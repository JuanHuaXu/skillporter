---
name: security-research
description: Use for authorized, scoped security patch research on software the user owns or is allowed to modify, including RCE, LPE, injection, unauthorized memory/disk read-write, and data-leak class bugs. Focus on finding the broken invariant, writing safe regression tests, and producing patches; treat scanners as optional leads, not proof.
---

# Security Research

Use this skill to find and patch security bugs in software. It is not an exploit-development or general internet-scanning skill.

## Scope Gate

Before running any scanner, dynamic check, or patch investigation, state:

- Target: exact repository, local path, localhost service, private network CIDR, or explicitly authorized asset.
- Permission: why this target is authorized to inspect and patch.
- Network scope: `none`, `localhost`, exact approved host list, or explicit RFC-1918 CIDR/range.
- Tool scope: which tool will run, whether it sends network requests, and what files it may read/write.
- Patch goal: the bug class or invariant being investigated.
- Stop condition: what finding, test, or missing evidence ends the investigation.

If the target or permission is unclear, do not run the tool.

RFC-1918 private ranges are valid local-network scopes when named explicitly: `10.0.0.0/8`, `172.16.0.0/12`, and `192.168.0.0/16`. Prefer the narrowest useful subnet, but do not require public-internet-style approval for private lab/home/office ranges the user says are theirs to test.

## Patch-Oriented Workflow

1. Identify the security boundary and expected invariant.
2. Use static/data-flow review first: `ast-grep`, `semgrep`, `TAINT_ANALYSIS.md`, `RCE_LPE.md`, `INJECTION.md`, or `MEMORY_DISK.md`.
3. Confirm the bug with a safe regression test, parser assertion, mocked sink, or synthetic marker data.
4. Compare sibling paths that use the same mechanism before choosing the patch boundary.
5. Patch the invariant, not only the observed call site.
6. Re-run the regression and adjacent-path guard tests.

## Allowed Discovery

- Secret discovery on local repositories with `trufflehog filesystem .` or `trufflehog git file://...`, used to patch leaks or prevent committed secrets.
- Static/data-flow review for RCE/LPE, injection, memory/disk exposure, and unsafe privilege-boundary bugs.
- Localhost or RFC-1918 dynamic checks only when needed to validate a patch or reproduce a bug safely.
- Nuclei only against explicitly approved localhost, RFC-1918 ranges, or owned hosts, with a narrow template set justified by the patch investigation.

## Disallowed Defaults

- No broad public-internet scanning.
- No fuzzing templates by default.
- No `exposures/`, `fuzzing/`, or large template directories unless explicitly approved for the named target.
- No credential exfiltration, destructive payloads, persistence, or lateral movement.
- No exploit chains, weaponized payloads, persistence mechanisms, or bypass recipes.
- No scanner-shaped fixes. Confirm root cause, sibling paths, and patch invariant first.

## RCE/LPE Hunt

Load `RCE_LPE.md` when looking for remote code execution, local privilege escalation, sandbox escape, unsafe updater, service-manager, plugin-loader, deserialization, archive extraction, path traversal to execution, or command-construction bugs.

For these classes, prioritize code review, data-flow proof, and patchable invariants over scanners:

1. Identify privilege boundaries: network-to-process, user-to-service, plugin-to-host, config-to-exec, file-to-loader, updater-to-root/admin.
2. Trace attacker-controlled sources to execution or privilege sinks.
3. Check whether validation happens before authority changes, filesystem writes, process creation, dynamic loading, or interpreter invocation.
4. Confirm patch relevance with a non-destructive regression test, mocked sink, temp marker in a lab path, or controlled argument-flow assertion.
5. Use `patch-reasoning-audit` before fixes: many RCE/LPE bugs are mechanism-wide, not one call-site-wide.

## Memory/Disk Exposure Hunt

Load `MEMORY_DISK.md` when looking for unauthorized memory reads/writes, disk reads/writes, stale buffer leakage, cross-session data exposure, dirty fragment reuse, cache bleed, temp-file leaks, path traversal, symlink races, unsafe artifact retention, or unintended persistence of sensitive data.

For these classes, focus on boundary ownership:

1. Identify the authority boundary: tenant, user, session, channel, process, sandbox, workspace, or privilege level.
2. Trace how data is read, cached, chunked, serialized, persisted, recalled, and deleted.
3. Check whether fragments, buffers, temp files, logs, indexes, embeddings, caches, and metadata preserve provenance.
4. Verify with harmless marker data and isolated temp paths, not real secrets.
5. Use `patch-reasoning-audit` before fixes: leaks often come from shared lifecycle or storage mechanisms, not one bad read call.

## Injection Hunt

Load `INJECTION.md` when looking for prompt injection, SQL/NoSQL injection, regex injection, XSS, shell/template/path/query injection, tag closure in input, escaping/sanitization bypass, delimiter confusion, special-character handling bugs, or context-breaking input.

For these classes, focus on interpreter boundaries:

1. Identify where untrusted data enters a language, query, regex, prompt, HTML, XML, Markdown, shell, template, or structured-output context.
2. Check whether the code validates by allowlist, escapes for the exact output context, or separates data from instructions/commands.
3. Test sibling contexts of the same mechanism, such as prompt wrapper vs memory wrapper, SQL read vs SQL write, HTML text vs attribute, or regex literal vs flags.
4. Use harmless marker strings and parser-level assertions where possible.
5. Use `patch-reasoning-audit` before fixes: escaping bugs often need a shared encoder/builder invariant, not one call-site patch.

## Tools

Tools are optional discovery aids. Do not install or run them unless they are needed for the patch investigation and allowed by the scope gate.

### TruffleHog

- macOS: `brew install trufflehog`
- Linux: use the official install script or release binary.
- Windows: prefer Docker, WSL, or a GitHub release binary.
- Docker: `docker pull trufflesecurity/trufflehog`
- Verify: `trufflehog --version`
- Docs: `https://github.com/trufflesecurity/trufflehog`

### Nuclei

- macOS: `brew install nuclei`
- Linux/Windows with Go: `go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest`
- Docker: `docker pull projectdiscovery/nuclei:latest`
- Verify: `nuclei -version`
- Docs: `https://docs.projectdiscovery.io/opensource/nuclei/install`

## Patch Gate

Before coding a fix, run `patch-reasoning-audit`: scanner output, suspicious sinks, and test failures are evidence, not proof. Identify the vulnerable invariant, sibling paths using the same mechanism, one falsifier, and the regression test that should fail before the patch.
