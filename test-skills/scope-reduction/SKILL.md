# Recursive Scope Reduction

Use this skill to decompose massive, complex objectives into "One-Shot" manageable chunks. This prevents context-bloat and ensures high-precision execution.

## The Scope Reduction Loop

### 1. Decompose (Divide)
Take a high-level objective and break it into a tree of sub-tasks. 
- **Rule**: If a task takes more than 100 lines of code change, it is TOO BIG. Decompose it further.
- **Output**: Create a `TODO.md` or a "Task Tree" in your memory.

### 2. Scope-Lock (Focus)
Pick exactly ONE leaf node from the Task Tree. Ignore all other tasks.
- **Mental State**: You are now a specialist for ONLY this sub-task.
- **Context**: Read only the files necessary for this specific chunk.

### 3. Execute & Verify (Conquer)
Perform the task and run a validation (e.g., test or manual check).

### 4. Traverse (Ascend/Descend)
Once a leaf is done, move to the next sibling or ascend to the parent task.
- **Update**: Mark the task as [x] in your Task Tree.
- **Transition**: Summarize the state changes before moving to the next scope.

## Actions (Internal reasoning steps)

### decompose-task
Break the current objective into a hierarchical list.

### current-scope
Explicitly state what you are working on RIGHT NOW and what you are ignoring.

### next-chunk
Determine the next logical task in the tree after a completion.

## Examples of Scope Reduction

#### Bad Scope (Too Broad)
"Refactor the whole API to use a new database."

#### Good Scope (Reduced)
1. Update the `db-connection.ts` to support the new driver. [LOCK HERE]
2. Map the `User` entity to the new schema.
3. Update the `getUser` endpoint.

## Security & Best Practices
- **Isolation**: When in a scope-lock, do not make "drive-by" changes to unrelated files.
- **Checkpoints**: Commit or save state after every leaf node is completed.
- **Depth-First**: Always finish a sub-task branch before moving to a new top-level branch.
- **Stuck?**: If a leaf node is still too hard, apply Scope Reduction to the leaf itself.
