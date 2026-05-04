# Quickstart

> Run your first autonomous agent in under 10 lines.

## Step 1 — Install

```bash
pip install gantrygraph langchain-anthropic
```

## Step 2 — Minimal agent

```python
from gantrygraph import GantryEngine
from langchain_anthropic import ChatAnthropic

agent = GantryEngine(llm=ChatAnthropic(model="claude-sonnet-4-6"))
print(agent.run("What is 2 + 2?"))
```

`GantryEngine` wraps any LangChain `BaseChatModel` in an `observe → think → act → review` loop. `run()` blocks until the task finishes and returns the final answer as a string; use `arun()` in async code.

## Step 3 — Add a tool

```python
from gantrygraph import GantryEngine, gantry_tool
from langchain_anthropic import ChatAnthropic

@gantry_tool
def word_count(text: str) -> str:
    """Count the number of words in a string."""
    return str(len(text.split()))

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    tools=[word_count],
)
print(agent.run("How many words are in 'the quick brown fox'?"))
```

`@gantry_tool` turns any `def` or `async def` function into a tool the LLM can call. The docstring becomes the tool description — make it specific.

## What's next

| I want to… | Guide |
|---|---|
| Control the desktop with mouse and keyboard | [Create a desktop agent](how-to/desktop-agent.md) |
| Scrape or automate websites | [Create a browser agent](how-to/browser-agent.md) |
| Connect external services via MCP | [Connect external services with MCP](how-to/mcp.md) |
| Require human sign-off before risky actions | [Require human approval before actions](how-to/human-approval.md) |
| Run multiple agents in parallel | [Run agents in parallel](how-to/swarm.md) |
| Deploy as a REST API | [Deploy as a REST API](how-to/cloud-deploy.md) |
| Read and write files | [Read and write files](how-to/filesystem.md) |
| Build custom tools | [Build custom tools](how-to/custom-tools.md) |
| Add memory across tasks | [Add memory to your agent](how-to/memory.md) |
| Monitor what the agent is doing | [Monitor agent execution](how-to/observability.md) |
