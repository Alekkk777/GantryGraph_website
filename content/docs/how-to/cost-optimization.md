# Reduce Token Cost

> Four orthogonal controls that together cut token spend by 5–10× on long agent runs.

## Summary

| Control | Where to set it | Typical savings |
|---|---|---|
| Accessibility-tree perception | `GantryEngine(perception_mode=)` | ~80% per observe step |
| Shell output truncation | `ShellTools(max_output_chars=)` | Prevents 100k-token log dumps |
| Sliding message window | `GantryEngine(message_window=)` | Caps O(N²) history growth |
| Anthropic prompt cache | `GantryEngine(enable_caching=True)` | Up to 90% on system messages |

Enable all four together for maximum effect:

```python
from gantrygraph import GantryEngine
from gantrygraph.actions import ShellTools
from langchain_anthropic import ChatAnthropic

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    tools=[ShellTools(max_output_chars=2000)],
    perception_mode="axtree",
    message_window=20,
    enable_caching=True,
    max_steps=50,
)
```

---

## 1. Accessibility-tree perception (`perception_mode`)

**Default:** `"auto"`

Every `observe` step sends a representation of the page to the LLM. By default in `"auto"` or
`"axtree"` mode, GantryGraph sends the browser's accessibility tree as plain text instead of a
screenshot image.

| Mode | Cost per step | When to use |
|---|---|---|
| `"axtree"` | ~300 tokens | Web pages with a readable DOM — most scraping and form-filling tasks |
| `"auto"` | ~300 tokens when DOM readable, screenshot as fallback | Best default for mixed workloads |
| `"vision"` | ~1,500–3,000 tokens | Canvas apps, PDFs, desktop GUIs, pixel-level verification |

```python
# Maximum savings — text-only, no screenshots
agent = GantryEngine(llm=..., perception_mode="axtree")

# Default — text when available, screenshot as fallback
agent = GantryEngine(llm=..., perception_mode="auto")

# Always screenshot — for visual tasks
agent = GantryEngine(llm=..., perception_mode="vision")
```

> **Rule of thumb:** use `"axtree"` for web scraping and form filling; use `"vision"` only when
> the agent needs to read a chart, verify layout, or interact with a canvas element.

---

## 2. Shell output truncation (`max_output_chars`)

**Default:** `2000`

A single `cat large_logfile.log` can produce megabytes of output. Without truncation, every
byte ends up in the conversation history and is re-paid on every subsequent LLM call.

`ShellTools` truncates combined stdout+stderr at `max_output_chars` and appends a hint so the
agent knows to refine with `grep` or `head`:

```
[48,312 chars truncated — use grep/head/tail for details]
```

```python
from gantrygraph.actions import ShellTools

# Default — 2 000 chars is enough for most task decisions
ShellTools(max_output_chars=2000)

# Raise for log-heavy debugging tasks
ShellTools(max_output_chars=5000)

# Lower for very token-sensitive pipelines
ShellTools(max_output_chars=500)
```

> **Do not set `max_output_chars` to a very large value in production.** The agent rarely
> needs more than the first 2 000 characters to decide its next action; the truncation hint
> guides it to refine its query with targeted shell commands.

---

## 3. Sliding message window (`message_window`)

**Default:** `None` (full history)

Without a window, every step appends new messages to the conversation. After N steps the
context contains ~N messages, and the *next* LLM call pays for all of them — O(N²) token
growth over the lifetime of a long task.

`message_window=20` keeps `messages[0]` (the task/system prompt) plus the **last 20
messages**, bounding context to a fixed size regardless of run length.

```python
# Recommended for long-running tasks (50+ steps)
agent = GantryEngine(llm=..., message_window=20)
```

**Choosing a value:**

| Window | Good for |
|---|---|
| `10` | Short extraction tasks with a clear goal |
| `20` | Most web and shell agents — covers the recent action cycle |
| `40` | Tasks with complex multi-step dependencies |
| `None` | Short tasks (< 20 steps) where full history is affordable |

> `messages[0]` (the task prompt) is always preserved regardless of window size, so the
> agent never loses its objective.

---

## 4. Anthropic prompt cache (`enable_caching`)

**Default:** `False` — only effective with `langchain_anthropic.ChatAnthropic`

When `enable_caching=True`, GantryGraph adds Anthropic's
`cache_control: {"type": "ephemeral"}` to system messages. Requests that hit the cache
pay the *cached input* rate — **up to 90% cheaper** than the standard input rate.

The cache TTL is 5 minutes on Anthropic's side. For runs shorter than 5 minutes, every step
after the first gets the cached rate. Longer runs re-prime the cache automatically.

```python
from gantrygraph import GantryEngine
from langchain_anthropic import ChatAnthropic

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    enable_caching=True,
)
```

> **Provider note:** `enable_caching=True` has no effect with OpenAI or other providers —
> the flag is silently ignored, no error is raised.

---

## Before / after — 50-step browser task

| Metric | Unoptimized | Optimized |
|---|---|---|
| Tokens per observe step | ~1,500 (screenshot) | ~300 (AXTree) |
| Context growth | O(N²) | O(N) bounded |
| Input token discount | none | up to 90% (cache) |
| Risk of log-flood | high | eliminated |

---

**Next:** [Observability](observability.md) · [State persistence](../concepts/engine.md) · [Browser agent](browser-agent.md)
