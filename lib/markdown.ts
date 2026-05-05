import { marked } from 'marked';
import { createHighlighter } from 'shiki';

const LANG_MAP: Record<string, string> = {
  py: 'python', python: 'python',
  js: 'javascript', javascript: 'javascript',
  ts: 'typescript', typescript: 'typescript',
  sh: 'bash', bash: 'bash', shell: 'bash',
  json: 'json', yaml: 'yaml',
  html: 'html', css: 'css',
  '': 'text', text: 'text',
};

// Top-level pages that live at / not /docs/
const TOP_LEVEL = new Set(['quickstart', 'api-reference', 'community']);

function normalizeLang(raw: string): string {
  const l = raw.trim().toLowerCase();
  return LANG_MAP[l] ?? (l || 'text');
}

function resolveDocLink(href: string, slugDir: string): string {
  if (!href || href.startsWith('http') || href.startsWith('/') || href.startsWith('#')) {
    return href;
  }

  // Split off any #anchor before checking for .md
  const hashIdx = href.indexOf('#');
  const anchor = hashIdx >= 0 ? href.slice(hashIdx) : '';
  const path = hashIdx >= 0 ? href.slice(0, hashIdx) : href;

  if (!path.endsWith('.md')) return href;

  // Strip .md and resolve ../ against the current directory
  const withoutExt = path.slice(0, -3);
  const base = slugDir ? slugDir.split('/') : [];
  const parts = withoutExt.split('/');

  for (const part of parts) {
    if (part === '..') base.pop();
    else base.push(part);
  }

  const resolved = base.join('/');
  const absPath = TOP_LEVEL.has(resolved) ? '/' + resolved : '/docs/' + resolved;
  return absPath + anchor;
}

let highlighterPromise: ReturnType<typeof createHighlighter> | null = null;

export function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-dark-dimmed'],
      langs: ['python', 'bash', 'typescript', 'javascript', 'json', 'yaml', 'html', 'css', 'text'],
    });
  }
  return highlighterPromise;
}

export async function renderMarkdown(md: string, slugDir = ''): Promise<string> {
  const hl = await getHighlighter();
  const store: Array<{ lang: string; code: string; highlighted?: string }> = [];

  const tokenized = md.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const idx = store.length;
    store.push({ lang: normalizeLang(lang), code });
    return `\n\nGANTRY_CODE_${idx}\n\n`;
  });

  for (let i = 0; i < store.length; i++) {
    const { lang, code } = store[i];
    const useLang = hl.getLoadedLanguages().includes(lang as never) ? lang : 'text';
    store[i].highlighted = hl.codeToHtml(code, {
      lang: useLang,
      theme: 'github-dark-dimmed',
      structure: 'inline',
    });
    store[i].highlighted = `<pre class="shiki-pre"><code>${store[i].highlighted}</code></pre>`;
  }

  const renderer = new marked.Renderer();
  renderer.link = ({ href, title, text }) => {
    const resolved = resolveDocLink(href ?? '', slugDir);
    const titleAttr = title ? ` title="${title}"` : '';
    return `<a href="${resolved}"${titleAttr}>${text}</a>`;
  };

  let html = marked.parse(tokenized, { gfm: true, renderer }) as string;

  for (let i = 0; i < store.length; i++) {
    const highlighted = store[i].highlighted ?? `<pre class="shiki-pre"><code>${store[i].code}</code></pre>`;
    html = html
      .replace(`<p>GANTRY_CODE_${i}</p>`, highlighted)
      .replace(`GANTRY_CODE_${i}`, highlighted);
  }

  return html;
}
