# Memory

Memory lets the agent store and retrieve facts across steps — or across runs.

```
step N: memory_add("user prefers dark mode")
step N+5: memory_search("user preferences")
           → ["user prefers dark mode"]  score=0.94
```

## The problem it solves

Each loop iteration the agent only sees its task description and tool results
from the current session. Long tasks that need to recall earlier findings —
or agents that run repeatedly and need continuity — require explicit memory.

## Two backends

| Backend | Persists? | Setup | Use when |
|---------|-----------|-------|----------|
| `InMemoryStore` | No (resets on exit) | Zero | Within a single run |
| `ChromaMemory` | Yes (disk) | `pip install 'gantrygraph[memory]'` | Across multiple runs |

## `InMemoryStore`

```python
from gantrygraph import GantryEngine
from gantrygraph.memory import InMemoryStore

agent = GantryEngine(
    llm=...,
    memory=InMemoryStore(),
    max_steps=30,
)
```

## `ChromaMemory`

```python
from gantrygraph.memory import ChromaMemory

agent = GantryEngine(
    llm=...,
    memory=ChromaMemory(
        collection_name="my_agent",
        persist_directory="/var/lib/agent/memory",
    ),
)
```

## How it works

When you attach a memory store, the engine adds two tools to the agent's tool list:

| Tool | What it does |
|------|-------------|
| `memory_add` | Store a text snippet with optional metadata |
| `memory_search` | Return the `k` most semantically similar entries |

The agent calls these tools on its own — no extra instructions needed.
Search uses vector similarity (cosine or L2 depending on backend).

## Similarity score

Results are returned with a `score` between 0 and 1. Higher = more relevant.

```python
results = await memory.search("authentication errors", k=3)
for r in results:
    print(f"{r.score:.2f}  {r.text}")
```

## Custom backend

Subclass `BaseMemory`:

```python
from gantrygraph.memory.base import BaseMemory, MemoryResult

class RedisMemory(BaseMemory):
    async def add(self, text: str, metadata=None) -> None: ...
    async def search(self, query: str, k: int = 5) -> list[MemoryResult]: ...
    async def close(self) -> None: ...
```

---

**See also:** [Memory guide](../how-to/memory.md) · [API reference](../api-reference.md#memory)
