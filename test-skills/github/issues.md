---
name: github/issues
description: Specialized tools for GitHub issue tracking and management via gh CLI.
---

# GitHub Issues

Automate the lifecycle of issues for tracking findings, feature requests, and bugs using the `gh issue` command suite.

### create_issue
Create a new issue with standardized metadata.
**Command:** `gh issue create --repo [OWNER/REPO] --title "[TITLE]" --body "[BODY]" --label "security,audit"`

### list_issues
Search for open issues in a repository, filtered by label.
**Command:** `gh issue list --repo [OWNER/REPO] --state open --label "security"`

### find_issue
Find an issue by its title or search query.
**Command:** `gh issue list --repo [OWNER/REPO] --search "[QUERY]"`

### view_issue
Get full details and comments for a specific issue.
**Command:** `gh issue view [NUMBER] --repo [OWNER/REPO] --comments`

### add_comment
Post a comment to an issue.
**Command:** `gh issue comment [NUMBER] --repo [OWNER/REPO] --body "[BODY]"`

### edit_issue
Modify an existing issue (e.g., update title or labels).
**Command:** `gh issue edit [NUMBER] --repo [OWNER/REPO] --add-label "in-progress" --remove-label "audit"`

### close_issue
Close a resolved issue.
**Command:** `gh issue close [NUMBER] --repo [OWNER/REPO] --reason "completed"`
