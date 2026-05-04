# Read and write files

Use `FileSystemTools` when you want the agent to create, read, update, or delete
files in a project directory — without ever being able to touch anything outside it.

```python
from gantrygraph import GantryEngine
from gantrygraph.actions import FileSystemTools
from langchain_anthropic import ChatAnthropic

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    tools=[FileSystemTools(workspace="/my/project")],
    max_steps=20,
)

result = agent.run("Find all TODO comments in the Python files and create a TODO.md summary.")
print(result)
```

`FileSystemTools` gives the agent four tools: `file_read`, `file_write`, `file_list`,
and `file_delete`. Every path the LLM tries to access is validated against `workspace`
before execution — path traversal attacks like `../../etc/passwd` are rejected outright.

## Run shell commands too

Pair `FileSystemTools` with `ShellTools` when the agent also needs to execute programs,
run tests, or use `git`:

```python
from gantrygraph.actions import FileSystemTools, ShellTools

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
```

`allowed_commands` is a whitelist — set it to the minimum your task needs.
Leave it `None` only if you fully trust the agent's actions.

## Lock everything to one directory at once

`WorkspacePolicy` is a shorthand that automatically wires both `FileSystemTools` and
`ShellTools` scoped to the same directory:

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

## What these tools provide

| Tool name      | What it does                                    |
|----------------|-------------------------------------------------|
| `file_read`    | Read the contents of a file                     |
| `file_write`   | Create or overwrite a file                      |
| `file_list`    | List files and directories under a path         |
| `file_delete`  | Delete a file                                   |
| `shell_run`    | Run a whitelisted command in the workspace      |

## Guard destructive operations

If you want the agent to ask before deleting files or running shell commands,
combine with `GuardrailPolicy`:

```python
from gantrygraph.security import GuardrailPolicy

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    tools=[
        FileSystemTools(workspace="/app"),
        ShellTools(workspace="/app", allowed_commands=["rm", "git"]),
    ],
    guardrail=GuardrailPolicy(requires_approval={"file_delete", "shell_run"}),
    approval_callback=my_approval_fn,
    max_steps=20,
)
```

See [Add human approval](human-approval.md) for the full approval flow.
