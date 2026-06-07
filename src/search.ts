import type { SkillInfo } from './parser.js';
import type { SkillInventory } from './indexer.js';

export interface SearchResult {
  skill: string;
  kind: 'skill' | 'reference';
  action: string;
  description: string;
  score: number;
}

interface ParsedQuery {
  phrases: string[];
  tokens: string[];
  conceptKeys: string[];
  expandedPhrases: string[];
  expandedTokens: string[];
}

interface FieldWeights {
  token: number;
  phrase: number;
}

const FIELD_WEIGHTS: Record<'name' | 'description' | 'actions' | 'body', FieldWeights> = {
  name: { token: 14, phrase: 70 },
  description: { token: 8, phrase: 42 },
  actions: { token: 12, phrase: 56 },
  body: { token: 1.5, phrase: 18 }
};

/**
 * Phrase-aware lexical search across skill names, descriptions, action names,
 * and body text. This is intentionally local and deterministic: no LLM,
 * embedder, network call, or heavyweight index dependency.
 */
export function searchInventory(
  inventory: SkillInventory,
  query: string,
  maxResults: number = 20
): SearchResult[] {
  const parsed = parseQuery(query, inventory.concepts || {});
  if (parsed.tokens.length === 0 && parsed.phrases.length === 0) return [];

  const results: SearchResult[] = [];

  for (const skill of inventory.skills) {
    const score = scoreSkill(skill, parsed);
    if (score.total <= 0) continue;
    if (!passesAdmissionGate(skill, parsed)) continue;
    if (!passesPhraseQueryGate(skill, parsed)) continue;

    results.push({
      skill: skill.name,
      kind: skill.kind,
      action: score.bestAction,
      description: skill.description || '',
      score: Math.round(score.total * 100) / 100
    });
  }

  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.kind !== b.kind) return a.kind === 'skill' ? -1 : 1;
    return a.skill.localeCompare(b.skill);
  });

  return results.slice(0, maxResults);
}

function passesAdmissionGate(skill: SkillInfo, query: ParsedQuery): boolean {
  const search = skill.search || buildSearchFallback(skill);
  if (query.conceptKeys.length > 0 && !hasHighSignalConceptMatch(search, query)) return false;
  if (query.phrases.some(phrase => search.all.includes(phrase))) return true;
  if (query.tokens.some(token => hasToken(search.all, token))) return true;

  return query.expandedPhrases
    .filter(phrase => phrase.split(' ').length >= 3)
    .some(phrase => search.all.includes(phrase));
}

function hasHighSignalConceptMatch(search: ReturnType<typeof buildSearchFallback>, query: ParsedQuery): boolean {
  const highSignal = `${search.name} ${search.description} ${search.actions}`;
  if (query.conceptKeys.some(key => matchQueryKey(highSignal, key))) return true;
  return query.expandedPhrases.some(phrase => matchQueryKey(highSignal, phrase));
}

function passesPhraseQueryGate(skill: SkillInfo, query: ParsedQuery): boolean {
  if (query.tokens.length < 3 || query.phrases.length === 0) return true;
  const search = skill.search || buildSearchFallback(skill);
  if (query.phrases.some(phrase => search.all.includes(phrase))) return true;
  if (query.expandedPhrases.some(phrase => search.all.includes(phrase))) return true;
  const matchedTokens = Array.from(new Set(query.tokens)).filter(token => hasToken(search.all, token)).length;
  return matchedTokens === new Set(query.tokens).size;
}

function scoreSkill(skill: SkillInfo, query: ParsedQuery): { total: number; bestAction: string } {
  const search = skill.search || buildSearchFallback(skill);
  let total = 0;

  total += scoreField(search.name, query, FIELD_WEIGHTS.name);
  total += scoreField(search.description, query, FIELD_WEIGHTS.description);
  total += scoreField(search.actions, query, FIELD_WEIGHTS.actions);
  total += scoreField(search.body, query, FIELD_WEIGHTS.body);
  total += scoreExpandedField(search.name, query, FIELD_WEIGHTS.name);
  total += scoreExpandedField(search.description, query, FIELD_WEIGHTS.description);
  total += scoreExpandedField(search.actions, query, FIELD_WEIGHTS.actions);
  total += scoreExpandedField(search.body, query, FIELD_WEIGHTS.body, false);

  total += tokenCoverageScore(search.all, query.tokens);
  total += tokenCoverageScore(search.all, query.expandedTokens) * 0.5;
  total += proximityScore(search.all, query.tokens);

  const bestAction = findBestAction(skill, query);
  if (bestAction) total += 8;
  if (total > 0 && skill.kind === 'skill') total += 1;

  return { total, bestAction };
}

function scoreExpandedField(
  field: string,
  query: ParsedQuery,
  weights: FieldWeights,
  includeExpandedTokens = true
): number {
  if (!field) return 0;

  let score = 0;
  for (const phrase of query.expandedPhrases) {
    if (phrase && field.includes(phrase)) score += weights.phrase * 0.45;
  }

  if (includeExpandedTokens) {
    for (const token of query.expandedTokens) {
      score += Math.min(countToken(field, token), 4) * weights.token * 0.35;
    }
  }

  return score;
}

function scoreField(field: string, query: ParsedQuery, weights: FieldWeights): number {
  if (!field) return 0;

  let score = 0;
  for (const phrase of query.phrases) {
    if (phrase && field.includes(phrase)) score += weights.phrase;
  }

  for (const token of query.tokens) {
    score += Math.min(countToken(field, token), 6) * weights.token;
  }

  return score;
}

