---
name: ast-grep
description: Use ast-grep for structural code search, AST-aware pattern matching, semantic refactors, and precise code rewrites across JavaScript, TypeScript, Python, Go, HTML, and other languages.
---

# Structural Analysis (ast-grep)

Use ast-grep (sg) to perform AST-based search and rewrite operations. This allows for "semantic" understanding of code patterns that text-based grep cannot find.

Use matches as structural evidence, not root-cause proof. Before turning ast-grep findings into a nontrivial bug/security/performance fix, apply `patch-reasoning-audit` to compare sibling use cases of the same mechanism.

## Prerequisites
- `ast-grep` can be run via npx or installed globally.
- It requires Tree-sitter parsers (automatically handled by the runner).

## Actions

### install
Install ast-grep globally for faster performance, or run it through Node without a global install.

**macOS**:
- Homebrew: `brew install ast-grep`
- Node: `npm install -g @ast-grep/cli`

**Linux**:
- Node: `npm install -g @ast-grep/cli`
- Rust: `cargo install ast-grep --locked`

**Windows**:
- Node: `npm install -g @ast-grep/cli`
- Rust: `cargo install ast-grep --locked`

**Verify**: `sg --version`
**Official install docs**: `https://ast-grep.github.io/guide/quick-start.html`

### search
Search for a structural pattern. Unlike text grep, this ignores whitespace and comments.

**Usage**:
`sg run --pattern '<pattern>' --lang <lang>`

**Examples**:
- Find all calls to a specific function: `sg run --pattern 'api.registerTool($ID, $OBJ)' --lang typescript`
- Find React `useState` hooks: `sg run --pattern 'const [$VAL, $SET] = useState($INIT)' --lang typescript`

### rewrite
Structurally replace code patterns across the project.

**Usage**:
`sg run --pattern '<old_pattern>' --rewrite '<new_pattern>' --lang <lang> -i`

### scan
Run a structural linting scan using rules.
`sg scan`

## Common Analysis Patterns for Agents

### Find "Unsafe" Returns
`sg run --pattern 'return { ...$RES }' --lang javascript`
(Finds places where an object is being spread into a return, potentially leaking sensitive data).

### Find Missing Error Handling
`sg run --pattern 'try { $$$ } catch ($ERR) {}' --lang typescript`
(Finds empty catch blocks).

### Find Hardcoded Secrets
`sg run --pattern 'const $KEY = "sk-$$$"' --lang javascript`

## Security & Best Practices
- **Quotes**: Always wrap patterns in single quotes `'...'` to prevent shell expansion of `$` variables.
- **Language**: Always specify `--lang` (e.g., `typescript`, `python`, `go`, `html`).
- **Dry Run**: Before using `-i` (interactive/in-place), run without it to preview matches.
- **Complexity**: For very complex patterns, prefer creating a `rule.yml` file and using `sg scan`.
- **Patch Boundary**: Structural similarity is not causality. Do not auto-rewrite adjacent paths unless the invariant and negative controls are clear.
