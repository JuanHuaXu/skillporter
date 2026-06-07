---
name: trace-debugging
description: Use to debug runtime behavior by tracing variable values, call flow, state transitions, async timing, I/O boundaries, or test failures across languages before patching. Especially useful when static reading is insufficient or a bug depends on execution order, data shape, environment, or side effects.
metadata:
  short-description: Trace runtime values before patching
---

# Trace Debugging

Use this skill when the question is "what actually happens at runtime?" Traces are evidence, not proof by themselves. For nontrivial fixes, combine trace results with `patch-reasoning-audit` before editing.

## Workflow

1. State the expected invariant and the observed failure.
2. Map the static path: entry point, key functions, state holders, I/O boundaries, and exit point.
3. Choose the smallest runtime probe that can falsify a hypothesis.
4. Trace at least two different use cases of the same mechanism when overfitting is possible.
5. Trace both the storage boundary and the sink boundary when they differ. For agent bugs, record whether data is persisted, assembled, and provider-visible; for UI bugs, record whether data is stored, rendered, and user-visible.
6. Capture structured output: trace id, timestamp/order, lifecycle phase, variable names, types, sizes, and boundary labels.
7. Prefer tests, mocks, or local fixtures over live production data.
8. Patch only after the trace identifies the broken invariant.
9. Remove or gate temporary probes before finishing.

## Dual Trace Packet

Prefer a compact KV packet over prose or diagrams when explaining runtime findings. The code graph shows where execution can go; the state flow shows what changed. The bug is credible when the graph path and state mutation both support the same invariant break.

Keep it curated:

- `nodes`: 3-7
- `state_steps`: 3-7
- `vars_per_step`: 3-5
- `evidence`: 1-3 items

Use this shape:

```yaml
trace_packet:
  hypothesis: "What this trace is testing"
  entrypoint:
    fn: "function_or_handler"
    file: "path/to/file"
  code_graph:
    - id: A
      fn: "entry"
      calls: [B]
      boundary: "request|test|queue|none"
    - id: B
      fn: "transform_or_branch"
      calls: [C]
      mutation: "state/key/value changed here"
    - id: C
      fn: "sink_or_exit"
      boundary: "cache|db|fs|network|model|none"
  state_flow:
    - at: A
      phase: "live|historical|ingest|replay|cache|sink"
      vars:
        input_id: "redacted-or-synthetic"
        owner: "expected owner/scope"
    - at: B
      transforms:
        key: "actual key shape"
      expected: "required invariant"
      actual: "observed state"
    - at: C
      effect: "read|write|call|render"
      boundary: "where authority or persistence changes"
  invariant_break:
    expected: "what must always hold"
    actual: "what the trace shows"
  evidence:
    - "line/log/test observation"
  falsifier: "What result would disprove this hypothesis"
  patch_invariant: "Rule the fix should enforce"
  tests:
    - "failing regression"
    - "adjacent-path guard"
```

Use Mermaid only as an optional visualization after the KV packet, not as the canonical trace.

## Lifecycle Boundary Probes

When a bug crosses memory, replay, prompt assembly, tool protocol, cache, or queue boundaries, use paired probes instead of a single trace:

- **Live path:** Fresh/current-turn data that must remain available to the next consumer.
- **Historical path:** Recalled, replayed, cached, or persisted data that may need sanitization or summarization.
- **Negative control:** Ordinary text or unrelated state that should be unchanged.

Use synthetic sentinels rather than private data. Record roles, block types, ids, lengths, hashes, and small redacted snippets. A probe that only shows "the transcript contains X" is incomplete until it also shows whether the sink consumed X.

## Probe Rules

- Do not log secrets, tokens, raw private data, or huge payloads. Log hashes, lengths, types, IDs, and redacted snippets.
- Use correlation IDs when tracing async, concurrent, request, queue, or background flows.
- Log before and after mutation points, not every line.
- For timing bugs, record monotonic timestamps and operation names.
- For memory/cache bugs, log owner namespace, key, lifecycle event, and eviction/delete behavior.
- For parser/serializer bugs, log input type/length, parse result shape, and escaped/rendered output.

