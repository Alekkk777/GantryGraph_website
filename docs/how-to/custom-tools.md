# Build your own tool

A tool is any Python function the agent can call. There are three ways to
create one, ordered by complexity.

## The fast way — `@gantry_tool`

Decorate any function and it becomes an LLM-callable tool in one step.
The docstring is what the LLM reads to decide when to use the tool —
write it clearly.

```python
from gantrygraph import GantryEngine, gantry_tool
from langchain_anthropic import ChatAnthropic

@gantry_tool
async def send_email(to: str, subject: str, body: str) -> str:
    """Send an email to a recipient. Returns 'sent' on success."""
    await email_client.send(to, subject, body)
    return "sent"

@gantry_tool
def get_stock_price(ticker: str) -> str:
    """Return the current stock price for a ticker symbol like AAPL."""
    return market_api.price(ticker)

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    tools=[send_email, get_stock_price],
    max_steps=10,
)
```

Type annotations are required — they define the JSON schema the LLM uses
to construct the call. Both `def` and `async def` are supported.

## When tools share state — `BaseAction`

If several tools share a connection (database, API client, browser session),
group them in a `BaseAction` subclass. `GantryEngine` calls `close()`
automatically when the run finishes.

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
            StructuredTool.from_function(
                coroutine=_post,
                name="slack_post",
                description="Post a message to a Slack channel.",
            ),
            StructuredTool.from_function(
                coroutine=_list_channels,
                name="slack_list_channels",
                description="List all channels in a Slack workspace.",
            ),
        ]

    async def close(self) -> None:
        await self._client.close()

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    tools=[SlackTools(token="xoxb-...")],
    max_steps=10,
)
```

## Connect a third-party service — `MCPClient`

If the service already has an [MCP server](https://modelcontextprotocol.io)
(GitHub, Notion, Postgres, Slack, and hundreds more), you don't need to write
any tool code at all. Point `MCPClient` at the server and all its tools are
discovered automatically:

```python
from gantrygraph.mcp import MCPClient

tools = MCPClient("npx -y @modelcontextprotocol/server-github")
```

See [Connect external services](mcp.md) for the full guide.

## Tips for writing good tools

**Short, specific docstrings** — the LLM calls what the docstring says. Vague
descriptions lead to wrong calls.

```python
# Too vague
async def process(data: str) -> str:
    """Process the data."""

# Clear
async def summarise_csv(csv_text: str) -> str:
    """Summarise a CSV string into a bullet-point list of key statistics."""
```

**Return human-readable strings** — the LLM reads the return value to decide
the next step. Return short, clear descriptions of what happened.

**Fail loudly** — raise exceptions for real errors rather than returning
`"error"` strings. `GantryEngine` converts exceptions into `ToolMessage(status="error")`
automatically so the LLM can try a different approach.

**One responsibility per tool** — narrow tools are easier for the LLM to use
correctly than multi-purpose tools with many optional parameters.