function tokenCoverageScore(field: string, tokens: string[]): number {
  if (tokens.length === 0) return 0;
  const uniqueTokens = Array.from(new Set(tokens));
  const matched = uniqueTokens.filter(token => hasToken(field, token)).length;
  if (matched === 0) return 0;
  return (matched / uniqueTokens.length) * 28;
}

function proximityScore(field: string, tokens: string[]): number {
  const uniqueTokens = Array.from(new Set(tokens));
  if (uniqueTokens.length < 2) return 0;

  const words = field.split(' ').filter(Boolean);
  const positions = uniqueTokens.map(token => words.findIndex(word => word === token));
  if (positions.some(position => position < 0)) return 0;

  const span = Math.max(...positions) - Math.min(...positions) + 1;
  const allowedSpan = uniqueTokens.length + 8;
  if (span > allowedSpan) return 0;

  return Math.max(0, 24 - (span - uniqueTokens.length) * 2);
}

function findBestAction(skill: SkillInfo, query: ParsedQuery): string {
  let bestAction = '';
  let bestScore = 0;

  for (const action of skill.actions) {
    const normalized = normalizeSearchText(action.name);
    const score =
      scoreField(normalized, query, { token: 10, phrase: 45 }) +
      scoreExpandedField(normalized, query, { token: 10, phrase: 45 }) +
      tokenCoverageScore(normalized, query.tokens);
    if (score > bestScore) {
      bestAction = action.name;
      bestScore = score;
    }
  }

  return bestAction;
}

function parseQuery(query: string, concepts: Record<string, string[]> = {}): ParsedQuery {
  const quotedPhrases = Array.from(query.matchAll(/"([^"]+)"/g))
    .map(match => normalizeSearchText(match[1]))
    .filter(Boolean);
  const unquoted = query.replace(/"([^"]+)"/g, ' ');
  const rawPhrase = normalizeSearchText(query.replace(/"/g, ' '));
  const tokens = tokenize(unquoted || query);
  const phrases = Array.from(new Set([
    ...quotedPhrases,
    ...(rawPhrase.split(' ').length > 1 ? [rawPhrase] : [])
  ]));
  const conceptKeys = [...new Set([...tokens, ...tokenNgrams(tokens), ...phrases])]
    .filter(key => Array.isArray(concepts[key]) && concepts[key].length > 0);
  const expansions = expandQuery(tokens, phrases, concepts);

  return { phrases, tokens, conceptKeys, ...expansions };
}

function tokenize(query: string): string[] {
  return normalizeSearchText(query)
    .split(' ')
    .map(stemToken)
    .filter(Boolean);
}

function expandQuery(
  tokens: string[],
  phrases: string[],
  concepts: Record<string, string[]>
): { expandedPhrases: string[]; expandedTokens: string[] } {
  const expandedPhrases = new Set<string>();
  const expandedTokens = new Set<string>();
  const candidates = new Set([...tokens, ...phrases, ...tokenNgrams(tokens)]);

  for (const candidate of candidates) {
    const direct = concepts[candidate] || [];
    for (const expansion of direct) {
      expandedPhrases.add(expansion);
      for (const token of tokenize(expansion)) expandedTokens.add(token);
    }
  }

  const joinedTokens = tokens.join(' ');
  if (joinedTokens && concepts[joinedTokens]) {
    for (const expansion of concepts[joinedTokens]) {
      expandedPhrases.add(expansion);
      for (const token of tokenize(expansion)) expandedTokens.add(token);
    }
  }

  for (const token of tokens) expandedTokens.delete(token);
  for (const phrase of phrases) expandedPhrases.delete(phrase);

  return {
    expandedPhrases: Array.from(expandedPhrases),
    expandedTokens: Array.from(expandedTokens)
  };
}

function tokenNgrams(tokens: string[]): string[] {
  const grams: string[] = [];
  for (let size = 2; size <= Math.min(tokens.length, 4); size++) {
    for (let i = 0; i <= tokens.length - size; i++) {
      grams.push(tokens.slice(i, i + size).join(' '));
    }
  }
  return grams;
}

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_/.-]+/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function countToken(field: string, token: string): number {
  if (!field || !token) return 0;
  let count = 0;
  for (const word of field.split(' ')) {
    if (word === token || stemToken(word) === token) count++;
  }
  return count;
}

function hasToken(field: string, token: string): boolean {
  return countToken(field, token) > 0;
}

function matchQueryKey(field: string, key: string): boolean {
  return key.includes(' ') ? field.includes(key) : hasToken(field, key);
}

function stemToken(token: string): string {
  if (token.length > 4 && token.endsWith('ies')) return `${token.slice(0, -3)}y`;
  if (token.length > 5 && token.endsWith('ing')) return token.slice(0, -3);
  if (token.length > 4 && token.endsWith('ed')) return token.slice(0, -2);
  if (token.length > 3 && token.endsWith('s')) return token.slice(0, -1);
  return token;
}

function buildSearchFallback(skill: SkillInfo) {
  const actions = skill.actions.map(action => action.name).join(' ');
  const body = skill.content.replace(/^---[\s\S]*?---\s*/, '');
  return {
    name: normalizeSearchText(skill.name),
    description: normalizeSearchText(skill.description || ''),
    actions: normalizeSearchText(actions),
    body: normalizeSearchText(body),
    all: normalizeSearchText(`${skill.name} ${skill.description || ''} ${actions} ${body}`)
  };
}
