import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// GitHub Actions supplies OWNER/REPO. Avoid hard-coding an unrelated account:
// project sites use /REPO, while OWNER.github.io repositories use the root.
const githubRepository = process.env.GITHUB_ACTIONS === 'true'
  ? process.env.GITHUB_REPOSITORY?.trim()
  : undefined;
const [owner, repository] = githubRepository?.split('/') ?? [];
const githubOrigin = owner && repository ? `https://${owner}.github.io` : undefined;
const explicitSite = process.env.SITE_URL?.trim() || undefined;
const site = explicitSite || githubOrigin;

if (site) {
  const url = new URL(site);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('SITE_URL must be an HTTP(S) origin without credentials or a path; use SITE_BASE for the path.');
  }
}
const isUserSite = owner && repository && repository.toLowerCase() === `${owner}.github.io`.toLowerCase();
const usesGitHubOrigin = !explicitSite || (githubOrigin && new URL(explicitSite).origin.toLowerCase() === githubOrigin.toLowerCase());
const inferredBase = githubOrigin && !isUserSite && usesGitHubOrigin ? `/${repository}` : '/';
const requestedBase = process.env.SITE_BASE?.trim();
const base = requestedBase || inferredBase;
if (!base.startsWith('/') || base.startsWith('//') || /[?#]/.test(base)) {
  throw new Error('SITE_BASE must be / or a root-relative path, such as /your-repository.');
}

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  // A sitemap needs a real public origin. Local builds without one still work.
  integrations: [react(), ...(site ? [sitemap()] : [])],
  devToolbar: { enabled: false },
  server: { allowedHosts: ['.e2b.app'] },
  vite: {
    build: {
      rolldownOptions: {
        output: {
          // Keep required license banners and separate the lazy WebGL library
          // from the scene implementation instead of suppressing size warnings.
          comments: { legal: true },
          codeSplitting: {
            groups: [{ name: 'three-core', test: /[\\/]node_modules[\\/]three[\\/]build[\\/]three\.module\.js$/ }],
          },
        },
      },
    },
  },
});
