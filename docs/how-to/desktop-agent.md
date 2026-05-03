# Automate the desktop

This guide shows you how to build an agent that takes screenshots
and controls the mouse and keyboard — like a human at a computer,
but autonomous.

## Prerequisites

```bash
pip install 'gantrygraph[desktop]'
```

On Linux, a display server is required:

```bash
apt-get install -y xvfb
Xvfb :99 -screen 0 1280x720x24 &
export DISPLAY=:99
```

## A working agent

```python
from gantrygraph import GantryEngine
from gantrygraph.perception import DesktopScreen
from gantrygraph.actions import MouseKeyboardTools
from gantrygraph.security import BudgetPolicy
from langchain_anthropic import ChatAnthropic

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    perception=DesktopScreen(max_resolution=(1280, 720)),
    tools=[MouseKeyboardTools()],
    max_steps=30,
    budget=BudgetPolicy(max_wall_seconds=120),
    system_prompt=(
        "You are a desktop automation agent. "
        "After each action, wait for the screen to update before proceeding."
    ),
)

agent.run("Open the terminal, run 'echo hello world', and close it.")
```

**What happens on each loop iteration:**

1. `DesktopScreen` takes a screenshot of your monitor
2. The LLM receives the image and decides what to click, type, or press
3. `MouseKeyboardTools` executes the action
4. The loop repeats until the task is done

## Available mouse and keyboard tools

| Tool | What it does |
|------|--------------|
| `mouse_click` | Click at (x, y) coordinates |
| `mouse_move` | Move the cursor to (x, y) |
| `key_press` | Press a key combination (e.g. `ctrl+c`) |
| `type_text` | Type a string character by character |
| `screenshot` | Take a screenshot (also happens automatically via perception) |

## Tips for reliable automation

**Use lower resolution.** Smaller screenshots cost fewer tokens and let the LLM
focus on relevant UI elements. `(1024, 768)` works well for most tasks.
`(1280, 720)` is a safe maximum for Claude.

**Set a time budget.** GUI state can change unexpectedly. Always add a `BudgetPolicy`
for unattended agents so a stuck loop doesn't run forever.

**Write a descriptive system prompt.** Tell the agent which application it's using,
what success looks like, and any app-specific quirks.

**Combine with file tools.** Desktop agents often need to read or write files
alongside GUI interaction:

```python
from gantrygraph.actions import FileSystemTools

agent = GantryEngine(
    llm=...,
    perception=DesktopScreen(),
    tools=[
        MouseKeyboardTools(),
        FileSystemTools(workspace="/my/project"),
    ],
    max_steps=40,
)

agent.run(
    "Open VS Code, edit src/config.py to set DEBUG=False, save, and close."
)
```
