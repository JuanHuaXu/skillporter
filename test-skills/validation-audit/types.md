---
name: validation-audit/types
description: Tools for auditing type safety, casting, and implicit coercion.
---

# Type Safety & Casting

Audit code for dangerous type assumptions and unsafe casting that can lead to type confusion or crashes.

### find_unsafe_casts
Identify where the type system is being manually overridden.
**Examples**:
- **TypeScript**: `variable as any`, `variable as unknown as T`.
- **C/C++**: `(Type*)ptr`, `reinterpret_cast<T>`.
- **Python**: `type: ignore` comments.
**Action**: Search for these patterns and verify that the variable actually matches the target type.

### check_implicit_coercion
Find places where the language might silently convert a type.
**Action**: Search for "Loose Equality" (`==` instead of `===` in JS) or math operations on strings.
**Command**: `grep -r " == "` or `ast-grep --pattern '$A == $B'`.

### audit_instanceof
Check if `instanceof` or `typeof` checks can be spoofed.
**Risk**: In some languages, `instanceof` can be bypassed by manipulating prototypes or using multiple class loaders.
**Action**: Verify if the system relies solely on `instanceof` for security-critical decisions.
