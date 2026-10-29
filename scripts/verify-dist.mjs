/** Fail a release build on missing assets, broken fragment links or bad SEO paths. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import config from '../astro.config.mjs';

const dist = path.resolve('dist');
const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const rawBase = config.base || '/';
const base = rawBase === '/' ? '/' : `${rawBase.replace(/\/+$/, '')}/`;
const ids = new Set([...html.matchAll(/\bid=["']([^"']+)["']/g)].map((m) => m[1]));
const references = [...html.matchAll(/\b(?:src|href|component-url|renderer-url)=["']([^"']+)["']/g)].map((m) => m[1]);
const backgrounds = [...html.matchAll(/url\(['"]?([^'"\)]+)['"]?\)/g)].map((m) => m[1]);
const srcsetUrls = [...html.matchAll(/\b(?:srcset|imagesrcset)=["']([^"']+)["']/gi)].flatMap((m) => m[1].split(',').map((entry) => entry.trim().split(/\s+/)[0]));
let checked = 0;
function checkUrl(ref) {
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(ref)) return;
  if (ref.startsWith('#')) {
    if (ref.length > 1) assert.ok(ids.has(decodeURIComponent(ref.slice(1))), `Broken fragment: ${ref}`);
    return;
  }
  const url = new URL(ref, `https://example.invalid${base}`);
  assert.ok(url.pathname.startsWith(base), `Reference ignores base ${base}: ${ref}`);
  const relative = decodeURIComponent(url.pathname.slice(base.length));
  const file = path.resolve(dist, relative || 'index.html');
  assert.ok(file.startsWith(`${dist}${path.sep}`), `Invalid local path: ${ref}`);
  assert.ok(fs.existsSync(file), `Missing generated asset: ${ref}`);
  checked++;
}
for (const ref of [...references, ...backgrounds, ...srcsetUrls]) checkUrl(ref);
const images = [...html.matchAll(/<img\b([^>]*)>/g)];
for (const [, attrs] of images) {
  assert.match(attrs, /\balt=/, 'Every image must have alt text (empty for decorative images)');
  assert.match(attrs, /\bwidth=/, 'Every image must have a width');
  assert.match(attrs, /\bheight=/, 'Every image must have a height');
}
for (const cssFile of fs.readdirSync(path.join(dist, '_astro')).filter((p) => p.endsWith('.css'))) {
  const css = fs.readFileSync(path.join(dist, '_astro', cssFile), 'utf8');
  for (const [, ref] of css.matchAll(/url\(['"]?([^'"\)]+)['"]?\)/g)) checkUrl(ref);
}
assert.ok(fs.existsSync(path.join(dist, '.nojekyll')), 'Missing .nojekyll');
const robots = fs.readFileSync(path.join(dist, 'robots.txt'), 'utf8');
assert.match(robots, /User-agent: \*/);
if (config.site) {
  const origin = new URL(config.site).origin;
  const canonical = new URL(base, origin).href;
  const social = new URL(`${base}images/quadra-og.jpg`, origin).href;
  assert.ok(html.includes(`rel="canonical" href="${canonical}"`), `Wrong canonical; expected ${canonical}`);
  assert.ok(html.includes(`property="og:image" content="${social}"`), `Wrong OG image; expected ${social}`);
  assert.ok(html.includes(`name="twitter:image" content="${social}"`), `Wrong Twitter image; expected ${social}`);
  const mapIndex = fs.readFileSync(path.join(dist, 'sitemap-index.xml'), 'utf8');
  const map = fs.readFileSync(path.join(dist, 'sitemap-0.xml'), 'utf8');
  assert.ok(robots.includes(new URL(`${base}sitemap-index.xml`, origin).href), 'robots.txt has the wrong sitemap URL');
  assert.ok(mapIndex.includes(new URL(`${base}sitemap-0.xml`, origin).href), 'Sitemap index has the wrong URL');
  const locs = [...map.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
  assert.deepEqual(locs, [canonical], 'Expected exactly the canonical home page in the sitemap');
}
console.log(`Verified ${checked} generated references, ${images.length} image tags and SEO for base ${base}.`);
