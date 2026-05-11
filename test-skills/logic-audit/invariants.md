---
name: logic-audit/invariants
description: Tools for identifying and auditing system invariants and consistency rules.
---

# System Invariants

An invariant is a condition that must always be true for the system to be considered in a "valid" state. Logic bugs often occur when an operation leaves the system in an invalid state.

### identify_invariants
Look for "Global Truths" in the codebase.
**Examples**:
- "A user's balance can never be less than their pending withdrawals."
- "An order cannot be 'shipped' unless it is 'paid'."
- "Only an 'Admin' can change the 'ownerId' of a resource."

### audit_consistency
Check if any code path can break an identified invariant.
**Task**: Find every function that modifies a critical field (e.g., `balance`, `status`, `role`) and verify that it enforces the invariant before and after the modification.

### find_unvalidated_updates
Search for "blind" updates to sensitive fields.
**Action**: Use `ast-grep` or `grep` to find where sensitive fields are assigned values without preceding validation logic.
**Command**: `ast-grep --pattern '$_.$FIELD = $VALUE'` (where FIELD is a sensitive attribute).
