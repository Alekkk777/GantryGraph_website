# Tools & actions

Tools are what the agent can *do*. The LLM decides which tool to call and with
what arguments — your job is to define the tools and register them with the engine.

## The fast path — `@gantry_tool`

Turn any Python function into an LLM-callable tool in one line.

```python
from gantrygraph import gantry_tool

@gantry_tool
async def search_db(query: str) -> str:
    """Search the product database. Returns matching rows as JSON."""
    return db.execute(query)
```

**Three rules:**
1. **Type-annotate every parameter** — annotations define the JSON schema the LLM uses to construct calls
2. **Write a clear docstring** — the LLM reads it to decide *when* to use the tool
3. **Return a string** — the LLM reads the return value as the tool result

Sync functions work too — `@gantry_tool` handles both:

```python
@gantry_tool
def get_timestamp() -> str:
    """Return the current UTC timestamp."""
    import datetime
    return datetime.datetime.utcnow().isoformat()
```

### Mark irreversible tools as destructive

Add `destructive=True` for any action that can't be undone — deleting records,
sending messages, charging a card. The engine automatically requires human
approval before the tool runs.

```python
@gantry_tool(destructive=True)
def drop_table(table: str) -> str:
    """Drop a database table permanently. Cannot be undone."""
    db.execute(f"DROP TABLE {table}")
    return f"dropped {table}"

# Approval is automatic — no GuardrailPolicy config needed
agent = GantryEngine(llm=..., tools=[drop_table], approval_callback=ask_human)
```

If `approval_callback` is not provided, the tool call returns an error and
the agent is told approval is required. See [Human approval](../how-to/human-approval.md).

## Registering tools

Pass any mix of tool types to `GantryEngine`:

```python
agent = GantryEngine(
    llm=...,
    tools=[
        search_db,                # @gantry_tool decorated function
        FileSystemTools(...),     # built-in action group
        MCPClient("npx ..."),     # external MCP server
        my_langchain_tool,        # any LangChain StructuredTool
    ],
)
```

## Built-in tool groups

### Read and write files — `FileSystemTools`

Gives the agent `file_read`, `file_write`, `file_list`, and `file_delete`.
All paths are validated against `workspace` — the agent can never escape the
directory, even if the LLM constructs a path like `../../etc/passwd`.

```python
from gantrygraph.actions import FileSystemTools

fs = FileSystemTools(workspace="/my/project")
```

See the [filesystem guide](../how-to/filesystem.md) for a complete working example.

### Run shell commands — `ShellTools`

Gives the agent `shell_run`. Two layers of protection ship by default:

1. **`allowed_commands`** — allowlist of executables the agent can run. Set it to the minimum your task needs.
2. **`ShellDenylist`** — blocks catastrophic commands (`rm -rf /`, fork bombs, `curl | bash`, SSH key reads) before the OS sees them.

```python
from gantrygraph.actions import ShellTools
from gantrygraph.security import ShellDenylist

shell = ShellTools(
    workspace="/my/project",
    allowed_commands=["python", "pytest", "git", "ruff"],
    timeout=30.0,
)
```

Three denylist profiles — choose based on how much you trust the agent:

| Profile | Blocks |
|---------|--------|
| `ShellDenylist.default()` | `rm -rf /`, fork bombs, `curl \| bash`, SSH key reads. **Active by default.** |
| `ShellDenylist.strict()` | All of the above + `mkfs`, `fdisk`, `chmod 777`, env dumps |
| `ShellDenylist.permissive()` | Nothing — disable only if you fully trust the agent's inputs |

```python
# Tighten controls for untrusted task inputs
shell = ShellTools(
    workspace="/app",
    allowed_commands=["python"],
    denylist=ShellDenylist.strict(),
)
```

See the [filesystem guide](../how-to/filesystem.md) for a complete example.

### Control mouse and keyboard — `MouseKeyboardTools`

Gives the agent `mouse_click`, `mouse_move`, `key_press`, `type_text`, and `screenshot`.
Requires `pip install 'gantrygraph[desktop]'`.

```python
from gantrygraph.actions import MouseKeyboardTools

tools = MouseKeyboardTools()
```

Pair with `DesktopScreen` perception so the agent sees the current screen
before deciding where to click. See the [desktop agent guide](../how-to/desktop-agent.md).

### Control a browser — `BrowserTools`

Gives the agent `browser_navigate`, `browser_click`, `browser_fill`,
`browser_get_text`, and `browser_get_url`.
Requires `pip install 'gantrygraph[browser]' && playwright install chromium`.

```python
from gantrygraph.actions import BrowserTools

tools = BrowserTools(headless=True)
```

Pair with `WebPage` perception and share the same instance to avoid
launching two browsers. See the [browser agent guide](../how-to/browser-agent.md).

## Connect external services — `MCPClient`

[Model Context Protocol](https://modelcontextprotocol.io) connects the agent
to GitHub, Notion, Slack, Postgres, and hundreds of other services. Tools are
discovered automatically — no integration code needed.

```python
from gantrygraph.mcp import MCPClient

# Starts the MCP server as a subprocess; tools are discovered on startup
tools = MCPClient("npx -y @modelcontextprotocol/server-github")

agent = GantryEngine(llm=..., tools=[tools])
```

See the [MCP guide](../how-to/mcp.md) for passing environment variables and
connecting to multiple servers simultaneously.

## Build a reusable tool group — `BaseAction`

When multiple tools share state (a database connection, an authenticated client,
a Slack token), group them in a `BaseAction` subclass instead of using `@gantry_tool`.
The engine calls `close()` automatically when the run finishes.

```python
from langchain_core.tools import StructuredTool
from gantrygraph import BaseAction

class SlackTools(BaseAction):
    def __init__(self, token: str) -> None:
        self._client = SlackClient(token)

    def get_tools(self) -> list:
        client = self._client

        async def _post(channel: str, message: str) -> str:
            """Post a message to a Slack channel."""
            await client.post(channel, message)
            return "posted"

        async def _list(team: str) -> str:
            """List all channels in a Slack workspace."""
            return str(await client.list_channels(team))

        return [
            StructuredTool.from_function(
                coroutine=_post, name="slack_post",
                description="Post a message to a Slack channel."),
            StructuredTool.from_function(
                coroutine=_list, name="slack_list_channels",
                description="List all channels in a Slack workspace."),
        ]

    async def close(self) -> None:
        await self._client.close()
```

Pass it like any other tool:

```python
agent = GantryEngine(
    llm=...,
    tools=[SlackTools(token=os.environ["SLACK_TOKEN"])],
)
```

## Use a secret in tool arguments

If a tool needs an API key, don't pass the real value in the task description.
Use `GantrySecrets` to define an alias — the agent uses the alias,
the engine substitutes the real value before execution, and the key
never appears in LLM context.

```python
from gantrygraph import GantrySecrets

secrets = GantrySecrets(api_key="sk-real-value-here")

@gantry_tool
async def call_api(endpoint: str, api_key: str) -> str:
    """Call the API. Pass api_key=<<api_key>> for authentication."""
    return await client.get(endpoint, headers={"Authorization": api_key})

agent = GantryEngine(llm=..., tools=[call_api], secrets=secrets)
# The agent passes api_key="<<api_key>>" — the engine replaces it with the real key
```

See [Guardrails](guardrails.md) for the full secrets reference.

---

**See also:** [Guardrails](guardrails.md) · [Custom tools guide](../how-to/custom-tools.md) · [API reference](../api-reference.md#tools)
