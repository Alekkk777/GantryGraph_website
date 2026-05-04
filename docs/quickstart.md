# Quickstart

Get a working autonomous agent in under 5 minutes.

## Install

```bash
pip install gantrygraph
```

For desktop, browser, or cloud features install the relevant extras:

```bash
pip install 'gantrygraph[desktop]'   # screenshot + mouse/keyboard
pip install 'gantrygraph[browser]'   # Playwright web automation
pip install 'gantrygraph[cloud]'     # REST API server
```

## Step 1 — A minimal agent

The simplest agent: an LLM that can reason and respond.

```python
from gantrygraph import GantryEngine
from langchain_anthropic import ChatAnthropic

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    max_steps=5,
)

result = agent.run("What is 17 × 23? Show your working.")
print(result)
```

`GantryEngine` manages the observe → think → act → review loop.
`max_steps` prevents infinite loops. `run()` is synchronous — use `arun()` in async code.

## Step 2 — Give it a tool

Turn any function into an agent tool with `@gantry_tool`.
The LLM reads the docstring to understand what the tool does.

```python
from gantrygraph import GantryEngine, gantry_tool
from langchain_anthropic import ChatAnthropic

@gantry_tool
async def get_weather(city: str) -> str:
    """Return the current weather for a city."""
    return f"Sunny, 22°C in {city}"   # replace with a real API call

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    tools=[get_weather],
    max_steps=5,
)

print(agent.run("What's the weather in Milan and Tokyo?"))
```

!!! tip "Sync or async — both work"
    `@gantry_tool` wraps both `def` and `async def` functions.
    Prefer `async def` for I/O-heavy tools.

## Step 3 — Read and write files safely

`FileSystemTools` sandboxes the agent inside a directory.
It can never touch files outside `workspace`, even if the LLM tries.

```python
from gantrygraph import GantryEngine
from gantrygraph.actions import FileSystemTools, ShellTools
from langchain_anthropic import ChatAnthropic

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    tools=[
        FileSystemTools(workspace="/my/project"),
        ShellTools(
            workspace="/my/project",
            allowed_commands=["python", "pytest", "git"],
        ),
    ],
    max_steps=20,
)

result = agent.run(
    "Run the test suite. If any tests fail, read the relevant source files "
    "and fix the failures. Then run the tests again to confirm."
)
print(result)
```

## What's next

Pick the guide that matches what you want to build:

| I want to… | Guide |
|---|---|
| Control the mouse and keyboard | [Automate the desktop](how-to/desktop-agent.md) |
| Scrape or interact with websites | [Automate a browser](how-to/browser-agent.md) |
| Connect GitHub, Notion, Postgres | [Connect MCP tools](how-to/mcp.md) |
| Require a human to approve actions | [Add human approval](how-to/human-approval.md) |
| Run tasks in parallel | [Multi-agent swarm](how-to/swarm.md) |
| Expose the agent as a REST API | [Deploy as an API](how-to/cloud-deploy.md) |

Or read [The agent loop](concepts/engine.md) to understand how everything fits together.
