# Web Search

> Give your agent the ability to search the web without getting blocked by CAPTCHAs.

## Why not scrape Google directly?

Search engines (Google, Bing, DuckDuckGo) detect and block headless browsers — even with stealth
patches — using CAPTCHA walls and 403 errors. The correct approach is to query a **search API**
that returns structured results without a browser.

`WebSearchTool` uses the [Tavily](https://tavily.com) search API. Tavily is:

- **Web-agnostic** — aggregates results across the whole web, not tied to any single engine
- **Free to start** — 1 000 queries/month on the free plan
- **Structured** — returns title, URL, snippet, and an optional AI-generated summary

## Setup

```bash
pip install 'gantrygraph[search]'
```

Get a free API key at [tavily.com](https://tavily.com) and export it:

```bash
export TAVILY_API_KEY=tvly-...
```

## Basic usage

```python
from gantrygraph import GantryEngine
from gantrygraph.actions.search import WebSearchTool
from langchain_anthropic import ChatAnthropic

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    tools=[WebSearchTool()],   # reads TAVILY_API_KEY from env
    max_steps=10,
)

result = agent.run("What are the top Python async libraries in 2024?")
print(result)
```

## Combine search + browser

The most powerful pattern: let the agent search for pages with `web_search`, then open
specific pages with `browser_navigate` to read them in depth.

```python
from gantrygraph import GantryEngine
from gantrygraph.perception import WebPage
from gantrygraph.actions import BrowserTools, WebSearchTool
from langchain_anthropic import ChatAnthropic

web = WebPage(headless=True)

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    perception=web,
    tools=[
        WebSearchTool(),
        BrowserTools(web_page=web),
    ],
    max_steps=25,
)

result = agent.run(
    "Search for the GitHub repository of the 'httpx' Python library, "
    "navigate to it, and return the current star count and latest release."
)
print(result)
```

## Preset shortcut

`browser_agent()` wires everything up when you pass `search_api_key=`:

```python
from gantrygraph.presets import browser_agent
from langchain_anthropic import ChatAnthropic
import os

agent = browser_agent(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    search_api_key=os.environ["TAVILY_API_KEY"],
)
result = agent.run("Find the latest LangGraph release notes.")
```

If `TAVILY_API_KEY` is already in your environment, the preset picks it up automatically
without needing `search_api_key=`.

## API reference

```python
WebSearchTool(
    api_key: str | None = None,       # falls back to TAVILY_API_KEY env var
    max_results: int = 5,             # results per query
    search_depth: "basic" | "advanced" = "basic",  # "advanced" is slower but more thorough
)
```

The tool exposes a single LLM-callable tool named `web_search`:

| Parameter | Type | Description |
|---|---|---|
| `query` | `str` | Search query |
| `max_results` | `int` | Number of results (default: value set at construction) |

## Troubleshooting

**`ImportError: WebSearchTool requires the [search] extra`** — run `pip install 'gantrygraph[search]'`.

**`ValueError: Tavily API key required`** — set `TAVILY_API_KEY` in your environment or pass `api_key=` directly.

**Empty results** — check that `TAVILY_API_KEY` is valid and your free quota hasn't been exceeded (1 000 queries/month).

---

**Next:** [Create a browser agent](browser-agent.md) · [Connect external services with MCP](mcp.md)
