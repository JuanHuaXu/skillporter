# Code Quality Workflow

A high-level workflow for automatically fixing formatting and linting issues in any repository. Use this to perform a "Full Clean" of a codebase.

## Workflow Sequence

### 1. Prettify
First, normalize the code structure to eliminate whitespace noise and basic formatting errors.
1. Load the `prettier` skill.
2. Install Prettier if missing.
3. Run `npx prettier --write .`

### 2. Mega-Lint
Second, perform a deep audit to catch security, style, and logic issues that Prettier ignores.
1. Load the `mega-linter` skill.
2. Ensure Docker is running.
3. Run `npx mega-linter-runner --flavor all --fix`

### 3. Verification
Finally, verify the changes.
1. Run `npx prettier --check .`
2. Review the `megalinter-reports` folder (if created) for any remaining manual-fix items.

## Actions

### auto-fix
Perform the full sequence (Prettier -> Mega-Linter).

## Security & Best Practices
- **Commit First**: ALWAYS encourage the user to commit their current changes before running this workflow, as it can modify hundreds of files.
- **Git Ignore**: Ensure `node_modules`, `dist`, and `.git` are properly ignored in both linter configurations.
- **Incremental Application**: If the repo is massive, apply the workflow folder-by-folder to avoid resource exhaustion.
