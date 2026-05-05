import type { Metadata } from 'next';
import { readFile } from 'fs/promises';
import path from 'path';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DocsSidebar from '@/components/docs/Sidebar';
import { renderMarkdown } from '@/lib/markdown';

export const metadata: Metadata = {
  title: 'API Reference — GantryGraph',
  description: 'Complete API reference for GantryGraph — all classes, parameters, and types.',
};

export default async function ApiReferencePage() {
  const filePath = path.join(process.cwd(), 'content', 'docs', 'api-reference.md');
  const markdown = await readFile(filePath, 'utf-8');
  const html = await renderMarkdown(markdown);

  return (
    <>
      <Header variant="docs" />
      <div className="docs-layout">
        <DocsSidebar />
        <article className="docs-main">
          <div className="docs-breadcrumb">
            <Link href="/">GantryGraph</Link> / API Reference
          </div>
          <div className="docs-content" dangerouslySetInnerHTML={{ __html: html }} />
        </article>
      </div>
      <Footer />
    </>
  );
}
