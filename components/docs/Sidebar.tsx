'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  {
    section: 'Getting Started',
    items: [
      { href: '/docs', label: 'Introduction' },
      { href: '/quickstart', label: 'Quickstart' },
    ],
  },
  {
    section: 'Concepts',
    items: [
      { href: '/docs/concepts/engine', label: 'The agent loop' },
      { href: '/docs/concepts/perception', label: 'Perception' },
      { href: '/docs/concepts/tools', label: 'Tools & actions' },
      { href: '/docs/concepts/guardrails', label: 'Guardrails' },
      { href: '/docs/concepts/memory', label: 'Memory' },
    ],
  },
  {
    section: 'Guides',
    items: [
      { href: '/docs/how-to/browser-agent', label: 'Browser agent' },
      { href: '/docs/how-to/desktop-agent', label: 'Desktop agent' },
      { href: '/docs/how-to/web-search', label: 'Web search' },
      { href: '/docs/how-to/mcp', label: 'Connect MCP tools' },
      { href: '/docs/how-to/human-approval', label: 'Human approval' },
      { href: '/docs/how-to/swarm', label: 'Parallel agents' },
      { href: '/docs/how-to/cloud-deploy', label: 'Deploy to production' },
      { href: '/docs/how-to/filesystem', label: 'Files & shell' },
      { href: '/docs/how-to/memory', label: 'Agent memory' },
      { href: '/docs/how-to/observability', label: 'Observability' },
      { href: '/docs/how-to/custom-tools', label: 'Custom tools' },
    ],
  },
  {
    section: 'Reference',
    items: [
      { href: '/api-reference', label: 'API Reference' },
    ],
  },
];

export default function DocsSidebar() {
  const pathname = usePathname();

  return (
    <nav className="docs-sidebar">
      {NAV.map((group) => (
        <div className="sidebar-section" key={group.section}>
          <div className="sidebar-section-title">{group.section}</div>
          <ul>
            {group.items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
