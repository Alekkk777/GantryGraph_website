# Run Agents in Parallel

> Decompose a complex task across multiple worker agents that run concurrently and synthesize a final answer.

## Step 1 — Same-agent swarm

```python
from gantrygraph import GantryEngine
from gantrygraph.swarm import GantrySupervisor
from gantrygraph.actions import FileSystemTools, ShellTools
from langchain_anthropic import ChatAnthropic

llm = ChatAnthropic(model="claude-sonnet-4-6")

def make_worker():
    return GantryEngine(
        llm=llm,
        tools=[
            FileSystemTools(workspace="/app"),
            ShellTools(workspace="/app", allowed_commands=["python", "pytest", "ruff"]),
        ],
        max_steps=20,
    )

supervisor = GantrySupervisor(
    llm=llm,
    worker_factory=make_worker,
    max_workers=4,
)

result = supervisor.run(
    "Run all tests, fix any failures, lint the codebase, and update CHANGELOG.md."
)
print(result)
```

The supervisor LLM decomposes the task into up to `max_workers` subtasks, runs one worker per subtask with `asyncio.gather`, and synthesizes a final answer. Each worker gets a fresh `GantryEngine` instance from the factory.

## Step 2 — Specialist swarm

```python
from gantrygraph import GantryEngine
from gantrygraph.swarm import GantrySupervisor, WorkerSpec
from gantrygraph.perception import WebPage
from gantrygraph.actions import BrowserTools, FileSystemTools
from gantrygraph.mcp import MCPClient
from langchain_anthropic import ChatAnthropic

llm = ChatAnthropic(model="claude-sonnet-4-6")

web = WebPage(url="https://google.com", headless=True)

supervisor = GantrySupervisor(
    llm=llm,
    workers=[
        WorkerSpec(
            name="researcher",
            engine=GantryEngine(
                llm=llm,
                perception=web,
                tools=[BrowserTools(web_page=web)],
                max_steps=15,
            ),
            description="Browses the web and retrieves up-to-date information.",
        ),
        WorkerSpec(
            name="coder",
            engine=GantryEngine(
                llm=llm,
                tools=[
                    FileSystemTools(workspace="/app"),
                    ShellTools(workspace="/app", allowed_commands=["python", "pytest"]),
                ],
                max_steps=20,
            ),
            description="Reads and edits source code, runs tests.",
        ),
        WorkerSpec(
            name="db_analyst",
            engine=GantryEngine(
                llm=llm,
                tools=[MCPClient("npx -y @modelcontextprotocol/server-postgres postgresql://localhost/mydb")],
                max_steps=10,
            ),
            description="Queries the production database for metrics.",
        ),
    ],
)

result = supervisor.run(
    "Research the latest OAuth 2.0 spec changes, update our auth module to comply, "
    "and pull last week's login failure stats from the database."
)
print(result)
```

When `workers=` is provided, the supervisor LLM reads each `WorkerSpec.description` and routes subtasks to the most appropriate specialist. Unrecognised assignments fall back to the first worker.

## Step 3 — Read results

```python
import asyncio

async def main():
    result = await supervisor.arun("Analyse these 10 documents and summarise findings.")
    # result is the synthesized final answer as a plain string
    print(result)

asyncio.run(main())
```

`GantrySupervisor.run()` (sync) and `.arun()` (async) both return the synthesized answer as a string. Individual worker outputs are merged by the supervisor LLM; they are not exposed separately in the public API.

---

## Complete example

```python
import asyncio
from gantrygraph import GantryEngine
from gantrygraph.swarm import GantrySupervisor, WorkerSpec
from gantrygraph.actions import FileSystemTools, ShellTools
from langchain_anthropic import ChatAnthropic

llm = ChatAnthropic(model="claude-sonnet-4-6")

supervisor = GantrySupervisor(
    llm=llm,
    workers=[
        WorkerSpec(
            name="shell_expert",
            engine=GantryEngine(
                llm=llm,
                tools=[ShellTools(workspace="/tmp", allowed_commands=["find", "du", "ls"])],
                max_steps=10,
            ),
            description="Runs shell commands and explores the filesystem.",
        ),
        WorkerSpec(
            name="file_editor",
            engine=GantryEngine(
                llm=llm,
                tools=[FileSystemTools(workspace="/tmp")],
                max_steps=10,
            ),
            description="Reads, writes, and edits files.",
        ),
    ],
)

result = asyncio.run(supervisor.arun(
    "Find all .log files in /tmp, read their first 10 lines, "
    "and write a combined summary to /tmp/log-summary.txt."
))
print(result)
```

---

## Variants

- **Cap parallel workers:** `GantrySupervisor(llm=llm, worker_factory=make_worker, max_workers=2)`
- **Async entry point:** `result = await supervisor.arun("task")`
- **Single specialist fallback:** if the supervisor cannot match a subtask to a named worker, it falls back to `workers[0]`

## Troubleshooting

**`ValueError: Provide either worker_factory= or workers=`** — pass one or the other, not both.

**Workers finish but the final answer is empty** — check that each worker's `GantryEngine` produces output; add `on_event=print` to a worker to inspect its execution.

**Subtasks are not well-decomposed** — use a more capable LLM for the supervisor (it only calls the LLM twice: decompose and synthesize) while workers can use a cheaper model.

---

**Next:** [Connect external services with MCP](mcp.md) · [Require human approval before actions](human-approval.md) · [Deploy as a REST API](cloud-deploy.md)
