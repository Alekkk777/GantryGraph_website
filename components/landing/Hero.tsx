'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

function showToast(text: string) {
  let toast = document.getElementById('__gg-toast') as HTMLDivElement | null;
  if (!toast) {
    toast = document.createElement('div');
    toast.id = '__gg-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = text;
  toast.classList.add('visible');
  const t = toast as HTMLDivElement & { _t?: ReturnType<typeof setTimeout> };
  clearTimeout(t._t);
  t._t = setTimeout(() => toast!.classList.remove('visible'), 1600);
}

function copyText(text: string) {
  navigator.clipboard?.writeText(text).then(() => showToast('Copied to clipboard'));
}

const CopyIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

type TokenType = 'kw' | 'fn' | 'str' | 'cm' | 'dec' | 'pn' | 'num' | '' | ' ';
interface Token { t: TokenType; v: string }
interface CodeLine { text: string; tokens: Token[] }

const HERO_CODE_LINES: CodeLine[] = [
  { text: 'from gantrygraph import GantryEngine, gantry_tool', tokens: [
    {t:'kw',v:'from'},{t:' ',v:' '},{t:'fn',v:'gantrygraph'},{t:' ',v:' '},{t:'kw',v:'import'},{t:' ',v:' '},{t:'fn',v:'GantryEngine'},{t:'pn',v:', '},{t:'fn',v:'gantry_tool'}
  ]},
  { text: 'from gantrygraph.actions import ShellTools', tokens: [
    {t:'kw',v:'from'},{t:' ',v:' '},{t:'fn',v:'gantrygraph.actions'},{t:' ',v:' '},{t:'kw',v:'import'},{t:' ',v:' '},{t:'fn',v:'ShellTools'}
  ]},
  { text: 'from gantrygraph.security import GuardrailPolicy, BudgetPolicy', tokens: [
    {t:'kw',v:'from'},{t:' ',v:' '},{t:'fn',v:'gantrygraph.security'},{t:' ',v:' '},{t:'kw',v:'import'},{t:' ',v:' '},{t:'fn',v:'GuardrailPolicy'},{t:'pn',v:', '},{t:'fn',v:'BudgetPolicy'}
  ]},
  { text: 'from langchain_anthropic import ChatAnthropic', tokens: [
    {t:'kw',v:'from'},{t:' ',v:' '},{t:'fn',v:'langchain_anthropic'},{t:' ',v:' '},{t:'kw',v:'import'},{t:' ',v:' '},{t:'fn',v:'ChatAnthropic'}
  ]},
  { text: '', tokens: [] },
  { text: '@gantry_tool(destructive=True)', tokens: [
    {t:'dec',v:'@gantry_tool'},{t:'pn',v:'(destructive='},{t:'kw',v:'True'},{t:'pn',v:')'}
  ]},
  { text: 'def deploy(env: str) -> str:', tokens: [
    {t:'kw',v:'def'},{t:' ',v:' '},{t:'fn',v:'deploy'},{t:'pn',v:'(env: str) -> str:'}
  ]},
  { text: '    """Deploy to environment. Requires human approval."""', tokens: [
    {t:'str',v:'    """Deploy to environment. Requires human approval."""'}
  ]},
  { text: '', tokens: [] },
  { text: 'agent = GantryEngine(', tokens: [
    {t:'',v:'agent '},{t:'pn',v:'= '},{t:'fn',v:'GantryEngine'},{t:'pn',v:'('}
  ]},
  { text: '    llm=ChatAnthropic(model="claude-sonnet-4-6"),', tokens: [
    {t:'',v:'    llm'},{t:'pn',v:'='},{t:'fn',v:'ChatAnthropic'},{t:'pn',v:'(model='},{t:'str',v:'"claude-sonnet-4-6"'},{t:'pn',v:'),'}
  ]},
  { text: '    tools=[ShellTools(workspace="/app"), deploy],', tokens: [
    {t:'',v:'    tools'},{t:'pn',v:'=['},{t:'fn',v:'ShellTools'},{t:'pn',v:'(workspace='},{t:'str',v:'"/app"'},{t:'pn',v:'), deploy],'}
  ]},
  { text: '    guardrail=GuardrailPolicy(requires_approval={"deploy"}),', tokens: [
    {t:'',v:'    guardrail'},{t:'pn',v:'='},{t:'fn',v:'GuardrailPolicy'},{t:'pn',v:'(requires_approval={'},{t:'str',v:'"deploy"'},{t:'pn',v:'}),'}
  ]},
  { text: '    budget=BudgetPolicy(max_tokens=10_000, on_limit="stop"),', tokens: [
    {t:'',v:'    budget'},{t:'pn',v:'='},{t:'fn',v:'BudgetPolicy'},{t:'pn',v:'(max_tokens='},{t:'num',v:'10_000'},{t:'pn',v:', on_limit='},{t:'str',v:'"stop"'},{t:'pn',v:'),'}
  ]},
  { text: ')', tokens: [{t:'pn',v:')'}] },
];

const FULL_CODE = HERO_CODE_LINES.map(l => l.tokens.map(t => t.v).join('')).join('\n');

function Terminal() {
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return;
    if (lineIdx >= HERO_CODE_LINES.length) { setDone(true); return; }
    const line = HERO_CODE_LINES[lineIdx];
    if (charIdx >= line.text.length) {
      const t = setTimeout(() => { setLineIdx(i => i + 1); setCharIdx(0); }, line.text === '' ? 60 : 90);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setCharIdx(c => c + 1), 14);
    return () => clearTimeout(t);
  }, [lineIdx, charIdx, done]);

  const renderTokens = (tokens: Token[], takeChars: number) => {
    let used = 0;
    return tokens.map((tk, i) => {
      const remaining = takeChars - used;
      if (remaining <= 0) return null;
      const slice = tk.v.slice(0, remaining);
      used += slice.length;
      return <span key={i} className={tk.t}>{slice}</span>;
    });
  };

  return (
    <div className="terminal" id="hero-terminal">
      <div className="term-titlebar">
        <div className="term-traffic"><span /><span /><span /></div>
        <div className="term-tab">agent.py — gantrygraph</div>
        <div style={{ flex: 1 }} />
        <button
          className="copy-btn"
          style={{ background: 'transparent', border: 0, color: 'var(--fg-dim)', cursor: 'pointer' }}
          onClick={() => copyText(FULL_CODE)}
        >
          <CopyIcon />
        </button>
      </div>
      <pre className="term-body">
        {HERO_CODE_LINES.slice(0, lineIdx + 1).map((line, i) => {
          const isCurrent = i === lineIdx && !done;
          const take = isCurrent ? charIdx : line.text.length;
          return (
            <div key={i}>
              {renderTokens(line.tokens, take)}
              {isCurrent && <span className="cursor" />}
              {!isCurrent && line.text === '' && <span>&nbsp;</span>}
            </div>
          );
        })}
      </pre>
    </div>
  );
}

