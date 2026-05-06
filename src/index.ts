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
      console.log(`Indexed ${inventory.skills.length} skills.`);
      for (const skill of inventory.skills) {
        console.log(`  - ${skill.name} (${skill.actions.length} actions)`);
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
          console.log(`\n[${skill.name}]`);
          for (const action of skill.actions) {
            console.log(`  - ${action.name} (line ${action.line})`);
          }
        } else {
          console.log(`\n[${skill.name}] (no actions found)`);
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

      const skill = inventory.skills.find(s => 
        s.name.toLowerCase() === sanitizedName || 
        s.actions.some(a => a.name.toLowerCase() === sanitizedName)
      );

      if (skill) {
        console.log(skill.content);
      } else {
        console.error(`Skill or action '${action}' not found.`);
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
  .option('-p, --port <number>', 'port to listen on', '3000')
  .action(async (options) => {
    try {
      const { config, configPath } = await loadConfig(options.config);
      const app = express();
      const port = parseInt(options.port, 10);

      // Security: Add Helmet for secure headers
      app.use(helmet());

      // Security: Rate limiting to prevent DoS
      const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Limit each IP to 100 requests per window
        standardHeaders: true,
        legacyHeaders: false,
        message: 'Too many requests, please try again later.'
      });
      app.use(limiter);

      app.get('/skills', async (req, res) => {
        try {
          const inventory = await loadInventory(config, configPath);
          res.json(inventory.skills.map(s => ({ 
            name: s.name, 
            description: s.description, 
            actionCount: s.actions.length 
          })));
        } catch (e) {
          res.status(500).json({ error: 'Internal server error' });
        }
      });

      app.get('/actions', async (req, res) => {
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

      app.listen(port, () => {
        console.log(`Skillporter API listening on port ${port}`);
        console.log(`- GET /skills`);
        console.log(`- GET /actions`);
        console.log(`- GET /skills/:name`);
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
      await fs.writeFile('skillporter.json', JSON.stringify(defaultConfig, null, 2));
      console.log('Created skillporter.json');
    } catch (e) {
      console.error('Error creating config:', e);
    }
  });

async function loadConfig(configPath: string) {
  // Security: Prevent traversal in config path argument
  if (configPath.includes('..') && !configPath.startsWith(process.cwd())) {
     throw new Error('Security Error: Configuration path must be within the project workspace.');
  }

  const fullPath = path.resolve(process.cwd(), configPath);
  const configRaw = await fs.readFile(fullPath, 'utf-8');
  const configJson = parse(configRaw);
  return {
    config: SkillporterConfigSchema.parse(configJson),
    configPath: fullPath
  };
}

program.parse();
