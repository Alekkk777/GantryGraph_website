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

GantryGraph provides four complementary layers — each can be used
independently or combined:

| Layer | What it protects |
|-------|-----------------|
| `GuardrailPolicy` | Gates named tools behind a human approval step |
| `BudgetPolicy` | Caps cost, steps, and wall time |
| `WorkspacePolicy` | Restricts filesystem and shell to allowed paths |
| `ShellDenylist` | Blocks dangerous shell patterns before the OS sees them |
| `GantrySecrets` | Keeps credentials out of the LLM context window |
| `@gantry_tool(destructive=True)` | Auto-adds a tool to the approval gate |

## `GuardrailPolicy` — approval gate

Specify which tool names must wait for human approval before running.

```python
from gantrygraph.security import GuardrailPolicy

guardrail = GuardrailPolicy(
    requires_approval={"shell_run", "file_delete"}
)
```

Any tool not in `requires_approval` runs freely. Wire an `approval_callback`:

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

## `@gantry_tool(destructive=True)` — auto-approval

Tag any tool as destructive and the engine automatically adds it to the
approval gate — no need to update `GuardrailPolicy` by hand.

```python
from gantrygraph import gantry_tool

@gantry_tool(destructive=True)
def drop_table(table: str) -> str:
    """Drop a database table permanently."""
    db.execute(f"DROP TABLE {table}")
    return f"dropped {table}"

agent = GantryEngine(
    llm=...,
    tools=[drop_table],
    approval_callback=ask_human,
    # drop_table is auto-added to requires_approval
)
```

If no `approval_callback` is provided, destructive tools return an error
message rather than executing.

## `ShellDenylist` — shell command firewall

The shell interceptor runs regex patterns against every command *before* the
subprocess is created. The OS never sees blocked commands.

Three built-in profiles:

```python
from gantrygraph.security import ShellDenylist
from gantrygraph.actions import ShellTools

# Default — blocks catastrophic commands (rm -rf /, fork bombs, curl|bash, ...)
tools = ShellTools(denylist=ShellDenylist.default())  # this is the default

# Strict — also blocks mkfs, fdisk, chmod 777, env/printenv credential dumps
tools = ShellTools(denylist=ShellDenylist.strict())

# Permissive — no restrictions (trusted/air-gapped environments only)
tools = ShellTools(denylist=ShellDenylist.permissive())

# Custom — extend default with your own patterns
tools = ShellTools(
    denylist=ShellDenylist(
        patterns=[
            *ShellDenylist.default().patterns,
            r"my-internal-forbidden-cmd",
        ],
        on_match="warn",   # log instead of blocking
    )
)
```

`on_match="warn"` logs a warning but still runs the command — useful for
auditing before switching to `"block"`.

## `GantrySecrets` — blind credential injection

Keep API keys and passwords out of the LLM's context window entirely. The
LLM sees *aliases* (e.g. `DB_PASS`); real values are substituted at execution
time.

```python
import os
from gantrygraph import GantryEngine
from gantrygraph.security import GantrySecrets

secrets = GantrySecrets({
    "DB_PASS":  os.environ["DB_PASSWORD"],
    "API_KEY":  os.environ["OPENAI_API_KEY"],
})

agent = GantryEngine(
    llm=...,
    tools=[...],
    secrets=secrets,
)
```

The system prompt automatically gains:
> *"Secret aliases available for tool arguments: DB_PASS, API_KEY. Pass them by name — their values are injected securely at execution time."*

When the LLM calls a tool with `{"password": "DB_PASS"}`, the engine
substitutes the real value before the tool runs. The real value never appears
in the message history.

Aliases also work embedded in strings:

```python
# LLM calls:  {"command": "mysql -u root -pDB_PASS"}
# Tool gets:  {"command": "mysql -u root -ps3cr3t"}
```

## `BudgetPolicy` — cost and time cap

```python
from gantrygraph.security import BudgetPolicy

agent = GantryEngine(
    llm=...,
    budget=BudgetPolicy(
        max_steps=30,
        max_tokens=10_000,        # raises BudgetExceededError
        max_wall_seconds=120.0,   # raises TimeoutError
        on_limit="stop",          # default; use "warn" to log and continue
    ),
)
```

## `WorkspacePolicy` — filesystem isolation

```python
from gantrygraph.security import WorkspacePolicy

# Single directory
agent = GantryEngine(
    llm=...,
    workspace_policy=WorkspacePolicy.restricted("/app"),
)

# Multiple directories
agent = GantryEngine(
    llm=...,
    workspace_policy=WorkspacePolicy.multi_path(["/tmp/input", "/tmp/output"]),
)
```

## Defence in depth — combine all layers

```python
from gantrygraph import GantryEngine, gantry_tool
from gantrygraph.security import (
    GuardrailPolicy, BudgetPolicy, WorkspacePolicy,
    ShellDenylist, GantrySecrets,
)
from gantrygraph.actions import ShellTools

@gantry_tool(destructive=True)
def file_delete(path: str) -> str:
    """Delete a file permanently."""
    ...

agent = GantryEngine(
    llm=...,
    tools=[
        ShellTools(
            workspace="/app",
            denylist=ShellDenylist.strict(),
        ),
        file_delete,  # auto-added to requires_approval
    ],
    workspace_policy=WorkspacePolicy.restricted("/app"),
    guardrail=GuardrailPolicy(requires_approval={"shell_run"}),
    budget=BudgetPolicy(max_steps=50, max_wall_seconds=300),
    approval_callback=ask_human,
    secrets=GantrySecrets({"DB_PASS": os.environ["DB_PASSWORD"]}),
)
```

---

**See also:** [Human approval guide](../how-to/human-approval.md) · [API reference](../api-reference.md#security)
