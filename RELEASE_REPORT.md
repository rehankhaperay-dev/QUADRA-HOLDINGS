# Quadra Holdings — Pages and release verification

**Audit:** 29 October 2026

**Status:** Locally verified; GitHub repository, deployment and live URL not yet confirmed.

## Findings addressed

- Installed the locked dependencies under Node 22.23.4, regenerated Astro types
  with `astro sync`, and checked the existing strict TypeScript configuration
  and case-sensitive stylesheet import. `astro check` reports no errors,
  warnings or hints.
- Removed root-only asset assumptions throughout the Astro and React
  components, styles, font/image preloads and license link. Public files now
  respect Astro's base path, including responsive image candidates.
- The GitHub Actions workflow uses the official Astro action and derives the
  GitHub Pages origin and base from the repository context. Optional `SITE_URL`
  and `SITE_BASE` variables support custom domains and subpaths. Action
  revisions are pinned; the workflow checks types, builds, verifies the output,
  and deploys the Pages artifact.
- Corrected canonical, Open Graph and Twitter image paths; added `robots.txt`,
  `.nojekyll` and a generated sitemap when a real site origin is supplied.
  One canonical home URL is emitted, avoiding duplicate slash variants.
- Split the existing lazy Three.js library from its scene code instead of
  hiding its former chunk-size warning. Generated smaller alpha-preserving
  WebP variants, added responsive `srcset`, preloaded the local Latin font, and
  improved the accessible names of brand and hero links.
- Preserved the approved design, original license notices, and clearly labeled
  portfolio placeholders. Removed the misleading template URL from npm
  repository metadata; upstream attribution remains in the documentation.
  No customer projects or other claims were invented.

## Tests on this version

- Clean npm installation and Astro sync/check; production builds completed
  without warnings. `npm audit` reported zero known vulnerabilities at test
  time. Node 22.23.4/npm 10.8.2 were used.
- Built and checked root, GitHub project-site, GitHub user-site, custom-domain
  and custom-subpath configurations. `verify:dist` checked 201 generated local
  references, 45 image tags, fragment links, the sitemap and social metadata.
- Exercised the production preview in Chromium at widths of 320, 375, 390, 430,
  768, 1024 and 1440px. Tested hero controls, drawer and Escape, services,
  project carousel and dialog, process selection, FAQ, visible image loads,
  navigation anchors and contact URI. Touch swipes were exercised on the hero,
  service selector and portfolio; short 320 × 568 and landscape 915 × 412
  viewports were also checked. Forty-nine distinct local asset and robots URLs
  returned HTTP 200. No page overflow, failed local requests or application
  console errors were observed in these tested flows.
- Firefox and WebKit were also checked at 320, 390, 768 and 1440px using
  reduced motion, covering the main controls, images, layout and console.
  Automated axe scans reported zero violations in 25 Chromium, Firefox and
  WebKit states. Reduced-motion, JavaScript-disabled and disabled-WebGL
  fallbacks were tested.
- Local simulated Lighthouse results: **mobile 98/100/100/100**, desktop
  **100/100/100/100** for Performance/Accessibility/Best Practices/SEO. These
  are lab scores, not real-user metrics or guarantees on a public host.

## Remaining launch actions and limits

The repository URL, GitHub authentication, Pages setting, deployment workflow
result and public URL were not available for verification here. Set the Pages
source to **GitHub Actions**, push to the configured branch, inspect the action,
and check the actual deployed URL and metadata. A project-site `robots.txt`
resides beneath the repository path; origin-root robots control or search
console submission may be needed for crawlers.

`mailto:rehan.khaperay@gmail.com` is preserved from the approved site. Its
ownership and delivery were not independently verified and no message was sent.
There is no form or social link. Physical devices, production-host performance,
mail delivery and a complete human screen-reader audit remain untested.