## Language Playbook

### JavaScript / TypeScript / Node

- Test focus: `node --test`, `vitest -t`, `jest -t`, or project scripts.
- Debug: `node --inspect-brk ...`, Chrome DevTools, or VS Code attach.
- Probes: `console.debug({ traceId, step, value })`, `util.inspect(value, { depth: 5 })`.
- Async: use `AsyncLocalStorage` or explicit trace IDs across promises, queues, and callbacks.
- Watch for object mutation by reference, stale module singletons, unawaited promises, and shared caches.

### Python

- Test focus: `pytest -k name -vv`, `python -m unittest`, or direct script repro.
- Debug: `python -m pdb script.py`, `breakpoint()`, or `pytest --pdb`.
- Probes: `logging.debug("step=%s value=%r", step, value)` with redaction.
- Runtime checks: `type(value)`, `repr(value)`, `id(value)`, dataclass/asdict snapshots.
- Watch for mutable default args, global state, monkeypatch leakage, path/env differences, and iterator exhaustion.

### Go

- Test focus: `go test ./...`, `go test ./pkg -run TestName -v`.
- Debug: `dlv test` or `dlv debug` when Delve is available.
- Probes: `t.Logf`, structured `slog`, or temporary `fmt.Printf` in local repros.
- Runtime checks: pointer identity, nil interfaces, goroutine ordering, context cancellation.
- Watch for data races with `go test -race`, copied mutexes, map concurrency, and deferred cleanup order.

### Rust

- Test focus: `cargo test test_name -- --nocapture`.
- Debug: `rust-gdb`, `rust-lldb`, or IDE debugger.
- Probes: `dbg!(&value)`, `tracing` spans, or `eprintln!` in narrow tests.
- Runtime checks: ownership moves, borrowed vs cloned data, `Option`/`Result` branches.
- Watch for feature flags, async task ordering, interior mutability, and unsafe blocks.

### Java / Kotlin

- Test focus: `mvn test -Dtest=Name`, `gradle test --tests Name`.
- Debug: JDWP attach, IDE debugger, or test breakpoints.
- Probes: SLF4J structured logs, `System.err.println` only in narrow local repros.
- Runtime checks: object identity, thread name, transaction/session scope.
- Watch for classloader differences, serialization, thread locals, Spring proxy boundaries, and async executors.

### C / C++

- Test focus: project test runner, `ctest -R name --output-on-failure`.
- Debug: `lldb`, `gdb`, sanitizers, or valgrind when available.
- Probes: debugger watchpoints, assertions, narrow stderr logs.
- Runtime checks: pointer addresses, ownership, buffer length, return codes, errno.
- Watch for use-after-free, uninitialized memory, signed/unsigned conversion, lifetime, and TOCTOU.

### Shell

- Trace: `set -x` with secrets disabled/redacted, or `bash -x script.sh`.
- Safer tracing: set `PS4='+ ${BASH_SOURCE}:${LINENO}: '`.
- Runtime checks: quote expansions, `printf '%q\n' "$var"`, `set -euo pipefail` behavior.
- Watch for word splitting, glob expansion, env leakage, subshell state, and command substitution failures.

### SQL / Data Stores

- Trace generated query and bound parameters separately.
- Use `EXPLAIN` for performance shape and transaction logs for ordering.
- Verify transaction boundaries, isolation level, row ownership predicates, and migration defaults.
- Watch for query-builder raw fragments, missing tenant filters, stale indexes, and read-after-write assumptions.

## Output Shape

Keep user-visible trace reports brief:

- Hypothesis tested.
- Probe location.
- Key observed values or order.
- What it proves.
- What it does not prove.
- Next patch or investigation step.

If evidence is still ambiguous, say so and add one narrower probe instead of patching.
