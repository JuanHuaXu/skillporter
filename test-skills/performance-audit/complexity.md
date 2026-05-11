---
name: performance-audit/complexity
description: Tools for analyzing Big O complexity and optimizing algorithmic efficiency.
---

# Algorithmic Complexity (Big O)

Audit code for inefficient algorithms that can lead to performance degradation or Algorithmic Complexity Attacks.

### analyze_big_o
Estimate the time complexity of a function relative to its input size $N$.
**Action**:
1. Identify all loops and recursive calls.
2. Determine if they are nested ($O(N^2)$, $O(N^3)$, etc.).
3. Check for $O(2^N)$ or $O(N!)$ patterns (e.g., in regex or recursive search).

### find_n_plus_one
Identify "N+1" query patterns where a database or API call is made inside a loop.
**Action**: Search for `await`, `fetch`, or `db.query` calls inside `for`, `forEach`, or `map`.
**Optimization**: Suggest batching or joining data into a single query.

### audit_regex_complexity
Identify Regular Expressions that can cause "Catastrophic Backtracking."
**Action**: Search for nested quantifiers like `(a+)+` or `([a-zA-Z]+)*`.
**Risk**: These can lead to $O(2^N)$ complexity, allowing a small input to freeze the server.

### detect_expensive_sort
Check for sorting operations on large or unvalidated data sets.
**Action**: Identify where `.sort()` is used and verify if the data size is capped.
