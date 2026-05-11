---
name: blind-spot-audit
description: Suite for identifying "Shadow Attack Surfaces" and implicitly trusted logic paths.
---

# Blind Spot Auditing

Blind spot auditing is the practice of looking for vulnerabilities in areas that are traditionally ignored or considered "safe." This includes internal APIs, error handlers, and environmental assumptions.

## Sub-Skills
- [Error Paths](./error-paths.md): Audit the "Dark Logic" inside failure and recovery handlers.
- [Integrations](./integrations.md): Audit trust boundaries between internal code and external services.
- [Hidden State](./hidden-state.md): Audit side-effects in caching, logging, and temp files.

## Methodology
1. **Challenge "Safe" Assumptions**: Ask "What happens if this 'trusted' internal service returns garbage?"
2. **Audit the Negatives**: Look for missing `default` cases, missing error handlers, and unhandled promise rejections.
3. **Trace Side Effects**: Follow data not just to its intended Sink, but to its "Shadow Sinks" (Logs, Caches, Analytics).
4. **Environment Stress**: Audit how the code behaves when environment variables are missing or malformed.

### find_implicit_trust
Use this action to find where the code trusts data from a "Safe" source.
**Task**: Identify a data source that isn't a direct user request (e.g., a database field, an internal API response) and check if it is validated.
