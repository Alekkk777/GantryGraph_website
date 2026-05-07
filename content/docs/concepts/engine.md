# The agent loop

`GantryEngine` runs one loop per task. Each iteration has four steps.
The loop continues until the LLM produces an answer with no tool calls.

```
START
  │
  ▼
memory_recall ──── injects top-3 relevant past results (first step only)
  │
  ▼
observe ─────────── takes a screenshot / accessibility snapshot (if perception= is set)
  │
  ▼
think ───────────── LLM receives full message history → decides: call tools or finish
  │
  ▼
act ─────────────── runs each tool call; approval gate fires here if configured
  │
  ▼
review ──────────── did the LLM return tool calls? yes → back to observe. no → END
```

## What each step does

**`memory_recall`** fires only on the first iteration. It searches long-term memory
(if configured) with the task as the query and prepends the top results to the
message history. Skipped if no `memory=` is attached.

**`observe`** calls `perception.observe()` and appends the result (screenshot, URL,
accessibility tree) as a `HumanMessage`. Skipped if no `perception=` is attached.
Screenshot diffing is automatic — if the screen hasn't changed since the last step,
the image is omitted to save vision tokens.

**`think`** sends the full message history to the LLM. The response is either:
- A list of tool calls → continue to `act`
- A plain text answer with no tool calls → `review` will terminate the loop

**`act`** runs each tool call from the `think` response:
1. Checks the guardrail approval list — if the tool requires approval, calls `approval_callback` (or interrupts if `use_interrupt=True`)
2. Resolves secret aliases in arguments (if `secrets=` is configured)
3. Executes the tool and records the result as a `ToolMessage`
4. Catches all exceptions — errors become `ToolMessage(status="error")` so the LLM can self-correct

**`review`** checks whether the last LLM message contained tool calls. If not, the task is
considered complete and the loop exits.

## Creating an engine

```python
from gantrygraph import GantryEngine
from langchain_anthropic import ChatAnthropic

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    # What the agent can see
    perception=...,             # DesktopScreen, WebPage, or custom BasePerception
    # What the agent can do
    tools=[...],                # BaseAction, MCPClient, or @gantry_tool functions
    # How many steps before stopping
    max_steps=50,
    max_consecutive_errors=5,   # stop after N back-to-back tool errors
    # Context and instructions
    system_prompt="...",
    # Observability
    on_event=lambda e: print(e),
    telemetry="stdout",         # "stdout" | "langsmith" | "silent"
    # Security
    approval_callback=...,
    guardrail=...,              # GuardrailPolicy
    budget=...,                 # BudgetPolicy
    secrets=...,                # GantrySecrets
    # Memory
    memory=...,                 # InMemoryStore or ChromaMemory
    # State persistence (suspend/resume)
    checkpointer=...,
    enable_suspension=False,
    # Token cost controls
    perception_mode="auto",     # "auto" | "axtree" | "vision"
    message_window=None,        # keep only the last N messages in context
    enable_caching=False,       # Anthropic prompt cache on system messages
)
```

All parameters except `llm` are optional.

## Running a task

=== "Sync"
    ```python
    result = agent.run("List the 5 largest files in /tmp")
    # blocks until the task finishes
    ```

=== "Async"
    ```python
    result = await agent.arun("List the 5 largest files in /tmp")
    # use this in async code — avoids nested event loop issues
    ```

=== "Stream events"
    ```python
    async for event in agent.astream_events("List the 5 largest files"):
        print(event.event_type, event.step, event.data)
    # yields GantryEvent after each node transition
    ```

## Observability shortcut

`telemetry=` is the fastest way to see what the agent is doing:

```python
GantryEngine(llm=..., telemetry="stdout")      # colored output to console — zero setup
GantryEngine(llm=..., telemetry="langsmith")   # sets LANGCHAIN_TRACING_V2=true automatically
GantryEngine(llm=..., telemetry="silent")      # suppresses all gantrygraph logging
```

For structured logging or custom sinks, pass `on_event=` instead:

```python
def log(event):
    print(f"[{event.event_type}] step={event.step} {event.data}")

agent = GantryEngine(llm=..., on_event=log)
```

## Token cost controls

Four orthogonal knobs that together reduce token spend by **5–10×** on long tasks:

| Parameter | Default | Savings |
|---|---|---|
| `perception_mode="axtree"` | `"auto"` | ~80% per observe step (text tree vs screenshot) |
| `message_window=20` | `None` | Caps O(N²) history growth to O(N) |
| `enable_caching=True` | `False` | Up to 90% on Anthropic system-message tokens |
| `ShellTools(max_output_chars=2000)` | `2000` | Prevents megabyte log dumps |

```python
from gantrygraph import GantryEngine
from gantrygraph.actions import ShellTools
from langchain_anthropic import ChatAnthropic

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    tools=[ShellTools(max_output_chars=2000)],
    perception_mode="axtree",   # accessibility tree only — no screenshots
    message_window=20,          # messages[0] + last 20 messages sent to LLM
    enable_caching=True,        # cache_control on system messages
    max_steps=50,
)
```

`perception_mode` values:
- **`"auto"`** (default) — sends the accessibility tree when available, screenshot as fallback
- **`"axtree"`** — always text-only; fails fast on vision-only setups (canvas apps, PDFs)
- **`"vision"`** — always screenshot; use for pixel-level tasks (CAPTCHA, image editing)

See the [Cost optimization guide](../how-to/cost-optimization.md) for a full breakdown.

## Limits and budget

| Parameter | Default | What it does |
|---|---|---|
| `max_steps` | `50` | Hard cap on act-node executions |
| `max_consecutive_errors` | `5` | Stop after N back-to-back tool failures — catches infinite loops |
| `BudgetPolicy.max_wall_seconds` | `None` | Wall-clock timeout per run — raises `TimeoutError` |
| `BudgetPolicy.max_tokens` | `None` | Cumulative token cap — raises `BudgetExceededError` |
| `BudgetPolicy.on_limit` | `"stop"` | `"stop"` raises on breach; `"warn"` logs and continues |

```python
from gantrygraph.security import BudgetPolicy

agent = GantryEngine(
    llm=...,
    max_steps=20,
    budget=BudgetPolicy(
        max_wall_seconds=60.0,
        max_tokens=10_000,
        on_limit="stop",
    ),
)
```

## Loading config from environment

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

`get_graph()` returns the compiled LangGraph `StateGraph`. Use it to inject custom nodes,
checkpointers, or streaming:

```python
graph = agent.get_graph()
# CompiledStateGraph — call ainvoke, astream, get_state, etc.
```

See the [API reference](../api-reference.md#graph-primitives) for a full custom-loop example.

---

**See also:** [Guardrails](guardrails.md) · [Quickstart](../quickstart.md) · [API reference](../api-reference.md#engine)
