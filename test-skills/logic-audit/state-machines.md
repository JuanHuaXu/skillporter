---
name: logic-audit/state-machines
description: Tools for auditing state transitions, authorization flows, and process logic.
---

# State Machine & Flow Auditing

Many complex systems (e.g., payment gateways, document workflows) are state machines. Logic bugs here often involve "illegal" state transitions.

### map_transitions
List all possible states for an entity and the actions that trigger transitions.
**Example**: `Draft` -> `submit()` -> `Pending` -> `approve()` -> `Active`.

### test_out_of_order
Identify if an action can be triggered in the wrong state.
**Attack Vector**: Can `approve()` be called while the document is still in `Draft`?
**Action**: Find the code for the transition action and check if it has an explicit state check (e.g., `if (this.status !== 'Pending') throw Error`).

### skip_step_bypass
Check if a critical step in a multi-step process can be skipped.
**Example**: A checkout process that skips the `payment` step but still triggers `create_order`.
**Action**: Trace the "Success" path of a workflow. Look for ways to jump directly to the end state from an intermediate state.

### authorization_bypass
Verify that the *initiator* of a transition is authorized for that specific transition.
**Action**: Check if the authorization logic depends on the *current* state of the object or just the *user's* role.
