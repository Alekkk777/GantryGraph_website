import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Community — GantryGraph',
  description: 'Join the GantryGraph community on GitHub and Discord.',
};

export default function CommunityPage() {
  return (
    <>
      <Header variant="landing" />
      <main>
        <section className="hero" style={{ paddingBottom: 80 }}>
          <div className="container">
            <p className="eyebrow">// COMMUNITY</p>
            <h1 className="section-title" style={{ fontSize: 'clamp(32px, 4vw, 56px)', marginBottom: 16 }}>
              <span className="gradient-text">Built in the open.</span><br />
              <span className="gradient-text-accent">Shaped by the community.</span>
            </h1>
            <p className="section-sub" style={{ marginBottom: 48 }}>
              GantryGraph is MIT licensed and developed in public on GitHub.
              Join the discussion, report issues, and shape the roadmap.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, maxWidth: 900 }}>
              {[
                {
                  title: 'GitHub',
                  desc: 'Star the repo, open issues, and submit pull requests. This is where the library lives.',
                  href: 'https://github.com/GantryGraph/GantryGraph',
                  cta: 'Open GitHub →',
                },
{
                  title: 'PyPI',
                  desc: 'The stable releases are on PyPI. pip install gantrygraph to get started.',
                  href: 'https://pypi.org/project/gantrygraph/',
                  cta: 'View on PyPI →',
                },
                {
                  title: 'Contributing',
                  desc: 'Read the contributing guide to learn how to add tools, fix bugs, and improve docs.',
                  href: 'https://github.com/GantryGraph/GantryGraph/blob/main/CONTRIBUTING.md',
                  cta: 'How to contribute →',
                },
              ].map((card, i) => (
                <a
                  key={i}
                  href={card.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block',
                    background: 'var(--bg-elev)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 28,
                    textDecoration: 'none',
                    transition: 'border-color 0.15s',
                  }}
                  className="community-card"
                >
                  <h3 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 600 }}>{card.title}</h3>
                  <p style={{ margin: '0 0 20px', color: 'var(--fg-muted)', fontSize: 14, lineHeight: 1.6 }}>{card.desc}</p>
                  <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{card.cta}</span>
                </a>
              ))}
            </div>

          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
