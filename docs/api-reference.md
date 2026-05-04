# API Reference

<div class="gg-api-section" markdown>

## Engine

### `GantryEngine`

The main entry point. Manages the observe → think → act → review loop.

::: gantrygraph.engine.engine.GantryEngine

---

### `GantryConfig`

Declarative configuration — build an engine from a YAML file, env vars, or a dict.

::: gantrygraph.config.GantryConfig

---

### `AgentSuspended`

Raised by `arun()` when the agent hits a guarded tool and `enable_suspension=True`.

::: gantrygraph.engine.engine.AgentSuspended

</div>

---

<div class="gg-api-section" markdown>

## Tools & Actions

### `@gantry_tool`

Decorator that turns any `def` or `async def` into an LLM-callable tool.

::: gantrygraph.tool.gantry_tool

---

### `FileSystemTools`

Sandbox-safe file read / write / list / delete, locked to a workspace directory.

::: gantrygraph.actions.filesystem.FileSystemTools

---

### `ShellTools`

Run shell commands via `asyncio` subprocess with optional allowlist and timeout.

::: gantrygraph.actions.shell.ShellTools

---

### `MouseKeyboardTools`

Control the mouse and keyboard via PyAutoGUI. Requires `gantrygraph[desktop]`.

::: gantrygraph.actions.mouse_keyboard.MouseKeyboardTools

---

### `BrowserTools`

Playwright-backed browser automation. Requires `gantrygraph[browser]`.

::: gantrygraph.actions.browser.BrowserTools

---

### `BaseAction`

Abstract base class for custom tool groups.

::: gantrygraph.core.base_action.BaseAction

</div>

---

<div class="gg-api-section" markdown>

## Perception

### `DesktopScreen`

Capture the primary monitor as a PNG screenshot each loop iteration.

::: gantrygraph.perception.desktop.DesktopScreen

---

### `WebPage`

Render a URL via Playwright and capture both screenshot and accessibility tree.

::: gantrygraph.perception.web.WebPage

---

### `MultiPerception`

Combine multiple perception sources. Screenshots are merged; trees are concatenated.

::: gantrygraph.perception.multi.MultiPerception

---

### `BasePerception`

Abstract base class for custom perception sources.

::: gantrygraph.core.base_perception.BasePerception

---

### `PerceptionResult`

Pydantic model returned by every `observe()` call.

::: gantrygraph.core.events.PerceptionResult

</div>

---

<div class="gg-api-section" markdown>

## Memory

### `InMemoryStore`

In-process vector memory. Fast, zero-dependency, resets between runs.

::: gantrygraph.memory.in_memory.InMemoryStore

---

### `ChromaMemory`

Persistent semantic memory backed by ChromaDB. Requires `gantrygraph[memory]`.

::: gantrygraph.memory.chroma.ChromaMemory

---

### `BaseMemory`

Abstract base class for custom memory backends.

::: gantrygraph.memory.base.BaseMemory

</div>

---

<div class="gg-api-section" markdown>

## MCP Integration

### `MCPClient`

Connect to any MCP server subprocess and expose its tools as LangChain tools.

::: gantrygraph.mcp.client.MCPClient

---

### `MCPToolRegistry`

Aggregate tools from multiple `MCPClient` instances into one flat list.

::: gantrygraph.mcp.registry.MCPToolRegistry

---

### `BaseMCPConnector`

Abstract base class for custom MCP connectors.

::: gantrygraph.core.base_mcp.BaseMCPConnector

</div>

---

<div class="gg-api-section" markdown>

## Security

### `GuardrailPolicy`

Define which tool names require `approval_callback` confirmation before executing.

::: gantrygraph.security.policies.GuardrailPolicy

---

### `BudgetPolicy`

Hard limits on step count and wall-clock time for a single `arun()` call.

::: gantrygraph.security.policies.BudgetPolicy

---

### `WorkspacePolicy`

Restrict the agent to a directory. Automatically wires `FileSystemTools` + `ShellTools`.

::: gantrygraph.security.policies.WorkspacePolicy

</div>

---

<div class="gg-api-section" markdown>

## Multi-Agent Swarm

### `GantrySupervisor`

Decompose a task into subtasks, dispatch to worker agents in parallel, synthesise the result.

::: gantrygraph.swarm.supervisor.GantrySupervisor

---

### `WorkerSpec`

Describes a named specialist worker for a heterogeneous swarm.

::: gantrygraph.swarm.worker.WorkerSpec

---

### `AgentWorker`

Thin wrapper that runs a `GantryEngine` as a named worker and returns a `WorkerResult`.

::: gantrygraph.swarm.worker.AgentWorker

</div>

---

<div class="gg-api-section" markdown>

## Telemetry

### `OTelExporter`

Export traces to any OTLP endpoint (Grafana Alloy, Datadog, Jaeger, etc.).

::: gantrygraph.telemetry.otel.OTelExporter

</div>

---

<div class="gg-api-section" markdown>

## State & Events

### `GantryState`

LangGraph `TypedDict` — the full state passed between nodes in the agent loop.

::: gantrygraph.core.state.GantryState

---

### `GantryEvent`

Dataclass emitted to `on_event` on every loop step.

::: gantrygraph.core.events.GantryEvent

</div>

---

<div class="gg-api-section" markdown>

## Graph Primitives

For custom agent topologies — inject your own nodes, checkpointers, or routing logic.
See [The agent loop](concepts/engine.md#advanced-raw-graph-access) for an example.

::: gantrygraph.engine.nodes.observe_node
::: gantrygraph.engine.nodes.think_node
::: gantrygraph.engine.nodes.act_node
::: gantrygraph.engine.nodes.review_node
::: gantrygraph.engine.nodes.should_continue
::: gantrygraph.engine.graph.build_graph

</div>
