---
name: performance-audit/memory
description: Tools for identifying memory leaks and optimizing resource management.
---

# Memory & Resource Management

Audit code for leaks and excessive memory consumption that can lead to Out-of-Memory (OOM) crashes.

### find_memory_leaks
Identify common patterns that prevent garbage collection.
**Check for**:
- **Global Variables**: Large objects attached to `global` or `window`.
- **Event Listeners**: Listeners added but never removed (`.on()` without `.off()`).
- **Closures**: Functions that accidentally retain large scope variables long after they are needed.

### audit_streaming
Check if large data sets (files, API responses) are being loaded entirely into memory.
**Action**: Search for `fs.readFileSync` or `res.json()` with potentially huge payloads.
**Optimization**: Suggest using Streams (`fs.createReadStream`) or pagination.

### detect_circular_references
Identify complex object structures that might confuse simple garbage collectors or cause serialization issues.
**Action**: Audit deep object nesting and verify if `JSON.stringify` or similar operations are safe.

### monitor_resource_limits
Verify if the system enforces limits on resource-intensive operations.
**Action**: Check for timeouts on long-running tasks and size limits on incoming buffers/requests.
