---
name: github
description: Comprehensive GitHub automation suite for repository management, issue tracking, and pull requests.
---

# GitHub Automation Suite

This skill provides a full suite of automated capabilities for interacting with GitHub. It is divided into specialized sub-skills for better focus.

## Sub-Skills
- [Issues](./issues.md): Track and manage security findings and bugs.
- [Pull Requests](./pull-requests.md): Automate code reviews and PR creation.
- [Repository Management](./repo-mgmt.md): Manage repository settings, secrets, and environments.

## General Usage
Most actions in this suite utilize the GitHub CLI (`gh`). Ensure you are authenticated before proceeding.

### status
Check current authentication and API status.
**Command:** `gh auth status`

### login
Log in to GitHub via the CLI.
**Command:** `gh auth login`

### whoami
Display the currently authenticated user.
**Command:** `gh api user --jq .login`
