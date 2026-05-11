# Mega-Linter

Mega-Linter is a 100% open-source tool that analyzes your project to detect security issues, coding style errors, and formatting inconsistencies across 70+ languages.

## Prerequisites
Mega-Linter is best run via Docker to ensure all linters are available without manual installation.
- Ensure **Docker** is running on the host.
- The `mega-linter-runner` is used to trigger the container.

## Actions

### install
Install the Mega-Linter runner locally.
`npm install --save-dev mega-linter-runner`

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
- **Timeout**: Large scans can take several minutes. Ensure your execution context doesn't time out prematurely.
