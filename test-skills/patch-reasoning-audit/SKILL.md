---
name: patch-reasoning-audit
description: Use before writing, approving, or reviewing a nontrivial bug, security, performance, regression, or PR fix when root cause, scope, or evidence is uncertain; especially for state, lifecycle, auth, caching, retries, ordering, concurrency, ingestion/retrieval, or invariant-sensitive changes.
metadata:
  short-description: Audit patch reasoning before coding
---

# Patch Reasoning Audit

Use this skill as a pre-patch reasoning gate. Its job is to stop plausible-but-wrong fixes by separating observed symptoms from proven root cause.

Keep user-visible audits under about 10 bullets unless asked for detail. Otherwise use the gate internally and report only the decision, key evidence, and caveats.

This skill does not grant permission to edit, merge, deploy, install, or release. It only gates reasoning.

Skip this skill for typo fixes, formatting-only changes, mechanical renames, generated-file updates, or patches where the failing test and root cause are already directly established.

## Required Gate

Before proposing, coding, approving, or requesting changes, run a compact audit:

- **Symptom:** What was observed, using raw evidence rather than model summaries when available.
- **Root-cause candidates:** List credible explanations. Prefer at least three, but say so if only two are real.
- **Multi-sampling:** Check different use cases of the same suspected mechanism before choosing root cause. Repeated failures with the same shape do not count as independent signals. Examples: envelope ingestion vs text ingestion, storage vs retrieval, live logs vs raw traces, unit behavior vs installed behavior. If unavailable, say what is missing.
- **Boundary proof:** For agent, prompt, context, tool, cache, or replay bugs, distinguish `stored`, `assembled`, and `sink-visible` evidence. A persisted transcript, memory item, tool result, or log line is not proof the model/client/provider actually saw it.
- **Lifecycle phase:** When the same data shape exists in multiple phases, classify each phase before patching. Examples: live/current-turn tool protocol vs historical replay, fresh user input vs recalled memory, cached snapshot vs active session state, and ingest-time envelope vs provider-visible prompt.
- **Chosen hypothesis and why:** What evidence proves this candidate better than the alternatives.
- **Falsifier:** One concrete observation or test that would disprove the chosen hypothesis.
- **Scope consistency:** If the patch treats path X specially, explain why the same reasoning does not apply to path Y. If it does, widen the invariant.
- **State model:** For stateful, lifecycle, ingestion/retrieval, auth, caching, retries, ordering, concurrency, or invariant-sensitive bugs, define the happy path, invariant, transitions, and timing assumptions. Name which transition or invariant is broken.
- **Hot-path cost:** When performance or repeated work may matter, identify loops, database/file/network opens, cache behavior, and rough complexity. Otherwise state `not relevant`.
- **Patch invariant:** The durable rule the code should enforce, not the example-specific behavior it should mimic.
- **Tests:** Prefer a failing regression for the root cause, an adjacent-path guard, and a negative control for overreach. Use a smaller set only when the change is genuinely narrow.
- **Confidence:** Short, explicit, and caveated.

If evidence is missing, say `not ready to patch/approve` and gather more evidence before editing or approving.

## Red Flags

- Treating “I found a suspicious thing” as root cause.
- Treating a corrupted, poisoned, or looping final state as root cause without finding the upstream transition that made a good state become bad.
- Fixing only the reported example instead of the shared invariant.
- Counting repeated failures of the same shape as independent evidence.
- Drawing a conclusion from one sampled path when a sibling path shares the same mechanism.
- Applying one sanitizer, normalizer, cache rule, or guard to multiple lifecycle phases solely because the payload shape matches.
- Flagging wrapper/envelope handling while equivalent text ingestion paths remain unexamined.
- Using an assistant answer, generated summary, or log coincidence as proof without checking raw traces.
- Adding a branch or PR before writing a falsifier.
- Making a hot-path change without counting loop nesting, database opens, I/O, or cache misses.
- Explaining why a patch works without explaining what would prove it wrong.
- Changing a stateful flow without naming the invariant or transition being repaired.

## Patch Discipline

Prefer boring, general invariants over clever case filters. The simple answer is acceptable only after it survives competing hypotheses, multi-sampling, adjacent-path checks, and hot-path review.

For replay, prompt, memory, and tool-protocol fixes, require paired controls whenever feasible: one case that proves historical or untrusted material is sanitized/neutralized, and one case that proves live/current-turn protocol or fresh user intent still reaches the next boundary intact.

After coding, rerun the gate briefly against the actual diff. If the diff no longer matches the chosen invariant, stop and revise.
