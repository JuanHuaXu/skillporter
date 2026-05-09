import { z } from 'zod';

export const SkillporterConfigSchema = z.object({
  skillDirs: z.array(z.string()),
  includePatterns: z.array(z.string()).default(['**/*.md']),
  excludePatterns: z.array(z.string()).default(['**/node_modules/**', '**/dist/**', '**/README.md']),
  outDir: z.string().default('.skillporter'),
  port: z.number().default(3000),
  host: z.string().default('127.0.0.1'),
  maxSearchResults: z.number().default(20),
  rateLimitWindowMs: z.number().default(15 * 60 * 1000), // 15 minutes
  rateLimitMax: z.number().default(1000), // Higher default for local use
});

export type SkillporterConfig = z.infer<typeof SkillporterConfigSchema>;
