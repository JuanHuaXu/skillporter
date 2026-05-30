---
name: code-quality
description: Use for formatting, linting, and mechanical code-quality cleanup when the requested change is broad but not root-cause-sensitive. Skip for causal bug fixes unless patch-reasoning-audit has already established the invariant.
---

# Code Quality Workflow

A high-level workflow for automatically fixing formatting and linting issues in any repository. Use this to perform a "Full Clean" of a codebase.

Skip this skill for root-cause-sensitive bug, security, performance, or regression fixes unless the failing test and root cause are already directly established. Use `patch-reasoning-audit` first when a linter finding might be only a symptom.

## Workflow Sequence

## Installation Notes

This workflow depends on Prettier, Mega-Linter, Node.js, and usually Docker. Use the OS-specific install sections in the `prettier` and `mega-linter` skills instead of guessing commands from memory.

### 0. Safety Check
Before broad cleanup:
1. Inspect `git status --short`.
2. Tell the user if unrelated changes are present.
3. Get explicit approval before repository-wide `--write` or `--fix`.

### 1. Prettify
First, normalize the code structure to eliminate whitespace noise and basic formatting errors.
1. Load the `prettier` skill.
2. Install Prettier if missing.
3. Run `npx prettier --write .`

### 2. Mega-Lint When Docker Is Available
Second, perform a deep audit to catch security, style, and logic issues that Prettier ignores.
1. Load the `mega-linter` skill.
2. Ensure Docker is running.
3. Run `npx mega-linter-runner --flavor all --fix`

### 2b. No-Docker Fallback
If Docker is unavailable, do not block cleanup. Use repository-native checks instead:
1. Inspect `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, or equivalent for lint/type/test scripts.
2. Run formatter checks first, then lint/type/test commands that already exist.
3. Use `semgrep` or `ast-grep` for targeted static checks when they are already installed or the user approves installation.
4. Report that Mega-Linter was skipped because Docker was unavailable.

### 3. Verification
Finally, verify the changes.
1. Run `npx prettier --check .`
2. Review the `megalinter-reports` folder (if created) for any remaining manual-fix items.

## Actions

### auto-fix
Perform the full sequence (Prettier -> Mega-Linter).

## Security & Best Practices
- **Commit First**: Encourage the user to commit or otherwise preserve current changes before broad cleanup, as it can modify many files.
- **Permission Boundary**: Do not run broad `--write` or `--fix` commands unless the user asked for a cleanup or approved the scope.
- **Git Ignore**: Ensure `node_modules`, `dist`, and `.git` are properly ignored in both linter configurations.
- **Incremental Application**: If the repo is massive, apply the workflow folder-by-folder to avoid resource exhaustion.
