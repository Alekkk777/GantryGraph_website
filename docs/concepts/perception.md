# Perception sources

Perception is how the agent *sees* before each think step.
Without a perception source the agent only reads its task description and tool results.
With one, it receives a fresh screenshot or DOM snapshot every loop iteration.

## When do you need it?

You need perception when the task requires **visual feedback** — reading what's
currently on screen before deciding what to do next.

- Desktop automation → `DesktopScreen`
- Web scraping / form filling → `WebPage`
- Custom sensors (APIs, metrics, files) → subclass `BasePerception`

For pure text tasks (read files, run commands, call APIs) you don't need a
perception source — tools alone are sufficient.

## `DesktopScreen` — screenshot the monitor

Captures the primary monitor at every loop step and sends the image to the LLM.
Runs in a thread pool so it never blocks the event loop.

```python
from gantrygraph.perception import DesktopScreen

# Default: full native resolution
screen = DesktopScreen()

# Smaller images = fewer tokens
screen = DesktopScreen(max_resolution=(1280, 720))
```

No extra dependencies — `mss` is bundled with the core install.

## `WebPage` — screenshot a browser page

Renders a URL via Playwright, captures a screenshot, and extracts the
page's accessibility tree. Requires `pip install 'gantrygraph[browser]'`.

```python
from gantrygraph.perception import WebPage

page = WebPage(url="https://myapp.example.com", headless=True)
```

!!! tip "Share the browser with BrowserTools"
    Pass the same `WebPage` instance to both `perception` and `BrowserTools`
    so they operate on the same Playwright `Page` — no double browser launch.

    ```python
    web = WebPage(url="https://app.example.com")
    agent = GantryEngine(
        perception=web,
        tools=[BrowserTools(web_page=web)],
        llm=...,
    )
    ```

## `MultiPerception` — combine sources

When your agent needs to see the desktop *and* monitor a web dashboard simultaneously:

```python
from gantrygraph import MultiPerception
from gantrygraph.perception import DesktopScreen, WebPage

agent = GantryEngine(
    perception=MultiPerception([
        DesktopScreen(),
        WebPage(url="https://dashboard.internal"),
    ]),
    llm=...,
)
```

The first screenshot wins; accessibility trees are concatenated with source labels.

## Write a custom perception source

Subclass `BasePerception` and implement `observe()`. Return a `PerceptionResult`.

```python
import asyncio
from gantrygraph import BasePerception
from gantrygraph.core.events import PerceptionResult

class SystemMetricsPerception(BasePerception):
    """Let the agent read live CPU and memory stats."""

    async def observe(self) -> PerceptionResult:
        import psutil
        stats = await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: {
                "cpu": psutil.cpu_percent(),
                "mem": psutil.virtual_memory().percent,
            },
        )
        return PerceptionResult(
            screenshot_b64=None,
            accessibility_tree=f"CPU: {stats['cpu']}%\nMEM: {stats['mem']}%",
            url=None,
            width=0,
            height=0,
            metadata=stats,
        )

    async def close(self) -> None:
        pass
```

Use it like any built-in source:

```python
agent = GantryEngine(
    perception=SystemMetricsPerception(),
    tools=[...],
    llm=...,
)
agent.run("Alert me if CPU stays above 90% for more than 30 seconds.")
```
