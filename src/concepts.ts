import crypto from 'node:crypto';
import type { SkillInfo } from './parser.js';

export type ConceptMap = Record<string, string[]>;

export const CONCEPT_MAP_VERSION = '2026-06-07.2';

const BUILT_IN_CONCEPTS: ConceptMap = {
  ast: ['abstract syntax tree', 'syntax tree', 'structural search', 'code structure'],
  'ast-grep': ['structural search', 'syntax tree search', 'abstract syntax tree search'],
  semgrep: ['semantic code analysis', 'security rule', 'static analysis', 'code scanning'],
  rce: ['remote code execution', 'command execution', 'exec sink', 'process creation'],
  lpe: ['local privilege escalation', 'privilege escalation', 'privilege boundary'],
  xss: ['cross site scripting', 'html injection', 'script injection'],
  ssrf: ['server side request forgery', 'outbound request', 'url fetch'],
  csrf: ['cross site request forgery', 'request forgery'],
  sqli: ['sql injection', 'query injection'],
  taint: ['data flow', 'source sink', 'source to sink', 'sanitizer'],
  sanitizer: ['escaping', 'validation', 'allowlist', 'encoder'],
  injection: ['delimiter confusion', 'escaping bypass', 'interpreter boundary'],
  'hostile prompt': ['prompt injection', 'instruction injection', 'malicious instruction'],
  'hostile prompts': ['prompt injection', 'instruction injection', 'malicious instructions'],
  'prompt attack': ['prompt injection', 'instruction injection', 'untrusted instructions'],
  unfurl: ['link preview', 'url embed', 'card preview', 'discord embed'],
  embed: ['preview', 'card', 'unfurl', 'media'],
  image: ['photo', 'picture', 'thumbnail', 'visual', 'media'],
  invariant: ['always true rule', 'consistency rule', 'state rule'],
  race: ['concurrency', 'timing', 'toctou', 'atomicity'],
  toctou: ['time of check time of use', 'race condition', 'timing bug'],
  memory: ['buffer', 'cache', 'heap', 'retention'],
  disk: ['file system', 'filesystem', 'storage', 'persistence'],
  schema: ['validation', 'zod', 'joi', 'type check'],
  prettier: ['formatting', 'code formatting', 'style normalization'],
  ctags: ['symbol index', 'definition lookup', 'code navigation']
};

export interface GeneratedConceptMap {
  concepts: ConceptMap;
  checksum: string;
  version: string;
}

export function generateConceptMap(skills: SkillInfo[]): GeneratedConceptMap {
  const concepts = normalizeConceptMap(BUILT_IN_CONCEPTS);

  for (const skill of skills) {
    for (const [shortForm, longForm] of extractAcronyms(skill.content)) {
      addConcept(concepts, shortForm, [longForm]);
      addConcept(concepts, longForm, [shortForm]);
    }
  }

  const sorted = sortConceptMap(concepts);
  const checksum = crypto
    .createHash('sha256')
    .update(CONCEPT_MAP_VERSION)
    .update(JSON.stringify(sorted))
    .digest('hex');

  return { concepts: sorted, checksum, version: CONCEPT_MAP_VERSION };
}

function extractAcronyms(content: string): Array<[string, string]> {
  const pairs: Array<[string, string]> = [];
  const normalized = content.replace(/\s+/g, ' ');
  const parentheticalPattern = /([A-Za-z][A-Za-z0-9 /-]{5,80})\s+\(([A-Z][A-Z0-9-]{1,12})\)/g;

  for (const match of normalized.matchAll(parentheticalPattern)) {
    const longForm = normalizeSearchText(match[1]);
    const shortForm = normalizeSearchText(match[2]);
    if (!longForm || !shortForm || longForm === shortForm) continue;
    if (!matchesAcronym(longForm, shortForm)) continue;
    pairs.push([shortForm, longForm]);
  }

  return pairs;
}

function matchesAcronym(longForm: string, shortForm: string): boolean {
  const acronym = shortForm.replace(/[^a-z0-9]/g, '');
  if (acronym.length < 2) return false;

  const words = longForm
    .split(' ')
    .filter(word => word.length > 0 && !['and', 'or', 'of', 'the', 'a', 'an', 'to'].includes(word));

  const initials = words.map(word => word[0]).join('');
  if (initials.endsWith(acronym)) return true;

  let index = 0;
  for (const word of words) {
    if (word[0] === acronym[index]) index++;
    if (index === acronym.length) return true;
  }

  return false;
}

function addConcept(concepts: ConceptMap, key: string, values: string[]) {
  const normalizedKey = normalizeSearchText(key);
  if (!normalizedKey) return;

  if (!concepts[normalizedKey]) concepts[normalizedKey] = [];
  for (const value of values) {
    const normalizedValue = normalizeSearchText(value);
    if (!normalizedValue || normalizedValue === normalizedKey) continue;
    concepts[normalizedKey].push(normalizedValue);
  }
}

function normalizeConceptMap(concepts: ConceptMap): ConceptMap {
  const normalized: ConceptMap = {};
  for (const [key, values] of Object.entries(concepts)) {
    addConcept(normalized, key, values);
    for (const value of values) {
      addConcept(normalized, value, [key]);
    }
  }
  return normalized;
}

function sortConceptMap(concepts: ConceptMap): ConceptMap {
  const sorted: ConceptMap = {};
  for (const key of Object.keys(concepts).sort()) {
    sorted[key] = Array.from(new Set(concepts[key])).sort();
  }
  return sorted;
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
