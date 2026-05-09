/**
 * Active skill state management with TTL-based ejection.
 *
 * Tracks which skills are currently injected into the agent's context
 * and auto-ejects them after the configured number of turns.
 */

export interface ActiveSkillEntry {
  name: string;
  action?: string;
  content: string;
  loadedAtTurn: number;
  ttl: number;
}

export class SkillState {
  private activeSkills: Map<string, ActiveSkillEntry> = new Map();
  private turnCounter = 0;
  private maxActive: number;

  constructor(maxActive = 3) {
    this.maxActive = maxActive;
  }

  /**
   * Advance the turn counter and eject expired skills.
   * Called at the start of each agent turn via the turn-prepare hook.
   * Returns the set of skills that were ejected.
   */
  advanceTurn(): string[] {
    this.turnCounter++;
    const ejected: string[] = [];

    for (const [key, entry] of this.activeSkills) {
      const turnsActive = this.turnCounter - entry.loadedAtTurn;
      if (turnsActive > entry.ttl) {
        this.activeSkills.delete(key);
        ejected.push(key);
      }
    }

    return ejected;
  }

  /**
   * Add a skill to the active set. If maxActive is reached,
   * ejects the oldest skill first.
   */
  loadSkill(name: string, content: string, ttl: number, action?: string): void {
    const key = action ? `${name}::${action}` : name;

    // If already loaded, refresh it
    if (this.activeSkills.has(key)) {
      this.activeSkills.set(key, {
        name,
        action,
        content,
        loadedAtTurn: this.turnCounter,
        ttl,
      });
      return;
    }

    // Evict oldest if at capacity
    while (this.activeSkills.size >= this.maxActive) {
      const oldestKey = this.activeSkills.keys().next().value;
      if (oldestKey) this.activeSkills.delete(oldestKey);
    }

    this.activeSkills.set(key, {
      name,
      action,
      content,
      loadedAtTurn: this.turnCounter,
      ttl,
    });
  }

  /**
   * Explicitly remove a skill from the active set.
   */
  ejectSkill(name: string, action?: string): boolean {
    const key = action ? `${name}::${action}` : name;
    return this.activeSkills.delete(key);
  }

  /**
   * Build the context injection text for all active skills.
   * Returns empty string if no skills are active.
   */
  buildContextInjection(): string {
    if (this.activeSkills.size === 0) return '';

    const sections: string[] = [];
    sections.push('<active_skills>');

    for (const [, entry] of this.activeSkills) {
      const turnsRemaining = entry.ttl - (this.turnCounter - entry.loadedAtTurn);
      const actionAttr = entry.action ? ` action="${entry.action}"` : '';
      sections.push(
        `<skill name="${entry.name}"${actionAttr} ttl_remaining="${Math.max(0, turnsRemaining)}">`
      );
      sections.push(entry.content);
      sections.push('</skill>');
    }

    sections.push('</active_skills>');
    sections.push('');
    sections.push('Follow the instructions in the active skills above. When done, the skill context will be automatically removed.');

    return sections.join('\n');
  }

  /**
   * Get the current active skill count.
   */
  get activeCount(): number {
    return this.activeSkills.size;
  }

  /**
   * Get the names of all active skills.
   */
  getActiveNames(): string[] {
    return Array.from(this.activeSkills.values()).map(e =>
      e.action ? `${e.name}/${e.action}` : e.name
    );
  }

  getCurrentTurn(): number {
    return this.turnCounter;
  }
}
