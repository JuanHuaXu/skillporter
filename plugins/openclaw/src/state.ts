export class ActiveSkillState {
  private activeSkill: { name: string; content: string } | null = null;
  private lastSearchResults: string[] = [];

  setActiveSkill(name: string, content: string) {
    this.activeSkill = { name, content };
    this.lastSearchResults = []; // Clear suggestions once loaded
  }

  getActiveSkill() {
    return this.activeSkill;
  }

  clearActiveSkill() {
    this.activeSkill = null;
  }

  setLastSearchResults(skills: string[]) {
    this.lastSearchResults = skills;
  }

  getLastSearchResults() {
    return this.lastSearchResults;
  }

  hasPendingSuggestions() {
    return !this.activeSkill && this.lastSearchResults.length > 0;
  }
}
