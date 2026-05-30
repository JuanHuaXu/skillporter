---
name: prompt-injection-audit
description: Suite for auditing code against Prompt Injection attacks in both data content and traversal paths.
---

# Prompt Injection Auditing

Prompt Injection is a vulnerability where an attacker tricks an AI agent into executing unintended instructions by embedding them in untrusted data. This can occur in visible content (e.g., search results) or "metadata" paths (e.g., file names, URLs).

Before patching, use `patch-reasoning-audit` when the vulnerable path may share a wrapping, escaping, retrieval, or prompt-construction mechanism with adjacent paths.

## Sub-Skills
- [Data Content](./data-content.md): Audit ingestion of untrusted content (web results, logs, user input).
- [Path Injection](./path-injection.md): Audit ingestion of payloads hidden in directory names, file names, or URIs.

## Methodology
1. **Identify the Ingestion Point**: Where does the agent "read" data that is controlled by an external source?
2. **Check for Semantic Wrapping**: Is untrusted data wrapped in markers (e.g., `<external-content>`) that tell the agent to ignore instructions within?
3. **Verify Termination Escaping**: Ensure that the markers themselves (the closing tags) cannot be spoofed by the data.
4. **Audit Metadata Paths**: Check if the agent interprets directory or file names as instructions.
5. **Compare Sibling Ingestion**: Check different uses of the same wrapping/escaping mechanism before deciding whether the flaw is path-specific or systemic.

### find_ingestion_points
Use this action to find where the system passes external data to an AI model.
**Task**: Search for code that constructs the final prompt or context sent to the agent. Identify every variable that contains external data.
