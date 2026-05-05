# Build Custom Tools

> Turn any Python function or class into a tool the agent can call.

## Step 1 — Simple decorator

```python
from gantrygraph import GantryEngine, gantry_tool
from langchain_anthropic import ChatAnthropic

@gantry_tool
def get_stock_price(ticker: str) -> str:
    """Return the current stock price for a ticker symbol like AAPL or MSFT."""
    return market_api.price(ticker)

@gantry_tool
async def send_email(to: str, subject: str, body: str) -> str:
    """Send an email to a recipient. Returns 'sent' on success."""
    await email_client.send(to, subject, body)
    return "sent"

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    tools=[get_stock_price, send_email],
    max_steps=10,
)
```

Type annotations on every parameter are required — they define the JSON schema the LLM uses to construct the call. The docstring is the tool description: write it as a single imperative sentence describing what the tool does and what it returns.

## Step 2 — Stateful BaseAction

```python
from langchain_core.tools import StructuredTool
from gantrygraph import GantryEngine, BaseAction
from langchain_anthropic import ChatAnthropic

class SlackTools(BaseAction):
    def __init__(self, token: str) -> None:
        self._client = SlackClient(token)

    def get_tools(self):
        client = self._client

        async def post_message(channel: str, message: str) -> str:
            """Post a message to a Slack channel. Returns 'posted' on success."""
            await client.post(channel, message)
            return "posted"

        async def list_channels(workspace: str) -> str:
            """List all channels in a Slack workspace."""
            return str(await client.list_channels(workspace))

        return [
            StructuredTool.from_function(
                coroutine=post_message,
                name="slack_post",
                description="Post a message to a Slack channel.",
            ),
            StructuredTool.from_function(
                coroutine=list_channels,
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

Use `BaseAction` when multiple tools share state (an HTTP session, a DB connection, a browser). `GantryEngine` calls `close()` automatically at the end of every run.

## Step 3 — Mark a tool as destructive

Tag a tool with `destructive=True` when it performs an irreversible action — deleting records, sending messages, charging a card, dropping tables. The engine automatically adds it to the approval gate, so `approval_callback` is called before every execution. No manual `GuardrailPolicy` config is needed.

```python
from gantrygraph import GantryEngine, gantry_tool
from langchain_anthropic import ChatAnthropic

@gantry_tool(destructive=True)
def drop_table(table: str) -> str:
    """Drop a database table permanently."""
    import db
    db.execute(f"DROP TABLE {table}")
    return f"Dropped table {table}."

@gantry_tool(destructive=True)
async def charge_card(amount_cents: int, card_token: str) -> str:
    """Charge a payment card. Returns the transaction ID."""
    txn = await payments.charge(amount_cents, card_token)
    return txn.id

def my_approval(tool_name: str, args: dict) -> bool:
    answer = input(f"Allow {tool_name}({args})? [y/N] ")
    return answer.strip().lower() == "y"

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    tools=[drop_table, charge_card],
    approval_callback=my_approval,  # called automatically for destructive tools
    max_steps=10,
)
```

`destructive=True` is equivalent to listing the tool name in `GuardrailPolicy(requires_approval={...})`, but requires no manual config when `approval_callback` is already set. If no `approval_callback` is provided, the tool call returns an error message to the LLM rather than executing — the agent cannot bypass the gate.

---

## Complete example

```python
import httpx
from langchain_core.tools import StructuredTool
from gantrygraph import GantryEngine, BaseAction, gantry_tool
from langchain_anthropic import ChatAnthropic

# Stateless tool via decorator
@gantry_tool(name="calculate", description="Evaluate a Python math expression and return the result.")
def calculate(expression: str) -> str:
    try:
        return str(eval(expression, {"__builtins__": {}}, {}))
    except Exception as exc:
        return f"Error: {exc}"

# Stateful tools sharing one HTTP client
class WeatherTools(BaseAction):
    def __init__(self, api_key: str) -> None:
        self._client = httpx.AsyncClient(
            base_url="https://api.openweathermap.org/data/2.5",
            params={"appid": api_key, "units": "metric"},
        )

    def get_tools(self):
        client = self._client

        async def current_weather(city: str) -> str:
            """Return the current temperature and conditions for a city."""
            r = await client.get("/weather", params={"q": city})
            d = r.json()
            return f"{d['main']['temp']}°C, {d['weather'][0]['description']}"

        async def forecast(city: str, days: int = 3) -> str:
            """Return a multi-day weather forecast for a city."""
            r = await client.get("/forecast", params={"q": city, "cnt": days * 8})
            return str(r.json()["list"][:days])

        return [
            StructuredTool.from_function(coroutine=current_weather, name="weather_current",
                                         description="Return current weather for a city."),
            StructuredTool.from_function(coroutine=forecast, name="weather_forecast",
                                         description="Return a multi-day forecast for a city."),
        ]

    async def close(self) -> None:
        await self._client.aclose()

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    tools=[calculate, WeatherTools(api_key="your-key")],
    max_steps=10,
)

result = agent.run("What is the average of the current temperatures in Paris and Tokyo?")
print(result)
```

---

## Variants

- **Override name and description:** `@gantry_tool(name="db_search", description="Full-text search over orders.")`
- **Async decorator:** `@gantry_tool` works on `async def` functions without any change
- **Destructive with custom policy:** combine `@gantry_tool(destructive=True)` with `GuardrailPolicy` to also gate non-decorator tools in the same run
- **Connect a third-party MCP server instead:** `MCPClient("npx -y @modelcontextprotocol/server-github")` — see [Connect external services with MCP](mcp.md)

## Troubleshooting

**`ValueError: @gantry_tool requires either a docstring or description=`** — add a docstring to the function or pass `description=` to the decorator.

**LLM calls the tool with wrong argument types** — add explicit type annotations (`str`, `int`, `float`, `bool`). Without annotations, the JSON schema is incomplete and the LLM may guess wrong types.

**Destructive tool executes without asking** — check that `approval_callback=` is passed to `GantryEngine`. Without a callback, calls return an error message to the LLM instead of running, but the LLM may retry indefinitely. Set an `approval_callback` to gate execution properly.

**Tool raises an exception** — `GantryEngine` catches tool exceptions and converts them to `ToolMessage(status="error")` so the LLM can try a different approach. Raise `ValueError` or `RuntimeError` for user-facing errors rather than returning error strings.

---

**Next:** [Connect external services with MCP](mcp.md) · [Read and write files](filesystem.md) · [Add memory to your agent](memory.md)
