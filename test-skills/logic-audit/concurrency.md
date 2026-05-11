---
name: logic-audit/concurrency
description: Tools for identifying race conditions, TOCTOU, and atomicity issues.
---

# Concurrency & Timing

Logic bugs often occur when two operations happen at the same time, leading to unexpected "Interleaving" of logic.

### find_toctou
Search for "Time-of-Check to Time-of-Use" patterns.
**Pattern**:
1. Check condition (e.g., `if (balance >= amount)`)
2. *Asynchronous gap* (e.g., `await logOperation()`)
3. Use resource (e.g., `balance -= amount`)
**Risk**: The balance might change during the `await` gap.

### audit_atomicity
Verify if multi-step updates are atomic (e.g., using DB transactions).
**Action**: Check if code that updates multiple related tables/objects is wrapped in a transaction or has a rollback mechanism.

### detect_race_conditions
Identify variables that are read and then written without locking.
**Task**: Use `grep` or `ast-grep` to find variables that are incremented/decremented (e.g., `count++`) in asynchronous contexts or across multiple HTTP requests without database-level locking (e.g., `SELECT ... FOR UPDATE`).
