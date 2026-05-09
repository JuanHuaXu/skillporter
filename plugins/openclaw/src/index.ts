/**
 * openclaw-plugin-skillporter
 *
 * "Librarian" Model:
 * This plugin allows the agent to search and retrieve specialized skills
 * from the Skillporter index. Skills are returned directly as tool results
 * to ensure maximum compatibility with reasoning models and context engines (LibraVDB).
 */

import { definePluginEntry, buildJsonPluginConfigSchema } from 'openclaw/plugin-sdk/plugin-entry';
import type { OpenClawPluginToolContext, AnyAgentTool } from 'openclaw/plugin-sdk/core';
import { SkillporterClient } from './client.js';

function asRecord(params: unknown): Record<string, unknown> {
  return params && typeof params === 'object' && !Array.isArray(params)
    ? (params as Record<string, unknown>)
    : {};
}

export default definePluginEntry({
  id: 'skillporter',
  name: 'Skillporter',
  description: 'On-demand skill discovery and retrieval from Skillporter index',

  configSchema: buildJsonPluginConfigSchema({
    type: 'object',
    properties: {
      endpoint: {
        type: 'string',
        default: 'http://127.0.0.1:3000',
        description: 'Skillporter HTTP server endpoint',
      },
    },
  }),

  register(api) {
    if (api.registrationMode !== 'full' && api.registrationMode !== 'tool-discovery') {
      return;
    }

    const pluginCfg = api.pluginConfig ?? {};
    const endpoint = (pluginCfg.endpoint as string) || 'http://127.0.0.1:3000';
    const client = new SkillporterClient(endpoint);
    const log = api.logger;

    log.info?.(`Skillporter (Librarian Mode) active at ${endpoint}`);

    // ---- TOOL: skill_search ----
    api.registerTool((ctx: OpenClawPluginToolContext): AnyAgentTool => ({
      name: 'skill_search',
      label: 'Skill Search',
      description: 'Search the Skillporter library for domain-specific instructions (e.g. "resize image", "git rebase"). Use this when you need precise steps for a complex task.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search keywords',
          },
        },
        required: ['query'],
      } as any,
      async execute(_toolCallId: string, params: unknown) {
        const p = asRecord(params);
        const query = typeof p.query === 'string' ? p.query : '';
        try {
          const results = await client.search(query);
          if (results.length === 0) {
            return {
              content: [{ type: 'text' as const, text: `No skills found for "${query}". Try different keywords.` }],
              details: { results: [] },
            };
          }
          const formatted = results.slice(0, 10).map((r, i) =>
            `${i + 1}. skill="${r.skill}" action="${r.action}" — ${r.description || 'No description'}`
          ).join('\n');
          return {
            content: [{
              type: 'text' as const,
              text: `Found ${results.length} relevant skill(s). Use skill_load to see the full instructions:\n\n${formatted}`,
            }],
            details: { results },
          };
        } catch (err) {
          return {
            content: [{ type: 'text' as const, text: 'Skillporter sidecar is offline.' }],
            details: { error: String(err) },
          };
        }
      },
    }));

    // ---- TOOL: skill_load ----
    api.registerTool((ctx: OpenClawPluginToolContext): AnyAgentTool => ({
      name: 'skill_load',
      label: 'Skill Load',
      description: 'Retrieve the full instructions for a specific skill or action. The instructions will be returned directly in this tool result.',
      parameters: {
        type: 'object',
        properties: {
          skill: {
            type: 'string',
            description: 'Skill name (from skill_search)',
          },
          action: {
            type: 'string',
            description: 'Optional: specific action within the skill',
          },
        },
        required: ['skill'],
      } as any,
      async execute(_toolCallId: string, params: unknown) {
        const p = asRecord(params);
        const skillName = typeof p.skill === 'string' ? p.skill : '';
        const actionName = typeof p.action === 'string' ? p.action : undefined;

        try {
          let content: string | null;
          if (actionName) {
            content = await client.getActionContent(skillName, actionName);
          } else {
            content = await client.getSkillContent(skillName);
          }

          if (!content) {
            return {
              content: [{ type: 'text' as const, text: `Skill "${skillName}" not found.` }],
              details: { found: false },
            };
          }

          const target = actionName ? `${skillName}:${actionName}` : skillName;
          
          return {
            content: [{
              type: 'text' as const,
              text: `### INSTRUCTIONS FOR ${target.toUpperCase()}:\n\n${content}\n\n(Follow these instructions exactly for the next steps.)`,
            }],
            details: { loaded: true, skill: target },
          };
        } catch (err) {
          return {
            content: [{ type: 'text' as const, text: 'Skillporter sidecar is offline.' }],
            details: { error: String(err) },
          };
        }
      },
    }));

    // ---- Removed skill_done as it's no longer needed in history-based mode ----

    // ---- Removed all lifecycle hooks to prevent interference with LibraVDB ----
    
    // Startup check
    client.health().catch(() => log.warn?.('Skillporter sidecar not reachable at boot.'));
  },
});
