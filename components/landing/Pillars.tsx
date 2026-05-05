const ShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L4 6v6c0 5 3.5 9.5 8 10 4.5-.5 8-5 8-10V6l-8-4z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);
const StopIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" stroke="none" />
  </svg>
);
const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const PuzzleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 11h-1V7a2 2 0 0 0-2-2h-4V4a2 2 0 1 0-4 0v1H4a2 2 0 0 0-2 2v4h1a2 2 0 1 1 0 4H2v4a2 2 0 0 0 2 2h4v-1a2 2 0 1 1 4 0v1h4a2 2 0 0 0 2-2v-4h1a2 2 0 1 0 0-4z" />
  </svg>
);

export default function Pillars() {
  return (
    <section className="section" id="pillars">
      <div className="container">
        <p className="eyebrow">// WHY GANTRYGRAPH</p>
        <h2 className="section-title">Built for production, not demos.</h2>
        <p className="section-sub">
          Computer Use APIs give you a black box. GantryGraph gives you a Python library
          you can audit, extend, and integrate into any backend — with enterprise-grade
          controls built into the execution loop from day one.
        </p>
        <div className="bento">
          <div className="bento-card" style={{ gridColumn: '1', gridRow: '1' }}>
            <div className="pillar-icon"><ShieldIcon /></div>
            <h3>Native security guardrails</h3>
            <p>
              <code>ShellDenylist</code> blocks destructive commands —{' '}
              <code>rm&nbsp;-rf&nbsp;/</code>, fork bombs, <code>curl&nbsp;|&nbsp;bash</code> — before
              they reach the OS. <code>GuardrailPolicy</code> gates any tool behind
              a human approval step. Zero-trust by default, not bolted on.
            </p>
          </div>
          <div className="bento-card" style={{ gridColumn: '2', gridRow: '1' }}>
            <div className="pillar-icon"><StopIcon /></div>
            <h3>API budget kill-switch</h3>
            <p>
              <code>BudgetPolicy</code> hard-stops the agent when it exceeds a token
              count, wall-clock time, or step limit. <code>on_limit="stop"</code> raises
              immediately — no graceful degradation, no runaway spend.
              Set it once, sleep soundly.
            </p>
          </div>
          <div className="bento-card" style={{ gridColumn: '1', gridRow: '2' }}>
            <div className="pillar-icon"><EyeIcon /></div>
            <h3>Full execution control</h3>
            <p>
              Built on LangGraph — every node is observable and modifiable.
              Stream events via <code>astream_events()</code>, inject custom nodes,
              attach checkpointers for suspend/resume. You own the graph.
              No magic, no hidden complexity.
            </p>
          </div>
          <div className="bento-card" style={{ gridColumn: '2', gridRow: '2' }}>
            <div className="pillar-icon"><PuzzleIcon /></div>
            <h3>Drops into your stack</h3>
            <p>
              A Python library, not a Docker container or a SaaS. Import it into
              FastAPI, Django, or a Lambda. Connect to any MCP server — GitHub,
              Postgres, Slack — with zero integration code. Model-agnostic:
              Claude, GPT-4o, Gemini, or local.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
