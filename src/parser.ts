import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';

export interface ActionInfo {
  name: string;
  line: number;
}

export interface SkillInfo {
  name: string;
  path: string;
  description?: string;
  actions: ActionInfo[];
  content: string;
}

export async function parseSkillFile(filePath: string, baseDir?: string): Promise<SkillInfo> {
  const contentRaw = await fs.readFile(filePath, 'utf-8');
  const { data, content } = matter(contentRaw);

  const actions: ActionInfo[] = [];
  
  // 1. Explicit actions from front-matter
  if (Array.isArray(data.actions)) {
    for (const actionName of data.actions) {
      actions.push({ name: String(actionName), line: 0 });
    }
  }

  const lines = content.split('\n');
  const genericHeaders = new Set([
    // General documentation sections
    'when to use', 'quick reference', 'fast workflow', 'core rules', 
    'common traps', 'how it works', 'installation', 'setup', 
    'output format', 'risk classification', 'permission scope', 
    'vetting protocol', 'asset-type defaults', 'background', 
    'summary', 'details', 'suggested action', 'metadata', 
    'resolution', 'when to promote', 'promotion targets', 
    'how to promote', 'promotion examples', 'ingestion workflow', 
    'periodic review', 'when to review', 'quick status check', 
    'review actions', 'quick setup', 'full setup', 'available hook scripts',
    'skill extraction criteria', 'extraction workflow', 'manual extraction',
    'extraction detection triggers', 'skill quality gates',
    'overview', 'security considerations', 'disabling hooks', 
    'test activator hook', 'test error detector hook', 'dry run extract script',
    'troubleshooting', 'hook not triggering', 'permission denied', 'script not found',
    'too much overhead', 'hook output budget', 'injected prompt files', 'delegation rules',
    'session handoff', 'communication style', 'error handling', 
    'learning workflow', 'available hook events', 'detection triggers',
    'standard triggers', 'openclaw-specific triggers', 'verification', 'status definitions',
    'skill extraction fields', 'naming conventions', 'extraction checklist', 'examples',
    'core rule', 'related', 'source', 'usage'
  ]);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // We primarily look for H2 (##) as "Action Words" (Capabilities)
    // We only look for H3 (###) if they don't look like "Steps"
    if (line.startsWith('## ') || line.startsWith('### ')) {
      const isH2 = line.startsWith('## ');
      const actionName = line.replace(/^##?#\s+/, '').trim();
      const lowerAction = actionName.toLowerCase();

      // Skip generic boilerplate
      if (genericHeaders.has(lowerAction)) continue;
      
      // Skip anything that looks like an internal step
      if (/^step\s+\d+/i.test(lowerAction) || /^phase\s+\d+/i.test(lowerAction) || /^\d+\.\s+/.test(lowerAction)) {
        continue;
      }

      // Avoid duplicates
      if (!actions.some(a => a.name === actionName)) {
        actions.push({
          name: actionName,
          line: i + 1
        });
      }
    }
  }

  // Calculate hierarchical name
  let name = data.name || (data as any).title;
  if (!name && baseDir) {
    const relativePath = path.relative(baseDir, filePath);
    name = relativePath.replace(/\.md$/, '').replace(/\\/g, '/');
  } else if (!name) {
    name = filePath.split('/').pop()?.replace('.md', '') || 'unknown';
  }

  return {
    name,
    path: filePath,
    description: data.description || '',
    actions,
    content: contentRaw
  };
}
