# Symbol Mapping (ctags)

Use Universal Ctags to index and navigate codebase symbols. This provides a "Table of Contents" for the entire repository, allowing for instant jumps to definitions.

## Prerequisites
- **Universal Ctags** (not the legacy BSD ctags found on macOS by default).
- The `tags` file is generated in the root of the project.

## Actions

### install
Install Universal Ctags.
`brew install universal-ctags`

### generate
Generate a `tags` index for the entire repository. This should be done whenever significant files are added.

**Usage**:
`ctags -R --exclude=node_modules --exclude=dist --exclude=.git .`

### find-definition
Find which file and line a symbol (function, class, variable) is defined in.

**Usage**:
`grep "^<symbol_name>\t" tags`

### list-symbols
List all symbols defined in a specific file.

**Usage**:
`ctags -f - <path_to_file>`

## Agent Navigation Strategy
1. **Index First**: Before exploring a new codebase, run the `generate` action.
2. **Search Map**: When looking for a function (e.g., `calculateTotal`), use `grep` on the `tags` file instead of searching all source files.
3. **Verify**: Once the file path is found in the `tags` file, use `cat` or `read_file` to examine the code.

## Security & Best Practices
- **Ignore the Tags**: Always add `tags` to `.gitignore` to avoid cluttering the repository.
- **Language Support**: Universal Ctags supports 100+ languages automatically.
- **Accuracy**: The `tags` file is a snapshot. If code changes significantly, run `generate` again.
