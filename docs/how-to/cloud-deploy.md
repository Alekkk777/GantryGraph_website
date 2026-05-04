# Deploy as a REST API

> Wrap any agent in a production HTTP server with a single function call.

## Prerequisites

```bash
pip install 'gantrygraph[cloud]'
```

## Step 1 — Minimal server

```python
# server.py
from gantrygraph import GantryEngine
from gantrygraph.actions import FileSystemTools, ShellTools
from gantrygraph.cloud import serve
from langchain_anthropic import ChatAnthropic

def make_agent() -> GantryEngine:
    return GantryEngine(
        llm=ChatAnthropic(model="claude-sonnet-4-6"),
        tools=[
            FileSystemTools(workspace="/workspace"),
            ShellTools(workspace="/workspace", allowed_commands=["python", "pytest"]),
        ],
        max_steps=30,
    )

serve(make_agent, host="0.0.0.0", port=8080)
```

```bash
python server.py
```

`serve()` calls `make_agent()` once per `POST /run` request, so each job gets a fresh, isolated engine instance. The server exposes five endpoints: `POST /run`, `GET /status/{job_id}`, `GET /stream/{job_id}`, `POST /resume/{job_id}`, and `GET /health`.

## Step 2 — Call with curl

```bash
# Submit a task
curl -X POST http://localhost:8080/run \
  -H "Content-Type: application/json" \
  -d '{"task": "Run the test suite and return a pass/fail summary"}'
```

```json
{"job_id": "abc123", "status": "queued"}
```

```bash
# Poll for the result
curl http://localhost:8080/status/abc123
```

```json
{"job_id": "abc123", "status": "completed", "result": "All 47 tests passed."}
```

```bash
# Stream live events via Server-Sent Events
curl -N http://localhost:8080/stream/abc123
```

Possible `status` values: `queued`, `running`, `suspended`, `completed`, `failed`.

## Step 3 — Docker

```dockerfile
# Use the built-in template as a starting point
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY server.py .
CMD ["python", "server.py"]
```

```bash
docker build -t my-agent .
docker run -p 8080:8080 \
  -e ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" \
  -v "$(pwd)/workspace:/workspace" \
  my-agent
```

For desktop automation in containers, add `xvfb` and set `DISPLAY=:99` in the Dockerfile.

---

## Complete example

```python
# server.py — with human-approval suspend/resume support
from gantrygraph import GantryEngine
from gantrygraph.actions import FileSystemTools, ShellTools
from gantrygraph.security import GuardrailPolicy, BudgetPolicy
from gantrygraph.cloud import serve
from langchain_anthropic import ChatAnthropic

def make_agent() -> GantryEngine:
    return GantryEngine(
        llm=ChatAnthropic(model="claude-sonnet-4-6"),
        tools=[
            FileSystemTools(workspace="/workspace"),
            ShellTools(workspace="/workspace", allowed_commands=["python", "pytest", "git"]),
        ],
        guardrail=GuardrailPolicy(requires_approval={"shell_run", "file_delete"}),
        enable_suspension=True,  # enables POST /resume/{job_id}
        budget=BudgetPolicy(max_steps=30, max_wall_seconds=120.0),
        max_steps=30,
    )

serve(make_agent, host="0.0.0.0", port=8080)
```

```bash
# Approve a suspended tool call
curl -X POST http://localhost:8080/resume/abc123 \
  -H "Content-Type: application/json" \
  -d '{"approved": true}'
```

---

## Variants

- **Custom host/port:** `serve(make_agent, host="127.0.0.1", port=9000)`
- **Async agent entry:** use `arun()` inside `make_agent` — `serve()` handles the event loop
- **Browser agent server:** swap tools for `BrowserTools` and add `pip install 'gantrygraph[browser]'` to your Dockerfile
- **Suspend/resume disabled (default):** omit `enable_suspension=True`; the agent will not support `POST /resume`

## Troubleshooting

**`ImportError: serve() requires the [cloud] extra`** — run `pip install 'gantrygraph[cloud]'`.

**`POST /resume` returns 409 Conflict** — the job is not in `"suspended"` status. Only jobs created with `enable_suspension=True` can be resumed; check `GET /status/{job_id}` first.

**`GET /stream` returns 410 Gone** — the job finished before the SSE client connected. Poll `GET /status/{job_id}` for the result instead.

---

**Next:** [Require human approval before actions](human-approval.md) · [Monitor agent execution](observability.md) · [Run agents in parallel](swarm.md)
