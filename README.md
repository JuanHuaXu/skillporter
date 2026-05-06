# Skillporter 🧳🤖

Skillporter is a dedicated **Skill Indexer and Server** for Markdown-based agent skills. It parses Markdown files, extracts "action words" (commands), and serves them to agents.

## Features

- **Action Extraction**: Automatically identifies actions defined in `###` (H3) headers.
- **Metadata Support**: Parses skill name and description from Markdown front-matter.
- **Fast Indexing**: Uses glob patterns to scan multiple directories and builds a persistent JSON inventory.
- **Flexible Retrieval**: Get the full Markdown content for any skill or specific action word.
- **HTTP API**: Serve the skill inventory and documentation to remote agents.

## Quick Start

### 1. Initialize
```bash
npx skillporter init
```

### 2. Configure `skillporter.json`
```json
{
  "skillDirs": ["./my-skills", "../other-repo/skills"],
  "includePatterns": ["**/*.md"],
  "outDir": ".skillporter"
}
```

### 3. Index Skills
```bash
npx skillporter index
```

### 4. List Actions
```bash
npx skillporter list
```

### 5. Get Skill Content
```bash
npx skillporter get my_action_name
```

### 6. Serve API
```bash
npx skillporter serve --port 3000
```

## How it Works

Skillporter looks for Markdown files in the configured `skillDirs`. For each file, it:
1.  Extracts metadata (name, description) from the front-matter.
2.  Scans for H3 headers (`### `) and treats them as "Action Words".
3.  Maps these actions back to the source file for instant retrieval.

## API Endpoints

- `GET /skills`: List all discovered skills with metadata.
- `GET /actions`: List all discovered action words across all skills.
- `GET /skills/:name`: Retrieve the full Markdown content of a specific skill.

## License
MIT
