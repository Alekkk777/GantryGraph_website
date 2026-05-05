# Monitor Agent Execution

> Observe every step the agent takes — built-in shortcuts, in-process callbacks, async streaming, and OpenTelemetry traces.

## Step 1 — Built-in telemetry shortcuts

The fastest way to see what the agent is doing is the `telemetry=` shortcut on `GantryEngine`:

```python
from gantrygraph import GantryEngine
from langchain_anthropic import ChatAnthropic

# Pretty-print every event to stdout
agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    telemetry="stdout",
    max_steps=20,
)
agent.run("List the 5 largest files in /tmp")
# [gantry step=00] OBSERVE    {'width': 0, 'height': 0, 'screenshot_cached': False}
# [gantry step=00] THINK      {'tool_calls': ['shell_run']}
# ...
```

| Value | Effect |
|---|---|
| `"stdout"` | Pretty-prints each `GantryEvent` to stdout during the run |
| `"langsmith"` | Sets `LANGCHAIN_TRACING_V2=true` — traces appear in your LangSmith dashboard |
| `"silent"` | Suppresses all `gantrygraph.*` log output |

`telemetry=` and `on_event=` are composable — if you pass both, both fire on every event.

## Step 2 — Custom event callback

```python
from gantrygraph import GantryEngine
from langchain_anthropic import ChatAnthropic

def log(event):
    print(f"[{event.event_type}] step={event.step}  {event.data}")

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    on_event=log,
    max_steps=30,
)

agent.run("Summarise the last 10 commits in this repo.")
```

`on_event` fires after every phase of the loop in order: `observe → think → act → review → done`. Both sync and async callbacks are supported — use `async def log(event): ...` for non-blocking I/O.

## Step 3 — Stream events asynchronously

```python
import asyncio
from gantrygraph import GantryEngine
from langchain_anthropic import ChatAnthropic

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    max_steps=20,
)

async def main():
    async for event in agent.astream_events("List the 5 largest files in /tmp"):
        print(event.event_type, event.step, event.data)

asyncio.run(main())
```

`astream_events()` is an async generator — yield each event as it is emitted rather than waiting for the full run to finish.

## Step 4 — OpenTelemetry traces

```bash
pip install 'gantrygraph[telemetry]'
```

```python
from gantrygraph import GantryEngine
from gantrygraph.telemetry import OTelExporter
from langchain_anthropic import ChatAnthropic

exporter = OTelExporter(
    service_name="my-agent",
    otlp_endpoint="http://localhost:4317",  # Grafana Alloy, Jaeger, Datadog, etc.
)

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    on_event=exporter.as_event_callback(),
    max_steps=30,
)

agent.run("Run the test suite.")
exporter.force_flush()  # flush before process exit
```

`OTelExporter` creates one root span `gantrygraph.task` per run and one child span `gantrygraph.tool.<name>` per tool execution. Pass `otlp_endpoint=None` to print spans to stdout during development.

---

## Complete example

```python
import asyncio
import json
import logging
from gantrygraph import GantryEngine
from gantrygraph.telemetry import OTelExporter
from gantrygraph.actions import FileSystemTools, ShellTools
from langchain_anthropic import ChatAnthropic

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("agent")

exporter = OTelExporter(service_name="ci-agent", otlp_endpoint=None)  # stdout for dev

def on_event(event):
    logger.info(json.dumps({
        "event": event.event_type,
        "step": event.step,
        **{k: v for k, v in event.data.items() if k != "screenshot_b64"},
    }))
    exporter.as_event_callback()(event)

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    tools=[
        FileSystemTools(workspace="/app"),
        ShellTools(workspace="/app", allowed_commands=["pytest", "ruff"]),
    ],
    on_event=on_event,
    max_steps=25,
)

result = asyncio.run(agent.arun("Run all tests and lint the code."))
print(result)
exporter.force_flush()
```

---

## GantryEvent reference

| Field | Type | Contents |
|---|---|---|
| `event_type` | `str` | `observe`, `think`, `act`, `review`, `error`, `done` |
| `step` | `int` | Current loop iteration (0-indexed) |
| `data` | `dict` | Step-specific payload — `screenshot_cached` in observe events indicates diffing saved a round-trip |

## Variants

- **Stdout (dev):** `telemetry="stdout"` — zero config, human-readable
- **LangSmith:** `telemetry="langsmith"` — set `LANGSMITH_API_KEY` env var first
- **Silent prod:** `telemetry="silent"` — suppresses all framework log output
- **Stdout OTel spans:** `OTelExporter(service_name="agent", otlp_endpoint=None)`
- **Grafana Tempo / Jaeger:** `OTelExporter(otlp_endpoint="http://localhost:4317")`
- **Filter to act events only:** `on_event=lambda e: print(e) if e.event_type == "act" else None`

## Troubleshooting

**`ImportError: OTelExporter requires opentelemetry`** — run `pip install 'gantrygraph[telemetry]'`.

**Spans are missing from the backend** — call `exporter.force_flush()` before process exit; `BatchSpanProcessor` buffers spans and may not flush automatically.

**`on_event` blocks the event loop** — use `async def on_event(event): ...` for any I/O inside the callback (database writes, HTTP requests, etc.).

---

**Next:** [Deploy as a REST API](cloud-deploy.md) · [Require human approval before actions](human-approval.md) · [Build custom tools](custom-tools.md)
