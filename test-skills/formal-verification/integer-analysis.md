---
name: formal-verification/integer-analysis
description: Rigorous mathematical analysis of integer ranges, overflows, and precision errors.
---

# Integer & Range Analysis

Software bugs often hide in the "Edge Cases" of fixed-width integers and floating-point math.

### audit_overflow_risk
Mathematically determine if an arithmetic operation can exceed the type's bounds.
**Action**:
1. Identify the input ranges (e.g., `uint32` means `0 to 2^32 - 1`).
2. Calculate the maximum possible result of an expression.
3. Check if `max_result > max_type_bound`.
**Example**: `a + b` where `a` and `b` are both `uint32`. If both are `2^31`, the result overflows.

### check_underflow
Check for negative results in unsigned types.
**Action**: Identify subtractions (`a - b`) where `a` and `b` are unsigned. Prove that `a >= b` is always enforced before the operation.

### precision_loss_analysis
Audit floating-point or fixed-point division for rounding errors.
**Action**:
1. Identify divisions (`a / b`).
2. Check if the remainder is lost or handled.
3. **Risk**: In financial code, repeated rounding down can lead to significant "lost" value over many iterations.
4. **Task**: Calculate the "Maximum Possible Error" over N iterations.

### range_constraint_proving
Prove that a variable stays within a specific range [Min, Max] across all possible paths.
**Action**: Use induction (check start state, check every possible change) to prove the range is never violated.
