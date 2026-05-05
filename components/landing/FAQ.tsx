'use client';

import { useState } from 'react';

const FAQ_ITEMS = [
  {
    q: 'How is GantryGraph different from OpenHands or browser-use?',
    a: 'GantryGraph is a Python library you drop into any service — not a standalone platform. Its scope spans the entire OS (desktop apps, browsers, local Python functions, and MCP servers) instead of being limited to coding workflows or web pages. GuardrailPolicy, native MCP support, and async event streaming come built-in rather than as add-ons.',
  },
  {
    q: 'Do I have to use Claude? Can I bring my own model?',
    a: 'No lock-in. GantryEngine accepts any LangChain chat model — Claude, GPT-4o, Gemini, Pixtral, Qwen2-VL, or any local model exposed over an OpenAI-compatible endpoint. Pass it as llm= at construction time.',
  },
  {
    q: 'Is it safe to run an agent on my real desktop?',
    a: 'GantryGraph is zero-trust by design. Use GuardrailPolicy to control which domains can be visited, which shell commands are allowed, and which actions require human approval via approval_callback. You explicitly opt in to capabilities, not out of them.',
  },
  {
    q: 'Does it work on Linux servers (Docker / k8s)?',
    a: 'Yes. Playwright runs headless inside any container. The agent loop is fully async, so it maps cleanly to FastAPI WebSocket endpoints and remote UIs.',
  },
  {
    q: 'How do I avoid CAPTCHA / bot-detection?',
    a: 'BrowserTools ships with stealth=True by default — it patches navigator.webdriver, sets a realistic Chrome UA, populates navigator.plugins and navigator.languages, and adds random delays to clicks. For search queries, use WebSearchTool (Tavily API) instead of navigating to search engines directly.',
  },
  {
    q: 'How does MCP integration work?',
    a: 'Pass an MCPConnector instance in tools=[]. Tools are auto-discovered from the server. Connect to GitHub, Slack, Postgres, Notion, arXiv, or any custom MCP server with one import.',
  },
  {
    q: 'Is GantryGraph open source?',
    a: 'Yes — MIT licensed on GitHub and PyPI. Free forever for the core library.',
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number>(0);

  return (
    <section className="section section-divider" id="faq">
      <div className="container">
        <p className="eyebrow">// FAQ</p>
        <h2 className="section-title">Questions, answered.</h2>
        <p className="section-sub">
          Common questions from engineers evaluating GantryGraph.
        </p>
        <div className="faq-list">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className={`faq-item ${open === i ? 'open' : ''}`}>
              <button className="faq-q" onClick={() => setOpen(open === i ? -1 : i)}>
                <span>{item.q}</span>
                <svg className="faq-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
              <div className="faq-a">{item.a}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
