import { z } from 'zod';

export const SkillporterConfigSchema = z.object({
  skillDirs: z.array(z.string()),
  includePatterns: z.array(z.string()).default(['**/*.md']),
  excludePatterns: z.array(z.string()).default(['**/node_modules/**', '**/dist/**', '**/README.md']),
  outDir: z.string().default('.skillporter'),
});

export type SkillporterConfig = z.infer<typeof SkillporterConfigSchema>;
