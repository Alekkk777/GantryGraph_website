# Memory

Memory lets the agent recall results from earlier steps or from previous runs.

## The problem it solves

Each loop iteration the LLM only sees the current task description and tool results
from that session. Without memory, an agent that ran a task last week cannot use
what it learned — it starts from scratch every time.

Two situations where you need memory:

- **Long multi-step tasks** — the agent needs to recall findings from 10 steps ago
- **Recurring agents** — the agent runs daily and should remember past outcomes

## Three backends

| Backend | Persists? | TTL | Setup | Use when |
|---------|-----------|-----|-------|----------|
| `InMemoryStore` | No — resets on exit | No | Zero | Development, testing |
| `ChromaMemory` | Yes — on disk | No | `pip install 'gantrygraph[memory]'` | Across multiple runs |
| `MiniVecDbMemory` | No — in-process | **Yes** | `pip install 'gantrygraph[minivecdb]'` | Long loops where old info should expire |

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

## `MiniVecDbMemory`

```python
from gantrygraph.memory import MiniVecDbMemory
from langchain_openai import OpenAIEmbeddings

embed = OpenAIEmbeddings(model="text-embedding-3-small").embed_query

agent = GantryEngine(
    llm=...,
    memory=MiniVecDbMemory(
        embed_fn=embed,
        ttl_ms=300_000,   # entries expire after 5 minutes
    ),
)
```

Backed by a Rust HNSW engine (MiniVecDb) with 1-bit vector quantisation.
Uses 48 bytes per vector — 32× less RAM than ChromaDB's float32 approach.
The `ttl_ms` parameter makes entries expire automatically: ideal for long
navigation loops where information from early steps becomes stale or
misleading later.

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
