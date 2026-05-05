# API Reference

Quick navigation:
[Engine](#engine) · [Tools & Actions](#tools-actions) · [Perception](#perception) · [Memory](#memory) · [MCP](#mcp-integration) · [Security](#security) · [Swarm](#multi-agent-swarm) · [Telemetry](#telemetry) · [State & Events](#state-events) · [Graph Primitives](#graph-primitives)

---

## Engine

### `GantryEngine`

The main entry point. Composes an LLM, perception, and tools into an autonomous `observe → think → act → review` loop.

```python
from gantrygraph import GantryEngine
from langchain_anthropic import ChatAnthropic

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    tools=[...],
    max_steps=20,
)
result = agent.run("Your task here")
```

**Constructor parameters**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `llm` | `BaseChatModel` | required | Any LangChain chat model |
| `tools` | `list` | `[]` | `BaseAction`, `BaseMCPConnector`, or bare `BaseTool` instances |
| `perception` | `BasePerception` | `None` | How the agent observes its environment each loop iteration |
| `max_steps` | `int` | `50` | Hard cap on act-node executions |
| `max_consecutive_errors` | `int` | `5` | Stop early if the same error repeats N times — prevents infinite CAPTCHA / redirect loops |
| `system_prompt` | `str` | `None` | Prepended as a `SystemMessage` before the task |
| `approval_callback` | `callable` | `None` | `(tool_name, args) → bool` — called before every tool execution |
| `guardrail` | `GuardrailPolicy` | `None` | Per-tool approval list |
| `budget` | `BudgetPolicy` | `None` | Step and wall-clock limits |
| `memory` | `BaseMemory` | `None` | Long-term memory backend |
| `on_event` | `callable` | `None` | `(GantryEvent) → None` — called after each node transition |
| `workspace_policy` | `WorkspacePolicy` | `None` | Auto-wires `FileSystemTools` + `ShellTools` locked to one or more directories |
| `telemetry` | `str` | `None` | `"stdout"` pretty-prints events; `"langsmith"` enables LangSmith tracing; `"silent"` suppresses all logs |
| `checkpointer` | LangGraph checkpointer | `None` | State persistence for suspension/resume |
| `enable_suspension` | `bool` | `False` | Enable `interrupt()`-based HITL (requires a checkpointer) |

**Methods**

`run(task, *, thread_id=None) → str`
: Synchronous. Blocks until the task completes and returns the final answer.

`await arun(task, *, thread_id=None) → str`
: Async primary entry point. Raises `AgentSuspended` when `enable_suspension=True` and a tool needs approval.

`async for event in astream_events(task)`
: Stream `GantryEvent` objects as they are emitted.

`get_graph() → CompiledStateGraph`
: Return the compiled LangGraph — use this to inject custom nodes, checkpointers, or routing logic.

`await resume(thread_id, *, approved=True) → str`
: Resume a suspended run. `approved=True` executes the pending tool; `False` denies it.

---

### `GantryConfig`

Declarative configuration — build an engine from a YAML file, env vars, or a Python dict.

```python
from gantrygraph import GantryConfig
from langchain_anthropic import ChatAnthropic

cfg = GantryConfig.from_env()
agent = cfg.build(llm=ChatAnthropic(model="claude-sonnet-4-6"))
```

**Class methods**

`GantryConfig.from_env(prefix="GANTRY_") → GantryConfig`
: Load from environment variables. Each field maps to `{PREFIX}{FIELD_UPPERCASE}`.

`GantryConfig.from_yaml(path) → GantryConfig`
: Load from a YAML file. Requires `pip install pyyaml`.

**Key fields** (all optional)

| Field | Env var | Description |
|---|---|---|
| `max_steps` | `GANTRY_MAX_STEPS` | Step cap |
| `workspace` | `GANTRY_WORKSPACE` | Auto-attach file + shell tools |
| `memory` | `GANTRY_MEMORY` | `"none"` / `"in_memory"` / `"chroma"` |
| `perception` | `GANTRY_PERCEPTION` | `"none"` / `"desktop"` / `"web"` |
| `max_wall_seconds` | `GANTRY_MAX_WALL_SECONDS` | Wall-clock timeout |
| `guardrail_requires_approval` | `GANTRY_GUARDRAIL_REQUIRES_APPROVAL` | Comma-separated tool names |
| `telemetry_otlp_endpoint` | `GANTRY_TELEMETRY_OTLP_ENDPOINT` | OTel OTLP gRPC endpoint |

`build(llm, *, approval_callback=None, on_event=None, extra_tools=None) → GantryEngine`
: Assemble and return a configured `GantryEngine`.

---

### `AgentSuspended`

Raised by `arun()` when the agent is suspended awaiting human approval (`enable_suspension=True`).

```python
try:
    result = await agent.arun(task)
except AgentSuspended as exc:
    print(exc.thread_id)   # pass to agent.resume()
    result = await agent.resume(exc.thread_id, approved=True)
```

**Attributes:** `thread_id: str`, `data: Any`

---

## Tools & Actions

### `@gantry_tool`

Decorator that turns any `def` or `async def` into an LLM-callable tool.

```python
from gantrygraph import gantry_tool

@gantry_tool
async def fetch_price(ticker: str) -> str:
    """Return the latest price for a stock ticker."""
    ...
```

The docstring becomes the tool description — make it specific. Accepts optional `name=` and `description=` overrides.

---

### `FileSystemTools`

Sandbox-safe file operations, locked to one or more directories.

```python
from gantrygraph.actions import FileSystemTools

# Single directory
tools = FileSystemTools(workspace="/tmp/sandbox")

# Multiple directories — read from one, write to another
tools = FileSystemTools(allowed_paths=["/data/input", "/data/output"])

# No restriction (trusted environments only)
tools = FileSystemTools(unrestricted=True)
```

| Parameter | Default | Description |
|---|---|---|
| `workspace` | `None` | Single allowed directory (original API — still supported) |
| `allowed_paths` | `None` | List of allowed directories; relative paths resolve against the first entry |
| `unrestricted` | `False` | Skip all path validation — use only in trusted environments |

**Exposed tools:** `file_read`, `file_write`, `file_list`, `file_delete`

---

### `ShellTools`

Run shell commands via `asyncio` subprocess.

```python
from gantrygraph.actions import ShellTools

tools = ShellTools(
    workspace="/tmp/sandbox",
    allowed_commands=["python", "pytest", "git"],
    timeout=30.0,
)
```

| Parameter | Default | Description |
|---|---|---|
| `workspace` | required | Working directory for every command |
| `allowed_commands` | `None` | Executable allowlist — `None` permits everything |
| `timeout` | `30.0` | Per-command wall-clock limit in seconds |

**Exposed tool:** `shell_run`

---

### `BrowserTools`

Playwright-backed browser automation. Requires `gantrygraph[browser]`.

```python
from gantrygraph.actions import BrowserTools
from gantrygraph.perception import WebPage

web = WebPage(url="https://example.com")
tools = BrowserTools(web_page=web)   # share the same browser tab as WebPage
```

| Parameter | Default | Description |
|---|---|---|
| `browser_type` | `"chromium"` | `"chromium"` / `"firefox"` / `"webkit"` |
| `headless` | `True` | Set `False` to watch the browser during development |
| `stealth` | `True` | Patch `navigator.webdriver`, set realistic UA, add human-like delays |
| `web_page` | `None` | Share a `WebPage` browser instance (recommended) |

**Exposed tools**

| Tool | What it does |
|---|---|
| `browser_navigate` | Open a URL |
| `browser_click` | Click a CSS or XPath selector |
| `browser_click_text` | Click any button/link by its exact visible text — more robust than CSS selectors on dynamic pages and consent banners |
| `browser_fill` | Type text into an input field |
| `browser_get_text` | Return visible text of an element or the whole page |
| `browser_get_url` | Return the current URL |
| `browser_scroll` | Scroll the page: `"down"` / `"up"` / `"top"` / `"bottom"` |
| `browser_evaluate` | Execute a JavaScript expression and return the result |
| `browser_wait_for_selector` | Wait until a CSS/XPath selector becomes visible |

---

### `WebSearchTool`

Search the web via Tavily API — no browser needed, no CAPTCHA. Requires `gantrygraph[search]`.

```python
from gantrygraph.actions.search import WebSearchTool
import os

tools = WebSearchTool(api_key=os.environ["TAVILY_API_KEY"])
```

Get a free key (1 000 queries/month) at [tavily.com](https://tavily.com). Results include title, URL, snippet, and an optional AI-generated summary. Web-agnostic — aggregates results across the whole web.

| Parameter | Default | Description |
|---|---|---|
| `api_key` | `$TAVILY_API_KEY` | Falls back to the env var if not passed |
| `max_results` | `5` | Number of results per query |
| `search_depth` | `"basic"` | `"advanced"` is slower but more thorough |

**Exposed tool:** `web_search(query, max_results?)`

---

### `MouseKeyboardTools`

Control mouse and keyboard via PyAutoGUI. Requires `gantrygraph[desktop]`.

```python
from gantrygraph.actions.mouse_keyboard import MouseKeyboardTools
tools = MouseKeyboardTools()
```

**Exposed tools:** `mouse_move`, `mouse_click`, `mouse_double_click`, `mouse_drag`, `keyboard_type`, `keyboard_hotkey`, `screenshot`

---

### `BaseAction`

Abstract base class for custom tool groups.

```python
from gantrygraph.core.base_action import BaseAction
from langchain_core.tools import BaseTool

class MyTools(BaseAction):
    def get_tools(self) -> list[BaseTool]:
        return [my_tool_a, my_tool_b]
```

| Method | Description |
|---|---|
| `get_tools() → list[BaseTool]` | Return all tools this action group exposes |
| `async close()` | Release resources (browser, connections) — called automatically by the engine |

---

## Perception

### `WebPage`

Render a URL via Playwright and capture a screenshot and accessibility tree each loop step. Requires `gantrygraph[browser]`.

```python
from gantrygraph.perception import WebPage

web = WebPage(url="https://example.com", headless=True)
```

| Parameter | Default | Description |
|---|---|---|
| `url` | `None` | Starting URL — navigate here on launch |
| `browser_type` | `"chromium"` | `"chromium"` / `"firefox"` / `"webkit"` |
| `headless` | `True` | Set `False` to watch the browser |
| `stealth` | `True` | Anti-bot-detection patches |
| `include_screenshot` | `True` | Include PNG screenshot in each observation |
| `include_accessibility` | `True` | Include accessibility tree in each observation |
| `vision_mode` | `"high"` | `"high"` = full viewport; `"low"` = downscale to 1280×720 before encoding, cutting vision token cost |

`page` property gives direct access to the Playwright `Page` object for advanced use.

---

### `DesktopScreen`

Capture the primary monitor as a PNG screenshot. Requires `gantrygraph[desktop]`.

```python
from gantrygraph.perception import DesktopScreen

screen = DesktopScreen(max_resolution=(1280, 720))
```

| Parameter | Default | Description |
|---|---|---|
| `max_resolution` | `(1920, 1080)` | Cap resolution before encoding |
| `monitor` | `1` | Monitor index (1 = primary) |
| `png_quality` | `85` | PNG compression level |
| `vision_mode` | `"high"` | `"high"` = use *max_resolution* as-is; `"low"` = cap at 1280×720, reducing vision token cost |

---

### `MultiPerception`

Combine multiple perception sources into one observation.

```python
from gantrygraph.perception import MultiPerception, DesktopScreen, WebPage

perception = MultiPerception(
    sources=[DesktopScreen(), WebPage(url="https://example.com")],
)
```

Screenshots are merged (first non-null wins); accessibility trees are concatenated with source labels.

---

### `BasePerception`

Abstract base class for custom perception sources.

```python
from gantrygraph.core.base_perception import BasePerception
from gantrygraph.core.events import PerceptionResult

class MyPerception(BasePerception):
    async def observe(self) -> PerceptionResult:
        return PerceptionResult(accessibility_tree="...")
```

---

### `PerceptionResult`

Pydantic model returned by every `observe()` call.

| Field | Type | Description |
|---|---|---|
| `screenshot_b64` | `str \| None` | Base64-encoded PNG |
| `accessibility_tree` | `str \| None` | JSON accessibility snapshot |
| `url` | `str \| None` | Current page URL (browser perception only) |
| `width` | `int` | Viewport / screen width in pixels |
| `height` | `int` | Viewport / screen height in pixels |

---

## Memory

### `InMemoryStore`

In-process vector memory. Fast, zero-dependency, no persistence between runs.

```python
from gantrygraph.memory import InMemoryStore

memory = InMemoryStore()
agent = GantryEngine(llm=..., memory=memory)
```

---

### `ChromaMemory`

Persistent semantic memory backed by ChromaDB. Requires `gantrygraph[memory]`.

```python
from gantrygraph.memory import ChromaMemory

memory = ChromaMemory(
    persist_directory="/data/agent-memory",
    collection="my_agent",
)
```

| Parameter | Default | Description |
|---|---|---|
| `persist_directory` | `None` | On-disk path — `None` uses an in-memory ChromaDB |
| `collection` | `"gantry_memory"` | ChromaDB collection name |

---

### `BaseMemory`

Abstract base class for custom memory backends.

| Method | Description |
|---|---|
| `async add(text, metadata?)` | Store a new memory entry |
| `async search(query, k=5) → list[MemoryResult]` | Return the `k` most relevant entries |
| `async close()` | Release resources |

---

## MCP Integration

### `MCPClient`

Connect to any MCP server subprocess and expose its tools as LangChain tools.

```python
from gantrygraph.mcp import MCPClient

agent = GantryEngine(
    llm=...,
    tools=[MCPClient("npx -y @modelcontextprotocol/server-filesystem /tmp")],
)
```

Use as an async context manager for standalone use; `GantryEngine` manages the lifecycle automatically.

---

### `MCPToolRegistry`

Aggregate tools from multiple `MCPClient` instances into one flat list.

```python
from gantrygraph.mcp import MCPToolRegistry, MCPClient

registry = MCPToolRegistry([
    MCPClient("npx -y @modelcontextprotocol/server-filesystem /tmp"),
    MCPClient("npx -y @modelcontextprotocol/server-github"),
])
```

---

### `BaseMCPConnector`

Abstract base class for custom MCP connectors. Implement `get_tools()` and the async context manager protocol (`__aenter__` / `__aexit__`).

---

## Security

### `GuardrailPolicy`

Define which tool names require `approval_callback` confirmation before executing.

```python
from gantrygraph.security import GuardrailPolicy

guardrail = GuardrailPolicy(requires_approval={"shell_run", "file_delete"})
agent = GantryEngine(llm=..., guardrail=guardrail, approval_callback=my_callback)
```

---

### `BudgetPolicy`

Hard limits on step count, wall-clock time, and token usage.

```python
from gantrygraph.security import BudgetPolicy

# Hard stop at 10 000 tokens
budget = BudgetPolicy(max_steps=20, max_tokens=10_000)
agent = GantryEngine(llm=..., budget=budget)

# Warn but continue (useful for monitoring without blocking)
budget = BudgetPolicy(max_tokens=50_000, on_limit="warn")
```

| Parameter | Default | Description |
|---|---|---|
| `max_steps` | `50` | Caps `GantryEngine.max_steps` |
| `max_wall_seconds` | `None` | Wall-clock timeout — raises `TimeoutError` if exceeded |
| `max_tokens` | `None` | Cumulative token cap tracked via `AIMessage.usage_metadata` |
| `on_limit` | `"stop"` | `"stop"` raises `BudgetExceededError` when `max_tokens` is hit; `"warn"` logs and continues |

**`BudgetExceededError`** — raised by `arun()` when `max_tokens` is exceeded and `on_limit="stop"`.

---

### `WorkspacePolicy`

Restrict the agent to one or more directories. Automatically wires `FileSystemTools` + `ShellTools`.

```python
from gantrygraph.security import WorkspacePolicy

# Single directory
WorkspacePolicy.restricted("/tmp/sandbox")

# Multiple directories
WorkspacePolicy.multi_path(["/data/input", "/data/output"])

# No restriction (trusted environments only)
WorkspacePolicy.full_access()

# Backward-compatible
WorkspacePolicy(workspace_path="/tmp/sandbox")
```

| Field | Default | Description |
|---|---|---|
| `allowed_paths` | `[]` | List of allowed directories |
| `unrestricted` | `False` | Skip all path validation |
| `workspace_path` | `None` | Deprecated — use `restricted()` or `allowed_paths` |

---

## Multi-Agent Swarm

### `GantrySupervisor`

Decompose a task into subtasks, dispatch to worker agents in parallel, synthesise the result.

```python
from gantrygraph.swarm import GantrySupervisor

supervisor = GantrySupervisor(
    llm=my_llm,
    worker_factory=lambda: GantryEngine(llm=my_llm, tools=[...]),
    max_workers=4,
)
result = supervisor.run("Analyse Q1–Q4 reports and produce an annual summary.")
```

| Parameter | Default | Description |
|---|---|---|
| `llm` | required | LLM used for task decomposition and synthesis |
| `worker_factory` | `None` | Callable that returns a fresh `GantryEngine` for each subtask |
| `workers` | `None` | List of `WorkerSpec` for heterogeneous swarms (alternative to `worker_factory`) |
| `max_workers` | `5` | Maximum parallel workers |

**Methods:** `run(task) → str`, `await arun(task) → str`

---

### `WorkerSpec`

Describes a named specialist worker for a heterogeneous swarm.

```python
from gantrygraph.swarm import WorkerSpec

specs = [
    WorkerSpec(name="researcher", description="Searches and summarises web content", engine=researcher_agent),
    WorkerSpec(name="writer",     description="Writes polished markdown reports",    engine=writer_agent),
]
supervisor = GantrySupervisor(llm=my_llm, workers=specs)
```

---

### `AgentWorker`

Thin wrapper that runs a `GantryEngine` as a named worker and returns a `WorkerResult`.

| Field | Description |
|---|---|
| `WorkerResult.output` | Final answer string |
| `WorkerResult.success` | `True` if the run completed without an exception |
| `WorkerResult.metadata` | Dict with `task`, `worker_name`, and elapsed time |

---

## Telemetry

### `OTelExporter`

Export traces to any OTLP endpoint (Grafana Alloy, Datadog, Jaeger, Zipkin, …). Requires `gantrygraph[telemetry]`.

```python
from gantrygraph.telemetry import OTelExporter

exporter = OTelExporter(
    endpoint="http://localhost:4317",
    service_name="my-agent",
)
agent = GantryEngine(llm=..., on_event=exporter.as_event_callback())
```

`force_flush()` — flush all pending spans before process exit.

---

## State & Events

### `GantryState`

LangGraph `TypedDict` — the full state dict passed between nodes in the agent loop. You only need this when building a custom graph with `get_graph()` or raw `build_graph()`.

| Field | Type | Description |
|---|---|---|
| `task` | `str` | Original task string |
| `messages` | `list[AnyMessage]` | Full conversation history |
| `step_count` | `int` | Number of act-node executions so far |
| `is_done` | `bool` | Set to `True` by `review_node` to terminate the loop |
| `last_error` | `str \| None` | Most recent tool error message |
| `last_observation` | `Any` | Raw `PerceptionResult.model_dump()` from the last observe step |
| `consecutive_errors` | `int` | Back-to-back error count — triggers early termination when it reaches `max_consecutive_errors` |

---

### `GantryEvent`

Emitted to `on_event` after each node transition.

| Field | Type | Description |
|---|---|---|
| `event_type` | `str` | `"observe"` / `"think"` / `"act"` / `"done"` |
| `step` | `int` | Current `step_count` |
| `data` | `dict` | Type-specific payload (tool names, screenshot, etc.) |

---

## Graph Primitives

For custom agent topologies — inject your own nodes, checkpointers, or routing logic. See [The agent loop](concepts/engine.md#advanced-raw-graph-access) for a full example.

```python
from gantrygraph.engine import (
    observe_node, think_node, act_node,
    review_node, should_continue, build_graph,
)
```

| Function | Signature | Description |
|---|---|---|
| `observe_node` | `(state, *, perception, on_event)` | Capture environment and append as `HumanMessage` |
| `think_node` | `(state, *, bound_llm, on_event)` | Invoke the LLM and return next `AIMessage` |
| `act_node` | `(state, *, tool_map, approval_callback, guardrail, on_event, use_interrupt)` | Execute tool calls; errors become `ToolMessage(status="error")` |
| `review_node` | `(state)` | Set `is_done=True` if last message has no tool calls |
| `should_continue` | `(state, *, max_steps, max_consecutive_errors)` | Routing edge — returns `"observe"` or `END` |
| `build_graph` | `(*, perception, bound_llm, tool_map, …)` | Assemble and compile the full `StateGraph` |

All node functions are pure — bound to engine-level config via `functools.partial` — so they are testable in isolation.
