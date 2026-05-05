# Create a Browser Agent

> Build an agent that navigates websites, extracts data, and fills forms — with built-in stealth mode and web search.

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

**Reduce token cost with `vision_mode="low"`:** By default `WebPage` captures screenshots at full resolution. Pass `vision_mode="low"` to downscale the PNG to 1280×720 — useful for content-extraction tasks that don't require pixel-level precision.

```python
# Full resolution — more detail, higher token cost
web = WebPage(url="https://example.com", headless=True, vision_mode="high")

# Downscaled to 1280x720 — cheaper, sufficient for most scraping tasks
web = WebPage(url="https://example.com", headless=True, vision_mode="low")
```

## Step 2 — Stealth mode (default on)

Both `WebPage` and `BrowserTools` ship with `stealth=True` by default. This sets a realistic
Chrome user-agent, patches `navigator.webdriver` to `undefined`, populates `navigator.plugins`
and `navigator.languages`, and passes `--disable-blink-features=AutomationControlled` at
launch. Click and fill actions also add small random delays to mimic human timing.

```python
# stealth=True is the default — no changes needed for most sites
web = WebPage(url="https://example.com", headless=True, stealth=True)
tools = [BrowserTools(web_page=web, stealth=True)]
```

Turn it off only if you're testing against a local server where fingerprinting doesn't matter:

```python
web = WebPage(url="http://localhost:3000", headless=True, stealth=False)
```

## Step 3 — Web search (search engines block bots — use the API instead)

Google, Bing, and DuckDuckGo detect and block headless browsers with CAPTCHAs regardless of
stealth patches. For search queries, use `WebSearchTool` which calls the
[Tavily](https://tavily.com) search API instead — web-agnostic, structured results, no browser.

```bash
pip install 'gantrygraph[search]'
```

```python
from gantrygraph import GantryEngine
from gantrygraph.actions import BrowserTools, WebSearchTool
from langchain_anthropic import ChatAnthropic
import os

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    tools=[
        WebSearchTool(api_key=os.environ["TAVILY_API_KEY"]),
        BrowserTools(),
    ],
    max_steps=20,
)

result = agent.run(
    "Search for 'Python async best practices 2024' and open the top result."
)
```

The agent calls `web_search` to get results, then uses `browser_navigate` to open the page it
wants to read in depth. Get a free Tavily key (1 000 queries/month) at
[tavily.com](https://tavily.com).

**Preset shortcut** — pass `search_api_key=` and everything is wired up automatically:

```python
from gantrygraph.presets import browser_agent
from langchain_anthropic import ChatAnthropic
import os

agent = browser_agent(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    start_url="https://example.com",
    search_api_key=os.environ["TAVILY_API_KEY"],
)
```

## Step 4 — Scrape without perception

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
```

Skipping `perception=` omits screenshots from every loop step, which cuts token cost
significantly for pure-extraction tasks.

## Step 5 — Fill a form

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

Set `headless=False` while developing so you can watch the agent interact with the page.

---

## Complete example — scrape + save

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
| `browser_navigate` | Open a URL |
| `browser_click` | Click a CSS or XPath selector |
| `browser_click_text` | Click any button/link by its visible text label — more robust than CSS selectors on dynamic pages and consent banners |
| `browser_fill` | Type text into an input field |
| `browser_get_text` | Return visible text from an element or the whole page |
| `browser_get_url` | Return the current URL |
| `browser_scroll` | Scroll the page (`"down"`, `"up"`, `"top"`, `"bottom"`) |
| `browser_evaluate` | Execute a JavaScript expression and return the result |
| `browser_wait_for_selector` | Wait until a CSS/XPath selector becomes visible |

## Stability options

| Parameter | Default | Description |
|---|---|---|
| `max_steps` | `50` | Hard cap on act-node executions |
| `max_consecutive_errors` | `5` | Stop early if the same error repeats — catches infinite CAPTCHA / redirect loops |

```python
from gantrygraph import GantryEngine
from gantrygraph.actions import BrowserTools
from langchain_anthropic import ChatAnthropic

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    tools=[BrowserTools()],
    max_steps=20,
    max_consecutive_errors=4,   # stop after 4 back-to-back tool failures
)
```

## Variants

- **Reduce screenshot token cost:** `WebPage(url="...", vision_mode="low")`
- **Visible browser for development:** `WebPage(url="...", headless=False)`
- **Firefox or WebKit:** `WebPage(url="...", browser_type="firefox")`
- **Accessibility tree only (no screenshot):** `WebPage(url="...", include_screenshot=False)`
- **Screenshot only (no accessibility tree):** `WebPage(url="...", include_accessibility=False)`
- **No stealth (local dev):** `WebPage(url="...", stealth=False)`

## Troubleshooting

**`ImportError: BrowserTools requires the [browser] extra`** — run `pip install 'gantrygraph[browser]' && playwright install chromium`.

**CAPTCHA on Google / Bing / DuckDuckGo** — search engines block headless browsers. Use `WebSearchTool` with a Tavily API key instead; see [Web search](web-search.md).

**`TimeoutError` on page load** — the default `wait_until="domcontentloaded"` can be slow on heavy pages. Call `browser_wait_for_selector` first or add a `BudgetPolicy(max_wall_seconds=60)`.

**Agent clicks wrong element** — use `browser_click_text` with the exact button label, or use `browser_evaluate` to click via JavaScript.

**Agent loops on a blocked page** — set `max_consecutive_errors=3` so the engine stops early instead of exhausting `max_steps`.

---

**Next:** [Web search](web-search.md) · [Connect external services with MCP](mcp.md) · [Read and write files](filesystem.md)
