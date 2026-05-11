# Vulnerability Research (Advanced Tools)

Use these tools to perform automated exploitation research and secret discovery.

## Tools

### Nuclei (Template-based Scanner)
Nuclei is used to send requests across targets based on templates, allowing for zero-day and known vulnerability detection with zero false positives.

**Actions**:
- `install`: `brew install nuclei`
- `scan`: `nuclei -u <target> -t <templates_path>` (e.g., `-t exposures/configs/`)
- `fuzz`: `nuclei -u <target> -t fuzzing/`

### TruffleHog (Secret Scanning)
Deeply scan the codebase and git history for high-entropy strings and verified secrets (API keys, passwords).

**Actions**:
- `install`: `brew install trufflehog`
- `scan-repo`: `trufflehog filesystem .`
- `scan-history`: `trufflehog git file:///path/to/repo`

## Researcher Strategy
1. **Secret Hunt**: Run `trufflehog` first to find leaked keys.
2. **Surface Analysis**: Use `nuclei` to find exposed config files or known CVEs in dependencies.
3. **Deep Audit**: Use the `Taint Analysis` skill combined with `ast-grep` to find custom logic vulnerabilities.

## Security & Best Practices
- **Ethical Boundary**: ONLY run these tools on repositories and targets you have explicit permission to audit.
- **Reporting**: Always document the "PoC" (Proof of Concept) for how a vulnerability can be exploited.
- **Patching**: Once a vulnerability is found, use `ast-grep` or `sed` to apply a permanent fix (e.g., switching from `exec` to `spawn`).
