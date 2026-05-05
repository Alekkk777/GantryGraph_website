import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CodeBlock from '@/components/CodeBlock';

export const metadata: Metadata = {
  title: 'Quickstart — GantryGraph',
  description: 'From zero to a working AI agent in five minutes.',
};

export default async function QuickstartPage() {
  return (
    <>
      <Header variant="docs" />
      <div className="docs-layout">
        <nav className="docs-sidebar">
          <div className="sidebar-section">
            <div className="sidebar-section-title">Getting Started</div>
            <ul>
              <li><Link href="/docs" className="sidebar-link">Introduction</Link></li>
              <li><Link href="/quickstart" className="sidebar-link active">Quickstart</Link></li>
            </ul>
          </div>
          <div className="sidebar-section">
            <div className="sidebar-section-title">Concepts</div>
            <ul>
              <li><Link href="/docs/concepts/engine" className="sidebar-link">The agent loop</Link></li>
              <li><Link href="/docs/concepts/perception" className="sidebar-link">Perception</Link></li>
              <li><Link href="/docs/concepts/tools" className="sidebar-link">Tools &amp; actions</Link></li>
              <li><Link href="/docs/concepts/guardrails" className="sidebar-link">Guardrails</Link></li>
              <li><Link href="/docs/concepts/memory" className="sidebar-link">Memory</Link></li>
            </ul>
          </div>
          <div className="sidebar-section">
            <div className="sidebar-section-title">Guides</div>
            <ul>
              <li><Link href="/docs/how-to/browser-agent" className="sidebar-link">Browser agent</Link></li>
              <li><Link href="/docs/how-to/desktop-agent" className="sidebar-link">Desktop agent</Link></li>
              <li><Link href="/docs/how-to/web-search" className="sidebar-link">Web search</Link></li>
              <li><Link href="/docs/how-to/mcp" className="sidebar-link">Connect MCP tools</Link></li>
              <li><Link href="/docs/how-to/filesystem" className="sidebar-link">Files &amp; shell</Link></li>
              <li><Link href="/docs/how-to/human-approval" className="sidebar-link">Human approval</Link></li>
            </ul>
          </div>
          <div className="sidebar-section">
            <ul>
              <li><Link href="/api-reference" className="sidebar-link">API Reference</Link></li>
            </ul>
          </div>
        </nav>

        <article className="docs-main">
          <div className="docs-breadcrumb">
            <Link href="/">GantryGraph</Link> / Quickstart
          </div>

          <h1>Quickstart</h1>
          <p className="lede">From zero to a working agent in five minutes.</p>

          <div className="callout">
            <div className="callout-title">Requirements</div>
            Python 3.10+ · macOS, Linux, or Windows · an API key from Anthropic,
            OpenAI, or any LangChain-compatible provider.
          </div>

          <h2>1. Install</h2>
          <CodeBlock lang="bash" code={`pip install gantrygraph

# with browser and search extras
pip install 'gantrygraph[browser,search]'
playwright install chromium`} />

          <h2>2. Set your API key</h2>
          <CodeBlock lang="bash" code={`export ANTHROPIC_API_KEY="sk-ant-..."
# or
export OPENAI_API_KEY="sk-..."`} />

          <h2>3. Your first agent</h2>
          <p>Create <code>hello_agent.py</code>:</p>
          <CodeBlock lang="python" code={`from gantrygraph import GantryEngine
from langchain_anthropic import ChatAnthropic

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    max_steps=20,
)

result = agent.run("What is the current working directory?")
print(result)`} />

          <h2>4. Add a browser</h2>
          <CodeBlock lang="python" code={`from gantrygraph import GantryEngine
from gantrygraph.perception import WebPage
from gantrygraph.actions import BrowserTools
from langchain_anthropic import ChatAnthropic

web = WebPage(url="https://news.ycombinator.com", headless=True)

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    perception=web,
    tools=[BrowserTools(web_page=web)],
    max_steps=20,
)

result = agent.run("Find the top 5 stories and return their titles and links.")
print(result)`} />

          <div className="callout success">
            <div className="callout-title">That&apos;s it</div>
            You have a working browser agent. From here, add tools, tighten security,
            and stream events to your UI.
          </div>

          <h2>5. Stream events in real time</h2>
          <CodeBlock lang="python" code={`import asyncio
from gantrygraph import GantryEngine
from gantrygraph.perception import WebPage
from gantrygraph.actions import BrowserTools
from langchain_anthropic import ChatAnthropic

async def main():
    web = WebPage(url="https://example.com", headless=True)
    agent = GantryEngine(
        llm=ChatAnthropic(model="claude-sonnet-4-6"),
        perception=web,
        tools=[BrowserTools(web_page=web)],
    )
    async for event in agent.astream_events("Find the pricing page"):
        print(event.event_type, event.step, event.data)

asyncio.run(main())`} />

          <h2>Next steps</h2>
          <ul>
            <li>Read <Link href="/docs/concepts/engine">The agent loop</Link> to understand observe → think → act → review.</li>
            <li>Add guardrails before granting wider access — see <Link href="/docs/concepts/guardrails">Guardrails</Link>.</li>
            <li>Browse the full <Link href="/api-reference">API Reference</Link>.</li>
          </ul>

          <div className="page-nav">
            <Link href="/docs">
              <span className="label">← Previous</span>
              <span className="title">Introduction</span>
            </Link>
            <Link href="/api-reference" className="next">
              <span className="label">Next →</span>
              <span className="title">API Reference</span>
            </Link>
          </div>
        </article>
      </div>
      <Footer />
    </>
  );
}
