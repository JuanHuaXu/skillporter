---
name: github/pull-requests
description: Tools for managing GitHub Pull Requests and automated reviews via gh CLI.
---

# GitHub Pull Requests

Automate the creation, review, and merging of Pull Requests using the `gh pr` command suite.

### create_pr
Create a new PR from the current branch.
**Command:** `gh pr create --title "[TITLE]" --body "[BODY]" --draft --assignee "@me"`

### list_prs
List open pull requests in the repository.
**Command:** `gh pr list --repo [OWNER/REPO]`

### check_pr
Check the status of CI/CD checks for a PR.
**Command:** `gh pr checks [NUMBER] --repo [OWNER/REPO]`

### view_diff
View the code changes (diff) for a specific PR.
**Command:** `gh pr diff [NUMBER] --repo [OWNER/REPO]`

### pr_review
Add a review comment or approve a PR.
**Command:** `gh pr review [NUMBER] --approve --body "Automated audit passed. LGTM!"`

### merge_pr
Merge a pull request once approved.
**Command:** `gh pr merge [NUMBER] --merge --delete-branch --repo [OWNER/REPO]`
