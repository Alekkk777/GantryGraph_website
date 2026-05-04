# Remember things between steps

By default every agent run starts fresh — it sees only its task description and
tool results from the current session. Add a memory store when the agent needs to
recall facts from previous steps or previous runs.

## In-memory (same session, no setup)

`InMemoryStore` is zero-dependency and instant to set up. It resets when your
process exits, so use it when you only need recall within a single run.

```python
from gantrygraph import GantryEngine
from gantrygraph.memory import InMemoryStore
from langchain_anthropic import ChatAnthropic

memory = InMemoryStore()

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    memory=memory,
    max_steps=30,
)

result = agent.run(
    "Research three open-source Python agent frameworks, "
    "store a summary of each, then compare them."
)
```

The agent can call `memory_add` to store a fact and `memory_search` to retrieve
relevant facts by semantic similarity at any later step.

## Persistent (survives restarts)

`ChromaMemory` stores embeddings on disk via ChromaDB.
Use it when you want the agent to remember things across multiple runs.

```python
pip install 'gantrygraph[memory]'
```

```python
from gantrygraph import GantryEngine
from gantrygraph.memory import ChromaMemory
from langchain_anthropic import ChatAnthropic

memory = ChromaMemory(
    collection_name="my_agent",
    persist_directory="/var/lib/agent/memory",
)

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    memory=memory,
    max_steps=30,
)
```

Every time the agent stores a fact it is written to disk. On the next run
the agent can search for and retrieve those facts by semantic similarity.

## How the agent uses memory

When you attach a memory store, `GantryEngine` automatically adds two tools
to the agent's tool list:

| Tool name       | What the agent does with it                              |
|-----------------|----------------------------------------------------------|
| `memory_add`    | Store a text snippet with optional metadata              |
| `memory_search` | Retrieve the `k` most semantically similar past entries  |

The agent decides when to use them based on the task — you do not need to
instruct it explicitly.

## Search results

`memory_search` returns results sorted by similarity score. Each result has
the stored text and any metadata you attached:

```python
results = await memory.search("authentication errors", k=3)
for r in results:
    print(r.score, r.text, r.metadata)
```

## Build a custom backend

Subclass `BaseMemory` and implement `add`, `search`, and `close`:

```python
from gantrygraph.memory.base import BaseMemory, MemoryResult

class RedisMemory(BaseMemory):
    async def add(self, text: str, metadata=None) -> None:
        ...

    async def search(self, query: str, k: int = 5) -> list[MemoryResult]:
        ...

    async def close(self) -> None:
        ...
```
