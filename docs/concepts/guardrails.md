# Guardrails

Guardrails let you control what the agent is allowed to do — before it does it.

```
think → act
         ↓
    [guardrail gate]  ← requires_approval set?
         ↓                    ↓
     allowed           approval_callback()
         ↓                    ↓
    tool runs          yes → runs   no → skipped
```

## The problem they solve

An LLM agent can call any tool it has access to, including destructive ones
like `file_delete`, `shell_run`, or `browser_fill`. Without guardrails, a
misunderstood instruction can cause irreversible damage.

Guardrails intercept tool calls before execution and either:
- **Block** until a human approves (approval gate)
- **Cap** total runtime or cost (budget limit)
- **Restrict** which files and commands are reachable (workspace policy)

## `GuardrailPolicy` — approval gate

Specify which tool names must wait for human approval before running.

```python
from gantrygraph.security import GuardrailPolicy

guardrail = GuardrailPolicy(
    requires_approval={"shell_run", "file_delete"}
)
```

Any tool not in `requires_approval` runs freely — only the listed names trigger the gate.

Wire it into the engine with an `approval_callback`:

```python
from gantrygraph import GantryEngine

async def ask_human(tool_name: str, args: dict) -> bool:
    print(f"Allow {tool_name}({args})? [y/N] ", end="")
    return input().strip().lower() == "y"

agent = GantryEngine(
    llm=...,
    tools=[...],
    guardrail=guardrail,
    approval_callback=ask_human,
)
```

If `approval_callback` returns `False`, the tool is skipped and the LLM receives
a "denied" message — it can then try a different approach.

## `BudgetPolicy` — cost and time cap

Hard-stop the agent if it runs too long or exceeds a step count.

```python
from gantrygraph.security import BudgetPolicy

agent = GantryEngine(
    llm=...,
    budget=BudgetPolicy(
        max_steps=30,
        max_wall_seconds=120.0,  # raises TimeoutError after 2 minutes
    ),
)
```

Use `max_wall_seconds` for unattended agents so a stuck loop doesn't run forever.

## `WorkspacePolicy` — file system isolation

Lock the agent to a directory. It cannot read, write, or execute anything outside it.

```python
from gantrygraph.security import WorkspacePolicy

agent = GantryEngine(
    llm=...,
    workspace_policy=WorkspacePolicy(workspace_path="/app"),
    # automatically adds FileSystemTools + ShellTools scoped to /app
)
```

Path traversal attempts like `../../etc/passwd` are rejected before the tool runs.

## Combine all three

```python
from gantrygraph.security import GuardrailPolicy, BudgetPolicy, WorkspacePolicy

agent = GantryEngine(
    llm=...,
    workspace_policy=WorkspacePolicy(workspace_path="/app"),
    guardrail=GuardrailPolicy(requires_approval={"shell_run", "file_delete"}),
    budget=BudgetPolicy(max_steps=50, max_wall_seconds=300),
    approval_callback=ask_human,
)
```

---

**See also:** [Human approval guide](../how-to/human-approval.md) · [API reference](../api-reference.md#security)
