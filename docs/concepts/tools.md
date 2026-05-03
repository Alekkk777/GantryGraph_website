# Tools & actions

Tools are what the agent can *do*. Every tool call comes from the LLM's
decision in the think step — the agent decides which tool to call and with what arguments.

## Adding tools to an agent

Pass a list of tools (or tool groups) to `GantryEngine`:

```python
agent = GantryEngine(
    llm=...,
    tools=[
        my_custom_tool,       # @gantry_tool decorated function
        FileSystemTools(...), # built-in action group
        MCPClient("npx ..."), # external MCP server
    ],
)
```

## Write a tool in 3 lines

`@gantry_tool` turns any function into an LLM-callable tool.
The docstring becomes the tool's description — write it clearly,
because the LLM reads it to decide when to use the tool.

```python
from gantrygraph import gantry_tool

@gantry_tool
async def send_email(to: str, subject: str, body: str) -> str:
    """Send an email. Returns 'sent' on success."""
    await email_client.send(to, subject, body)
    return "sent"
```

Type annotations are required — they define the schema the LLM uses to
construct the call.

## Built-in tool groups

### Read and write files — `FileSystemTools`

Use this when you want the agent to create, read, modify, or delete files.
All paths are validated against `workspace` — the agent can never escape it,
even if the LLM tries a path like `../../etc/passwd`.

```python
from gantrygraph.actions import FileSystemTools

fs = FileSystemTools(workspace="/my/project")
# tools: file_read, file_write, file_list, file_delete
```

### Run shell commands — `ShellTool`

Use this when you want the agent to run programs, tests, git commands, etc.
`allowed_commands` is a whitelist — set it to prevent the agent from running
arbitrary code. Leave it `None` only if you trust the agent fully.

```python
from gantrygraph.actions import ShellTool

shell = ShellTool(
    workspace="/my/project",
    allowed_commands=["python", "pytest", "git", "ruff"],
    timeout=30.0,
)
# tool: shell_run
```

### Control mouse and keyboard — `MouseKeyboardTools`

Use this when you want the agent to interact with the desktop GUI.
Requires `pip install 'gantrygraph[desktop]'`.

```python
from gantrygraph.actions import MouseKeyboardTools

tools = MouseKeyboardTools()
# tools: mouse_click, mouse_move, key_press, type_text, screenshot
```

See the [desktop guide](../how-to/desktop-agent.md) for a full working example.

### Control a browser — `BrowserTools`

Use this when you want the agent to navigate websites, fill forms, or extract data.
Requires `pip install 'gantrygraph[browser]' && playwright install chromium`.

```python
from gantrygraph.actions import BrowserTools

tools = BrowserTools(headless=True)
# tools: browser_navigate, browser_click, browser_fill,
#        browser_get_text, browser_get_url
```

See the [browser guide](../how-to/browser-agent.md) for a full working example.

## Connect external services — `MCPClient`

[Model Context Protocol](https://modelcontextprotocol.io) lets you connect the agent
to any MCP-compatible server — GitHub, Notion, Slack, Postgres, and hundreds more.
No custom code needed; tools are discovered automatically from the server.

```python
from gantrygraph.mcp import MCPClient

# Any MCP server — local binary, npx package, or custom server
tools = MCPClient("npx -y @modelcontextprotocol/server-github")
```

See the [MCP guide](../how-to/mcp.md) for details.

## Build a reusable tool group — `BaseAction`

If your tools share state (a database connection, a browser session, a Slack client),
group them in a `BaseAction` subclass instead of using `@gantry_tool`.

```python
from langchain_core.tools import StructuredTool
from gantrygraph import BaseAction

class SlackTools(BaseAction):
    def __init__(self, token: str) -> None:
        self._client = SlackClient(token)

    def get_tools(self):
        client = self._client

        async def _post(channel: str, message: str) -> str:
            """Post a message to a Slack channel."""
            await client.post(channel, message)
            return "posted"

        async def _list_channels(team: str) -> str:
            """List all channels in a workspace."""
            return str(await client.list_channels(team))

        return [
            StructuredTool.from_function(coroutine=_post,
                name="slack_post", description="Post a Slack message."),
            StructuredTool.from_function(coroutine=_list_channels,
                name="slack_list_channels", description="List Slack channels."),
        ]

    async def close(self) -> None:
        await self._client.close()
```

`GantryEngine` calls `close()` automatically when the run finishes.
