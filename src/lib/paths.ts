/** Resolve a public asset beneath Astro's configured base path. */
export function withBase(path: string): string {
  // External images, data URLs, and fragment-only links must not be rewritten.
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(path)) return path;
  const rawBase = import.meta.env.BASE_URL || '/';
  const base = `/${rawBase.replace(/^\/+|\/+$/g, '')}`;
  const prefix = base === '/' ? '/' : `${base}/`;
  // Also accept data authored with the current base already present.
  if (base !== '/' && (path === base || path.startsWith(prefix))) return path;
  return `${prefix}${path.replace(/^\/+/, '')}`;
}

/** Responsive, alpha-preserving variants of the website's original artwork. */
export function iconSrcSet(name: string): string {
  const sizes = name === 'emblem' ? [96, 192, 384] : [96, 144, 192];
  const original = name === 'emblem' ? 384 : 192;
  return sizes.map((size) => `${withBase(`images/ai/${name}${size === original ? '' : `-${size}`}.webp`)} ${size}w`).join(', ');
}
