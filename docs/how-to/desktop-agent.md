# Create a Desktop Agent

> Build an agent that takes screenshots and controls the mouse and keyboard.

## Prerequisites

```bash
pip install 'gantrygraph[desktop]'
```

On headless Linux, start a virtual display first:

```bash
apt-get install -y xvfb
Xvfb :99 -screen 0 1280x720x24 &
export DISPLAY=:99
```

## Step 1 — Minimal desktop agent

```python
from gantrygraph import GantryEngine
from gantrygraph.perception import DesktopScreen
from gantrygraph.actions import MouseKeyboardTools
from langchain_anthropic import ChatAnthropic

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    perception=DesktopScreen(max_resolution=(1280, 720)),
    tools=[MouseKeyboardTools()],
    max_steps=30,
)

agent.run("Open the terminal and run 'echo hello world'.")
```

`DesktopScreen` takes an OS-native screenshot before every think step. `MouseKeyboardTools` exposes `mouse_click`, `keyboard_type`, `mouse_scroll`, `keyboard_hotkey`, and `mouse_move` to the LLM.

**Reduce token cost with `vision_mode="low"`:** By default `DesktopScreen` captures at the full `max_resolution`. Pass `vision_mode="low"` to cap the screenshot at 1280×720 regardless of the `max_resolution` setting — useful when your task doesn't require pixel-perfect detail and you want to keep token cost down.

```python
# Full resolution — more detail, higher token cost
perception=DesktopScreen(max_resolution=(1920, 1080), vision_mode="high")

# Capped at 1280x720 — cheaper, sufficient for most UI tasks
perception=DesktopScreen(max_resolution=(1920, 1080), vision_mode="low")
```

## Step 2 — Add file tools

```python
from gantrygraph import GantryEngine
from gantrygraph.perception import DesktopScreen
from gantrygraph.actions import MouseKeyboardTools, FileSystemTools
from langchain_anthropic import ChatAnthropic

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    perception=DesktopScreen(max_resolution=(1280, 720)),
    tools=[
        MouseKeyboardTools(),
        FileSystemTools(workspace="/my/project"),
    ],
    max_steps=40,
)

agent.run("Open VS Code, edit src/config.py to set DEBUG=False, save, and close.")
```

`FileSystemTools` lets the agent read and write files inside the workspace without leaving the directory boundary.

## Step 3 — Run

```python
result = agent.run("Screenshot the desktop and describe what you see.")
print(result)
```

`run()` blocks until the task completes. Use `arun()` in async contexts.

---

## Complete example

```python
from gantrygraph import GantryEngine
from gantrygraph.perception import DesktopScreen
from gantrygraph.actions import MouseKeyboardTools, FileSystemTools
from gantrygraph.security import BudgetPolicy
from langchain_anthropic import ChatAnthropic

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    perception=DesktopScreen(max_resolution=(1280, 720), monitor=1),
    tools=[
        MouseKeyboardTools(fail_safe=True, pause=0.05),
        FileSystemTools(workspace="/my/project"),
    ],
    budget=BudgetPolicy(max_steps=30, max_wall_seconds=120.0),
    system_prompt=(
        "You are a desktop automation agent. "
        "After each action, wait for the screen to update before proceeding."
    ),
    max_steps=30,
)

result = agent.run(
    "Open the terminal, navigate to /my/project, run pytest, "
    "and report whether the tests passed."
)
print(result)
```

---

## Step 4 — Use the accessibility tree instead of screenshots (macOS, zero vision tokens)

```bash
pip install 'gantrygraph[desktop-ax]'
```

```python
from gantrygraph import GantryEngine
from gantrygraph.perception import DesktopAXTree
from gantrygraph.actions import MouseKeyboardTools
from langchain_anthropic import ChatAnthropic

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    perception=DesktopAXTree(app_name="Obsidian"),
    tools=[MouseKeyboardTools()],
    max_steps=20,
)

agent.run("Find the note titled 'Q2 Goals' and append a new bullet: 'Ship DesktopAXTree'")
```

`DesktopAXTree` reads the native macOS **Accessibility API** (AXUIElement) — the same tree that screen readers use. Instead of sending a screenshot to the vision model, it passes structured text describing every button, text field, and label in the app. No image tokens. No coordinate guessing.

```
AXApplication 'Obsidian'
  AXWindow 'My Vault — Obsidian'
    AXTextArea 'Q2 Goals\n- Ship v1\n- Write docs' (focused, editable)
    AXButton 'New note' (enabled)
    AXButton 'Search' (enabled)
```

| | `DesktopScreen` | `DesktopAXTree` |
|---|---|---|
| Works on | macOS, Linux, Windows | macOS only |
| Observation format | Screenshot image | Structured text |
| Token cost | ~2 000 / step | ~200 / step |
| Coordinate precision | Depends on resolution | Element-level (no coords) |
| Works when app off-screen | No | Yes |

Target a specific app by name, by bundle ID, or leave both `None` to target whatever is in focus:

```python
DesktopAXTree(app_name="Obsidian")                   # by localised name
DesktopAXTree(bundle_id="md.obsidian")               # by bundle ID
DesktopAXTree()                                      # frontmost app
DesktopAXTree(app_name="Obsidian", include_screenshot=True)  # AX tree + screenshot
```

Grant Accessibility permission once in **System Settings → Privacy & Security → Accessibility**.

---

## Variants

- **Reduce token cost:** `DesktopScreen(max_resolution=(1280, 720), vision_mode="low")`
- **Lower resolution to save tokens further:** `DesktopScreen(max_resolution=(1024, 768))`
- **Second monitor:** `DesktopScreen(monitor=2)`
- **Native app, zero vision tokens (macOS):** `DesktopAXTree(app_name="Obsidian")`
- **AX tree + screenshot fallback:** `DesktopAXTree(include_screenshot=True)`
- **Slower, safer actions:** `MouseKeyboardTools(pause=0.2)`
- **Disable fail-safe (pyautogui corner abort):** `MouseKeyboardTools(fail_safe=False)`

## Troubleshooting

**`ImportError: MouseKeyboardTools requires the [desktop] extra`** — run `pip install 'gantrygraph[desktop]'`.

**`ImportError: DesktopAXTree requires atomacos`** — run `pip install 'gantrygraph[desktop-ax]'` (macOS only).

**`AX error: APIDisabled`** — grant Accessibility permission in System Settings → Privacy & Security → Accessibility, then restart your terminal.

**`KeyError` or blank screenshot on Linux** — ensure `DISPLAY` is set and Xvfb is running: `export DISPLAY=:99`.

**Agent clicks wrong coordinates** — lower the resolution (`max_resolution=(1024, 768)`) so the LLM gets a sharper, less cluttered view.

---

**Next:** [Create a browser agent](browser-agent.md) · [Read and write files](filesystem.md) · [Require human approval before actions](human-approval.md)
