import { notFound } from 'next/navigation';
import { readFile } from 'fs/promises';
import path from 'path';
import Link from 'next/link';
import { renderMarkdown } from '@/lib/markdown';

interface Props {
  params: Promise<{ slug: string[] }>;
}

async function getMarkdown(slug: string[]): Promise<string | null> {
  const filePath = path.join(process.cwd(), 'content', 'docs', ...slug) + '.md';
  try {
    return await readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
}

function slugToTitle(slug: string[]): string {
  const last = slug[slug.length - 1];
  return last.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return { title: `${slugToTitle(slug)} — GantryGraph` };
}

export default async function DocPage({ params }: Props) {
  const { slug } = await params;
  const markdown = await getMarkdown(slug);
  if (!markdown) notFound();

  const slugDir = slug.slice(0, -1).join('/');
  const html = await renderMarkdown(markdown, slugDir);
  const breadcrumb = slug.map((s, i) => ({
    label: s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    href: '/docs/' + slug.slice(0, i + 1).join('/'),
  }));

  return (
    <>
      <div className="docs-breadcrumb">
        <Link href="/">GantryGraph</Link> /
        <Link href="/docs"> Docs</Link>
        {breadcrumb.slice(0, -1).map((b) => (
          <span key={b.href}> / <Link href={b.href}>{b.label}</Link></span>
        ))}
        {' '}/ {breadcrumb[breadcrumb.length - 1].label}
      </div>
      <div
        className="docs-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </>
  );
}
