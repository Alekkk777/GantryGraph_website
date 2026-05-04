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

## Variants

- **Lower resolution to save tokens:** `DesktopScreen(max_resolution=(1024, 768))`
- **Second monitor:** `DesktopScreen(monitor=2)`
- **Slower, safer actions:** `MouseKeyboardTools(pause=0.2)`
- **Disable fail-safe (pyautogui corner abort):** `MouseKeyboardTools(fail_safe=False)`
- **Use the preset shortcut:** `from gantrygraph.presets import desktop_agent; agent = desktop_agent(llm)`

## Troubleshooting

**`ImportError: MouseKeyboardTools requires the [desktop] extra`** — run `pip install 'gantrygraph[desktop]'`.

**`KeyError` or blank screenshot on Linux** — ensure `DISPLAY` is set and Xvfb is running: `export DISPLAY=:99`.

**Agent clicks wrong coordinates** — lower the resolution (`max_resolution=(1024, 768)`) so the LLM gets a sharper, less cluttered view.

---

**Next:** [Create a browser agent](browser-agent.md) · [Read and write files](filesystem.md) · [Require human approval before actions](human-approval.md)
