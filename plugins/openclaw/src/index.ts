import { SkillporterClient } from './client.js';
import { ActiveSkillState } from './state.js';

const state = new ActiveSkillState();
let client: SkillporterClient;

let lastSearchQuery = "";
let lastSearchTime = 0;

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

    api.registerTool({
      name: 'skill_search',
      id: 'skill_search',
      description: 'Search the Skillporter database for available skills. IMPORTANT: Skills are NOT native tools in your registry. They are external documents that MUST be loaded into your prompt using the skill_load tool.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
        },
        required: ['query'],
      },
      execute: async (_toolCallId: string, params: any) => {
        const query = params.query || '';
        console.debug(`[Skillporter] TOOL EXECUTION TRIGGERED: skill_search (query: ${query})`);
        const now = Date.now();
        
        if (query === lastSearchQuery && (now - lastSearchTime) < 10000) {
          return { content: [{ type: 'text', text: `You recently searched for "${query}". To proceed, you MUST pick a skill from the list below and use 'skill_load' to activate it.` }] };
        }
        
        lastSearchQuery = query;
        lastSearchTime = now;

        try {
          const results = await getClient().search(query);
          if (!results || results.length === 0) return { content: [{ type: 'text', text: 'No matching skills found.' }] };
          
          state.setLastSearchResults(results.map((s: any) => s.skill));
          
          const currentSkill = state.getActiveSkill();
          let header = currentSkill 
            ? `CURRENT ACTIVE SKILL: ${currentSkill.name}\n(Specialized instructions are already loaded and active!)\n\n`
            : "IMPORTANT: You must call 'skill_load' with a skill name below to unlock the specialized instructions and actions for that capability.\n\n";
            
          const text = results.map((s: any) => {
            const isActive = currentSkill?.name === s.skill;
            const actionText = s.action ? ` (Action match: ${s.action})` : '';
            return `- **${s.skill}** ${isActive ? '[ACTIVE]' : ''}: ${s.description || '(No description)'}${actionText}`;
          }).join('\n');
          
          return { content: [{ type: 'text', text: `${header}Available Skills:\n\n${text}\n\nREQUIRED NEXT STEP: Call 'skill_load' with the name of the skill you want to use.` }] };
        } catch (err) {
          return { content: [{ type: 'text', text: 'Skillporter search failed.' }] };
        }
      }
    });

    api.on?.('agent_turn_prepare', async () => {
      const activeSkill = state.getActiveSkill();
      
      if (activeSkill) {
        return {
          appendContext: `\n\n=== ACTIVE SKILL: ${String(activeSkill.name).toUpperCase()} ===\n${String(activeSkill.content)}\n=== END ACTIVE SKILL ===\n[SYSTEM: You are currently using the ${activeSkill.name} skill. Follow the specialized instructions above for all subsequent steps.]`,
        };
      }

      // if (state.hasPendingSuggestions()) {
      //   const suggestions = state.getLastSearchResults().slice(0, 3).join(', ');
      //   return {
      //     appendContext: `\n\n[SYSTEM URGENT: You have searched for skills but have not loaded one. You MUST call 'skill_load' with one of the following names to proceed with the specialized audit: ${suggestions}. Do not attempt to use manual shell commands for this task.]`,
      //   };
      // }
      
      return {};
    });

    api.registerTool({
      name: 'skill_load',
      id: 'skill_load',
      description: 'REQUIRED: Activate a skill from the Skillporter database. IMPORTANT: When the user asks you to use a "skill" (like security-research), they are NOT referring to a native tool in your registry. You MUST use this skill_load tool to fetch the external instructions into your prompt.',
      parameters: {
        type: 'object',
        properties: {
          skill: { type: 'string', description: 'The exact name of the skill to activate (found via skill_search)' },
        },
        required: ['skill'],
      },
      execute: async (_toolCallId: string, params: any) => {
        const target = params.skill;
        console.debug(`[Skillporter] TOOL EXECUTION TRIGGERED: skill_load (skill: ${target})`);
        try {
          const content = await getClient().getSkillContent(target);
          if (!content) return { content: [{ type: 'text', text: `Skill "${target}" not found. Did you use the exact name from skill_search?` }] };
          state.setActiveSkill(target, content);
          lastSearchQuery = ""; 
          return {
            content: [{ type: 'text', text: `SUCCESS: Skill "${target}" is now active. Specialized instructions have been injected into your system prompt. Proceed with the audit using these instructions.` }],
          };
        } catch (err) {
          return { content: [{ type: 'text', text: `Error loading skill: ${err}` }] };
        }
      }
    });

    api.registerTool({
      name: 'skill_done',
      id: 'skill_done',
      description: 'Clear the active skill context when the specialized task is complete.',
      parameters: { type: 'object', properties: {} },
      execute: async () => {
        state.clearActiveSkill();
        return { content: [{ type: 'text', text: 'Active skill context cleared.' }] };
      }
    });
  }
};
