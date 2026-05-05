# Connect External Services with MCP

> Give your agent tools from any MCP server — GitHub, Notion, Postgres, and more — without writing integration code.

## Step 1 — Connect a single server

```python
from gantrygraph import GantryEngine
from gantrygraph.mcp import MCPClient
from langchain_anthropic import ChatAnthropic

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    tools=[
        MCPClient("npx -y @modelcontextprotocol/server-filesystem /workspace"),
    ],
    max_steps=20,
)

result = agent.run("List every file modified today and show the 3 largest.")
print(result)
```

`MCPClient` launches the server subprocess, discovers its tools automatically, and terminates the process when the run ends — even on errors. `GantryEngine` manages the full lifecycle.

## Step 2 — Connect multiple servers

```python
from gantrygraph import GantryEngine
from gantrygraph.mcp import MCPClient, MCPToolRegistry
from langchain_anthropic import ChatAnthropic

registry = MCPToolRegistry([
    MCPClient("npx -y @modelcontextprotocol/server-filesystem /workspace"),
    MCPClient("npx -y @modelcontextprotocol/server-github"),
    MCPClient("npx -y @modelcontextprotocol/server-postgres postgresql://localhost/mydb"),
])

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    tools=[registry],
    max_steps=30,
)

result = agent.run(
    "Find all open PRs tagged 'bug', check which ones have failing tests in "
    "the database, and write a report to /workspace/report.md."
)
print(result)
```

`MCPToolRegistry` opens all clients concurrently and presents their tools as a single flat list. Pass the registry as one item in `tools=`.

## Step 3 — Mix MCP tools with custom tools

```python
from gantrygraph import GantryEngine, gantry_tool
from gantrygraph.mcp import MCPClient
from gantrygraph.actions import FileSystemTools
from langchain_anthropic import ChatAnthropic

@gantry_tool
async def notify_slack(message: str) -> str:
    """Post an urgent notification to the #alerts Slack channel."""
    await slack_client.post("#alerts", message)
    return "posted"

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    tools=[
        MCPClient("npx -y @modelcontextprotocol/server-github"),
        FileSystemTools(workspace="/workspace"),
        notify_slack,
    ],
    max_steps=20,
)
```

`BaseAction` instances, `@gantry_tool` functions, and `MCPClient` connectors all go in the same `tools=` list and are flattened into one registry.

---

## Complete example

```python
import asyncio
from gantrygraph import GantryEngine
from gantrygraph.mcp import MCPClient, MCPToolRegistry
from gantrygraph.memory import InMemoryStore
from langchain_anthropic import ChatAnthropic

llm = ChatAnthropic(model="claude-sonnet-4-6")

registry = MCPToolRegistry([
    MCPClient("npx -y @modelcontextprotocol/server-github"),
    MCPClient("npx -y @modelcontextprotocol/server-filesystem /workspace"),
])

agent = GantryEngine(
    llm=llm,
    tools=[registry],
    memory=InMemoryStore(),
    max_steps=40,
)

# Use arun() to avoid blocking in async contexts
result = asyncio.run(agent.arun(
    "Summarise the last 5 merged PRs in the repo, "
    "save the summary to /workspace/pr-digest.md, "
    "and return the filename."
))
print(result)
```

---

## Variants

- **Pass env vars to the server process:** `MCPClient("npx -y @mcp/github", env={"GITHUB_TOKEN": "ghp_..."})`
- **Use without an agent (inspect tools directly):** call `async with MCPClient(...) as c: print(c.get_tools())`
- **Preset shortcut:** `from gantrygraph.presets import mcp_agent; agent = mcp_agent(llm, "npx -y @mcp/github")`

## Troubleshooting

**`ImportError: mcp is a core dependency`** — run `pip install gantrygraph` (no extras needed, `mcp` ships with the base package).

**Server subprocess fails to start** — confirm `npx` is on your PATH and the package name is correct. Test standalone: `npx -y @modelcontextprotocol/server-filesystem /tmp`.

**Tools not found after `aenter`** — `MCPClient.get_tools()` returns an empty list when called before the client enters its context manager. Let `GantryEngine` manage the lifecycle by passing the client to `tools=` rather than entering it manually.

---

**Next:** [Build custom tools](custom-tools.md) · [Run agents in parallel](swarm.md) · [Connect external services with MCP](mcp.md)
