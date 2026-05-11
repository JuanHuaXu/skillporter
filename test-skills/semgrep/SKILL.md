# Security & Bug Hunting (Semgrep)

Use Semgrep to perform semantic analysis and security auditing. Semgrep excels at finding complex bugs and security vulnerabilities using its vast registry of community rules.

## Prerequisites
- Semgrep requires Python or can be installed via Homebrew.
- Internet access is required to pull the latest rules from the Semgrep Registry unless running in offline mode.

## Actions

### install
Install Semgrep globally.
`brew install semgrep` or `python3 -m pip install semgrep`

### scan
Perform a full security and quality scan using the community registry.

**Usage**:
`semgrep scan --config auto`

### search
Perform an ad-hoc semantic search for a specific pattern.

**Usage**:
`semgrep --lang <lang> -e '<pattern>' .`

**Examples**:
- Find hardcoded credentials: `semgrep --lang javascript -e 'password = "$$$"' .`
- Find unsafe regex: `semgrep --lang python -e 're.compile($X)' .`

### fix
Run a scan and automatically apply suggested fixes.
`semgrep scan --config auto --autofix`

## Semgrep vs ast-grep
- Use **ast-grep** for surgical, structural search-and-replace (e.g., refactoring a function signature).
- Use **Semgrep** for security audits, finding known CVE patterns, and enforcing high-level architectural rules.

## Security & Best Practices
- **Rulesets**: Use `--config "p/security-audit"` for a focused security pass.
- **Ignore**: Semgrep automatically respects `.gitignore`, but you can use `.semgrepignore` for specific exclusions.
- **Output**: For large projects, use `--json` if you need to parse results programmatically.
- **Pattern Syntax**: Semgrep uses `...` for "anything in between" and `$VAR` for metavariables, similar to ast-grep but optimized for bug detection.
