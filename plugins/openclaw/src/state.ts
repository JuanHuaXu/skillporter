/**
 * Simplified active skill state management for persistent injection.
 */

export interface ActiveSkillEntry {
  name: string;
  content: string;
}

export class ActiveSkillState {
  private activeSkill: ActiveSkillEntry | null = null;

  setActiveSkill(name: string, content: string): void {
    this.activeSkill = { name, content };
  }

  getActiveSkill(): ActiveSkillEntry | null {
    return this.activeSkill;
  }

  clearActiveSkill(): void {
    this.activeSkill = null;
  }
}
