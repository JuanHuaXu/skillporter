---
name: github/repo-mgmt
description: Repository-level management tools, including secrets and settings via gh CLI.
---

# GitHub Repository Management

Manage repository configurations, secrets, and environments using the `gh repo` and `gh secret` command suites.

### repo_view
View the README or metadata for a repository.
**Command:** `gh repo view [OWNER/REPO]`

### repo_clone
Clone a repository locally for audit.
**Command:** `gh repo clone [OWNER/REPO]`

### set_secret
Set a repository secret for GitHub Actions.
**Command:** `gh secret set [NAME] --body "[VALUE]" --repo [OWNER/REPO]`

### list_secrets
List names of secrets available in the repository.
**Command:** `gh secret list --repo [OWNER/REPO]`

### list_envs
List environments configured for the repository via the API.
**Command:** `gh api repos/[OWNER]/[REPO]/environments`

### get_workflow_runs
Check the status of recent GitHub Actions workflow runs.
**Command:** `gh run list --repo [OWNER/REPO] --limit 5`

### dispatch_workflow
Manually trigger a repository workflow.
**Command:** `gh workflow run [WORKFLOW_FILE] --repo [OWNER/REPO]`
