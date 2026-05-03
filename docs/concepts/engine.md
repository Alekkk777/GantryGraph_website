# The agent loop

Every `GantryEngine` runs the same four-step loop until the task is done
or `max_steps` is reached.

```
observe → think → act → review → (loop) → done
```

Understanding this loop makes it easy to predict what your agent will do
and where to add controls.

## The four steps

**Observe** — the agent takes stock of its environment.
If you gave it a `DesktopScreen` or `WebPage` perception source, it takes a screenshot
and appends it as a multimodal message. Without perception, this step is skipped
and the agent only sees its task description and tool results.

**Think** — the LLM receives the full message history (task + observations + tool results)
and decides what to do next. It either calls one or more tools, or outputs a final answer
with no tool calls.

**Act** — each tool call runs through the optional guardrail gate. If you set
`approval_callback`, dangerous tools pause and wait for a response before executing.
Errors from tools are returned to the LLM as `ToolMessage(status="error")` so it can
try a different approach rather than crashing.

**Review** — a pure function that checks: did the LLM's last response contain any tool calls?
If yes, loop back to observe. If no, the task is complete.

## Creating an engine

```python
from gantrygraph import GantryEngine
from langchain_anthropic import ChatAnthropic

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),

    # Optional — all have sensible defaults
    tools=[...],               # what the agent can do
    perception=...,            # what the agent can see
    max_steps=50,              # hard stop on loop count
    system_prompt="...",       # custom instructions prepended to every task
    on_event=lambda e: print(e),  # callback for observe/think/act/review events
    approval_callback=...,     # human-in-the-loop gate
    guardrail=...,             # which tools need approval
    budget=...,                # cost/time hard limits
)
```

## Running a task

=== "Sync"
    ```python
    result = agent.run("List the 5 largest files in /tmp")
    ```

=== "Async"
    ```python
    result = await agent.arun("List the 5 largest files in /tmp")
    ```

=== "Stream events"
    ```python
    async for event in agent.astream_events("List the 5 largest files"):
        print(event.event_type, event.step, event.data)
    ```

`run()` is a thin sync wrapper around `arun()`. Use `arun()` directly in async code
to avoid creating a nested event loop.

## Setting limits

### Step limit

```python
agent = GantryEngine(llm=..., max_steps=20)
```

The loop stops after 20 iterations regardless of whether the task is done.
The last LLM output is returned as the result.

### Time and cost limit

```python
from gantrygraph.security import BudgetPolicy

agent = GantryEngine(
    llm=...,
    budget=BudgetPolicy(
        max_steps=20,
        max_wall_seconds=60.0,   # raises TimeoutError after 60 s
    ),
)
```

### Workspace sandbox

```python
from gantrygraph.security import WorkspacePolicy

agent = GantryEngine(
    llm=...,
    workspace_policy=WorkspacePolicy(workspace_path="/app"),
)
# Automatically adds FileSystemTools and ShellTool scoped to /app
```

## Observing what the agent does

Pass `on_event` to get a callback on every step:

```python
def log(event):
    print(f"[{event.event_type}] step={event.step} data={event.data}")

agent = GantryEngine(llm=..., on_event=log)
```

Events: `observe`, `think`, `act`, `review`, `error`, `done`.

## Configuration from environment variables

`GantryConfig` reads all settings from `GANTRY_*` env vars so you don't
hardcode anything:

```python
from gantrygraph import GantryConfig
from langchain_anthropic import ChatAnthropic

cfg = GantryConfig.from_env()
agent = cfg.build(llm=ChatAnthropic(model="claude-sonnet-4-6"))
```

```bash
export GANTRY_WORKSPACE=/app
export GANTRY_MAX_STEPS=30
export GANTRY_MAX_WALL_SECONDS=120
```

## Advanced — raw graph access

`engine.get_graph()` returns the compiled LangGraph `StateGraph` if you need
to add custom nodes, use a checkpointer, or wire up streaming differently:

```python
graph = agent.get_graph()
# graph is a CompiledStateGraph — use it like any LangGraph graph
```

See [LangGraph docs](https://langchain-ai.github.io/langgraph/) for graph-level features.
