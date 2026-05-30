---
name: semgrep
description: Use Semgrep for semantic code analysis, security audits, bug hunting, finding known vulnerability patterns, enforcing architectural rules, and applying autofixes where appropriate.
---

# Security & Bug Hunting (Semgrep)

Use Semgrep to perform semantic analysis and security auditing. Semgrep excels at finding complex bugs and security vulnerabilities using its vast registry of community rules.

Treat Semgrep results as leads until confirmed. Before proposing or applying a nontrivial fix, use `patch-reasoning-audit` to verify root cause, scope, sibling paths, and false positives.

## Prerequisites
- Semgrep requires Python 3.10+ for native CLI installs, or Docker for containerized scans.
- Internet access is required to pull the latest rules from the Semgrep Registry unless running in offline mode.

## Actions

### install
Install Semgrep globally or use Docker for isolated scans.

**macOS**:
- Homebrew: `brew install semgrep`
- pipx: `pipx install semgrep`
- uv: `uv tool install semgrep`

**Linux**:
- pipx: `pipx install semgrep`
- uv: `uv tool install semgrep`
- Docker: `docker run --rm -v "${PWD}:/src" semgrep/semgrep semgrep scan --config auto /src`

**Windows**:
- pipx: `pipx install semgrep`
- uv: `uv tool install semgrep`
- Docker Desktop: `docker run --rm -v "%cd%:/src" semgrep/semgrep semgrep scan --config auto /src`

**Verify**: `semgrep --version`
**Official install docs**: `https://semgrep.dev/docs/getting-started/quickstart`

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
- **Autofix Boundary**: Use `--autofix` only for mechanical, rule-local changes. For uncertain behavior, prove the invariant first.
