# Perception sources

Perception is how the agent *sees* the world before each think step.
Without a perception source the agent only reads its task description and tool results.
With one, it receives a fresh screenshot or DOM snapshot every loop iteration.

## Do you need perception?

**Yes** — if the task requires reading what's currently on screen before deciding what to do:
- Desktop automation (click buttons, read UI text, fill forms in a native app)
- Web scraping or form filling (read page state, navigate based on what's visible)
- Monitoring dashboards (watch for a value to change)

**No** — if the agent works purely through tool results:
- Read files, run commands, call APIs → tools alone are sufficient
- The agent receives tool outputs as text; no visual input needed

## `DesktopScreen` — screenshot the monitor

Captures the primary monitor before each think step and sends the image to the LLM.
Runs in a thread pool so it never blocks the event loop.

```python
from gantrygraph.perception import DesktopScreen

# Full native resolution — highest quality, highest token cost
screen = DesktopScreen()

# Cap resolution to reduce vision token cost
screen = DesktopScreen(max_resolution=(1280, 720))
```

No extra dependencies — `mss` is bundled with the core install.

### Reduce cost with `vision_mode`

`vision_mode="low"` caps the image at 1280×720 regardless of `max_resolution`.
Use it when the task doesn't require pixel-perfect reads — UI labels, button text,
and form fields are still readable.

| Mode | Resolution cap | Token cost | Use when |
|------|---------------|------------|----------|
| `"high"` (default) | Native resolution | Higher | Reading fine UI details, small text |
| `"low"` | 1280 × 720 | ~4× cheaper | Navigating apps, clicking buttons |

```python
screen = DesktopScreen(max_resolution=(1920, 1080), vision_mode="low")
```

### Screenshot diffing

The engine automatically skips sending an image if the screen hasn't changed
since the previous step. This saves vision tokens during steps where the agent
is waiting for a tool result or processing text.

## `WebPage` — screenshot a browser page

Renders a URL via Playwright, captures a screenshot, and extracts the
page's accessibility tree. Both are sent to the LLM before each think step.
Requires `pip install 'gantrygraph[browser]'`.

```python
from gantrygraph.perception import WebPage

page = WebPage(url="https://myapp.example.com", headless=True)

# Lower token cost — downscales screenshots to 1280×720
page = WebPage(url="https://myapp.example.com", vision_mode="low")
```

### Share the browser with `BrowserTools`

Pass the same `WebPage` instance to both `perception=` and `BrowserTools`
so they operate on the same Playwright `Page` object — no double browser launch.

```python
from gantrygraph import GantryEngine
from gantrygraph.perception import WebPage
from gantrygraph.actions import BrowserTools

web = WebPage(url="https://app.example.com", headless=True)

agent = GantryEngine(
    llm=...,
    perception=web,
    tools=[BrowserTools(web_page=web)],
)
```

Without this, `BrowserTools` would launch a second browser instance pointing
at a different page — the agent would act on one page but perceive another.

## `MultiPerception` — combine sources

When your agent needs to see multiple things simultaneously — for example,
control the desktop while monitoring a web dashboard:

```python
from gantrygraph import MultiPerception
from gantrygraph.perception import DesktopScreen, WebPage

agent = GantryEngine(
    llm=...,
    perception=MultiPerception([
        DesktopScreen(),
        WebPage(url="https://dashboard.internal"),
    ]),
)
```

The first source's screenshot is used as the primary image.
Accessibility trees from all sources are concatenated with source labels.

## Write a custom perception source

Subclass `BasePerception` and implement `observe()`. Return a `PerceptionResult`.

```python
import asyncio
from gantrygraph import BasePerception
from gantrygraph.core.events import PerceptionResult

class SystemMetricsPerception(BasePerception):
    """Feed CPU and memory stats to the agent instead of a screenshot."""

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
            screenshot_b64=None,       # no image — text-only perception
            accessibility_tree=f"CPU: {stats['cpu']}%\nMEM: {stats['mem']}%",
            url=None,
            width=0,
            height=0,
            metadata=stats,
        )

    async def close(self) -> None:
        pass  # nothing to clean up
```

Use it exactly like a built-in source:

```python
agent = GantryEngine(
    llm=...,
    perception=SystemMetricsPerception(),
    tools=[...],
)
agent.run("Alert me if CPU stays above 90% for more than 30 seconds.")
```

`PerceptionResult.screenshot_b64` can be `None` — the engine skips
the image and only sends the `accessibility_tree` text to the LLM.
This pattern works for any text-based sensor: log tails, metric APIs,
file watchers, database cursors.

---

**See also:** [Desktop agent guide](../how-to/desktop-agent.md) · [Browser agent guide](../how-to/browser-agent.md) · [API reference](../api-reference.md#perception)
