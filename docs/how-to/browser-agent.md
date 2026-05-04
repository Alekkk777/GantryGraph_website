# Create a Browser Agent

> Build an agent that navigates websites, extracts data, and fills forms using a real Chromium browser.

## Prerequisites

```bash
pip install 'gantrygraph[browser]'
playwright install chromium
```

## Step 1 — Minimal browser agent

```python
from gantrygraph import GantryEngine
from gantrygraph.perception import WebPage
from gantrygraph.actions import BrowserTools
from langchain_anthropic import ChatAnthropic

web = WebPage(url="https://news.ycombinator.com", headless=True)

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    perception=web,
    tools=[BrowserTools(web_page=web)],
    max_steps=20,
)

result = agent.run("Find the top 5 stories and return their titles and links.")
print(result)
```

Passing the same `WebPage` instance to both `perception=` and `BrowserTools(web_page=web)` ensures they share one browser tab. The agent sees a screenshot and the accessibility tree on every step.

## Step 2 — Scrape data without perception

```python
from gantrygraph import GantryEngine
from gantrygraph.actions import BrowserTools
from langchain_anthropic import ChatAnthropic

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    tools=[BrowserTools(headless=True)],
    max_steps=10,
)

result = agent.run(
    "Go to https://pypi.org/project/gantrygraph/ and return the latest version number."
)
print(result)
```

Skipping `perception=` omits screenshots from every loop step, which cuts token cost significantly for pure-extraction tasks.

## Step 3 — Fill a form

```python
from gantrygraph import GantryEngine
from gantrygraph.perception import WebPage
from gantrygraph.actions import BrowserTools
from langchain_anthropic import ChatAnthropic

web = WebPage(url="https://myapp.example.com/login", headless=False)

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    perception=web,
    tools=[BrowserTools(web_page=web)],
    max_steps=15,
)

agent.run("Log in with username 'admin' and password 'secret', then go to the dashboard.")
```

Set `headless=False` while developing so you can watch the agent interact with the page in real time.

---

## Complete example

```python
from gantrygraph import GantryEngine
from gantrygraph.perception import WebPage
from gantrygraph.actions import BrowserTools, FileSystemTools
from langchain_anthropic import ChatAnthropic

web = WebPage(url="https://github.com/trending/python?since=weekly", headless=True)

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    perception=web,
    tools=[
        BrowserTools(web_page=web),
        FileSystemTools(workspace="/tmp/results"),
    ],
    max_steps=30,
)

result = agent.run(
    "Extract all repository names and star counts from the trending page "
    "and save them as JSON to trending.json."
)
print(result)
```

---

## Browser tools reference

| Tool | What it does |
|---|---|
| `browser_navigate` | Open a URL in the browser |
| `browser_click` | Click a CSS or XPath selector |
| `browser_fill` | Type text into an input field |
| `browser_get_text` | Return visible text from an element or the whole page |
| `browser_get_url` | Return the current URL |

## Variants

- **Visible browser for development:** `WebPage(url="...", headless=False)`
- **Firefox or WebKit:** `WebPage(url="...", browser_type="firefox")`
- **Accessibility tree only (no screenshot):** `WebPage(url="...", include_screenshot=False)`
- **Screenshot only (no accessibility tree):** `WebPage(url="...", include_accessibility=False)`
- **Preset shortcut:** `from gantrygraph.presets import browser_agent; agent = browser_agent(llm, start_url="https://example.com")`

## Troubleshooting

**`ImportError: BrowserTools requires the [browser] extra`** — run `pip install 'gantrygraph[browser]' && playwright install chromium`.

**`TimeoutError` on page load** — the default `wait_until="domcontentloaded"` can be slow on heavy pages; reduce `max_steps` and add a `BudgetPolicy(max_wall_seconds=60)`.

**Agent clicks wrong element** — enable `include_accessibility=True` (default) so the LLM can use semantic selectors instead of coordinates.

---

**Next:** [Connect external services with MCP](mcp.md) · [Read and write files](filesystem.md) · [Run agents in parallel](swarm.md)
