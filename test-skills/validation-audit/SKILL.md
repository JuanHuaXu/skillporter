---
name: validation-audit
description: Suite for auditing type safety, input validation schemas, and data sanitization logic.
---

# Validation & Type Audit

Validation flaws occur when the system trusts data that hasn't been properly verified for its type, format, or range. Type flaws occur when the system makes incorrect assumptions about the structure of an object.

## Sub-Skills
- [Types](./types.md): Audit type casting, assertions, and implicit conversions.
- [Schemas](./schemas.md): Audit validation schemas (Zod, Joi) and manual sanitization.

## Methodology
1. **Identify Trust Boundaries**: Find where external data (API, DB, Env) enters the system.
2. **Verify Schema Enforcement**: Check if the data is parsed against a strict schema immediately.
3. **Audit "Escape Hatches"**: Look for `as any`, `(T)(void*)`, or `unsafe` blocks that bypass the type system.
4. **Test Boundary Cases**: Try to inject values that satisfy the *type* but violate the *logic* (e.g., negative numbers for an unsigned type).

### audit_boundary
Use this action to identify a data boundary and verify its validation logic.
**Task**: Find an API endpoint or file-read operation and trace the data to its first use. Ensure it is validated before any logic is applied.
