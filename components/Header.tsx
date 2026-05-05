'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const GitHubIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.05-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.21.09 1.85 1.24 1.85 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23.96-.27 1.99-.4 3.01-.41 1.02.01 2.05.14 3.01.41 2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.49 5.92.43.37.81 1.1.81 2.22 0 1.61-.01 2.9-.01 3.29 0 .32.21.7.83.58C20.56 21.79 24 17.3 24 12 24 5.37 18.63 0 12 0z" />
  </svg>
);

const StarIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const LogoMark = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    {/* outer left bracket */}
    <path d="M5 4 L3 4 L3 20 L5 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {/* outer right bracket */}
    <path d="M19 4 L21 4 L21 20 L19 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {/* inner left bracket */}
    <path d="M8 7 L6.5 7 L6.5 17 L8 17" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {/* inner right bracket */}
    <path d="M16 7 L17.5 7 L17.5 17 L16 17" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {/* asterisk center */}
    <line x1="12" y1="9.5" x2="12" y2="14.5" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" />
    <line x1="9.6" y1="10.8" x2="14.4" y2="13.2" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" />
    <line x1="14.4" y1="10.8" x2="9.6" y2="13.2" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

function formatStars(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

interface HeaderProps {
  variant?: 'landing' | 'docs';
}

export default function Header({ variant = 'landing' }: HeaderProps) {
  const pathname = usePathname();
  const [stars, setStars] = useState<string | null>(null);

  useEffect(() => {
    fetch('https://api.github.com/repos/GantryGraph/GantryGraph')
      .then(r => r.json())
      .then(d => { if (typeof d.stargazers_count === 'number') setStars(formatStars(d.stargazers_count)); })
      .catch(() => {});
  }, []);

  return (
    <header className="header">
      <div className="container header-inner">
        <Link href="/" className="logo">
          <span className="logo-mark" style={{ color: 'var(--accent)' }}>
            <LogoMark />
          </span>
          <span>GantryGraph</span>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-dim)',
            border: '1px solid var(--border)', padding: '2px 6px', borderRadius: 4,
            marginLeft: 4,
          }}>
            {variant === 'docs' ? 'docs · ' : ''}v{process.env.NEXT_PUBLIC_APP_VERSION ?? '0.3.0'}
          </span>
        </Link>
        <nav className="nav">
          <Link href="/" style={pathname === '/' ? { color: 'var(--fg)' } : {}}>Home</Link>
          <Link href="/docs" style={pathname?.startsWith('/docs') ? { color: 'var(--fg)' } : {}}>Docs</Link>
          <Link href="/quickstart" style={pathname === '/quickstart' ? { color: 'var(--fg)' } : {}}>Quickstart</Link>
          <Link href="/api-reference" style={pathname === '/api-reference' ? { color: 'var(--fg)' } : {}}>API Reference</Link>
          <Link href="/community" style={pathname === '/community' ? { color: 'var(--fg)' } : {}}>Community</Link>
        </nav>
        <div className="nav-right">
          <a
            className="icon-btn"
            href="https://github.com/GantryGraph/GantryGraph"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
          >
            <GitHubIcon />
            <StarIcon />
            <span style={{ minWidth: 24, display: 'inline-block' }}>
              {stars ?? '—'}
            </span>
          </a>
          <Link className="btn btn-accent" href="/quickstart">
            pip install →
          </Link>
        </div>
      </div>
    </header>
  );
}
