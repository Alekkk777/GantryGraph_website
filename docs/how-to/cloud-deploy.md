# Deploy as a REST API

This guide shows you how to wrap your agent in a production-ready
HTTP server so it can be called from any language or service.

`gantrygraph.cloud.serve()` creates a FastAPI application with:

- `POST /run` — submit a task, get a `job_id` back
- `GET /status/{job_id}` — poll for the result
- `GET /stream/{job_id}` — stream live events via SSE
- `POST /resume/{job_id}` — approve or deny a suspended tool call
- `GET /health` — health check

## Prerequisites

```bash
pip install 'gantrygraph[cloud]'
```

## A minimal server

```python
# server.py
from gantrygraph import GantryEngine
from gantrygraph.actions import FileSystemTools, ShellTool
from gantrygraph.cloud import serve
from langchain_anthropic import ChatAnthropic

def make_agent() -> GantryEngine:
    """Called once per job — create a fresh engine for each request."""
    return GantryEngine(
        llm=ChatAnthropic(model="claude-sonnet-4-6"),
        tools=[
            FileSystemTools(workspace="/workspace"),
            ShellTool(workspace="/workspace", allowed_commands=["python", "pytest"]),
        ],
        max_steps=30,
    )

serve(make_agent, host="0.0.0.0", port=8080)
```

```bash
python server.py
# Serving on http://0.0.0.0:8080
```

## Call the API

### Submit a task

```bash
curl -X POST http://localhost:8080/run \
  -H "Content-Type: application/json" \
  -d '{"task": "Run the test suite and return a pass/fail summary"}'
```

```json
{"job_id": "abc123", "status": "queued"}
```

### Poll for the result

```bash
curl http://localhost:8080/status/abc123
```

```json
{"job_id": "abc123", "status": "completed", "result": "All 47 tests passed."}
```

Possible status values: `queued`, `running`, `suspended`, `completed`, `failed`.

### Stream events in real time

```bash
curl -N http://localhost:8080/stream/abc123
```

```
data: {"type": "observe", "step": 0, "data": {}}
data: {"type": "think",   "step": 0, "data": {"tool_calls": ["shell_run"]}}
data: {"type": "act",     "step": 0, "data": {"tool": "shell_run", "result": "..."}}
event: done
data: {}
```

### Resume a suspended job

When the agent is waiting for human approval:

```bash
curl -X POST http://localhost:8080/resume/abc123 \
  -H "Content-Type: application/json" \
  -d '{"approved": true}'
```

## Configure via environment variables

```python
from gantrygraph import GantryConfig
from gantrygraph.cloud import serve
from langchain_anthropic import ChatAnthropic

def make_agent():
    cfg = GantryConfig.from_env()
    return cfg.build(llm=ChatAnthropic(model="claude-sonnet-4-6"))

serve(make_agent)
```

```bash
export GANTRY_WORKSPACE=/workspace
export GANTRY_MAX_STEPS=30
export GANTRY_MAX_WALL_SECONDS=120
python server.py
```

## Docker

The included Dockerfile installs Xvfb so GUI automation works in headless Linux containers:

```bash
# Copy the template Dockerfile into your project
python -c "
import gantrygraph, os, shutil
tpl = os.path.join(os.path.dirname(gantrygraph.__file__), 'cloud', 'templates', 'Dockerfile')
shutil.copy(tpl, 'Dockerfile')
"

docker build -t my-agent .
docker run -p 8080:8080 -v $(pwd)/workspace:/workspace my-agent
```

## Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gantry-agent
spec:
  replicas: 3
  selector:
    matchLabels:
      app: gantry-agent
  template:
    metadata:
      labels:
        app: gantry-agent
    spec:
      containers:
      - name: agent
        image: my-agent:latest
        ports:
        - containerPort: 8080
        env:
        - name: ANTHROPIC_API_KEY
          valueFrom:
            secretKeyRef:
              name: anthropic-secret
              key: api-key
        - name: GANTRY_WORKSPACE
          value: /workspace
        - name: GANTRY_MAX_STEPS
          value: "30"
```
