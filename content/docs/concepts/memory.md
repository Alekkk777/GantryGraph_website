# Memory

Memory lets the agent recall results from earlier steps or from previous runs.

## The problem it solves

Each loop iteration the LLM only sees the current task description and tool results
from that session. Without memory, an agent that ran a task last week cannot use
what it learned — it starts from scratch every time.

Two situations where you need memory:

- **Long multi-step tasks** — the agent needs to recall findings from 10 steps ago
- **Recurring agents** — the agent runs daily and should remember past outcomes

## Two backends

| Backend | Persists? | Setup | Use when |
|---------|-----------|-------|----------|
| `InMemoryStore` | No — resets on exit | Zero | Single run, development, testing |
| `ChromaMemory` | Yes — on disk | `pip install 'gantrygraph[memory]'` | Across multiple runs |

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

Uses trigram Jaccard similarity — zero dependencies, instant setup.
All entries are lost when the process exits.

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

Uses sentence-transformer embeddings with ChromaDB.
The first run downloads the model (~90 MB); subsequent runs use the cache.
Pass `persist_directory=None` for an in-memory ChromaDB (no disk writes).

## How it works

Attaching a memory store adds two automatic steps to the agent loop:

| Step | When | What happens |
|------|------|--------------|
| **Recall** | Before the first think step | The engine searches the store with the task as the query, injects the top 3 matches as context |
| **Store** | After the run completes | The engine saves `"Task: {task}\nResult: {result}"` for future retrieval |

The agent does not call memory tools explicitly — everything is managed automatically.

## Searching memory directly

You can also query the store from your own code:

```python
results = await memory.search("authentication errors", k=3)
for r in results:
    print(f"{r.score:.2f}  {r.text}")
```

Results have a `score` between 0 and 1. Higher = more semantically similar.

## Custom backend

Subclass `BaseMemory` and implement three methods:

```python
from gantrygraph.memory.base import BaseMemory, MemoryResult

class RedisMemory(BaseMemory):
    async def add(self, text: str, metadata: dict | None = None) -> None:
        ...  # store text in Redis

    async def search(self, query: str, k: int = 5) -> list[MemoryResult]:
        ...  # return k most relevant entries

    async def close(self) -> None:
        ...  # clean up connections
```

Pass it directly to `GantryEngine(memory=RedisMemory(...))`.

---

**See also:** [Memory guide](../how-to/memory.md) · [API reference](../api-reference.md#memory)
