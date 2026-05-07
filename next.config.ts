import type { NextConfig } from 'next';

async function fetchPyPIVersion(pkg: string, fallback: string): Promise<string> {
  try {
    const res = await fetch(`https://pypi.org/pypi/${pkg}/json`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return fallback;
    const data = await res.json() as { info: { version: string } };
    return data.info.version ?? fallback;
  } catch {
    return fallback;
  }
}

export default async function nextConfig(): Promise<NextConfig> {
  const version = await fetchPyPIVersion('gantrygraph', '0.5.0');

  return {
    pageExtensions: ['ts', 'tsx', 'mdx'],
    experimental: {
      mdxRs: false,
    },
    env: {
      NEXT_PUBLIC_PYPI_VERSION: version,
    },
  };
}
