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

  const skillResults = new Map<string, SearchResult>();

  for (const skill of inventory.skills) {
    const skillNameLower = skill.name.toLowerCase();
    const descLower = (skill.description || '').toLowerCase();

    // Score skill-level match
    let baseScore = 0;
    for (const token of tokens) {
      if (skillNameLower.includes(token)) baseScore += 5;
      if (descLower.includes(token)) baseScore += 2;
    }

    // Find the best action match within this skill
    let bestActionName = '';
    let highestActionScore = baseScore;

    for (const action of skill.actions) {
      const actionLower = action.name.toLowerCase();
      let actionScore = baseScore;

      for (const token of tokens) {
        if (actionLower.includes(token)) actionScore += 5;
        if (actionLower === token) actionScore += 10;
      }

      if (actionScore > highestActionScore) {
        highestActionScore = actionScore;
        bestActionName = action.name;
      }
    }

    if (highestActionScore > 0) {
      skillResults.set(skill.name, {
        skill: skill.name,
        action: bestActionName,
        description: skill.description || '',
        score: highestActionScore
      });
    }
  }

  // Convert map to array and sort
  const results = Array.from(skillResults.values());
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
    .filter(t => t.length > 0);  // Removed t.length > 1 — single-char tokens are valid
}
