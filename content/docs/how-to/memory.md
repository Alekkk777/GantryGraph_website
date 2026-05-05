# Add Memory to Your Agent

> Let the agent recall facts from earlier steps or previous runs using a pluggable memory store.

## Step 1 — In-memory store

```python
from gantrygraph import GantryEngine
from gantrygraph.memory import InMemoryStore
from langchain_anthropic import ChatAnthropic

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    memory=InMemoryStore(),
    max_steps=30,
)

result = agent.run(
    "Research three open-source Python agent frameworks, "
    "store a summary of each, then compare them."
)
print(result)
```

`InMemoryStore` uses trigram Jaccard similarity for retrieval — zero dependencies, instant setup. All entries are held in RAM and lost when the process exits. `GantryEngine` automatically stores the task result in memory at the end of each run and recalls relevant past results at the start of the next.

## Step 2 — Persistent store

```bash
pip install 'gantrygraph[memory]'
```

```python
from gantrygraph import GantryEngine
from gantrygraph.memory import ChromaMemory
from langchain_anthropic import ChatAnthropic

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    memory=ChromaMemory(
        collection_name="my_agent",
        persist_directory="/var/lib/agent/memory",
    ),
    max_steps=30,
)

result = agent.run("Summarise this week's pull requests.")
print(result)
```

`ChromaMemory` persists embeddings to disk via ChromaDB and uses sentence-transformer embeddings for semantic search. The next run automatically recalls the most relevant past entries.

## Step 3 — Custom backend

```python
from gantrygraph.memory.base import BaseMemory, MemoryResult

class RedisMemory(BaseMemory):
    def __init__(self, redis_url: str) -> None:
        import redis.asyncio as aioredis
        self._redis = aioredis.from_url(redis_url)

    async def add(self, text: str, metadata: dict | None = None) -> None:
        import json, uuid
        key = f"memory:{uuid.uuid4()}"
        await self._redis.set(key, json.dumps({"text": text, "meta": metadata or {}}))

    async def search(self, query: str, k: int = 5) -> list[MemoryResult]:
        # implement semantic or keyword search here
        return []

    async def close(self) -> None:
        await self._redis.aclose()

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    memory=RedisMemory("redis://localhost:6379"),
    max_steps=20,
)
```

Subclass `BaseMemory` and implement `add`, `search`, and optionally `close`. `GantryEngine` calls all three automatically.

---

## Complete example

```python
import asyncio
from gantrygraph import GantryEngine
from gantrygraph.memory import ChromaMemory
from gantrygraph.actions import FileSystemTools, ShellTools
from langchain_anthropic import ChatAnthropic

memory = ChromaMemory(
    collection_name="code_agent",
    persist_directory="./agent_memory",
)

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    tools=[
        FileSystemTools(workspace="/my/project"),
        ShellTools(workspace="/my/project", allowed_commands=["pytest", "git"]),
    ],
    memory=memory,
    max_steps=25,
)

# First run — agent stores what it learns
asyncio.run(agent.arun("Explore the project structure and summarise the architecture."))

# Second run — agent recalls the architecture summary automatically
asyncio.run(agent.arun("Add a new endpoint following the existing patterns."))
```

---

## Variants

- **In-memory for testing:** `memory=InMemoryStore()` — no install, resets on exit
- **Ephemeral ChromaDB (no disk):** `ChromaMemory(persist_directory=None)`
- **Named collection per project:** `ChromaMemory(collection_name="project-x")`
- **Search memory manually:** `results = await memory.search("authentication errors", k=3)`

## Troubleshooting

**`ImportError: ChromaMemory requires chromadb`** — run `pip install 'gantrygraph[memory]'`.

**Memory results are irrelevant** — `InMemoryStore` uses trigram overlap, not semantic similarity. Switch to `ChromaMemory` for better retrieval on longer or more diverse text.

**`ChromaMemory` is slow on first run** — the first run downloads the sentence-transformer model (~90 MB). Subsequent runs use the cached model.

---

**Next:** [Build custom tools](custom-tools.md) · [Monitor agent execution](observability.md) · [Run agents in parallel](swarm.md)
