---
name: performance-audit
description: Suite for auditing algorithmic complexity, resource usage, and performance bottlenecks.
---

# Performance & Resource Audit

Performance auditing focuses on identifying "Expensive" operations that can slow down the system or be used as a vector for Denial of Service (DoS) attacks.

Before patching a performance finding, use `patch-reasoning-audit` when the expensive operation may be a symptom of a broader ingestion/retrieval, caching, lifecycle, or state-model issue.

## Sub-Skills
- [Complexity](./complexity.md): Audit Big O complexity and algorithmic efficiency.
- [Memory](./memory.md): Audit memory usage, leaks, and garbage collection behavior.

## Methodology
1. **Identify Hot Paths**: Find code that is executed frequently (e.g., inside a request handler or a main loop).
2. **Analyze Loops**: Look for nested loops or recursive calls that depend on user-controlled input size.
3. **Audit I/O**: Identify blocking I/O operations or redundant database queries (N+1 problem).
4. **Stress the Limits**: Estimate how the code behaves when input size $N$ grows by 10x or 100x.
5. **Compare Same Mechanism**: Check at least one sibling use case of the same mechanism, not only repeated slow examples with the same shape.

### find_hot_paths
Use this action to identify the most frequently executed code in a feature.
**Task**: Trace the execution flow of a high-traffic operation and list the functions involved.
