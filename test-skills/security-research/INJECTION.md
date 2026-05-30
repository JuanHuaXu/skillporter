# Injection Review

Use this reference to find and patch injection bugs: prompt injection, SQL/NoSQL injection, regex injection, XSS, template injection, shell/query/path injection, tag closure, delimiter confusion, and sanitizer/escaping bypass.

## Core Model

Injection happens when untrusted data crosses into an interpreter context and is parsed as structure, control, code, query, markup, instruction, or syntax instead of inert data.

Review by context, not by keyword. The same string can be safe in HTML text and unsafe in an attribute, safe in a SQL parameter and unsafe in a raw query fragment, safe in JSON data and unsafe inside a prompt wrapper.

## Source Classes

- User text, chat messages, profile fields, filenames, URLs, headers, uploads.
- Database rows, logs, retrieved memories, model/tool output, generated code.
- Config/env values, plugin manifests, package metadata, webhooks.
- Search queries, filters, sort keys, regex patterns, template variables.

## Sink Classes

- Prompt/model contexts: system prompt additions, memory wrappers, tool arguments, structured-output repair prompts.
- SQL/NoSQL/query builders: raw query strings, filter objects, sort keys, aggregation pipelines.
- Regex construction: user-controlled pattern, flags, anchors, alternation, lookarounds, replacement strings.
- Markup/rendering: HTML text, attributes, URLs, SVG, Markdown, XML, JSX dangerously-set HTML.
- Template engines: server-side templates, client templates, string interpolation into executable templates.
- Shell/command contexts: shell strings, command fragments, path arguments interpreted by shell or tool.
- URL/path contexts: redirects, SSRF targets, path traversal, glob expansion, archive paths.

## Boundary Checks

- Is data structurally separated from code/instructions, such as SQL parameters or argv arrays?
- Is escaping applied for the exact sink context, not a generic sanitizer?
- Can input close a wrapper, tag, quote, fence, JSON/XML node, Markdown block, or prompt section?
- Are special characters normalized before validation but used after decoding differently?
- Are allowlists applied before authority changes, rendering, query execution, or prompt assembly?
- Do sibling paths use the same encoder/builder consistently?

## Prompt and Wrapper Injection

- Check every prompt/context wrapper that includes untrusted text.
- Verify closing tags, code fences, XML-like tags, JSON delimiters, Markdown separators, and role labels cannot be injected by content.
- Treat retrieved memory, logs, filenames, URLs, and tool output as untrusted content even if they came from local storage.
- Prefer structured serialization or escaping helpers over ad hoc string concatenation.
- Test prompt wrapper and memory wrapper siblings; do not patch only one path if the same builder is reused.

## SQL/NoSQL Injection

- Prefer parameterized queries or typed query builders.
- Treat identifiers, sort fields, table names, operators, and raw fragments as separate risks from values.
- For NoSQL, check operator injection, aggregation stage injection, and type confusion in filter objects.
- Verify validation rejects unexpected keys and operators, not only unexpected values.

## Regex Injection

- User input inside regex should be escaped unless the feature intentionally accepts regex syntax.
- If regex syntax is allowed, bound complexity, length, flags, and execution time.
- Check replacement strings separately; replacement syntax can have its own metacharacters.
- Watch for ReDoS when user input controls nested quantifiers, alternation, or catastrophic backtracking shape.

## XSS and Markup Injection

- Escape by output context: HTML text, attribute, URL, CSS, JS string, SVG, and Markdown are different contexts.
- Sanitized HTML must be sanitized by a real parser/sanitizer, not regex.
- Markdown can become HTML; validate the renderer and allowed raw HTML behavior.
- URLs need scheme allowlists, not only escaping.

## Safe Proof Rules

- Use harmless marker strings that prove boundary breakage without stealing data or executing destructive actions.
- Prefer unit tests against parser/render/query output.
- Do not use live secrets, credential theft, persistence, or external callbacks.
- For XSS, prove script-capable context or unsafe DOM shape without browser credential access.

## Fix Invariants

- Use builders that separate data from syntax: SQL parameters, argv arrays, URL builders, DOM APIs, structured prompt serializers.
- Centralize escaping/serialization helpers per sink context.
- Preserve provenance on untrusted content until after rendering/query/prompt assembly.
- Add tests for delimiter/tag/quote/fence closure and decoded special-character variants.
- Compare sibling paths that share the same wrapper, encoder, query builder, renderer, or regex builder.