interface StreamEvent {
  t: 'thought' | 'tool' | 'action';
  ts: string;
  label: string;
  msg: string;
}

const STREAM_EVENTS: StreamEvent[] = [
  { t: 'thought', ts: '00:00.3', label: 'think', msg: 'I need to deploy to staging. Calling deploy().' },
  { t: 'tool',    ts: '00:00.6', label: 'guardrail', msg: 'policy_check: deploy requires human approval' },
  { t: 'action',  ts: '00:01.1', label: 'suspended', msg: 'Waiting for approval — thread_id: tk_0x4a91' },
  { t: 'thought', ts: '00:04.2', label: 'approved', msg: 'Human approved. Resuming execution.' },
  { t: 'tool',    ts: '00:04.5', label: 'tool_call', msg: 'deploy(env="staging")' },
  { t: 'action',  ts: '00:05.1', label: 'budget', msg: 'tokens used: 4 231 / 10 000 · steps: 3 / 5' },
  { t: 'thought', ts: '00:05.8', label: 'done', msg: 'Deploy complete. All checks passed.' },
];

function AgentStream() {
  const [count, setCount] = useState(1);

  useEffect(() => {
    const id = setInterval(() => {
      setCount(c => (c >= STREAM_EVENTS.length ? 1 : c + 1));
    }, 1100);
    return () => clearInterval(id);
  }, []);

  const visible = STREAM_EVENTS.slice(0, count);
  return (
    <div className="stream-panel">
      <div className="stream-head">
        <div className="stream-head-left">
          <span className="live-dot" />
          <span>agent.astream_events()</span>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-dim)' }}>
          thread_id: <span style={{ color: 'var(--fg-muted)' }}>tk_0x4a91</span>
        </div>
      </div>
      <div className="stream-body">
        {visible.map((e, i) => (
          <div key={`${i}-${count}`} className={`stream-event ${e.t}`}>
            <div className="ts">{e.ts}</div>
            <div>
              <div className="label">{e.label}</div>
              <div className="msg">{e.msg}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const version = process.env.NEXT_PUBLIC_PYPI_VERSION ?? '0.5.0';

export default function Hero() {
  return (
    <section className="hero" id="top">
      <div className="container">
        <div className="hero-grid">
          <div>
            <div className="pill">
              <span className="pill-dot" />
              <span>GantryGraph <em>v{version}</em> is now live on PyPI</span>
            </div>
            <h1 className="hero-title">
              <span className="gradient-text">OS-level AI agents</span><br />
              <span className="gradient-text-accent">built for Developers.</span>
            </h1>
            <p className="hero-sub">
              GantryGraph transforms LangGraph into a secure, fully-controllable engine
              for desktop and web automation. Built-in guardrails, cost control,
              and seamless Python integration.
            </p>
            <div className="hero-cta">
              <Link className="btn btn-primary" href="/docs">
                Read the Docs
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </Link>
              <button className="copy-block" onClick={() => copyText('pip install gantrygraph')}>
                <span className="dollar">$</span>
                <span>pip install gantrygraph</span>
                <span className="copy-btn"><CopyIcon /></span>
              </button>
            </div>
            <div style={{ marginTop: 24, display: 'flex', gap: 24, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-dim)', flexWrap: 'wrap' }}>
              <span>★ MIT License</span>
              <span>· LangGraph-native</span>
              <span>· GuardrailPolicy</span>
              <span>· BudgetPolicy</span>
            </div>
          </div>
          <div>
            <Terminal />
          </div>
        </div>
      </div>
    </section>
  );
}
