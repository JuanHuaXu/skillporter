import { globby } from 'globby';
import path from 'node:path';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { type SkillporterConfig } from './config-schema.js';
import { parseSkillFile, type SkillInfo } from './parser.js';

export interface SkillInventory {
  updatedAt: string;
  configHash?: string;
  dirMtimes: Record<string, number>;
  skills: SkillInfo[];
}

// Security: Helper to ensure a path is within a base directory
function isPathSafe(baseDir: string, targetPath: string): boolean {
  const relative = path.relative(baseDir, targetPath);
  return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
}

export async function calculateHash(filePath: string): Promise<string> {
  try {
    // Security: Validate path before reading
    if (filePath.includes('..') && !filePath.startsWith(process.cwd())) {
      return '';
    }
    const content = await fs.readFile(filePath);
    return crypto.createHash('sha512').update(content).digest('hex');
  } catch {
    return '';
  }
}

export async function indexSkills(config: SkillporterConfig, configPath?: string): Promise<SkillInventory> {
  // Security: Global excludes for sensitive directories
  const secureExcludes = [
    ...config.excludePatterns,
    '**/.git/**',
    '**/.ssh/**',
    '**/.aws/**',
    '**/.config/**',
    '**/node_modules/**'
  ];

  const fileToBaseDir = new Map<string, string>();

  // 1. Files in current working directory
  const cwdFiles = await globby(config.includePatterns, {
    cwd: process.cwd(),
    ignore: secureExcludes,
    absolute: true,
    followSymbolicLinks: false, // Security: Prevent symlink loops/escapes
    deep: 5 // Security: Limit recursion depth
  });
  for (const f of cwdFiles) fileToBaseDir.set(f, process.cwd());

  const dirMtimes: Record<string, number> = {};
  
  try {
    const stats = await fs.stat(process.cwd());
    dirMtimes[process.cwd()] = stats.mtimeMs;
  } catch {}

  // 2. Files in explicit skillDirs
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
        // Security: Double-check path safety
        if (isPathSafe(fullDir, f)) {
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

  let configHash = '';
  if (configPath) {
    configHash = await calculateHash(configPath);
    try {
      await fs.writeFile(`${configPath}.sha512`, configHash);
    } catch {}
  }

  const inventory: SkillInventory = {
    updatedAt: new Date().toISOString(),
    configHash,
    dirMtimes,
    skills
  };

  const outDir = path.resolve(process.cwd(), config.outDir);
  // Security: Ensure outDir is within workspace
  if (!outDir.startsWith(process.cwd())) {
     throw new Error('Security Error: outDir must be within the project workspace.');
  }

  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(path.join(outDir, 'inventory.json'), JSON.stringify(inventory, null, 2));

  return inventory;
}

export async function loadInventory(config: SkillporterConfig, configPath?: string): Promise<SkillInventory> {
  const inventoryPath = path.join(path.resolve(process.cwd(), config.outDir), 'inventory.json');
  
  try {
    const raw = await fs.readFile(inventoryPath, 'utf-8');
    const inventory: SkillInventory = JSON.parse(raw);
    
    if (configPath) {
      const currentHash = await calculateHash(configPath);
      let storedHash = inventory.configHash;

      try {
        const sidecarHash = (await fs.readFile(`${configPath}.sha512`, 'utf-8')).trim();
        if (sidecarHash) {
          storedHash = sidecarHash;
        }
      } catch {}

      if (currentHash !== storedHash) {
        console.log('Config checksum mismatch, reindexing...');
        return await indexSkills(config, configPath);
      }
    }

    for (const [dir, lastMtime] of Object.entries(inventory.dirMtimes || {})) {
      try {
        const stats = await fs.stat(dir);
        if (stats.mtimeMs > lastMtime) {
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
