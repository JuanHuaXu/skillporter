# Taint Analysis & Data Flow

Use this skill to identify "Taint Paths" where untrusted user input (Source) reaches a dangerous operation (Sink) without proper sanitization.

## The Researcher's Checklist

### 1. Identify Sources (Dirty Input)
Look for any point where external data enters the system:
- `req.body`, `req.query`, `req.params` (Web)
- `process.argv` (CLI)
- `fs.readFile` (File System)
- `process.env` (Environment variables)

### 2. Identify Sinks (Dangerous Operations)
Look for operations that can be exploited if the data is "dirty":
- **Command Injection**: `child_process.exec()`, `spawn()`, `system()`
- **Code Injection**: `eval()`, `new Function()`, `setTimeout(string)`
- **SQL Injection**: `db.query()`, `connection.execute()` (with string concatenation)
- **Path Traversal**: `fs.open()`, `path.join()` used with user input.
- **SSRF**: `fetch()`, `axios.get()` where the URL is user-controlled.

### 3. Trace the Path
- Use `ast-grep` or `grep` to follow the variable from the Source to the Sink.
- **Crucial**: Look for "Sanitizers" in between (e.g., `parseInt()`, `validator.isAlphanumeric()`). If no sanitizer exists, it is a VULNERABILITY.

## Actions

### trace-taint
Pick a Source and trace every variable it touches until it reaches a Sink.

### audit-sink
Pick a dangerous Sink (like `exec`) and work backwards to see where its arguments come from.

## Security & Best Practices
- **Assume Evil**: Always assume the user input is an exploit string (e.g., `; rm -rf /`).
- **Logic Flaws**: Look for places where "Privilege Escalation" can happen (e.g., a user changing their own `role` field).
- **Secret Leaks**: Check if "dirty" data is accidentally logged to `console.log` or a file.
