import { globby } from 'globby';
import path from 'node:path';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { type SkillporterConfig } from './config-schema.js';
import { parseSkillFile, type SkillInfo } from './parser.js';
import { CONCEPT_MAP_VERSION, type ConceptMap, generateConceptMap } from './concepts.js';

export interface SkillInventory {
  updatedAt: string;
  configHash?: string;
  conceptMapHash?: string;
  conceptMapVersion?: string;
  dirMtimes: Record<string, number>;
  concepts?: ConceptMap;
  skills: SkillInfo[];
}

// Security: Helper to ensure a path is within a base directory.
// Resolves symlinks and normalizes paths to prevent traversal attacks.
async function isPathSafe(baseDir: string, targetPath: string): Promise<boolean> {
  try {
    const [resolvedBase, resolvedTarget] = await Promise.all([
      fs.realpath(baseDir),
      fs.realpath(targetPath),
    ]);
    const relative = path.relative(resolvedBase, resolvedTarget);
    return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
  } catch {
    // If realpath fails (file doesn't exist yet), fall back to string comparison.
    const relative = path.relative(path.resolve(baseDir), path.resolve(targetPath));
    return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
  }
}

export async function calculateHash(filePath: string): Promise<string> {
  try {
    // Security: Resolve and verify path is within cwd before reading.
    const resolved = path.resolve(filePath);
    const cwd = process.cwd();
    if (!resolved.startsWith(path.resolve(cwd) + path.sep) && resolved !== path.resolve(cwd)) {
      return '';
    }
    const content = await fs.readFile(resolved);
    return crypto.createHash('sha512').update(content).digest('hex');
  } catch {
    return '';
  }
}

export async function indexSkills(config: SkillporterConfig, configPath?: string): Promise<SkillInventory> {
  const outDir = path.resolve(process.cwd(), config.outDir);
  // Security: Ensure outDir is within workspace.
  if (!outDir.startsWith(path.resolve(process.cwd()) + path.sep) && outDir !== path.resolve(process.cwd())) {
     throw new Error('Security Error: outDir must be within the project workspace.');
  }

  // Security: Global excludes for sensitive directories
  const secureExcludes = [
    ...config.excludePatterns,
    '**/.git/**',
    '**/.ssh/**',
    '**/.aws/**',
    '**/.config/**',
    '**/node_modules/**',
    path.join(config.outDir, '**')
  ];

  const fileToBaseDir = new Map<string, string>();

  const dirMtimes: Record<string, number> = {};

  await fs.mkdir(outDir, { recursive: true });

  for (const dir of config.skillDirs) {
    // Security: Prevent traversal in config
    if (dir.includes('..')) {
       console.warn(`Security Warning: Skipping directory with traversal pattern: ${dir}`);
       continue;
    }

    const fullDir = path.resolve(process.cwd(), dir);
    
    // Security: Ensure skillDir is within the workspace or at least not in sensitive system dirs
    if (fullDir.startsWith('/etc') || fullDir.startsWith('/var') || fullDir.startsWith('/root')) {
      console.warn(`Security Warning: Skipping restricted system directory: ${fullDir}`);
      continue;
    }

    try {
      const stats = await fs.stat(fullDir);
      dirMtimes[fullDir] = stats.mtimeMs;
      
      const dirFiles = await globby(config.includePatterns, {
        cwd: fullDir,
        ignore: secureExcludes,
        absolute: true,
        followSymbolicLinks: false,
        deep: 5
      });
      for (const f of dirFiles) {
        // Security: Double-check path safety (resolves symlinks)
        if (await isPathSafe(fullDir, f)) {
          fileToBaseDir.set(f, fullDir);
        }
      }
    } catch (e) {
      console.warn(`Could not access skill directory: ${fullDir}`);
    }
  }

  const uniqueFiles = Array.from(fileToBaseDir.keys());
  
  const skills: SkillInfo[] = [];
  for (const file of uniqueFiles) {
    try {
      const baseDir = fileToBaseDir.get(file);
      const skill = await parseSkillFile(file, baseDir);
      skills.push(skill);
    } catch (error) {
      console.warn(`Failed to parse ${file}:`, error instanceof Error ? error.message : String(error));
    }
  }

  const generatedConceptMap = generateConceptMap(skills);

  let configHash = '';
  if (configPath) {
    configHash = await calculateHash(configPath);
    try {
      await fs.writeFile(path.join(outDir, 'config.sha512'), configHash);
    } catch {}
  }

  const inventory: SkillInventory = {
    updatedAt: new Date().toISOString(),
    configHash,
    conceptMapHash: generatedConceptMap.checksum,
    conceptMapVersion: generatedConceptMap.version,
    dirMtimes,
    concepts: generatedConceptMap.concepts,
    skills
  };

  await fs.writeFile(path.join(outDir, 'concepts.json'), JSON.stringify({
    checksum: generatedConceptMap.checksum,
    version: generatedConceptMap.version,
    concepts: generatedConceptMap.concepts
  }, null, 2));
  await fs.writeFile(path.join(outDir, 'inventory.json'), JSON.stringify(inventory, null, 2));

  return inventory;
}

export async function loadInventory(config: SkillporterConfig, configPath?: string): Promise<SkillInventory> {
  const inventoryDir = path.resolve(process.cwd(), config.outDir);
  const inventoryPath = path.join(inventoryDir, 'inventory.json');
  
  // Security: Ensure inventory path is within workspace
  if (!inventoryPath.startsWith(process.cwd())) {
    throw new Error('Security Error: inventory path must be within the project workspace.');
  }
  
  try {
    const raw = await fs.readFile(inventoryPath, 'utf-8');
    const inventory: SkillInventory = JSON.parse(raw);
    
    if (configPath) {
      const currentHash = await calculateHash(configPath);
      let storedHash = inventory.configHash;

      try {
        const sidecarHash = (await fs.readFile(path.join(inventoryDir, 'config.sha512'), 'utf-8')).trim();
        if (sidecarHash) {
          storedHash = sidecarHash;
        }
      } catch {}

      if (currentHash !== storedHash) {
        console.log('Config checksum mismatch, reindexing...');
        return await indexSkills(config, configPath);
      }
    }

    if (!inventory.concepts || !inventory.conceptMapHash || inventory.conceptMapVersion !== CONCEPT_MAP_VERSION) {
      console.log('Concept map missing or stale, reindexing...');
      return await indexSkills(config, configPath);
    }

    if (inventory.skills.some(skill => !skill.search)) {
      console.log('Search index missing or stale, reindexing...');
      return await indexSkills(config, configPath);
    }

    for (const [dir, lastMtime] of Object.entries(inventory.dirMtimes || {})) {
      if (inventoryDir.startsWith(dir)) continue;
      try {
        const stats = await fs.stat(dir);
        if (Math.floor(stats.mtimeMs) > Math.floor(lastMtime)) {
          console.log(`Directory ${dir} changed, reindexing...`);
          return await indexSkills(config, configPath);
        }
      } catch {}
    }

    return inventory;
  } catch (error) {
    console.log('Inventory missing or stale, indexing...');
    return await indexSkills(config, configPath);
  }
}
