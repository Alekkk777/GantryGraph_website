# Add human approval

This guide shows you how to pause the agent before it executes a
dangerous action and wait for a human to say yes or no.

Two patterns are available:

- **Callback mode** — a Python function is called synchronously. Good for CLI tools
  or scripts where you're watching the terminal.
- **Suspend / resume mode** — the agent pauses and you resume it later via an API call.
  Good for web apps and workflows where the human is not at the keyboard.

## Pattern 1 — Approval callback (CLI / scripts)

```python
from gantrygraph import GantryEngine
from gantrygraph.actions import ShellTool
from gantrygraph.security import GuardrailPolicy
from langchain_anthropic import ChatAnthropic

async def ask_human(tool_name: str, args: dict) -> bool:
    """Called before any tool in requires_approval is executed."""
    print(f"\nAgent wants to run: {tool_name}")
    print(f"Arguments: {args}")
    answer = input("Allow? [y/N] ").strip().lower()
    return answer == "y"

shell = ShellTool(workspace="/my/project", allowed_commands=["git", "rm"])

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    tools=[shell],
    guardrail=GuardrailPolicy(requires_approval={"shell_run"}),
    approval_callback=ask_human,
    max_steps=20,
)

result = agent.run("Clean up the temp files and commit the changes.")
```

If `ask_human` returns `False`, the tool call is skipped and the LLM is told
the action was denied. It can then try a different approach.

## Pattern 2 — Suspend and resume (web apps / APIs)

Use this when the agent runs in a server and the human approves via a UI
or chat interface.

```python
from gantrygraph import GantryEngine, AgentSuspended
from gantrygraph.actions import ShellTool
from gantrygraph.security import GuardrailPolicy
from langchain_anthropic import ChatAnthropic

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    tools=[ShellTool(workspace="/app")],
    guardrail=GuardrailPolicy(requires_approval={"shell_run"}),
    enable_suspension=True,
)

# First call — runs until it hits a guarded tool
try:
    result = await agent.arun("Deploy to production", thread_id="deploy-job-1")
except AgentSuspended as e:
    pending_tool = e.data["tool_name"]
    pending_args = e.data["args"]
    print(f"Suspended: agent wants to run {pending_tool}({pending_args})")
    # Store e.thread_id and wait for the human to respond via your UI

# Later — after the human approves
result = await agent.resume(thread_id="deploy-job-1", approved=True)
print(result)
```

The `thread_id` lets you persist the suspension across HTTP requests or
message queues. The agent resumes exactly where it left off.

## Combining with the cloud server

The built-in REST server handles suspend/resume automatically.
See [Deploy as a REST API](cloud-deploy.md) for the `/resume/{job_id}` endpoint.

## Guarding specific tools

`GuardrailPolicy.requires_approval` takes a set of tool names.
Only those tools trigger the approval gate — all others run freely.

```python
from gantrygraph.security import GuardrailPolicy

# Only block file deletion and shell commands — reads and writes are fine
guardrail = GuardrailPolicy(
    requires_approval={"file_delete", "shell_run"}
)
```

You can combine this with `BudgetPolicy` to also cap runtime:

```python
from gantrygraph.security import BudgetPolicy, GuardrailPolicy

agent = GantryEngine(
    llm=...,
    tools=[...],
    guardrail=GuardrailPolicy(requires_approval={"shell_run", "file_delete"}),
    budget=BudgetPolicy(max_steps=30, max_wall_seconds=300),
    approval_callback=ask_human,
)
```
