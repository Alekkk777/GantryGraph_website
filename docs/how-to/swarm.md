# Run multiple agents

When a task is too complex for one agent — or can be split into
parallel workstreams — use `GantrySupervisor`.

The supervisor LLM decomposes your task into subtasks, dispatches each to
a worker agent, runs all workers in parallel, and synthesises a final answer.

## When to use a swarm

Use a swarm when:

- The task has **independent parts** that don't need to share state
  (e.g. "run tests AND update docs AND check security")
- You want **specialist agents** — one for web research, one for code, one for databases
- You want **speed** — parallel workers finish faster than sequential steps

## Homogeneous swarm — same agent, N copies

```python
from gantrygraph.swarm import GantrySupervisor
from gantrygraph import GantryEngine
from gantrygraph.actions import FileSystemTools, ShellTool
from langchain_anthropic import ChatAnthropic

llm = ChatAnthropic(model="claude-sonnet-4-6")

def make_worker():
    return GantryEngine(
        llm=llm,
        tools=[
            FileSystemTools(workspace="/app"),
            ShellTool(workspace="/app", allowed_commands=["python", "pytest", "ruff"]),
        ],
        max_steps=20,
    )

supervisor = GantrySupervisor(
    llm=llm,
    worker_factory=make_worker,
    n_workers=4,
)

result = await supervisor.arun(
    "Run all tests, fix any failures, lint the codebase, and update CHANGELOG.md."
)
print(result)
```

The supervisor splits the task into up to 4 subtasks and runs them at the same time.

## Heterogeneous swarm — specialist agents

When different parts of the task need different tools, define each worker separately:

```python
from gantrygraph.swarm import GantrySupervisor, WorkerSpec
from gantrygraph import GantryEngine
from gantrygraph.perception import WebPage
from gantrygraph.actions import BrowserTools, FileSystemTools
from gantrygraph.mcp import MCPClient
from langchain_anthropic import ChatAnthropic

llm = ChatAnthropic(model="claude-sonnet-4-6")

# Web researcher
web = WebPage(url="https://google.com", headless=True)
researcher = GantryEngine(
    llm=llm,
    perception=web,
    tools=[BrowserTools(web_page=web)],
    max_steps=15,
)

# Code worker
coder = GantryEngine(
    llm=llm,
    tools=[
        FileSystemTools(workspace="/app"),
        ShellTool(workspace="/app", allowed_commands=["python", "pytest"]),
    ],
    max_steps=20,
)

# Database worker
db_agent = GantryEngine(
    llm=llm,
    tools=[MCPClient("npx -y @modelcontextprotocol/server-postgres postgresql://...")],
    max_steps=10,
)

supervisor = GantrySupervisor(
    llm=llm,
    workers=[
        WorkerSpec(name="researcher", engine=researcher,
                   description="Browses the web and retrieves up-to-date information."),
        WorkerSpec(name="coder",      engine=coder,
                   description="Reads and edits source code, runs tests."),
        WorkerSpec(name="db_analyst", engine=db_agent,
                   description="Queries the production database for metrics."),
    ],
)

result = await supervisor.arun(
    "Research the latest OAuth 2.0 spec changes, update our auth module to comply, "
    "and pull last week's login failure stats from the database."
)
```

## Reading individual worker results

```python
supervisor_result = await supervisor.arun("...")

for worker_result in supervisor_result.results:
    print(f"[{worker_result.worker_name}] {worker_result.result}")
```

## Notes on concurrency

- Workers run with `asyncio.gather` — all in the same event loop
- Each worker has its own `GantryEngine` lifecycle (separate tool state)
- For CPU-intensive or very long-running workers, consider separate processes
