# Skillporter 🌌

Skillporter is a high-performance Markdown skill indexer and discovery engine designed for AI agents. It decouples massive skill libraries from the agent's immediate context, allowing for O(1) context scaling through on-demand retrieval.

## 🏗️ Architecture

- **Sidecar (Server)**: A Node.js background service that indexes Markdown files and serves search/retrieval requests over HTTP.
- **OpenClaw Plugin (Client)**: A native extension that adds `skill_search` and `skill_load` capabilities to any OpenClaw agent.

## 🚀 Quick Start

### Installation

We provide a unified setup script to configure the sidecar and the plugin in one go:

```bash
git clone https://github.com/your-repo/skillporter.git
cd skillporter
./scripts/setup.sh
```

This will:
1. Build the Skillporter CLI.
2. Register the sidecar as a macOS LaunchAgent (Port 3000).
3. Symlink the OpenClaw plugin into your extensions folder.

### Configuration

The sidecar uses `skillporter.json` in the root directory:

```json
{
  "skillDirs": ["./skills"],
  "includePatterns": ["**/*.md"],
  "excludePatterns": ["**/node_modules/**", "README.md"],
  "port": 3000,
  "host": "127.0.0.1"
}
```

## 🧩 OpenClaw Integration

Once installed, your agent gains two new tools:

1.  **`skill_search(query)`**: Returns a ranked list of relevant skills, references, and action-words. Search is local and phrase-aware: it scores exact phrases, token coverage, nearby terms, names, descriptions, action headings, and Markdown body text without using an LLM, embedder, or network service.
2.  **`skill_load(skill, [action])`**: Loads the full instructions for a skill (or a specific action) directly into the agent's history.

During indexing, Skillporter also generates `.skillporter/concepts.json`: a deterministic concept map with a checksum stored in the inventory. It combines curated local aliases (for example `rce` → `remote code execution`, `unfurl` → `link preview`) with acronym pairs extracted from the Markdown corpus, enabling meaning-like query expansion while staying fast and fully local.

### Context Management (Librarian Mode)
Skillporter uses a "Librarian" model. Instead of bloating the system prompt, it returns instructions as tool results. This allows your **Context Engine (e.g., LibraVDB)** to naturally manage the memory and prune instructions when they are no longer relevant.

## 🔒 Security

- **Path Isolation**: Files are strictly bound to configured `skillDirs`.
- **DoS Protection**: Maximum file size limit of 1MB per skill.
- **Rate Limiting**: Built-in protection against request flooding (200 req / 15 min).
- **Hardened Sanitization**: Strict regex-based input validation for all API parameters.

## 🛠️ Development

### Building
```bash
npm run build
```

### Manual Indexing
```bash
skillporter index
```

### Phrase Search
```bash
skillporter search "find RCE bugs"
skillporter search "\"link preview\" discord"
```

Use `search` for discovery, then pass an exact skill or action name to `get`.

### Running the API manually
```bash
skillporter serve
```

## License

Skillporter is released under the [MIT License](./LICENSE).
