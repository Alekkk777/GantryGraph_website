# Require Human Approval Before Actions

> Gate dangerous tool calls so a human can approve or deny them before the agent proceeds.

## Step 1 — Define an approval callback

```python
async def ask_human(tool_name: str, args: dict) -> bool:
    """Called before every tool in GuardrailPolicy.requires_approval."""
    print(f"\nAgent wants to run: {tool_name}")
    print(f"Arguments: {args}")
    answer = input("Allow? [y/N] ").strip().lower()
    return answer == "y"
```

The callback receives the tool name and its arguments. Return `True` to allow, `False` to deny. Both sync and async callbacks are supported.

## Step 2 — Wire the guardrail

```python
from gantrygraph import GantryEngine
from gantrygraph.actions import ShellTools, FileSystemTools
from gantrygraph.security import GuardrailPolicy
from langchain_anthropic import ChatAnthropic

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    tools=[
        FileSystemTools(workspace="/my/project"),
        ShellTools(workspace="/my/project", allowed_commands=["git", "rm"]),
    ],
    guardrail=GuardrailPolicy(requires_approval={"shell_run", "file_delete"}),
    approval_callback=ask_human,
    max_steps=20,
)

result = agent.run("Clean up temp files and commit the changes.")
print(result)
```

Only the tools listed in `requires_approval` trigger the callback. All other tools run freely. When the callback returns `False`, the LLM is told the action was denied and can try a different approach.

## Step 3 — Suspend and resume pattern (web apps)

```python
from gantrygraph import GantryEngine, AgentSuspended
from gantrygraph.actions import ShellTools
from gantrygraph.security import GuardrailPolicy
from langchain_anthropic import ChatAnthropic

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    tools=[ShellTools(workspace="/app")],
    guardrail=GuardrailPolicy(requires_approval={"shell_run"}),
    enable_suspension=True,  # uses LangGraph interrupt — no callback needed
)

# First call — runs until a guarded tool is reached, then raises AgentSuspended
try:
    result = await agent.arun("Deploy to production.", thread_id="deploy-001")
except AgentSuspended as exc:
    print(f"Suspended — thread_id: {exc.thread_id}")
    print(f"Pending: {exc.data}")
    # Store exc.thread_id and wait for the human to respond

# Later — after the human approves via your UI or chat
result = await agent.resume(thread_id="deploy-001", approved=True)
print(result)
```

`enable_suspension=True` auto-creates a `MemorySaver` checkpointer. The `thread_id` uniquely identifies the paused run so it can be resumed across HTTP requests or message queues.

---

## Complete example

```python
import asyncio
from gantrygraph import GantryEngine, AgentSuspended
from gantrygraph.actions import ShellTools, FileSystemTools
from gantrygraph.security import GuardrailPolicy, BudgetPolicy
from langchain_anthropic import ChatAnthropic

# Synchronous CLI approval
async def cli_approval(tool_name: str, args: dict) -> bool:
    print(f"\n[APPROVAL REQUIRED] {tool_name}")
    for k, v in args.items():
        print(f"  {k}: {v}")
    return input("Allow? [y/N] ").strip().lower() == "y"

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    tools=[
        FileSystemTools(workspace="/my/project"),
        ShellTools(workspace="/my/project", allowed_commands=["git", "pytest", "rm"]),
    ],
    guardrail=GuardrailPolicy(requires_approval={"shell_run", "file_delete"}),
    approval_callback=cli_approval,
    budget=BudgetPolicy(max_steps=30, max_wall_seconds=300.0),
    max_steps=30,
)

result = asyncio.run(agent.arun(
    "Run the test suite, delete all __pycache__ directories, "
    "and commit the result."
))
print(result)
```

---

## Variants

- **Approve only deletions:** `GuardrailPolicy(requires_approval={"file_delete"})`
- **Approve all shell commands:** `GuardrailPolicy(requires_approval={"shell_run"})`
- **Auto-approve custom tools with `@gantry_tool(destructive=True)`:** tag any tool as destructive and the engine adds it to the gate automatically — no `requires_approval` entry needed:

```python
from gantrygraph import gantry_tool

@gantry_tool(destructive=True)
def nuke_data(scope: str) -> str:
    """Permanently delete all data in scope."""
    ...

# No guardrail= needed — nuke_data auto-requires approval
agent = GantryEngine(llm=..., tools=[nuke_data], approval_callback=ask_human)
```

- **Async Slack approval:** define `async def ask_slack(tool_name, args) -> bool:` and post to a Slack channel — both sync and async callbacks work
- **Suspend/resume via REST:** use the built-in `serve()` server — see [Deploy as a REST API](cloud-deploy.md) for `POST /resume/{job_id}`

## Troubleshooting

**Callback never fires** — verify the tool name in `requires_approval` exactly matches the tool's `name` attribute (e.g. `"shell_run"`, not `"ShellTools"`).

**`resume()` raises `RuntimeError: resume() requires a checkpointer`** — pass `enable_suspension=True` or a custom `checkpointer=` when constructing `GantryEngine`.

**Agent loops after denial** — set a `BudgetPolicy` with `max_steps` to stop the agent from repeatedly attempting the same denied action.

---

**Next:** [Deploy as a REST API](cloud-deploy.md) · [Read and write files](filesystem.md) · [Monitor agent execution](observability.md)
