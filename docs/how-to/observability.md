# Watch what the agent does

Two mechanisms let you observe the agent in real time: event callbacks for
in-process logging, and OpenTelemetry traces for distributed systems.

## Get a callback on every step

Pass `on_event` to receive a `GantryEvent` after each phase of the loop:

```python
from gantrygraph import GantryEngine
from langchain_anthropic import ChatAnthropic

def log(event):
    print(f"[{event.event_type}] step={event.step}  {event.data}")

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    tools=[...],
    on_event=log,
    max_steps=30,
)

agent.run("Summarise the last 10 commits in this repo.")
```

Events fire in order: `observe → think → act → review → done`.
Each `GantryEvent` carries:

| Field        | Type                              | Contents                                   |
|--------------|-----------------------------------|--------------------------------------------|
| `event_type` | `str`                             | `observe`, `think`, `act`, `review`, `error`, `done` |
| `step`       | `int`                             | Current loop iteration (1-indexed)         |
| `data`       | `dict`                            | Step-specific payload (see below)          |

### What `data` contains per event type

| `event_type` | Key fields in `data`                                          |
|--------------|---------------------------------------------------------------|
| `observe`    | `screenshot` (bool), `tree_length` (int)                     |
| `think`      | `tool_calls` (list of `{name, args}`)                        |
| `act`        | `tool_name`, `args`, `result`, `approved` (bool or `None`)   |
| `review`     | `is_done` (bool)                                             |
| `error`      | `tool_name`, `error` (str)                                   |
| `done`       | `result` (str), `steps` (int)                                |

## Stream events asynchronously

In async code, use `astream_events` to consume events as an async iterator
instead of a callback:

```python
async for event in agent.astream_events("List the 5 largest files in /tmp"):
    print(event.event_type, event.step, event.data)
```

## Export traces to Grafana / Datadog / Jaeger

`OTelExporter` sends structured spans to any OTLP-compatible backend.
Each agent run becomes a root span; each loop step is a child span.

```python
pip install 'gantrygraph[telemetry]'
```

```python
from gantrygraph import GantryEngine
from gantrygraph.telemetry import OTelExporter
from langchain_anthropic import ChatAnthropic

exporter = OTelExporter(
    endpoint="http://localhost:4317",   # your OTLP collector
    service_name="my-agent",
)

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    tools=[...],
    telemetry=exporter,
    max_steps=30,
)
```

Traces include: total wall time, token counts, step durations, tool names,
error messages, and the final result.

## Log to the standard library

`on_event` can also feed Python's standard `logging` module:

```python
import logging, json

logger = logging.getLogger("my_agent")

def log(event):
    logger.info(json.dumps({"event": event.event_type, "step": event.step, **event.data}))

agent = GantryEngine(llm=..., on_event=log)
```

## Combine callback + traces

Both mechanisms work independently — you can use them together:

```python
agent = GantryEngine(
    llm=...,
    on_event=log,
    telemetry=OTelExporter(endpoint="http://otel-collector:4317"),
)
```
