import type { SkillInventory } from './indexer.js';

export interface SearchResult {
  skill: string;
  action: string;
  description: string;
  score: number;
}

/**
 * Simple keyword search across skills and actions.
 * Tokenizes the query and scores matches by keyword hit frequency.
 */
export function searchInventory(
  inventory: SkillInventory,
  query: string,
  maxResults: number = 20
): SearchResult[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  const results: SearchResult[] = [];

  for (const skill of inventory.skills) {
    const skillNameLower = skill.name.toLowerCase();
    const descLower = (skill.description || '').toLowerCase();

    // Score skill-level match
    let skillScore = 0;
    for (const token of tokens) {
      if (skillNameLower.includes(token)) skillScore += 3;
      if (descLower.includes(token)) skillScore += 2;
    }

    // Score each action
    for (const action of skill.actions) {
      const actionLower = action.name.toLowerCase();
      let actionScore = skillScore;

      for (const token of tokens) {
        if (actionLower.includes(token)) actionScore += 5;
        // Exact match bonus
        if (actionLower === token) actionScore += 10;
      }

      if (actionScore > 0) {
        results.push({
          skill: skill.name,
          action: action.name,
          description: skill.description || '',
          score: actionScore
        });
      }
    }

    // If the skill itself matches but has no action hits, include a skill-level entry
    if (skillScore > 0 && !results.some(r => r.skill === skill.name)) {
      results.push({
        skill: skill.name,
        action: '',
        description: skill.description || '',
        score: skillScore
      });
    }
  }

  // Sort by score descending, then by name for stability
  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.skill.localeCompare(b.skill);
  });

  return results.slice(0, maxResults);
}

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[\s,_\-\/]+/)
    .map(t => t.trim())
    .filter(t => t.length > 1);
}
