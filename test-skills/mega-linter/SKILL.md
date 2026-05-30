---
name: mega-linter
description: Use Mega-Linter for broad lint, style, and static-analysis sweeps when the user wants repository cleanup or diagnostic coverage. Do not treat linter matches as root-cause proof for nontrivial fixes.
---

# Mega-Linter

Mega-Linter is a 100% open-source tool that analyzes your project to detect security issues, coding style errors, and formatting inconsistencies across 70+ languages.

## Prerequisites
Mega-Linter is best run via Docker to ensure all linters are available without manual installation.
- Ensure **Docker** is running on the host.
- The `mega-linter-runner` is used to trigger the container.
- Install Docker from the official Docker docs for the host OS before running full scans.

## Actions

### install
Install the Mega-Linter runner locally, then run scans through Docker.

**macOS**:
- Install Docker Desktop.
- Runner: `npm install --save-dev mega-linter-runner`

**Linux**:
- Install Docker Engine or Docker Desktop for Linux.
- Runner: `npm install --save-dev mega-linter-runner`

**Windows**:
- Install Docker Desktop.
- Runner: `npm install --save-dev mega-linter-runner`

**No local runner**:
- Use `npx mega-linter-runner --flavor all` when Node can download packages on demand.

**Verify**: `docker version` and `npx mega-linter-runner --version`
**Official install docs**: `https://megalinter.io/latest/install-assisted/` and `https://docs.docker.com/get-started/get-docker/`

### scan
Perform a full project scan.
`npx mega-linter-runner --flavor all`

### fix
Run all linters and attempt to automatically fix issues.
`npx mega-linter-runner --flavor all --fix`

### config
Create a basic `.mega-linter.yml` configuration file to customize the scan.

## Configuration Options
You can exclude specific linters or folders in `.mega-linter.yml`:
```yaml
EXCLUDED_LINTERS:
  - SPELL_CSPELL
  - REPOSITORY_KICS
```

## Security & Best Practices
- **Docker Required**: Always check if the Docker daemon is active before running a scan.
- **Flavors**: Use specialized flavors if the project is large (e.g., `--flavor javascript`, `--flavor documentation`).
- **Permissions**: Mega-Linter may create a `megalinter-reports` folder; ignore this in your git operations.
- **Fix Boundary**: Before applying `--fix`, confirm this is a mechanical cleanup. For bug/security/performance fixes with uncertain causality, run `patch-reasoning-audit` first.
- **Timeout**: Large scans can take several minutes. Ensure your execution context doesn't time out prematurely.
