# Automate a browser

This guide shows you how to build an agent that navigates websites,
fills forms, clicks buttons, and extracts data — using a real Chromium browser.

## Prerequisites

```bash
pip install 'gantrygraph[browser]'
playwright install chromium
```

## A working agent

```python
from gantrygraph import GantryEngine
from gantrygraph.perception import WebPage
from gantrygraph.actions import BrowserTools
from langchain_anthropic import ChatAnthropic

# Share the same browser between perception and actions
web = WebPage(url="https://news.ycombinator.com", headless=True)

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    perception=web,
    tools=[BrowserTools(web_page=web)],
    max_steps=20,
)

result = agent.run(
    "Find the top 5 stories on the front page and return their titles and links."
)
print(result)
```

Passing the same `WebPage` to both `perception` and `BrowserTools` means
they share the same browser tab. The agent sees a screenshot plus the page's
accessibility tree on every step, giving it precise context for clicking.

## Available browser tools

| Tool | What it does |
|------|--------------|
| `browser_navigate` | Open a URL |
| `browser_click` | Click a CSS selector or XPath |
| `browser_fill` | Type text into an input field |
| `browser_get_text` | Return visible text from an element or the whole page |
| `browser_get_url` | Return the current URL |

## Common patterns

### Fill a form and submit

```python
web = WebPage(url="https://myapp.example.com/login", headless=False)

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    perception=web,
    tools=[BrowserTools(web_page=web)],
    max_steps=15,
)

agent.run("Log in with username 'admin' and password 'secret', then go to the dashboard.")
```

### Scrape data without perception

If the agent only needs to extract information (no clicking), you can skip
the `perception` source and let it call `browser_get_text` explicitly.
This is cheaper — no screenshots are sent to the LLM.

```python
agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    tools=[BrowserTools(headless=True)],   # no perception
    max_steps=10,
)

result = agent.run(
    "Go to https://pypi.org/project/gantrygraph/ and tell me the latest version."
)
```

### Save results to a file

```python
from gantrygraph.actions import FileSystemTools

agent = GantryEngine(
    llm=...,
    perception=web,
    tools=[
        BrowserTools(web_page=web),
        FileSystemTools(workspace="/tmp/results"),
    ],
    max_steps=30,
)

agent.run(
    "Go to https://github.com/trending/python?since=weekly, "
    "extract all repo names and star counts, and save them to trending.json."
)
```

## Headless vs. visible browser

Set `headless=False` when developing — you can watch the agent work in real time.
Set `headless=True` for production or CI runs.

```python
web = WebPage(url="...", headless=False)   # visible — for development
web = WebPage(url="...", headless=True)    # invisible — for production
```
