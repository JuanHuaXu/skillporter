---
name: blind-spot-audit/hidden-state
description: Tools for auditing side-effects in logging, caching, and temporary files.
---

# Hidden State & Side Effects

Audit "Shadow" data sinks that can leak sensitive information or be used to manipulate system behavior.

### audit_logging_leakage
Search for sensitive data being sent to logs.
**Action**: Search for `console.log`, `logger.info`, etc., and check if variables containing PII, credentials, or session tokens are passed.

### check_cache_integrity
Audit data stored in caches (e.g., Redis, Memcached).
**Action**: Check if cached data is validated upon retrieval.
**Risk**: If an attacker can pollute the cache, they can influence the logic of every user that retrieves that cached data.

### find_temp_file_leaks
Audit usage of `/tmp` or local scratch space.
**Action**: Verify that temporary files are created with secure permissions (e.g., `0600`) and are deleted immediately after use.
**Risk**: Leftover temp files can leak source code, data exports, or session info.
