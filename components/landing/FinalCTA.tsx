'use client';

import Link from 'next/link';

const CopyIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

export default function FinalCTA() {
  return (
    <section className="final-cta" id="quickstart">
      <div className="container">
        <h2>
          <span className="gradient-text">Build your own agent.</span><br />
          <span className="gradient-text-accent">Make it yours.</span>
        </h2>
        <button
          className="giant-install"
          onClick={() => navigator.clipboard?.writeText('pip install gantrygraph')}
        >
          <span style={{ color: 'var(--fg-dim)' }}>$</span>
          <span>pip install gantrygraph</span>
          <span style={{ color: 'var(--accent)' }}><CopyIcon /></span>
        </button>
        <div style={{ marginTop: 24, fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--fg-dim)' }}>
          Open source · MIT license · Python 3.10+
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link className="btn btn-primary" href="/quickstart">Get started →</Link>
          <a className="btn" href="https://github.com/GantryGraph/GantryGraph" target="_blank" rel="noopener noreferrer">View on GitHub</a>
        </div>
      </div>
    </section>
  );
}
