---
name: logic-audit
description: Specialized suite for identifying deep software logic bugs, state machine flaws, and invariant violations.
---

# Logic Bug Auditing

Logic bugs are flaws in the design or implementation of the system's "business rules." Unlike syntax errors or simple crashes, logic bugs often result in unexpected behavior, privilege escalation, or data inconsistency.

When a logic-audit finding becomes a proposed patch, use `patch-reasoning-audit` unless the failing test and broken invariant are already directly established.

## Sub-Skills
- [Invariants](./invariants.md): Audit system rules and data consistency.
- [State Machines](./state-machines.md): Audit transitions, status flows, and authorization.
- [Concurrency](./concurrency.md): Audit race conditions, TOCTOU, and locking issues.

## Methodology
1. **Understand the "Happy Path"**: First, identify how the code is *supposed* to work.
2. **Define Invariants**: Ask "What must always be true here?"
3. **Attack the Transitions**: Try to skip steps, jump states, or trigger operations out of order.
4. **Stress the Timing**: Look for logic that assumes operations are atomic when they are not.
5. **Sample Sibling Paths**: Check different use cases of the same mechanism before concluding which transition is broken.

### map_logic
Use this action to map out the high-level logic of a specific feature.
**Task**: Read the entry point of a feature and trace its primary control flow. Identify critical decision points (if/else, switch).
