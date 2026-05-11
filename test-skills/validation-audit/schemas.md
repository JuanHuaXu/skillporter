---
name: validation-audit/schemas
description: Tools for auditing validation schemas, sanitization logic, and range checks.
---

# Schemas & Sanitization

Audit how the system validates the *content* of the data it receives.

### audit_zod_schemas
Check for common weaknesses in Zod (or similar) schemas.
**Look for**:
- `.optional()` or `.nullable()` on critical fields (e.g., `userId`).
- Missing `.min()` or `.max()` on numeric fields (allowing negative or massive numbers).
- Missing `.trim()` or `.email()` on strings (allowing whitespace-based bypasses or invalid formats).

### check_regex_validation
Audit custom regular expressions used for validation.
**Action**: Extract regex patterns and test them for:
- **ReDoS**: Check for nested quantifiers (e.g., `(a+)+$`).
- **Anchors**: Ensure `^` and `$` are used correctly to prevent partial matches.

### find_manual_sanitization
Identify where the developer is manually stripping characters instead of using a schema.
**Risk**: Manual sanitization is highly prone to "Blacklist" flaws (missing a dangerous character).
**Action**: Search for `.replace()` or `.split()` calls on user-provided strings and verify if the regex is comprehensive.

### audit_json_parse
Check for unsafe `JSON.parse` or `eval` usage.
**Risk**: Parsing untrusted JSON can lead to Prototype Pollution if not handled carefully.
**Action**: Search for `JSON.parse` and see if the result is immediately validated or used to extend other objects.
