---
name: ctags
description: Use Universal Ctags only when normal search/read workflows are insufficient for navigating a large or unfamiliar codebase. Use for discovery and orientation, not as proof of root cause.
---

# Symbol Mapping (ctags)

Use Universal Ctags to index and navigate codebase symbols when `rg`, language-server output, or direct file reads are not enough.

## Prerequisites
- **Universal Ctags** (not the legacy BSD ctags found on macOS by default).
- The `tags` file is generated in the root of the project.

## Actions

### install
Install Universal Ctags.

**macOS**:
- Homebrew stable: `brew install universal-ctags`
- Homebrew latest HEAD: `brew tap universal-ctags/universal-ctags && brew install --HEAD universal-ctags`

**Linux**:
- Debian/Ubuntu package, if current enough: `sudo apt install universal-ctags`
- Fedora: `sudo dnf install ctags`
- Source build: follow the upstream Autotools build guide when distro packages are old.

**Windows**:
- Prefer WSL and the Linux instructions for consistent behavior.
- Native package availability varies; verify the package is Universal Ctags, not legacy Exuberant/BSD ctags.

**Verify**: `ctags --version` and confirm it says `Universal Ctags`.
**Official install docs**: `https://docs.ctags.io/en/latest/autotools.html`

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
1. **Use Last**: Start with `rg`, `rg --files`, direct reads, or language-native tooling.
2. **Index When Needed**: Generate tags only for large codebases or repeated symbol navigation.
3. **Search Map**: When looking for a function (e.g., `calculateTotal`), use `grep` on the `tags` file after tags exist.
4. **Verify**: Once the file path is found in the `tags` file, read the source directly.

## Security & Best Practices
- **Ignore the Tags**: Always add `tags` to `.gitignore` to avoid cluttering the repository.
- **Language Support**: Universal Ctags supports 100+ languages automatically.
- **Accuracy**: The `tags` file is a snapshot. If code changes significantly, run `generate` again.
- **Reasoning Boundary**: Symbol location helps navigation; it does not establish causality. Use `patch-reasoning-audit` before turning navigation findings into nontrivial fixes.
