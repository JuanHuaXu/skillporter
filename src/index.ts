#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'jsonc-parser';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { SkillporterConfigSchema } from './config-schema.js';
import { indexSkills, loadInventory } from './indexer.js';
import { searchInventory } from './search.js';
import { extractActionContent } from './parser.js';

const program = new Command();

program
  .name('skillporter')
  .description('Markdown skill indexer and server.')
  .version('0.2.0');

program
  .command('index')
  .description('Index skills from configured directories')
  .option('-c, --config <path>', 'path to skillporter.json', 'skillporter.json')
  .action(async (options) => {
    try {
      const { config, configPath } = await loadConfig(options.config);
      const inventory = await indexSkills(config, configPath);
      const skillCount = inventory.skills.filter(s => s.kind === 'skill').length;
      const referenceCount = inventory.skills.filter(s => s.kind === 'reference').length;
      console.log(`Indexed ${inventory.skills.length} entries (${skillCount} skills, ${referenceCount} references).`);
      for (const skill of inventory.skills) {
        console.log(`  - ${skill.name} [${skill.kind}] (${skill.actions.length} actions)`);
      }
    } catch (error) {
      console.error('Error indexing skills:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List all action words in the inventory')
  .option('-c, --config <path>', 'path to skillporter.json', 'skillporter.json')
  .action(async (options) => {
    try {
      const { config, configPath } = await loadConfig(options.config);
      const inventory = await loadInventory(config, configPath);
      console.log('Action Words Inventory:');
      for (const skill of inventory.skills) {
        if (skill.actions.length > 0) {
          console.log(`\n[${skill.name}] [${skill.kind}]`);
          for (const action of skill.actions) {
            console.log(`  - ${action.name} (line ${action.line})`);
          }
        } else {
          console.log(`\n[${skill.name}] [${skill.kind}] (no actions found)`);
        }
      }
    } catch (error) {
      console.error('Error listing skills:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('get')
  .description('Retrieve the full content of a skill or action')
  .argument('<name>', 'name of the skill or action word')
  .option('-c, --config <path>', 'path to skillporter.json', 'skillporter.json')
  .action(async (action, options) => {
    try {
      const { config, configPath } = await loadConfig(options.config);
      const inventory = await loadInventory(config, configPath);
      
      // Security: Sanitize input name to prevent any unexpected lookup behavior
      const sanitizedName = action.replace(/[^\w\-\/ ]/g, '').toLowerCase();

      const exactSkill = inventory.skills.find(s => s.name.toLowerCase() === sanitizedName);
      if (exactSkill) {
        console.log(exactSkill.content);
        return;
      }

      const actionMatch = inventory.skills
        .map(s => ({
          skill: s,
          action: s.actions.find(a => a.name.toLowerCase() === sanitizedName)
        }))
        .find(match => match.action);

      if (actionMatch?.action) {
        const actionContent = extractActionContent(actionMatch.skill.content, actionMatch.action.name);
        console.log(actionContent || actionMatch.skill.content);
      } else {
        console.error('Skill or action not found.');
        process.exit(1);
      }
    } catch (error) {
      console.error('Error retrieving skill:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('serve')
  .description('Start HTTP API server')
  .option('-c, --config <path>', 'path to skillporter.json', 'skillporter.json')
  .option('-p, --port <number>', 'port to listen on')
  .option('-H, --host <host>', 'host to bind to')
  .action(async (options) => {
    try {
      const { config, configPath } = await loadConfig(options.config);
      const app = express();
      const port = options.port ? parseInt(options.port, 10) : config.port;
      if (options.port) {
        if (isNaN(port) || port < 1 || port > 65535 || String(port) !== options.port.trim()) {
          console.error('Error: --port must be a valid integer between 1 and 65535.');
          process.exit(1);
        }
      }
      const host = options.host || config.host;

      // Security: Validate port and host
      if (options.port && (isNaN(port) || port < 1024 || port > 65535)) {
        console.error('Error: Port must be between 1024 and 65535.');
        process.exit(1);
      }
      if (host && !/^\d{1,3}(\.\d{1,3}){3}$|^\[?[0-9a-fA-F:]+\)?$/.test(host)) {
        console.error('Error: Invalid host format.');
        process.exit(1);
      }

      // Security: Warn when binding to a non-localhost address
      const isLocalhost = host === '127.0.0.1' || host === '::1' || host === 'localhost';
      if (!isLocalhost) {
        console.warn(`Warning: Binding to ${host}. The HTTP API has no authentication — exposing it to network interfaces beyond localhost is a security risk. Consider binding to 127.0.0.1.`);
      }

      // Security: Add Helmet for secure headers
      app.use(helmet());

      // Security: Rate limiting to prevent DoS/loops (reduced from permissive defaults)
      const limiter = rateLimit({
        windowMs: config.rateLimitWindowMs,
        max: config.rateLimitMax,
        standardHeaders: true,
        legacyHeaders: false,
        message: 'Too many requests, please try again later.',
      });
      app.use(limiter);

      // Health check
      app.get('/health', async (_req, res) => {
        try {
          const inventory = await loadInventory(config, configPath);
          const actionCount = inventory.skills.reduce((sum, s) => sum + s.actions.length, 0);
          const skillCount = inventory.skills.filter(s => s.kind === 'skill').length;
          const referenceCount = inventory.skills.filter(s => s.kind === 'reference').length;
          res.json({ ok: true, entryCount: inventory.skills.length, skillCount, referenceCount, actionCount });
        } catch (e) {
          res.status(503).json({ ok: false, error: 'Index unavailable' });
        }
      });

      // Search endpoint
      app.get('/search', async (req, res) => {
        try {
          const query = typeof req.query.q === 'string' ? req.query.q : '';
          if (!query.trim()) return res.json([]);
          const inventory = await loadInventory(config, configPath);
          const results = searchInventory(inventory, query, config.maxSearchResults);
          res.json(results);
        } catch (e) {
          res.status(500).json({ error: 'Internal server error' });
        }
      });

      // List all skills (compact metadata)
      app.get('/skills', async (_req, res) => {
        try {
          const inventory = await loadInventory(config, configPath);
          res.json(inventory.skills.map(s => ({ 
            name: s.name, 
            kind: s.kind,
            description: s.description, 
            actionCount: s.actions.length,
            path: s.path
          })));
        } catch (e) {
          res.status(500).json({ error: 'Internal server error' });
        }
      });

      // List all actions across all skills
      app.get('/actions', async (_req, res) => {
        try {
          const inventory = await loadInventory(config, configPath);
          const actions = inventory.skills.flatMap(s => s.actions.map(a => ({ 
            skill: s.name, 
            action: a.name 
          })));
          res.json(actions);
        } catch (e) {
          res.status(500).json({ error: 'Internal server error' });
        }
      });

      // Get a specific action's content (section-level extraction)
      app.get('/skills/:name/actions/:action', async (req, res) => {
        try {
          const inventory = await loadInventory(config, configPath);
          const sanitizedName = req.params.name.replace(/[^\w\-\/ ]/g, '').toLowerCase();
          const sanitizedAction = req.params.action.replace(/[^\w\-\/ ]/g, '');
          const skill = inventory.skills.find(s => s.name.toLowerCase() === sanitizedName);
          if (!skill) return res.status(404).json({ error: 'Skill not found' });

          const actionContent = extractActionContent(skill.content, sanitizedAction);
          if (!actionContent) return res.status(404).json({ error: 'Action not found in skill' });

          res.type('text/markdown').send(actionContent);
        } catch (e) {
          res.status(500).json({ error: 'Internal server error' });
        }
      });

      // Get full skill content
      app.get('/skills/:name', async (req, res) => {
        try {
          const inventory = await loadInventory(config, configPath);
          const sanitizedName = req.params.name.replace(/[^\w\-\/ ]/g, '').toLowerCase();
          const skill = inventory.skills.find(s => s.name.toLowerCase() === sanitizedName);
          
          if (!skill) return res.status(404).json({ error: 'Skill not found' });
          res.type('text/markdown').send(skill.content);
        } catch (e) {
          res.status(500).json({ error: 'Internal server error' });
        }
      });

      app.listen(port, host, () => {
        console.log(`Skillporter API listening on ${host}:${port}`);
        console.log(`  GET /health`);
        console.log(`  GET /search?q=<query>`);
        console.log(`  GET /skills`);
        console.log(`  GET /actions`);
        console.log(`  GET /skills/:name`);
        console.log(`  GET /skills/:name/actions/:action`);
      });
    } catch (error) {
      console.error('Error starting server:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Initialize a default skillporter.json')
  .action(async () => {
    try {
      const defaultConfig = {
        skillDirs: ["./skills"],
        includePatterns: ["**/*.md"],
        excludePatterns: ["**/node_modules/**", "**/dist/**", "**/README.md"],
        outDir: ".skillporter"
      };
      try {
        await fs.access('skillporter.json');
        console.error('Error: skillporter.json already exists. Remove it first if you want to re-initialize.');
        process.exit(1);
      } catch {
        // File does not exist, proceed
      }
      await fs.writeFile('skillporter.json', JSON.stringify(defaultConfig, null, 2));
      console.log('Created skillporter.json');
    } catch (e) {
      console.error('Error creating config:', e);
    }
  });

async function loadConfig(configPath: string) {
  // Security: Strictly bound config loading to the current working directory or absolute paths
  const resolvedPath = path.resolve(process.cwd(), configPath);
  if (!resolvedPath.startsWith(process.cwd())) {
     throw new Error('Security Error: Configuration path must be within the project workspace.');
  }

  try {
    const configRaw = await fs.readFile(resolvedPath, 'utf-8');
    const configJson = parse(configRaw);
    return {
      config: SkillporterConfigSchema.parse(configJson),
      configPath: resolvedPath
    };
  } catch (err) {
    throw new Error(`Failed to load config at ${resolvedPath}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

program.parse();
