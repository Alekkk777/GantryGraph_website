# Connect MCP tools

[Model Context Protocol](https://modelcontextprotocol.io) (MCP) is an open standard
for connecting AI agents to external services. Instead of writing custom integration
code, you point the agent at an MCP server and it discovers all available tools
automatically.

Popular MCP servers: GitHub, Notion, Slack, Postgres, filesystem, web search,
and hundreds more — all work with the same two lines of code.

## Connect a single server

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

`MCPClient` starts the server subprocess when the agent run begins and
terminates it when it ends — even on errors.

## Connect multiple servers

Use `MCPToolRegistry` to give the agent tools from several servers at once.
All tools are flattened into one list and de-duplicated by name.

```python
from gantrygraph.mcp import MCPClient, MCPToolRegistry

registry = MCPToolRegistry([
    MCPClient("npx -y @modelcontextprotocol/server-filesystem /workspace"),
    MCPClient("npx -y @modelcontextprotocol/server-github"),
    MCPClient("npx -y @modelcontextprotocol/server-postgres postgresql://..."),
])

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    tools=[registry],
    max_steps=30,
)

result = agent.run(
    "Find all open PRs tagged 'bug' in the repo, "
    "check which ones have failing tests in the database, "
    "and write a summary to /workspace/report.md."
)
```

## Mix MCP tools with custom tools

You can combine `MCPClient` with `@gantry_tool` functions and built-in action groups:

```python
from gantrygraph import GantryEngine, gantry_tool
from gantrygraph.mcp import MCPClient
from gantrygraph.actions import FileSystemTools

@gantry_tool
async def notify_slack(message: str) -> str:
    """Post an urgent notification to #alerts on Slack."""
    await slack.post("#alerts", message)
    return "posted"

agent = GantryEngine(
    llm=...,
    tools=[
        MCPClient("npx -y @modelcontextprotocol/server-github"),
        FileSystemTools(workspace="/workspace"),
        notify_slack,
    ],
    max_steps=20,
)
```

## Use MCP tools directly (without an agent)

If you just want to list or call tools from an MCP server programmatically:

```python
import asyncio
from gantrygraph.mcp import MCPClient

async def main():
    async with MCPClient("npx -y @modelcontextprotocol/server-filesystem /tmp") as client:
        tools = client.get_tools()
        print([t.name for t in tools])
        # ['read_file', 'write_file', 'list_directory', ...]

asyncio.run(main())
```

## Finding MCP servers

Browse the official registry at [modelcontextprotocol.io/servers](https://modelcontextprotocol.io/servers)
or search npm for packages starting with `@modelcontextprotocol/`.

Any MCP-compatible server works — including ones you build yourself.
