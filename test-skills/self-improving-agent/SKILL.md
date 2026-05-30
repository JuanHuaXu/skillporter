---
name: self-improvement
description: Use when a command fails, the user corrects the agent, a prior conclusion was wrong, a tool behaves unexpectedly, or a repeatable workflow improvement should be captured for future Codex/OpenClaw sessions.
metadata:
  short-description: Capture corrections and workflow learnings
---

# Self-Improvement

Use this skill to turn concrete mistakes into durable operating rules. Keep entries short, factual, and tied to evidence.

## When To Use

- A command, tool, API, or install step fails unexpectedly.
- The user says the agent's conclusion, patch, or assumption was wrong.
- A previous fix overfit a symptom or missed the actual root cause.
- A better repeatable workflow is discovered.
- A local convention should be remembered for future Codex/OpenClaw work.

Skip one-off preferences, ordinary test failures fixed immediately, or vague impressions without a concrete correction.

## Where To Write

Prefer the current workspace when the learning is project-specific:

- `.learnings/LEARNINGS.md` for corrections, conventions, and better workflows.
- `.learnings/ERRORS.md` for tool, command, API, or environment failures.
- `.learnings/FEATURE_REQUESTS.md` for missing capabilities requested by the user.

Use `~/.openclaw/workspace/.learnings/` only for broadly reusable OpenClaw/Codex behavior that should survive across projects.

Create the directory only when needed:

```bash
mkdir -p .learnings
```

## Entry Format

```markdown
## YYYY-MM-DD - Short Title

- Category: correction | error | workflow | tool | convention
- Context: What happened.
- Evidence: Raw trace, command, file, or user correction that proves it.
- Lesson: The rule to apply next time.
- Scope: Project-local or global.
```

## Root-Cause Corrections

When the user rejects a fix because root cause was not isolated, run `patch-reasoning-audit` before making more edits. Capture:

- Which evidence was over-weighted.
- Which sibling path or alternate use case was missed.
- What falsifier should have been written first.
- The corrected invariant or workflow rule.

Do not promote a learning into global memory until it has a concrete, repeatable shape.
