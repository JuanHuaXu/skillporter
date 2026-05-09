import { SkillporterClient } from './client.js';
import { ActiveSkillState } from './state.js';

const state = new ActiveSkillState();
let client: SkillporterClient;

export default {
  id: "skillporter",
  name: "Skillporter",
  description: "On-demand skill search and ephemeral context injection from Skillporter index",
  
  register(api: any) {
    const getClient = () => {
      if (!client) {
        const config = api.config || {};
        const endpoint = config.endpoint || 'http://127.0.0.1:3000';
        client = new SkillporterClient(endpoint);
      }
      return client;
    };

    // Register discovery tool
    api.registerTool({
      name: 'skill_search',
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
        try {
          const results = await getClient().search(params.query || '');
          if (!results || results.length === 0) return { content: [{ type: 'text', text: 'No matching skills found.' }] };
          const text = results.map((s: any) => `- **${s.skill}**: ${s.description || 'No description'}`).join('\n');
          return { content: [{ type: 'text', text: `Recommended Skills:\n\n${text}` }] };
        } catch (err) {
          return { content: [{ type: 'text', text: 'Skillporter search failed.' }] };
        }
      }
    });

    // Persistent Context Injection Hook
    if (api.on) {
      api.on('agent_turn_prepare', async () => {
        const activeSkill = state.getActiveSkill();
        if (activeSkill) {
          return {
            appendContext: `\n\n=== ACTIVE SKILL: ${activeSkill.name.toUpperCase()} ===\n${activeSkill.content}\n=== END ACTIVE SKILL ===`,
          };
        }
      });
    }

    // Load Skill Tool
    api.registerTool({
      name: 'skill_load',
      id: 'skill_load',
      description: 'Load a specific skill into your active context. This makes the skill instructions persistent in your system prompt.',
      parameters: {
        type: 'object',
        properties: {
          skill: { type: 'string', description: 'Name of the skill to load' },
        },
        required: ['skill'],
      },
      execute: async (_toolCallId: string, params: any) => {
        const target = params.skill;
        try {
          const content = await getClient().getSkillContent(target);
          if (!content) return { content: [{ type: 'text', text: `Skill "${target}" not found.` }] };
          state.setActiveSkill(target, content);
          return {
            content: [{ type: 'text', text: `Skill "${target}" loaded. Instructions are now in your system prompt.` }],
            details: { loaded: true, skill: target }
          };
        } catch (err) {
          return { content: [{ type: 'text', text: `Error loading skill: ${err}` }] };
        }
      }
    });

    // Clear Skill Tool
    api.registerTool({
      name: 'skill_done',
      id: 'skill_done',
      description: 'Clear the active skill context once the task is complete.',
      parameters: { type: 'object', properties: {} },
      execute: async () => {
        state.clearActiveSkill();
        return { content: [{ type: 'text', text: 'Active skill context cleared.' }] };
      }
    });
  }
};
