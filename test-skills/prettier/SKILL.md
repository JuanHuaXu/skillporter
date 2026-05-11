# Prettify (Prettier)

Automated code formatting using Prettier. Use this skill to ensure code consistency across the project.

## Prerequisites
Before formatting, ensure Prettier is available. If not, run the `install` action.

## Actions

### install
Install Prettier as a development dependency.

**Usage**:
`npm install --save-dev prettier`

### format
Format one or more files using `npx prettier`.

**Usage**:
`npx prettier --write <path_to_file>`

**Parameters**:
- `path`: The file or directory to format.

**Rules**:
1. ALWAYS use the `--write` flag to apply changes unless you only want to check for errors.
2. For multiple files, you can use globs: `npx prettier --write "src/**/*.ts"`.
3. If a `.prettierrc` exists in the root, Prettier will automatically use it.
4. Supported languages include: JavaScript, TypeScript, JSON, CSS, SCSS, HTML, Markdown, and YAML.

### check
Check if files are formatted without modifying them.

**Usage**:
`npx prettier --check <path_to_file>`

## Examples

#### Format a single file
```bash
npx prettier --write src/index.ts
```

#### Format the entire src directory
```bash
npx prettier --write "src/**/*.{ts,js,json}"
```

#### Check if the project is formatted
```bash
npx prettier --check .
```

## Security & Best Practices
- Avoid formatting `node_modules` or `dist` folders.
- Use quotes around glob patterns to prevent shell expansion issues.
- If you encounter a formatting conflict, check for a `.prettierignore` file in the workspace.
