# The agent loop

Every `GantryEngine` runs four steps, in order, until the task is done.

```
observe → think → act → review
   ↑__________________________|
```

## The four steps

**Observe** — if you gave the agent a `DesktopScreen` or `WebPage`, it takes a fresh
screenshot now and appends it to the message history. Without perception, this step
is a no-op.

**Think** — the LLM receives the full message history (task + observations + tool results)
and decides what to do: call one or more tools, or output a final answer.

**Act** — tool calls run through the optional guardrail gate. Errors come back as
`ToolMessage(status="error")` so the LLM can self-correct instead of crashing.

**Review** — did the last LLM response contain tool calls? Yes → loop. No → done.

## Creating an engine

```python
from gantrygraph import GantryEngine
from langchain_anthropic import ChatAnthropic

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    tools=[...],
    perception=...,
    max_steps=50,
    system_prompt="...",
    on_event=lambda e: print(e),
    approval_callback=...,
    guardrail=...,
    budget=...,
)
```

All parameters except `llm` are optional.

## Running

=== "Sync"
    ```python
    result = agent.run("List the 5 largest files in /tmp")
    ```

=== "Async"
    ```python
    result = await agent.arun("List the 5 largest files in /tmp")
    ```

=== "Stream"
    ```python
    async for event in agent.astream_events("List the 5 largest files"):
        print(event.event_type, event.step, event.data)
    ```

Use `arun()` directly in async code to avoid a nested event loop.

## Limits

```python
from gantrygraph.security import BudgetPolicy

agent = GantryEngine(
    llm=...,
    budget=BudgetPolicy(
        max_steps=20,
        max_wall_seconds=60.0,
    ),
)
```

See [Guardrails](guardrails.md) for the full set of safety controls.

## Configuration from environment

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

`engine.get_graph()` returns the compiled LangGraph `StateGraph` for custom nodes,
checkpointers, or streaming:

```python
graph = agent.get_graph()
# CompiledStateGraph — use like any LangGraph graph
```

---

**See also:** [Quickstart](../quickstart.md) · [Guardrails](guardrails.md) · [API reference](../api-reference.md#engine)
