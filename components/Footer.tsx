import Link from 'next/link';

const LogoMark = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M5 4 L3 4 L3 20 L5 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M19 4 L21 4 L21 20 L19 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M8 7 L6.5 7 L6.5 17 L8 17" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M16 7 L17.5 7 L17.5 17 L16 17" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <line x1="12" y1="9.5" x2="12" y2="14.5" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" />
    <line x1="9.6" y1="10.8" x2="14.4" y2="13.2" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" />
    <line x1="14.4" y1="10.8" x2="9.6" y2="13.2" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="logo" style={{ marginBottom: 12 }}>
              <span className="logo-mark" style={{ color: 'var(--accent)' }}><LogoMark /></span>
              <span>GantryGraph</span>
            </div>
            <p style={{ color: 'var(--fg-muted)', fontSize: 13.5, lineHeight: 1.55, maxWidth: 300, margin: 0 }}>
              The open framework for AI agents that control the OS.
              LangGraph-native, enterprise guardrails built in.
              MIT licensed. Yours to extend.
            </p>
          </div>
          <div className="footer-col">
            <h5>Product</h5>
            <ul>
              <li><Link href="/docs">Documentation</Link></li>
              <li><Link href="/quickstart">Quickstart</Link></li>
              <li><Link href="/api-reference">API Reference</Link></li>
              <li><Link href="/community">Community</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h5>Resources</h5>
            <ul>
              <li><a href="https://github.com/GantryGraph/GantryGraph" target="_blank" rel="noopener noreferrer">GitHub Repository</a></li>
              <li><a href="https://pypi.org/project/gantrygraph/" target="_blank" rel="noopener noreferrer">PyPI Package</a></li>
              <li><Link href="/#faq">FAQ</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h5>Community</h5>
            <ul>
              <li><a href="https://github.com/GantryGraph/GantryGraph" target="_blank" rel="noopener noreferrer">GitHub</a></li>
              <li><a href="https://github.com/GantryGraph/GantryGraph/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer">Contribute</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h5>Legal</h5>
            <ul>
              <li><a href="https://github.com/GantryGraph/GantryGraph/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">MIT License</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <div>© 2026 GantryGraph · MIT License</div>
          <div>v{process.env.NEXT_PUBLIC_APP_VERSION ?? '0.5.0'} · python 3.11+ · linux · macos · windows</div>
        </div>
      </div>
    </footer>
  );
}
