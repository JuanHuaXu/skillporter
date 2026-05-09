/**
 * Skillporter HTTP client — communicates with the Skillporter sidecar.
 */

export interface SearchResult {
  skill: string;
  action: string;
  description: string;
  score: number;
}

export interface HealthStatus {
  ok: boolean;
  skillCount: number;
  actionCount: number;
}

export class SkillporterClient {
  private endpoint: string;
  private timeoutMs: number;

  constructor(endpoint: string, timeoutMs = 5000) {
    this.endpoint = endpoint.replace(/\/$/, '');
    this.timeoutMs = timeoutMs;
  }

  async health(): Promise<HealthStatus> {
    const res = await this.fetch('/health');
    return res.json() as Promise<HealthStatus>;
  }

  async search(query: string): Promise<SearchResult[]> {
    const res = await this.fetch(`/search?q=${encodeURIComponent(query)}`);
    return res.json() as Promise<SearchResult[]>;
  }

  async getSkillContent(name: string): Promise<string | null> {
    const res = await this.fetch(`/skills/${encodeURIComponent(name)}`);
    if (!res.ok) return null;
    return res.text();
  }

  async getActionContent(skill: string, action: string): Promise<string | null> {
    const res = await this.fetch(
      `/skills/${encodeURIComponent(skill)}/actions/${encodeURIComponent(action)}`
    );
    if (!res.ok) return null;
    return res.text();
  }

  private async fetch(path: string): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      return await globalThis.fetch(`${this.endpoint}${path}`, {
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  }
}
