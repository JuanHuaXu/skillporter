import { SkillporterClient } from './client.js';
import { ActiveSkillState } from './state.js';

export default async function setup(ctx: any, api: any) {
  const { config, log } = ctx;
  const endpoint = config?.endpoint || 'http://127.0.0.1:3000';
  const client = new SkillporterClient(endpoint);
  const state = new ActiveSkillState();

  // Register the discovery tool
  api.registerTool({
    id: 'skill_search',
    description: 'Search for available skills and capabilities. Use this if you are unsure how to perform a task.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'What are you trying to do?' },
      },
      required: ['query'],
    },
    execute: async (_toolCallId: string, params: any) => {
      const { query } = params;
      try {
        const results = await client.search(query);
        if (results.length === 0) return { content: [{ type: 'text', text: 'No matching skills found.' }] };
        
        const text = results.map(s => `- **${s.skill}**: ${s.description || 'No description'}`).join('\n');
        return { content: [{ type: 'text', text: `Recommended Skills:\n\n${text}` }] };
      } catch (err) {
        return { content: [{ type: 'text', text: 'Skillporter search failed.' }] };
      }
    },
  });

  // Hook: Inject active skill content into the system prompt
  api.registerHook('system_prompt_prepare', async (ctx: any, prompt: string) => {
    const activeSkill = state.getActiveSkill();
    if (activeSkill) {
      return `${prompt}\n\n=== ACTIVE SKILL: ${activeSkill.name.toUpperCase()} ===\n${activeSkill.content}\n=== END ACTIVE SKILL ===`;
    }
    return prompt;
  });

  // Tool: Load a skill into the active state
  api.registerTool({
    id: 'skill_load',
    description: 'Load a skill into active context. This makes the skill instructions persistent in your system prompt.',
    parameters: {
      type: 'object',
      properties: {
        skill: { type: 'string', description: 'Name of the skill to load' },
      },
      required: ['skill'],
    },
    execute: async (_toolCallId: string, params: any) => {
      const { skill: target } = params;
      try {
        const content = await client.getSkillContent(target);
        if (!content) return { content: [{ type: 'text', text: `Skill "${target}" not found.` }] };
        
        state.setActiveSkill(target, content);
        return {
          content: [{ type: 'text', text: `Skill "${target}" loaded into system prompt. You can now use these instructions for all subsequent turns.` }],
          details: { loaded: true, skill: target },
        };
      } catch (err) {
        return {
          content: [{ type: 'text', text: `Error loading skill: ${err instanceof Error ? err.message : String(err)}` }],
          details: { error: true },
        };
      }
    },
  });

  // Tool: Clear the active skill
  api.registerTool({
    id: 'skill_done',
    description: 'Clear the active skill context once the task is complete.',
    parameters: { type: 'object', properties: {} },
    execute: async () => {
      state.clearActiveSkill();
      return { content: [{ type: 'text', text: 'Active skill context cleared.' }] };
    },
  });

  // Startup check
  client.health().catch(() => log?.warn?.('Skillporter sidecar not reachable at boot.'));
}
