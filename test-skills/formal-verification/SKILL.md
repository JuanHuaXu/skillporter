---
name: formal-verification
description: High-rigor suite for converting code to mathematical models and proving logic integrity.
---

# Formal Verification & Mathematical Audit

Formal verification involves treating code as a mathematical object. By converting algorithms into formulas, we can prove that certain bugs (like overflows or logical contradictions) are mathematically impossible—or find the exact input that triggers them.

> [!CAUTION]
> **Context Safety**: Formal verification is computationally and contextually expensive. **Do not attempt to model an entire system.** Focus only on critical "Atomic" units of logic (e.g., a single pricing function or a crypto primitive).

## Sub-Skills
- [Symbolic Math](./symbolic-math.md): Extract logic as algebraic/boolean formulas.
- [Integer Analysis](./integer-analysis.md): Prove safety against overflow, underflow, and precision loss.

## Methodology
1. **Isolate the Core**: Pick a single function with no external side effects (Pure Function).
2. **Translate to Math**: Convert `if/else` to boolean logic and arithmetic to equations.
3. **Define the Property**: State what must be true (e.g., `output > input` for an incrementer).
4. **Solve for Contradiction**: Look for any input that makes the Property false.
5. **Patch Gate**: If the proof drives a code change outside the modeled unit, use `patch-reasoning-audit` to confirm the model still matches the implementation boundary.

### extract_formula
Use this action to turn a simple code block into a mathematical representation.
**Task**: Take a function and represent its return value as a function of its inputs.
**Example**: `if (x > 10) return x * 2 else return x + 10` becomes `f(x) = (x > 10) ? (2x) : (x + 10)`.
