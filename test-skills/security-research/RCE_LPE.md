# RCE and LPE Review

Use this reference to find and patch RCE, LPE, sandbox escape, and privilege-boundary bugs in authorized software. Prefer static proof and regression tests; dynamic checks must stay inside the scope gate from `SKILL.md`.

## RCE Sink Classes

- Process creation: `exec`, `spawn`, `system`, `popen`, shell wrappers, task runners.
- Dynamic code: `eval`, `new Function`, runtime imports, template engines with code execution.
- Deserialization: pickle, YAML object constructors, Java serialization, PHP unserialize, unsafe marshal formats.
- Plugin/module loading: user-controlled paths, package names, extension manifests, native addons.
- Archive/file extraction: zip slip, symlink extraction, executable overwrite, unsafe permissions.
- Update/install flows: downloaded scripts, postinstall hooks, unsigned artifacts, path-controlled installers.
- Interpreter bridges: Python/Ruby/Node subprocesses, notebooks, SQL functions, embedded Lua/WASM where host calls are exposed.
- Pseudo-filesystem/device control paths: privileged reads or writes to `/dev`, `/proc`, `/sys`, sysctl-like interfaces, device nodes, debugfs, procfs, sysfs, or kernel/service control files.

## LPE Sink Classes

- Privileged helpers: setuid/setgid, LaunchDaemon/systemd services, scheduled tasks, sudoers/polkit rules.
- Writable privileged paths: config, plugin, log, pid, socket, temp, cache, or working directories used by elevated code.
- Insecure handoff: root/admin process trusts user-owned files, env vars, cwd, PATH, LD_* variables, dynamic library paths.
- Service control: restart hooks, updater hooks, pre/post scripts, health checks, logrotate scripts.
- Permission drift: world-writable directories, weak umask, symlink/hardlink races, TOCTOU around chmod/chown/open.
- Signed-binary bypass surfaces: privileged code accepts user-controlled pseudo-file/device input or kernel/service knobs directly, bypassing executable signature controls without needing to replace a signed binary.

## Source Classes

- HTTP request data, headers, uploads, webhooks.
- CLI args, config files, environment variables.
- Database fields, queues, caches, remembered state.
- Filenames, archive entries, symlinks, project paths.
- Plugin manifests, package metadata, model/tool output, generated code.
- Local low-privileged user controlled files or sockets.

## Review Procedure

1. Map the privilege boundary and expected trust model.
2. Enumerate sources and sinks before deciding which path is suspicious.
3. Trace at least two use cases of the same mechanism when possible.
4. Check sanitizers by property, not by name: argument separation, allowlists, canonical paths, signature checks, ownership checks, race-free file opens.
5. Prove control reaches the sink with a safe regression test, mocked sink, harmless marker, or test double.
6. Document impact as the authority at risk: same-user code execution, service-user execution, root/admin, sandbox escape, or persistence risk.

## Pseudo-Filesystem and Device Review

- Treat `/dev`, `/proc`, `/sys`, debugfs, procfs, sysfs, sysctl-like settings, device nodes, and service control files as privileged interfaces, not ordinary files.
- Look for privileged services that copy user input into these paths, accept path/config indirection to them, or expose wrappers around them to lower-privileged users.
- Check whether allowlists exclude pseudo-filesystems and device nodes when a feature claims to read or write "files".
- Check container/sandbox escapes where host pseudo-filesystems or device nodes are mounted into a restricted context.
- Verify signature checks cover the actual authority path. A signed binary can still be abused if untrusted input controls the pseudo-file/device interface it writes to.
- Use static proof, mocks, or harmless read-only checks. Do not modify live kernel, device, or service-control state.

## Safe Proof Rules

- No destructive test cases.
- No persistence mechanisms.
- No credential access.
- No lateral movement.
- Prefer temp directories and explicit marker files.
- For command construction, prove argument/control flow without running attacker-controlled commands when static proof is enough.

## Fix Invariants

- Avoid shell interpretation; pass argv arrays to process APIs.
- Canonicalize and constrain paths before use; reject traversal and symlink surprises at the open boundary.
- Verify signatures/ownership before loading plugins, updates, or executable content.
- Deny or tightly allowlist pseudo-filesystem and device paths before privileged reads/writes.
- Treat signed-binary checks as insufficient when user input can control privileged pseudo-file/device operations.
- Keep privileged services from reading user-writable config, env, cwd, or PATH.
- Use least privilege and drop privileges before processing untrusted input.
- Make unsafe states unrepresentable with schemas and typed command builders where possible.
