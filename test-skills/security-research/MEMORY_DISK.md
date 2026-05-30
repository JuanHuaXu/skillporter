# Memory and Disk Exposure Review

Use this reference to find and patch unauthorized read/write, data leakage, cross-boundary storage bugs, dirty fragment reuse, memory bleed, cache bleed, and unsafe persistence risks.

## Boundary Classes

- User or tenant isolation.
- Session, channel, workspace, project, or profile isolation.
- Process, sandbox, container, browser profile, or plugin boundary.
- Privilege boundary between normal user and service/admin/root process.
- Trust boundary between model/tool output, retrieved memory, durable storage, and current user input.

## Read Exposure Sinks

- File reads: user-controlled paths, glob expansion, recursive import, attachment loading, archive extraction.
- Memory/cache reads: shared singleton caches, global maps, buffer pools, session reuse, vector/KV caches.
- Retrieval reads: search indexes, embeddings, recalled memories, transcript compaction, log replay.
- Metadata reads: filenames, EXIF, database rows, prompt envelopes, sender/channel IDs, env vars.
- Error/log reads: stack traces, debug dumps, crash reports, serialized request/response bodies.
- Pseudo-file reads: `/proc`, `/sys`, `/dev`, debugfs, procfs, sysfs, device nodes, and service/kernel control files that expose memory, process, kernel, hardware, or host state.

## Write/Corruption Sinks

- File writes: path traversal, symlink/hardlink writes, unsafe temp files, weak permissions, predictable names.
- Memory writes: shared mutable state, stale object reuse, buffer aliasing, unsafe pooling, racey mutation.
- Index writes: cross-tenant embeddings, stale chunk IDs, wrong namespace, deleted content retained in search.
- Config/state writes: user-controlled config, plugin manifests, startup files, scheduler/system service state.
- Log/cache writes: sensitive data retained beyond intended lifetime or readable by the wrong actor.
- Pseudo-file/device writes: user-controlled writes into `/dev`, `/proc`, `/sys`, debugfs, procfs, sysfs, sysctl-like controls, or device nodes.

## Dirty Fragment and Memory Bleed Patterns

- Chunking splits provenance from content, then retrieval returns the fragment without the original boundary.
- A buffer, object, cache entry, or vector record is reused without clearing prior user/session data.
- Compaction, summarization, or recall merges content from multiple channels/users without provenance.
- Deletion removes primary rows but leaves embeddings, caches, logs, snapshots, or temp files.
- Partial writes or failed transactions leave readable fragments.
- Concurrent requests share mutable state keyed too broadly.
- "File" features fail to distinguish normal files from pseudo-filesystems or device nodes, allowing unintended host/kernel/process reads or writes.

## Review Procedure

1. Map the lifecycle: ingest -> transform -> cache/index -> persist -> retrieve -> delete.
2. Name the owner/provenance required at each step.
3. Check namespace keys: user, tenant, session, channel, workspace, model, and provider.
4. Trace at least two use cases of the same mechanism, such as direct text vs envelope, live cache vs durable store, or primary row vs vector index.
5. Test with synthetic marker strings, tiny files, and isolated temp directories.
6. Confirm whether data can cross a boundary, survive deletion, overwrite a protected path, or be recalled by the wrong principal.
7. For file features, confirm pseudo-filesystems and device nodes are denied or explicitly allowlisted.

## Safe Proof Rules

- Do not read real secrets to prove exposure; write synthetic marker data first.
- Do not overwrite real config, logs, or user files; use isolated temp paths.
- Do not write to live `/dev`, `/proc`, `/sys`, debugfs, procfs, sysfs, or device nodes as proof.
- Do not dump broad directories; inspect the minimum file or record needed.
- For memory/cache issues, prefer unit tests or instrumentation over live sensitive data.

## Fix Invariants

- Every stored fragment keeps owner/provenance metadata until deletion.
- Namespaces include the full isolation boundary, not only a session or default user.
- Buffers and reusable objects are cleared before reuse.
- Deletes cover primary rows, secondary indexes, embeddings, caches, logs, and temp artifacts where applicable.
- File paths are canonicalized and constrained at open/write time.
- Pseudo-filesystems and device nodes are denied by default unless the feature explicitly requires and safely scopes them.
- Sensitive logs and diagnostics are opt-in, bounded, and redacted by default.
