'use client';

import { useState } from 'react';

type TokenType = 'kw' | 'fn' | 'str' | 'cm' | 'dec' | 'pn' | 'num' | '' | ' ';
interface Token { t: TokenType; v: string }
interface UseCase {
  id: string; num: string; title: string; desc: string;
  code: { tokens: Token[] }[];
  bullets: string[];
}

const USECASES: UseCase[] = [
  {
    id: 'browser',
    num: '01',
    title: 'Browser Automation',
    desc: 'Navigate, extract, and fill forms — with stealth mode.',
    code: [
      {tokens:[{t:'kw',v:'from'},{t:' ',v:' '},{t:'fn',v:'gantrygraph'},{t:' ',v:' '},{t:'kw',v:'import'},{t:' ',v:' '},{t:'fn',v:'GantryEngine'}]},
      {tokens:[{t:'kw',v:'from'},{t:' ',v:' '},{t:'fn',v:'gantrygraph.perception'},{t:' ',v:' '},{t:'kw',v:'import'},{t:' ',v:' '},{t:'fn',v:'WebPage'}]},
      {tokens:[{t:'kw',v:'from'},{t:' ',v:' '},{t:'fn',v:'gantrygraph.actions'},{t:' ',v:' '},{t:'kw',v:'import'},{t:' ',v:' '},{t:'fn',v:'BrowserTools'}]},
      {tokens:[]},
      {tokens:[{t:'',v:'web '},{t:'pn',v:'= '},{t:'fn',v:'WebPage'},{t:'pn',v:'(url='},{t:'str',v:'"https://news.ycombinator.com"'},{t:'pn',v:', headless='},{t:'kw',v:'True'},{t:'pn',v:')'}]},
      {tokens:[]},
      {tokens:[{t:'',v:'agent '},{t:'pn',v:'= '},{t:'fn',v:'GantryEngine'},{t:'pn',v:'('}]},
      {tokens:[{t:'',v:'    llm'},{t:'pn',v:'='},{t:'fn',v:'ChatAnthropic'},{t:'pn',v:'(model='},{t:'str',v:'"claude-sonnet-4-6"'},{t:'pn',v:'),'}]},
      {tokens:[{t:'',v:'    perception'},{t:'pn',v:'='},{t:'',v:'web'},{t:'pn',v:','}]},
      {tokens:[{t:'',v:'    tools'},{t:'pn',v:'=['},{t:'fn',v:'BrowserTools'},{t:'pn',v:'(web_page='},{t:'',v:'web'},{t:'pn',v:')],'}]},
      {tokens:[{t:'pn',v:')'}]},
      {tokens:[]},
      {tokens:[{t:'cm',v:'# Scrape top stories with screenshots on every step'}]},
      {tokens:[{t:'',v:'result '},{t:'pn',v:'= '},{t:'',v:'agent'},{t:'pn',v:'.'},{t:'fn',v:'run'},{t:'pn',v:'('},{t:'str',v:'"Find the top 5 stories and their links"'},{t:'pn',v:')'}]},
    ],
    bullets: [
      'Stealth mode — UA patch, webdriver undefined, random delays',
      'browser_click_text bypasses CSS-selector failures on dynamic DOM',
      'Combine with WebSearchTool to search + browse in one agent',
    ],
  },
  {
    id: 'desktop',
    num: '02',
    title: 'Desktop Automation',
    desc: 'Drive any desktop app — including ones with no API.',
    code: [
      {tokens:[{t:'kw',v:'from'},{t:' ',v:' '},{t:'fn',v:'gantrygraph'},{t:' ',v:' '},{t:'kw',v:'import'},{t:' ',v:' '},{t:'fn',v:'GantryEngine'}]},
      {tokens:[{t:'kw',v:'from'},{t:' ',v:' '},{t:'fn',v:'gantrygraph.perception'},{t:' ',v:' '},{t:'kw',v:'import'},{t:' ',v:' '},{t:'fn',v:'DesktopScreen'}]},
      {tokens:[{t:'kw',v:'from'},{t:' ',v:' '},{t:'fn',v:'gantrygraph.actions'},{t:' ',v:' '},{t:'kw',v:'import'},{t:' ',v:' '},{t:'fn',v:'MouseKeyboardTools'}]},
      {tokens:[]},
      {tokens:[{t:'',v:'agent '},{t:'pn',v:'= '},{t:'fn',v:'GantryEngine'},{t:'pn',v:'('}]},
      {tokens:[{t:'',v:'    llm'},{t:'pn',v:'='},{t:'fn',v:'ChatAnthropic'},{t:'pn',v:'(model='},{t:'str',v:'"claude-sonnet-4-6"'},{t:'pn',v:'),'}]},
      {tokens:[{t:'',v:'    perception'},{t:'pn',v:'='},{t:'fn',v:'DesktopScreen'},{t:'pn',v:'(),'}]},
      {tokens:[{t:'',v:'    tools'},{t:'pn',v:'=['},{t:'fn',v:'MouseKeyboardTools'},{t:'pn',v:'()],'}]},
      {tokens:[{t:'',v:'    approval_callback'},{t:'pn',v:'='},{t:'',v:'my_approval_fn'},{t:'pn',v:','}]},
      {tokens:[{t:'pn',v:')'}]},
      {tokens:[]},
      {tokens:[{t:'cm',v:'# Requires human approval before any action runs'}]},
      {tokens:[{t:'',v:'agent'},{t:'pn',v:'.'},{t:'fn',v:'run'},{t:'pn',v:'('},{t:'str',v:'"Open the calculator and compute 1337 × 42"'},{t:'pn',v:')'}]},
    ],
    bullets: [
      'Works on any app — no API required, vision-only control',
      'Human-in-the-loop approval queue for sensitive actions',
      'Full screenshot audit log per step',
    ],
  },
  {
    id: 'research',
    num: '03',
    title: 'Autonomous Research',
    desc: 'Gather data from the web, analyze, produce reports.',
    code: [
      {tokens:[{t:'kw',v:'from'},{t:' ',v:' '},{t:'fn',v:'gantrygraph'},{t:' ',v:' '},{t:'kw',v:'import'},{t:' ',v:' '},{t:'fn',v:'GantryEngine'}]},
      {tokens:[{t:'kw',v:'from'},{t:' ',v:' '},{t:'fn',v:'gantrygraph.actions.search'},{t:' ',v:' '},{t:'kw',v:'import'},{t:' ',v:' '},{t:'fn',v:'WebSearchTool'}]},
      {tokens:[{t:'kw',v:'from'},{t:' ',v:' '},{t:'fn',v:'gantrygraph.actions'},{t:' ',v:' '},{t:'kw',v:'import'},{t:' ',v:' '},{t:'fn',v:'FileSystemTools'}]},
      {tokens:[]},
      {tokens:[{t:'',v:'agent '},{t:'pn',v:'= '},{t:'fn',v:'GantryEngine'},{t:'pn',v:'('}]},
      {tokens:[{t:'',v:'    llm'},{t:'pn',v:'='},{t:'fn',v:'ChatAnthropic'},{t:'pn',v:'(model='},{t:'str',v:'"claude-sonnet-4-6"'},{t:'pn',v:'),'}]},
      {tokens:[{t:'',v:'    tools'},{t:'pn',v:'=['}]},
      {tokens:[{t:'',v:'        '},{t:'fn',v:'WebSearchTool'},{t:'pn',v:'(),   '},{t:'cm',v:'# Tavily API'}]},
      {tokens:[{t:'',v:'        '},{t:'fn',v:'FileSystemTools'},{t:'pn',v:'(workspace='},{t:'str',v:'"/tmp/results"'},{t:'pn',v:'),'}]},
      {tokens:[{t:'',v:'    '},{t:'pn',v:'],'}]},
      {tokens:[{t:'pn',v:')'}]},
      {tokens:[]},
      {tokens:[{t:'cm',v:'# Search → read → save results to disk'}]},
      {tokens:[{t:'',v:'agent'},{t:'pn',v:'.'},{t:'fn',v:'run'},{t:'pn',v:'('},{t:'str',v:'"Survey 2025 papers on agent guardrails"'},{t:'pn',v:')'}]},
    ],
    bullets: [
      'WebSearchTool uses Tavily API — avoids CAPTCHA walls on all search engines',
      'FileSystemTools writes results locally — no vendor cloud dependency',
      'Combine with BrowserTools to search, then read pages in depth',
    ],
  },
];

