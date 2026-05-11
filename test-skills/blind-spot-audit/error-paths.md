---
name: blind-spot-audit/error-paths
description: Tools for auditing failure logic, try/catch blocks, and recovery handlers.
---

# Error Path Auditing (Dark Logic)

Bugs in error handlers are often high-impact because they trigger when the system is already in an unstable state.

### audit_catch_blocks
Identify logic inside `catch` or `except` blocks.
**Check for**:
- **Information Disclosure**: Does the error handler log the full exception or return it to the user?
- **Incomplete State Recovery**: Does the error handler leave a lock open or a database transaction unrolled?
- **Recursive Errors**: Does the error handler itself trigger another error (e.g., trying to log to a full disk)?

### find_unhandled_failures
Search for "Silent Failures" where errors are swallowed.
**Action**: Search for empty `catch {}` blocks or `on('error', () => {})`.
**Risk**: Swallowing errors can lead to "Ghost States" where the system thinks an operation succeeded when it failed.

### audit_cleanup_logic
Check if cleanup logic (e.g., `finally` blocks) is robust.
**Task**: Verify that sensitive resources (temp files, credentials in memory) are cleared even if an operation fails midway.
