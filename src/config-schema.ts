import { z } from 'zod';

export const SkillporterConfigSchema = z.object({
  skillDirs: z.array(z.string()),
  includePatterns: z.array(z.string()).default(['**/*.md']),
  excludePatterns: z.array(z.string()).default(['**/node_modules/**', '**/dist/**', '**/README.md']),
  outDir: z.string().min(1).default('.skillporter'),
  port: z.number().int().min(1).max(65535).default(3000),
  host: z.string().default('127.0.0.1'),
  maxSearchResults: z.number().int().min(1).default(20),
  rateLimitWindowMs: z.number().int().min(1).default(15 * 60 * 1000), // 15 minutes
  rateLimitMax: z.number().int().min(1).default(100), // Reduced from 1000 — audit 2026-05-09
});

export type SkillporterConfig = z.infer<typeof SkillporterConfigSchema>;
