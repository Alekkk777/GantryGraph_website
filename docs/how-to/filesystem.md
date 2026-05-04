# Read and Write Files

> Give your agent sandboxed access to a directory so it can read, write, list, and delete files.

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

`FileSystemTools` gives the agent four tools: `file_read`, `file_write`, `file_list`, and `file_delete`. Every path is validated against `workspace` before I/O — path-traversal attempts like `../../etc/passwd` raise `PermissionError` and are never executed.

## Step 2 — Add shell commands

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

## Step 3 — Workspace policy shorthand

```python
from gantrygraph import GantryEngine
from gantrygraph.security import WorkspacePolicy
from langchain_anthropic import ChatAnthropic

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    workspace_policy=WorkspacePolicy(workspace_path="/app"),
    max_steps=20,
)
```

`WorkspacePolicy` automatically adds both `FileSystemTools` and `ShellTools` locked to `workspace_path`. It is equivalent to listing them manually in `tools=`.

---

## Complete example

```python
from gantrygraph import GantryEngine
from gantrygraph.actions import FileSystemTools, ShellTools
from gantrygraph.security import GuardrailPolicy, BudgetPolicy
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

- **Read-only agent:** omit `file_write`, `file_delete`, and `ShellTools` — pass only `FileSystemTools` with its tools filtered, or use `@gantry_tool` to expose only `file_read` and `file_list`
- **No shell allowlist (trust the agent):** `ShellTools(workspace="/app")` with no `allowed_commands`
- **Longer shell timeout:** `ShellTools(workspace="/app", timeout=120.0)`
- **Guard destructive ops:** add `GuardrailPolicy(requires_approval={"file_delete", "shell_run"})` — see [Require human approval](human-approval.md)

## Troubleshooting

**`PermissionError: path escapes workspace`** — the agent tried a path like `../../etc`; this is working as intended. Widen `workspace` if legitimate paths are being blocked.

**`shell_run` returns `command not found`** — the executable is not in `allowed_commands`. Either add it or set `allowed_commands=None` to allow everything.

**Agent reads large files and runs out of tokens** — `file_read` returns the full file. Add a `system_prompt` instructing the agent to read only the relevant sections.

---

**Next:** [Build custom tools](custom-tools.md) · [Require human approval before actions](human-approval.md) · [Monitor agent execution](observability.md)