const renderTokens = (tokens: Token[]) =>
  tokens.map((t, i) => <span key={i} className={t.t}>{t.v}</span>);

export default function UseCases() {
  const [active, setActive] = useState(0);
  const uc = USECASES[active];
  const codeStr = uc.code.map(l => l.tokens.map(t => t.v).join('')).join('\n');

  return (
    <section className="section section-divider" id="usecases">
      <div className="container">
        <p className="eyebrow">// USE CASES</p>
        <h2 className="section-title">Browser, desktop, research — one library.</h2>
        <p className="section-sub">
          Real production patterns you can ship today.
        </p>
        <div className="usecase-grid">
          <div className="usecase-tabs">
            {USECASES.map((u, i) => (
              <button key={u.id} className={`usecase-tab ${i === active ? 'active' : ''}`}
                onClick={() => setActive(i)}>
                <div className="tab-num">{u.num}</div>
                <div className="tab-title">{u.title}</div>
                <div className="tab-desc">{u.desc}</div>
              </button>
            ))}
          </div>
          <div className="usecase-panel">
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', borderBottom: '1px solid var(--border)',
              fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-2)', boxShadow: '0 0 8px var(--accent-2)', display: 'inline-block' }} />
                <span>{uc.title.toLowerCase().replace(/\s+/g, '_')}.py</span>
              </div>
              <button onClick={() => navigator.clipboard?.writeText(codeStr)}
                style={{ background: 'transparent', border: 0, color: 'var(--fg-muted)', cursor: 'pointer' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
            </div>
            <pre className="code-block" style={{ margin: 0 }}>
              {uc.code.map((line, i) => (
                <div key={i}>{line.tokens.length === 0 ? <>&nbsp;</> : renderTokens(line.tokens)}</div>
              ))}
            </pre>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {uc.bullets.map((b, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: 'var(--accent)' }}>→</span>
                  <span>{b}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
