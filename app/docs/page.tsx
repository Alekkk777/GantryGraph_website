import type { Metadata } from 'next';
import Link from 'next/link';
import CodeBlock from '@/components/CodeBlock';

export const metadata: Metadata = {
  title: 'Documentation — GantryGraph',
  description: 'GantryGraph documentation — build autonomous AI agents with Python.',
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginTop: 40 }}>
    <h2 style={{ marginBottom: 16 }}>{title}</h2>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
      {children}
    </div>
  </div>
);

const Card = ({ href, title, desc }: { href: string; title: string; desc: string }) => (
  <Link
    href={href}
    style={{
      display: 'block',
      padding: '18px 22px',
      background: 'var(--bg-elev)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      textDecoration: 'none',
      transition: 'border-color 0.15s',
    }}
  >
    <div style={{ fontWeight: 600, marginBottom: 5, color: 'var(--fg)' }}>{title}</div>
    <div style={{ color: 'var(--fg-muted)', fontSize: 13, lineHeight: 1.5 }}>{desc}</div>
  </Link>
);

export default async function DocsIndexPage() {
  return (
    <>
      <div className="docs-breadcrumb">
        <Link href="/">GantryGraph</Link> / Docs
      </div>

      <h1>Documentation</h1>
      <p className="lede" style={{ maxWidth: 680 }}>
        GantryGraph is an open-source Python library for building autonomous AI agents
        that control the desktop, browser, filesystem, and external services.
        Every agent runs a <code>observe → think → act → review</code> loop backed by LangGraph.
      </p>

      <CodeBlock lang="python" code={`from gantrygraph import GantryEngine, gantry_tool
from langchain_anthropic import ChatAnthropic

@gantry_tool
def search_db(query: str) -> str:
    """Search the product database and return matching rows."""
    return db.execute(query)

agent = GantryEngine(
    llm=ChatAnthropic(model="claude-sonnet-4-6"),
    tools=[search_db],
)
print(agent.run("Find all orders placed in the last 7 days."))`} />

      <Section title="Get started">
        <Card
          href="/quickstart"
          title="Quickstart"
          desc="From zero to a working agent in under 5 minutes."
        />
        <Card
          href="/docs/concepts/engine"
          title="How the agent loop works"
          desc="The four steps — observe, think, act, review — and when each runs."
        />
        <Card
          href="/docs/concepts/tools"
          title="Tools and actions"
          desc="@gantry_tool, built-in tool groups, MCP, and BaseAction."
        />
        <Card
          href="/docs/concepts/perception"
          title="Perception sources"
          desc="How the agent sees: DesktopScreen, WebPage, and custom sensors."
        />
      </Section>

      <Section title="Build agents">
        <Card
          href="/docs/how-to/custom-tools"
          title="Build custom tools"
          desc="Turn any function into an LLM-callable tool. Supports sync, async, and stateful groups."
        />
        <Card
          href="/docs/how-to/filesystem"
          title="Read and write files"
          desc="FileSystemTools and ShellTools with sandboxed workspace access."
        />
        <Card
          href="/docs/how-to/browser-agent"
          title="Create a browser agent"
          desc="Navigate websites, fill forms, and scrape data with stealth Playwright."
        />
        <Card
          href="/docs/how-to/desktop-agent"
          title="Create a desktop agent"
          desc="Control mouse, keyboard, and monitor any app on the screen."
        />
        <Card
          href="/docs/how-to/mcp"
          title="Connect services with MCP"
          desc="GitHub, Notion, Postgres, and hundreds more — zero integration code."
        />
        <Card
          href="/docs/how-to/web-search"
          title="Add web search"
          desc="Search the web via Tavily API — no CAPTCHA, structured results."
        />
        <Card
          href="/docs/how-to/memory"
          title="Add memory"
          desc="Let the agent remember facts across steps or across multiple runs."
        />
        <Card
          href="/docs/how-to/swarm"
          title="Run agents in parallel"
          desc="Decompose tasks across specialist workers with GantrySupervisor."
        />
      </Section>

      <Section title="Secure and control">
        <Card
          href="/docs/concepts/guardrails"
          title="Guardrails overview"
          desc="All six security layers: approval gate, shell firewall, secrets, workspace, budget, and destructive flag."
        />
        <Card
          href="/docs/how-to/human-approval"
          title="Require human approval"
          desc="Gate dangerous tool calls with a callback or suspend/resume pattern."
        />
        <Card
          href="/docs/how-to/observability"
          title="Monitor execution"
          desc="telemetry=stdout shortcut, event callbacks, streaming, and OpenTelemetry traces."
        />
      </Section>

      <Section title="Deploy and reference">
        <Card
          href="/docs/how-to/cloud-deploy"
          title="Deploy as a REST API"
          desc="Wrap any agent in an HTTP server with POST /run, SSE streaming, and suspend/resume."
        />
        <Card
          href="/api-reference"
          title="API Reference"
          desc="Full parameter tables for GantryEngine, all tools, security policies, and graph primitives."
        />
      </Section>
    </>
  );
}
