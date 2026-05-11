# Structural Analysis (ast-grep)

Use ast-grep (sg) to perform AST-based search and rewrite operations. This allows for "semantic" understanding of code patterns that text-based grep cannot find.

## Prerequisites
- `ast-grep` can be run via npx or installed globally.
- It requires Tree-sitter parsers (automatically handled by the runner).

## Actions

### install
Install ast-grep globally for faster performance.
`brew install ast-grep` or `npm install -g @ast-grep/cli`

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
