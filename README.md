# Quadra Holdings — website

A light, responsive website for Quadra Holdings, adapted **in the original
[Apple-Style Portfolio](https://github.com/larry-xue/apple-style-portfolio)
repository** ([upstream commit `3c793a3`](https://github.com/itsyujay/apple-style-portfolio/tree/3c793a36d87ef5f2800d786b02593e957c9ed669); the original URL redirects to the
author's current repository). The project retains and reworks the template's
Astro component architecture, local Inter font, React/Three.js hero, GSAP reveal
approach, Tailwind/PostCSS tooling and original MIT license. The recognizable
centered hero, compact information tiles and rounded dashboard widgets remain;
their content is now arranged as one clear visitor journey from services to
portfolio, process, about and contact. Fictional demo clients, testimonials,
achievements and projects have not been used.

This is a statically generated Astro site, not a React single-page application.
The portfolio cards are React components rendered to HTML by Astro; the hero's
React/Three.js island hydrates only on suitable desktop-style devices.

## Setup and local checks

Use **Node.js 22.23.4 or newer** and npm 9.6.5 or newer. The committed
`package-lock.json` is required for reproducible installs. Run these commands
from the project root:

```bash
npm ci
npx astro sync       # regenerate .astro/types.d.ts for editors
npm run check        # Astro and TypeScript diagnostics
npm run build        # produce dist/index.html and the remaining static assets
npm run verify:dist  # check generated links, assets, image tags and SEO
npm run preview      # rebuild and serve the production output locally
```

`npm run dev` starts the development server. If an editor still reports that
`astro/tsconfigs/strict` or the CSS imports cannot be found after `npm ci` and
`npx astro sync`, open this project folder (not its parent) and restart the
editor's TypeScript server or reload its window. `src/styles/global.css` and
the `@fontsource-variable/inter` dependency are both part of the project.

The site is static: it has no server-side form, database, API keys or social
account links. Contact links open `mailto:rehan.khaperay@gmail.com` in the
visitor's email application; no email is sent by this website.

## GitHub Pages deployment

1. Push this project to a GitHub repository you control. The workflow at
   `.github/workflows/deploy.yml` runs on pushes to `main` and on manual
   dispatch. If your default branch is not `main`, update the workflow's branch.
2. In the repository, open **Settings → Pages → Build and deployment** and
   select **GitHub Actions** as the source. If prompted, allow the workflow to
   create a Pages deployment and approve any `github-pages` environment rules.
3. The official `withastro/action` installs dependencies, runs `astro check`,
   builds and verifies `dist`, then `actions/deploy-pages` publishes the
   artifact. Follow the run in the **Actions** tab. A successful run displays
   the actual Pages URL in its deployment output.

During a GitHub Actions build, `astro.config.mjs` obtains the owner and
repository name from `GITHUB_REPOSITORY` rather than using an unrelated
hard-coded account:

- For `OWNER/REPOSITORY`, the inferred address is
  `https://OWNER.github.io/REPOSITORY/` and the base is `/REPOSITORY`.
- For the special `OWNER/OWNER.github.io` repository, the inferred address is
  `https://OWNER.github.io/` and the base is `/`.

The real owner and repository name must come from your own GitHub repository.
These examples are patterns, not confirmed live URLs. Asset, font, canonical,
Open Graph and Twitter URLs respect the selected base. A `.nojekyll` file is
included in the output.

### Custom domain or nonstandard location

For a GitHub Pages custom domain, configure DNS and the GitHub Pages custom
hostname, add `public/CNAME` if required, and add repository variables under
**Settings → Secrets and variables → Actions → Variables**:

- `SITE_URL`: the public origin, e.g. `https://example.com` (no path).
- `SITE_BASE`: `/` for a custom domain at its root, or `/subdirectory` when
  the host actually serves the site from that subdirectory.

These are public build configuration values, not secrets. An unset `SITE_URL`
and `SITE_BASE` use the inferred GitHub Pages values. For other static hosts,
set the same variables in the build environment:

```bash
# macOS/Linux example; replace with your actual origin and path
SITE_URL=https://example.com SITE_BASE=/ npm run build
SITE_URL=https://example.com SITE_BASE=/ npm run preview

# PowerShell
$env:SITE_URL = 'https://example.com'
$env:SITE_BASE = '/'
npm run build
npm run preview
```

When testing a subpath locally, use the same variables for both the build and
preview commands. `npm run preview` rebuilds, so reapply the variables:

```bash
SITE_URL=https://example.com SITE_BASE=/subdirectory npm run preview
```

With a real `SITE_URL`, the build emits an absolute canonical URL, social image
URLs, `sitemap-index.xml`, `sitemap-0.xml` and a `robots.txt` referencing the
sitemap. A local build without a site origin omits the canonical URL and sitemap
instead of inventing a public domain. For a GitHub project site the generated
`robots.txt` is at `/REPOSITORY/robots.txt`, while crawlers normally request
`/robots.txt` at the *origin root*. If you control that root, add the project
sitemap there; otherwise submit the project's sitemap URL in Search Console.

Do not commit `.env` files, passwords or access tokens. GitHub Actions
repository variables above are public configuration, not a place for secrets.

## Replace the portfolio placeholders

`src/data/project.ts` contains the three clearly labeled placeholder entries.
They are **not** completed client projects. To add a real practice project:

1. Put an optimized screenshot such as a WebP in `public/images/`.
2. Add an image field to the relevant entry:

   ```ts
   image: {
     src: '/images/my-practice-project.webp',
     alt: 'Homepage of my practice project, showing its navigation and hero',
     width: 1200,
     height: 675,
   },
   ```

3. Use the actual image dimensions, then replace `title`, `summary`, `goal`
   and `builtWith` with accurate information.
   The card and dialog switch from `PLACEHOLDER` to `PRACTICE PROJECT` when an
   image is present. Do not describe concept or practice work as paid work.
4. Once appropriate, update the instructional paragraph in
   `src/components/ProjectsWidget.astro`. Project cards, modal details and the
   no-JavaScript details view all use the same data.

## How the upstream template was adapted

- `src/pages/index.astro` presents the visitor journey in order: hero →
  services → portfolio → process → about → pricing and FAQ → contact. The
  upstream's recognizable centered hero, info tiles, service/project cards,
  timeline and rounded dashboard styling are retained, but major sections are
  no longer arranged as competing side-by-side columns.
- `Hero.astro` retains the original centered profile-hero composition and
  floating forms. The profile photo is replaced by the Quadra emblem, and its
  real 3D geometry is in `Scene3D.tsx`.
- `InfoWidgets.astro` keeps the four compact cards, now grouped within the
  About section. The unrendered decorative principles component was removed
  from the release so the shipped source contains only the active journey.
- `SkillsWidget.astro` becomes an easily scanned service list with a selected
  explanation; `ProjectsWidget.astro` and `ProjectCard.tsx` retain the
  featured-project card pattern; and `ExperienceWidget.astro` turns the demo
  timeline into the four-step process. Supporting About, Pricing, FAQ and
  Contact cards complete the same dashboard.
- `Nav.astro` includes a custom Quadra menu symbol and coordinated icons in a
  clear side drawer, available at desktop and mobile widths. Its links follow
  the order of the page and the current section is highlighted.
- The original `LICENSE` is unchanged, and the upstream commit is recorded at
  the top of this document. The added navigation and interactive controls do
  not require any separate repository.

## Customize branding and content

- `public/quadra-mark.svg` and `public/favicon.svg` are the editable,
  four-part vector mark. The coordinated AI-rendered version appears in the
  header, footer, favicon (`public/favicon.png`), social image and hero fallback.
  If the identity changes, update these files and the corresponding geometry
  in `src/components/Scene3D.tsx` together.
- `src/assets/ai/cutouts/` contains eleven 1024 × 1024 RGBA transparent PNG
  masters: the original emblem, location, globe, storefront, mail, spark and
  diamond, plus the custom menu, portfolio, process and pricing symbols.
  The optimized alpha-preserving WebP files used by the site are in
  `public/images/ai/`, including 96/144px responsive variants (and a 192px
  emblem variant). These are 3D-*looking image renders*, not actual meshes;
  motifs are intentionally reused in related sections. Functional controls
  such as arrows and disclosure toggles remain simple text/CSS for clarity.
- The hero and dashboard use two different coordinated background images:
  `src/assets/ai/hero-background-original.png` and
  `src/assets/ai/dashboard-background-original.png`, optimized as WebPs in
  `public/images/ai/`. The website's background plates are intentionally
  opaque; only the foreground symbol artwork has transparency.
  `public/images/quadra-og.jpg` is the 1200 × 630 social-preview image.
- Copy and content live in the Astro sections under `src/components/`;
  `src/pages/index.astro` assembles them. Design tokens and responsive layouts
  live in `src/styles/global.css` and `tailwind.config.mjs`.
- `src/scripts/interactions.ts` contains the slider, navigation, selector,
  modal, touch and motion enhancements. The FAQ uses native HTML disclosures.

## Interaction, accessibility and performance

- The hero has manual previous/next buttons, pagination, keyboard support and
  native swipe/scroll; there is no auto-play. All three services are visible
  and can be selected directly, with previous/next controls and horizontal
  touch-swipe selection. Portfolio cards scroll horizontally on all sizes and
  support arrows and touch. The four process steps can be selected. Project
  details use native modal dialogs with Escape, focus return and a plain
  `<details>` fallback.
- The desktop and mobile side drawer is a native disclosure with clear section
  labels and custom icons. JavaScript adds smooth closing, Escape/backdrop
  dismissal, focus cycling and return, scroll locking, and current-section
  highlighting. Without JavaScript it still opens and closes via its summary,
  and the links remain ordinary anchors. Reduced motion removes the animated
  entrance/exit.
- The React/Three.js scene uses actual beveled, extruded four-part geometry,
  lighting and a procedural Three.js environment for reflections—not an image
  mapped onto a plane. Its WebGL enhancement loads only when the viewport is
  wider than 768px, the primary pointer is fine and can hover, and motion is
  allowed. A transparent AI-rendered WebP still is present in the initial HTML
  and remains visible on touch-first devices (including landscape phones),
  reduced-motion settings, without JavaScript, and when WebGL is unavailable
  or the context is lost. Touch on
  the still provides a small response without blocking vertical scrolling;
  desktop cursor motion is subtle. Rendering pauses when the scene is offscreen
  or the tab is hidden.
- The two background plates and their ornaments respond separately to pointer
  movement or a light touch. Their handlers are passive, do not capture input
  or prevent scrolling, and respect reduced-motion preferences. Offscreen
  foreground images and the closed drawer's icons are lazy-loaded; assets are
  local rather than CDN-hosted.
- The 3D library is code-split and lazy-loaded, keeping its largest minified
  chunk below the 500 kB warning threshold. It is not loaded on touch-first
  devices, narrow screens, or in reduced-motion mode. GSAP/ScrollTrigger are
  also dynamically loaded only when motion is allowed. Responsive WebP variants
  and a preloaded local variable font reduce unnecessary image/font downloads.
- The page includes a skip link, semantic sections, visible focus states,
  accessible labels, responsive layouts and reduced-motion styles. Without
  JavaScript, navigation, FAQ, project disclosures, section content and native
  horizontal scrolling remain usable. No essential information is hover-only.

## Validation performed

The current production build was tested under root, GitHub project-site,
GitHub user-site and custom-domain/subpath configurations. `npm run check`
and the build had no diagnostics or warnings; `npm run verify:dist` checked
local asset paths, image attributes, fragment links, canonical/social URLs,
robots and sitemap output. Chromium-based browser tests covered 320, 375, 390,
430, 768, 1024 and 1440px, including drawer, selectors, carousel, dialog, FAQ,
touch swipes, reduced-motion, disabled-WebGL and no-JavaScript states. Firefox
and WebKit were also checked at 320, 390, 768 and 1440px with reduced motion.
Twenty-five automated accessibility scans reported no violations in the tested
states.

A local, simulated Lighthouse run scored 98/100/100/100 on mobile and
100/100/100/100 on desktop for Performance, Accessibility, Best Practices and
SEO respectively. Scores vary by device, network and host; they are not field
measurements. See `RELEASE_REPORT.md` for details and remaining limitations.
No physical-device, public deployment, live inbox-delivery or full manual
screen-reader test was performed during this pass.

## Credits and licenses

The upstream template's original MIT copyright and permission notice is
preserved unmodified in [`LICENSE`](./LICENSE), and a copy is included in
`public/licenses/` and the static build. Inter is locally served under the
SIL Open Font License. Notices for Astro, @astrojs/sitemap, React, Three.js, Tailwind and
Autoprefixer are also in `public/licenses/`. GSAP and ScrollTrigger are
subject to their own [standard license](https://gsap.com/standard-license/),
which permits commercial website use under its terms; their original bundled
copyright notices are retained. The original vector emblem and actual 3D
geometry were created for this project; the two background plates and eleven
transparent, 3D-style symbol renders were AI-generated for this project and
then processed for the site. No third-party stock photographs or original demo
images are used. See
[`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md) for details.
