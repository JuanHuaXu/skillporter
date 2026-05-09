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

/**
 * Extract just the content under a specific action header (H2/H3).
 * Stops at the next same-level or higher-level header.
 * Returns the header line + all content until the next boundary.
 */
export function extractActionContent(content: string, actionName: string): string | null {
  const lines = content.split('\n');
  const lowerTarget = actionName.toLowerCase();
  let capturing = false;
  let captureLevel = 0;
  const captured: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Check if this line is an H2 or H3 header
    const h2Match = trimmed.startsWith('## ') && !trimmed.startsWith('### ');
    const h3Match = trimmed.startsWith('### ');

    if (h2Match || h3Match) {
      const headerLevel = h2Match ? 2 : 3;
      const headerText = trimmed.replace(/^##?#\s+/, '').trim();

      if (capturing) {
        // Stop if we hit a same-level or higher-level header
        if (headerLevel <= captureLevel) {
          break;
        }
        // Include sub-headers within the section
        captured.push(line);
        continue;
      }

      // Check if this header matches the target action
      if (headerText.toLowerCase() === lowerTarget) {
        capturing = true;
        captureLevel = headerLevel;
        captured.push(line);
        continue;
      }
    } else if (capturing) {
      captured.push(line);
    }
  }

  if (captured.length === 0) return null;

  // Trim trailing blank lines
  while (captured.length > 0 && captured[captured.length - 1].trim() === '') {
    captured.pop();
  }

  return captured.join('\n');
}

export async function parseSkillFile(filePath: string, baseDir?: string): Promise<SkillInfo> {
  // Security: Check file size before reading (DoS protection)
  const stats = await fs.stat(filePath);
  if (stats.size > 1024 * 1024) {
    throw new Error(`File too large: ${filePath} (${stats.size} bytes). Max limit is 1MB.`);
  }

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
