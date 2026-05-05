# Read and Write Files

> Give your agent sandboxed access to one or more directories so it can read, write, list, and delete files.

## Step 1 — Read and write files

```python
from gantrygraph import GantryEngine
from gantrygraph.actions import FileSystemTools
from langchain_anthropic import ChatAnthropic

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    tools=[FileSystemTools(workspace="/my/project")],
    max_steps=20,
)

result = agent.run("Find all TODO comments in Python files and create a TODO.md summary.")
print(result)
```

`FileSystemTools` gives the agent four tools: `file_read`, `file_write`, `file_list`, and `file_delete`. Every path is validated against the allowed roots — path-traversal attempts like `../../etc/passwd` raise `PermissionError` and are never executed.

## Step 2 — Multiple allowed directories

When your task reads from one location and writes to another, pass a list:

```python
from gantrygraph.actions import FileSystemTools

tools = FileSystemTools(allowed_paths=["/data/input", "/data/output"])
```

The agent can use any absolute path inside either directory. Relative paths resolve against the first entry in the list.

## Step 3 — Add shell commands

```python
from gantrygraph import GantryEngine
from gantrygraph.actions import FileSystemTools, ShellTools
from langchain_anthropic import ChatAnthropic

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    tools=[
        FileSystemTools(workspace="/my/project"),
        ShellTools(
            workspace="/my/project",
            allowed_commands=["python", "pytest", "git", "ruff"],
            timeout=60.0,
        ),
    ],
    max_steps=30,
)

result = agent.run(
    "Run the test suite. If any tests fail, read the source files "
    "and fix the failures. Then run the tests again to confirm."
)
print(result)
```

`allowed_commands` is an allowlist — set it to the minimum executables your task needs. `timeout` is a per-command wall-clock limit in seconds.

**Security:** `ShellTools` ships with `ShellDenylist.default()` active. It blocks catastrophic commands — `rm -rf /`, fork bombs, `curl | bash`, and SSH key reads — before the OS sees them. To tighten controls, pass `denylist=ShellDenylist.strict()`. To disable (trusted environments only), pass `denylist=ShellDenylist.permissive()`.

```python
from gantrygraph.security import ShellDenylist

ShellTools(workspace="/app", denylist=ShellDenylist.strict())
```

## Step 4 — Workspace policy shorthand

`WorkspacePolicy` automatically adds both `FileSystemTools` and `ShellTools`. Use the factory methods to express intent clearly:

```python
from gantrygraph import GantryEngine
from gantrygraph.security import WorkspacePolicy
from langchain_anthropic import ChatAnthropic

# Single directory
agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    workspace_policy=WorkspacePolicy.restricted("/app"),
    max_steps=20,
)

# Multiple directories
agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    workspace_policy=WorkspacePolicy.multi_path(["/data/input", "/data/output"]),
    max_steps=20,
)

# No path restriction — trusted environments only
agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    workspace_policy=WorkspacePolicy.full_access(),
    max_steps=20,
)
```

---

## Complete example

```python
from gantrygraph import GantryEngine
from gantrygraph.actions import FileSystemTools, ShellTools
from gantrygraph.security import GuardrailPolicy, BudgetPolicy, ShellDenylist
from langchain_anthropic import ChatAnthropic

async def confirm(tool_name: str, args: dict) -> bool:
    print(f"Allow {tool_name}({args})? [y/N] ", end="")
    return input().strip().lower() == "y"

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    tools=[
        FileSystemTools(workspace="/my/project"),
        ShellTools(
            workspace="/my/project",
            allowed_commands=["git", "pytest", "rm"],
            timeout=30.0,
            denylist=ShellDenylist.strict(),
        ),
    ],
    guardrail=GuardrailPolicy(requires_approval={"file_delete", "shell_run"}),
    approval_callback=confirm,
    budget=BudgetPolicy(max_steps=25, max_wall_seconds=180.0),
    max_steps=25,
)

result = agent.run(
    "Run the full test suite, delete all __pycache__ directories, "
    "and stage the result with git."
)
print(result)
```

---

## File tools reference

| Tool | What it does |
|---|---|
| `file_read` | Read the contents of a file |
| `file_write` | Create or overwrite a file with text content |
| `file_list` | List files and directories under a path |
| `file_delete` | Delete a file or directory |
| `shell_run` | Run a whitelisted shell command in the workspace |

## Variants

- **Read-only agent:** pass only `FileSystemTools` and omit `ShellTools`; use `@gantry_tool` to expose only `file_read` and `file_list`
- **Separate input/output roots:** `FileSystemTools(allowed_paths=["/data/in", "/data/out"])`
- **No restriction (dev mode):** `FileSystemTools(unrestricted=True)` or `WorkspacePolicy.full_access()`
- **No shell allowlist (trust the agent):** `ShellTools(workspace="/app")` with no `allowed_commands`
- **Guard destructive ops:** add `GuardrailPolicy(requires_approval={"file_delete", "shell_run"})` — see [Require human approval](human-approval.md)

## Troubleshooting

**`PermissionError: path escapes workspace`** — the agent tried a path outside the allowed roots. Widen the list with `allowed_paths=` or use `WorkspacePolicy.full_access()` in dev.

**`shell_run` returns `command not found`** — the executable is not in `allowed_commands`. Either add it or set `allowed_commands=None` to allow everything.

**Agent reads large files and runs out of tokens** — `file_read` returns the full file. Add a `system_prompt` instructing the agent to read only the relevant sections.

---

**Next:** [Build custom tools](custom-tools.md) · [Require human approval before actions](human-approval.md) · [Monitor agent execution](observability.md)
