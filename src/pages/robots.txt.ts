import type { APIRoute } from 'astro';
import { withBase } from '../lib/paths';

/** A project-site robots file is under its base; search engines use origin root. */
export const GET: APIRoute = ({ site }) => {
  const lines = ['User-agent: *', 'Allow: /'];
  if (site) lines.push(`Sitemap: ${new URL(withBase('sitemap-index.xml'), site).href}`);
  return new Response(`${lines.join('\n')}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
