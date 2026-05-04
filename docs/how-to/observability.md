# Monitor Agent Execution

> Observe every step the agent takes — in-process callbacks, async streaming, and OpenTelemetry traces.

## Step 1 — Event callback

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

## Step 2 — Stream events asynchronously

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

## Step 3 — OpenTelemetry traces

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

# Both in-process logging and OTel traces, combined
exporter = OTelExporter(service_name="ci-agent", otlp_endpoint=None)  # stdout for dev

def on_event(event):
    logger.info(json.dumps({
        "event": event.event_type,
        "step": event.step,
        **event.data,
    }))
    # Also feed the OTel exporter
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
| `data` | `dict` | Step-specific payload |

## Variants

- **Stdout spans (dev mode):** `OTelExporter(service_name="agent", otlp_endpoint=None)`
- **Grafana Tempo / Jaeger:** `OTelExporter(otlp_endpoint="http://localhost:4317")`
- **Python `logging` module:** `on_event=lambda e: logger.info("%s step=%d", e.event_type, e.step)`
- **Filter to act events only:** `on_event=lambda e: print(e) if e.event_type == "act" else None`

## Troubleshooting

**`ImportError: OTelExporter requires opentelemetry`** — run `pip install 'gantrygraph[telemetry]'`.

**Spans are missing from the backend** — call `exporter.force_flush()` before process exit; `BatchSpanProcessor` buffers spans and may not flush automatically.

**`on_event` blocks the event loop** — use `async def on_event(event): ...` for any I/O inside the callback (database writes, HTTP requests, etc.).

---

**Next:** [Deploy as a REST API](cloud-deploy.md) · [Require human approval before actions](human-approval.md) · [Build custom tools](custom-tools.md)
