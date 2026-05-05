import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'GantryGraph — Build AI Agents That Use Your Computer · Python',
  description:
    'GantryGraph is an open-source Python library for building autonomous AI agents that operate the desktop, browser, and MCP tools. Built on LangGraph. MIT licensed.',
  keywords: [
    'GantryGraph', 'AI agent framework', 'computer use', 'LangGraph', 'MCP',
    'browser automation', 'Python agent library', 'autonomous agent',
  ],
  authors: [{ name: 'GantryGraph Contributors' }],
  openGraph: {
    type: 'website',
    title: 'GantryGraph — The OS-level AI Agent Framework',
    description: 'Build, secure, and scale Computer Use AI agents. Production-grade, model-agnostic, MCP-ready.',
    url: 'https://gantrygraph.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GantryGraph — OS-level AI Agent Framework',
    description: 'Build, secure, and scale Computer Use AI agents. Open source. Production-grade.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
