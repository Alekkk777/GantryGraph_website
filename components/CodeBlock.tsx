import { getHighlighter } from '@/lib/markdown';

const LANG_MAP: Record<string, string> = {
  py: 'python', python: 'python',
  js: 'javascript', javascript: 'javascript',
  ts: 'typescript', typescript: 'typescript',
  sh: 'bash', bash: 'bash', shell: 'bash',
  json: 'json', yaml: 'yaml',
  html: 'html', css: 'css',
  '': 'text', text: 'text',
};

export default async function CodeBlock({ code, lang = 'python' }: { code: string; lang?: string }) {
  const hl = await getHighlighter();
  const normLang = LANG_MAP[lang] ?? (lang || 'text');
  const useLang = hl.getLoadedLanguages().includes(normLang as never) ? normLang : 'text';
  const inner = hl.codeToHtml(code, { lang: useLang, theme: 'github-dark-dimmed', structure: 'inline' });
  return (
    <pre className="shiki-pre">
      <code dangerouslySetInnerHTML={{ __html: inner }} />
    </pre>
  );
}
