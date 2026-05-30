---
name: skill-vetter
version: 1.0.0
description: Security-first skill vetting for AI agents. Use before installing any skill from ClawdHub, GitHub, or other sources. Checks for red flags, permission scope, and suspicious patterns.
---

# Skill Vetter

Security-first vetting protocol for AI agent skills. This skill is a checklist, not a trust oracle: raw file review and user approval still control installation decisions.

## When to Use

- Before installing any skill from ClawdHub
- Before running skills from GitHub repos
- When evaluating skills shared by other agents
- Anytime you're asked to install unknown code

## Vetting Protocol

When vetting leads to a requested fix or install recommendation, separate evidence from conclusion. Use `patch-reasoning-audit` if the risk depends on uncertain causality, sibling paths, permission scope, or generated behavior.

### Step 1: Source Check

```
Questions to answer:
- [ ] Where did this skill come from?
- [ ] Is the author known/reputable?
- [ ] How many downloads/stars does it have?
- [ ] When was it last updated?
- [ ] Are there reviews from other agents?
```

### Step 2: Code Review (MANDATORY)

Read all files in the skill. Check for these red flags:

```
REJECT OR ESCALATE IF YOU SEE:
- curl/wget/install scripts from unknown URLs
- Sends data to external servers without a narrow reason
- Requests credentials/tokens/API keys
- Reads ~/.ssh, ~/.aws, ~/.config without clear reason
- Accesses private memory or identity files without clear reason
- Uses base64 decode, eval, exec, or dynamic code loading on external input
- Modifies files outside the intended workspace or skill directory
- Installs packages without listing them
- Network calls to raw IPs instead of domains
- Obfuscated, compressed, encoded, or minified code
- Requests elevated/sudo permissions
- Accesses browser cookies/sessions
- Touches credential files
```

### Step 3: Permission Scope

```
Evaluate:
- [ ] What files does it need to read?
- [ ] What files does it need to write?
- [ ] What commands does it run?
- [ ] Does it need network access? To where?
- [ ] Is the scope minimal for its stated purpose?
```

### Step 4: Risk Classification

| Risk Level | Examples | Action |
|------------|----------|--------|
| LOW | Notes, formatting | Basic review |
| MEDIUM | File ops, browser, APIs | Full code review |
| HIGH | Credentials, finance, system access | Explicit user approval |
| EXTREME | Security configs, root access, credential access | Do not install |

## Output Format

After vetting, produce this report:

```
Skill: [name]
Source: [ClawdHub / GitHub / other]
Author: [username]
Version: [version]

Metrics:
- Downloads/Stars: [count]
- Last Updated: [date]
- Files Reviewed: [count]

RED FLAGS: [None / List them]

Permissions Needed:
- Files: [list or "None"]
- Network: [list or "None"]
- Commands: [list or "None"]

Risk Level: [LOW / MEDIUM / HIGH / EXTREME]

Verdict: [SAFE TO INSTALL / INSTALL WITH CAUTION / DO NOT INSTALL]

NOTES: [Any observations]
```

## Quick Vet Commands

Prefer `gh` when authenticated:

```bash
# Check repo stats
gh repo view OWNER/REPO --json stargazerCount,forkCount,updatedAt

# List skill files
gh api repos/OWNER/REPO/contents/skills/SKILL_NAME --jq '.[].name'

# Fetch and review SKILL.md
gh api repos/OWNER/REPO/contents/skills/SKILL_NAME/SKILL.md --jq .content | base64 --decode
```

Fallback without `gh`:
```bash
# Check repo stats
curl -s "https://api.github.com/repos/OWNER/REPO" | jq '{stars: .stargazers_count, forks: .forks_count, updated: .updated_at}'

# List skill files
curl -s "https://api.github.com/repos/OWNER/REPO/contents/skills/SKILL_NAME" | jq '.[].name'

# Fetch and review SKILL.md
curl -s "https://raw.githubusercontent.com/OWNER/REPO/main/skills/SKILL_NAME/SKILL.md"
```

## Trust Hierarchy

1. **Official OpenClaw skills** → Lower scrutiny (still review)
2. **High-star repos (1000+)** → Moderate scrutiny
3. **Known authors** → Moderate scrutiny
4. **New/unknown sources** → Maximum scrutiny
5. **Skills requesting credentials** → Human approval always

## Remember

- No skill is worth compromising security
- When in doubt, don't install
- Ask your human for high-risk decisions
- Document what you vet for future reference
