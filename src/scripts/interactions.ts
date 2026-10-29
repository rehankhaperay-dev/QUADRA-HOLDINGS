/* Progressive enhancements: all copy, native details, links and horizontal
   scroll areas remain usable when JavaScript, WebGL or motion are unavailable. */
const $ = <T extends Element>(selector: string, root: ParentNode = document) => root.querySelector<T>(selector);
const $$ = <T extends Element>(selector: string, root: ParentNode = document) => Array.from(root.querySelectorAll<T>(selector));
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const behavior = (): ScrollBehavior => reduced.matches ? 'auto' : 'smooth';

// The two background plates and their transparent ornaments react independently.
// Mouse movement is throttled to one paint per frame; on touch, a gentle press
// response never prevents default, captures the pointer, or interferes with swipe.
$$<HTMLElement>('[data-reactive-background]').forEach((section) => {
  let frame = 0;
  let target = { x: 0, y: 0 };
  const draw = () => {
    frame = 0;
    if (reduced.matches) return;
    section.style.setProperty('--bg-x', `${(-target.x * 5).toFixed(2)}px`);
    section.style.setProperty('--bg-y', `${(-target.y * 5).toFixed(2)}px`);
    section.style.setProperty('--float-x', `${(target.x * 10).toFixed(2)}px`);
    section.style.setProperty('--float-y', `${(target.y * 8).toFixed(2)}px`);
  };
  const move = (event: PointerEvent) => {
    if (reduced.matches || (event.pointerType === 'mouse' && !finePointer.matches)) return;
    const rect = section.getBoundingClientRect();
    const visibleTop = Math.max(0, rect.top);
    const visibleBottom = Math.min(window.innerHeight, rect.bottom);
    const clamp = (value: number) => Math.max(-1, Math.min(1, value));
    target = {
      x: clamp((event.clientX - rect.left) / Math.max(rect.width, 1) * 2 - 1),
      y: clamp((event.clientY - visibleTop) / Math.max(visibleBottom - visibleTop, 1) * 2 - 1),
    };
    if (!frame) frame = requestAnimationFrame(draw);
  };
  const reset = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    ['--bg-x', '--bg-y', '--float-x', '--float-y'].forEach((name) => section.style.removeProperty(name));
  };
  section.addEventListener('pointermove', (event) => { if (event.pointerType === 'mouse') move(event); }, { passive: true });
  section.addEventListener('pointerdown', (event) => { if (event.pointerType === 'touch') move(event); }, { passive: true });
  section.addEventListener('pointerup', (event) => { if (event.pointerType === 'touch') reset(); }, { passive: true });
  section.addEventListener('pointercancel', reset, { passive: true });
  section.addEventListener('pointerleave', reset, { passive: true });
  reduced.addEventListener('change', () => { if (reduced.matches) reset(); });
});

// One branded drawer works at every screen size. Native <details> remains
// operable without JavaScript; enhancements add dismissal and focus handling.
const mobileNav = $<HTMLDetailsElement>('[data-mobile-nav]');
const menuSummary = mobileNav && $<HTMLElement>('summary', mobileNav);
const pageBehindDrawer = ['main', '.site-footer', '.site-header .brand', '.desktop-nav', '.nav-cta']
  .map((selector) => $<HTMLElement>(selector)).filter((el): el is HTMLElement => !!el);
if (mobileNav && menuSummary) {
  let restoreFocus = true;
  let pendingTarget: HTMLElement | null = null;
  let wasOpened = false;
  let closeTimer = 0;
  const closeDrawer = (restore = true, target: HTMLElement | null = null) => {
    if (!mobileNav.open || mobileNav.hasAttribute('data-closing')) return;
    restoreFocus = restore;
    pendingTarget = target;
    if (reduced.matches) { mobileNav.open = false; return; }
    mobileNav.setAttribute('data-closing', '');
    closeTimer = window.setTimeout(() => {
      mobileNav.open = false;
      mobileNav.removeAttribute('data-closing');
    }, 220);
  };
  const syncDrawer = () => {
    const opened = mobileNav.open;
    document.body.classList.toggle('nav-open', opened);
    pageBehindDrawer.forEach((element) => { element.inert = opened; });
    if (opened) {
      wasOpened = true;
      menuSummary.focus({ preventScroll: true });
      return;
    }
    window.clearTimeout(closeTimer);
    mobileNav.removeAttribute('data-closing');
    if (!wasOpened) return;
    if (pendingTarget) {
      const target = pendingTarget;
      pendingTarget = null;
      requestAnimationFrame(() => {
        target.setAttribute('tabindex', '-1');
        target.scrollIntoView({ block: 'start', behavior: behavior() });
        target.focus({ preventScroll: true });
        updateNavigation();
      });
    } else if (restoreFocus) menuSummary.focus({ preventScroll: true });
    restoreFocus = true;
  };
  mobileNav.addEventListener('toggle', syncDrawer);
  // Keep a real exit animation when enhanced; without JS the native summary
  // still opens and closes immediately, including with keyboard activation.
  menuSummary.addEventListener('click', (event) => {
    if (mobileNav.open) { event.preventDefault(); closeDrawer(); }
  });
  $<HTMLElement>('[data-menu-backdrop]', mobileNav)?.addEventListener('click', () => closeDrawer());
  document.addEventListener('pointerdown', (event) => {
    if (mobileNav.open && event.target instanceof Node && !mobileNav.contains(event.target)) closeDrawer();
  });
  document.addEventListener('keydown', (event) => {
    if (!mobileNav.open) return;
    if (event.key === 'Escape') { event.preventDefault(); closeDrawer(); return; }
    if (event.key !== 'Tab') return;
    const focusable = [menuSummary, ...$$<HTMLElement>('a[href]', mobileNav)].filter((el) => el.getClientRects().length > 0);
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && (document.activeElement === first || !mobileNav.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  $$<HTMLAnchorElement>('a[href^="#"]', mobileNav).forEach((link) => link.addEventListener('click', (event) => {
    const target = document.getElementById(link.hash.slice(1));
    if (!target) return;
    event.preventDefault();
    if (mobileNav.hasAttribute('data-closing')) return;
    history.pushState(null, '', link.hash);
    closeDrawer(false, target);
  }));
}

// The active link follows the visitor's place in the single-column journey,
// including the gaps between sections and the home state at the top.
const navLinks = $$<HTMLAnchorElement>('[data-nav-link]');
const navSections = ['top', 'services', 'work', 'process', 'about', 'pricing', 'contact']
  .map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
let navFrame = 0;
function updateNavigation() {
  navFrame = 0;
  const line = Math.min(window.innerHeight * 0.3, 210);
  let active = navSections.filter((section) => section.getBoundingClientRect().top <= line).at(-1)?.id || 'top';
  if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4) active = 'contact';
  navLinks.forEach((link) => {
    const selected = link.hash === `#${active}`;
    link.classList.toggle('is-active', selected);
    if (selected) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
  });
}
window.addEventListener('scroll', () => { if (!navFrame) navFrame = requestAnimationFrame(updateNavigation); }, { passive: true });
window.addEventListener('resize', updateNavigation, { passive: true });
updateNavigation();

// Hero: native scroll-snap provides touch/swipe. Buttons and keyboard add
// explicit, accessible navigation; there is deliberately no auto-play.
const heroTrack = $<HTMLElement>('[data-hero-track]');
const heroSlides = heroTrack ? Array.from(heroTrack.children) as HTMLElement[] : [];
const heroDots = $$<HTMLButtonElement>('[data-hero-dot]');
const heroCount = $<HTMLElement>('[data-hero-count]');
const heroStatus = $<HTMLElement>('[data-hero-status]');
let heroIndex = 0;
function sizeHeroTrack() {
  if (heroTrack && heroSlides[heroIndex]) heroTrack.style.height = `${Math.ceil(heroSlides[heroIndex].getBoundingClientRect().height) + 2}px`;
}
function updateHero(index: number, announce = false) {
  heroIndex = Math.max(0, Math.min(heroSlides.length - 1, index));
  heroDots.forEach((dot, i) => {
    dot.classList.toggle('is-active', i === heroIndex);
    if (i === heroIndex) dot.setAttribute('aria-current', 'true'); else dot.removeAttribute('aria-current');
  });
  if (heroCount) heroCount.innerHTML = `${String(heroIndex + 1).padStart(2, '0')} <span>/</span> ${String(heroSlides.length).padStart(2, '0')}`;
  if (announce && heroStatus) heroStatus.textContent = `Introduction slide ${heroIndex + 1} of ${heroSlides.length}`;
  sizeHeroTrack();
}
function goHero(index: number) {
  if (!heroTrack || !heroSlides.length) return;
  const next = (index + heroSlides.length) % heroSlides.length;
  heroTrack.scrollTo({ left: next * heroTrack.clientWidth, behavior: behavior() });
  updateHero(next, true);
}
if (heroTrack && heroSlides.length) {
  sizeHeroTrack();
  window.addEventListener('resize', sizeHeroTrack, { passive: true });
  document.fonts?.ready.then(sizeHeroTrack);
  $<HTMLButtonElement>('[data-hero-prev]')?.addEventListener('click', () => goHero(heroIndex - 1));
  $<HTMLButtonElement>('[data-hero-next]')?.addEventListener('click', () => goHero(heroIndex + 1));
  heroDots.forEach((dot, i) => dot.addEventListener('click', () => goHero(i)));
  heroTrack.addEventListener('scroll', () => {
    const next = Math.round(heroTrack.scrollLeft / Math.max(heroTrack.clientWidth, 1));
    if (next !== heroIndex) updateHero(next, true);
  }, { passive: true });
  heroTrack.addEventListener('keydown', (event) => {
    if (event.target !== heroTrack) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault(); goHero(heroIndex + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
}

// A gentle press/tilt on touch screens, plus a horizontal swipe on the art to
// move the hero. Vertical gestures remain native page scrolling (touch-action).
const art = $<HTMLElement>('[data-scene]');
const still = art && $<HTMLElement>('.scene-fallback', art);
let touchStart: { x: number; y: number } | null = null;
if (art && still) {
  art.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'touch') return;
    touchStart = { x: event.clientX, y: event.clientY };
  });
  art.addEventListener('pointermove', (event) => {
    if (!touchStart || event.pointerType !== 'touch' || reduced.matches) return;
    const rect = art.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - .5) * 4;
    const y = -((event.clientY - rect.top) / rect.height - .5) * 4;
    still.style.setProperty('--touch-x', `${Math.max(-2, Math.min(2, y))}deg`);
    still.style.setProperty('--touch-y', `${Math.max(-2, Math.min(2, x))}deg`);
  }, { passive: true });
  const finishTouch = (event: PointerEvent) => {
    if (touchStart && event.type === 'pointerup') {
      const dx = event.clientX - touchStart.x, dy = event.clientY - touchStart.y;
      if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4) goHero(heroIndex + (dx < 0 ? 1 : -1));
    }
    touchStart = null;
    still.style.removeProperty('--touch-x'); still.style.removeProperty('--touch-y');
  };
  art.addEventListener('pointerup', finishTouch);
  art.addEventListener('pointercancel', finishTouch);
  art.addEventListener('pointerleave', finishTouch);
}

// Services: links work as regular anchors without JS. With JS they select a
// detail panel, while the card strip retains native scrolling and swipe.
const serviceTrack = $<HTMLElement>('[data-service-track]');
const serviceLinks = $$<HTMLAnchorElement>('[data-service-select]');
const servicePanels = $$<HTMLElement>('[data-service-panel]');
const serviceStatus = $<HTMLElement>('[data-service-status]');
let serviceIndex = 0;
function activateService(index: number, bringIntoView = false, announce = false) {
  if (!serviceLinks.length) return;
  serviceIndex = (index + serviceLinks.length) % serviceLinks.length;
  serviceLinks.forEach((link, i) => {
    link.classList.toggle('is-active', i === serviceIndex);
    if (i === serviceIndex) link.setAttribute('aria-current', 'true'); else link.removeAttribute('aria-current');
  });
  servicePanels.forEach((panel, i) => { panel.classList.toggle('is-active', i === serviceIndex); panel.hidden = i !== serviceIndex; });
  if (announce && serviceStatus) serviceStatus.textContent = `${serviceLinks[serviceIndex].querySelector('.service-card-title')?.textContent?.trim() || 'Service'} selected`;
  if (bringIntoView && serviceTrack) {
    const container = serviceTrack.getBoundingClientRect(), item = serviceLinks[serviceIndex].getBoundingClientRect();
    if (item.left < container.left - 2 || item.right > container.right + 2) {
      serviceTrack.scrollTo({ left: serviceTrack.scrollLeft + item.left - container.left, behavior: behavior() });
    }
  }
}
if (serviceTrack && serviceLinks.length && servicePanels.length) {
  let serviceTouchStart: { x: number; y: number } | null = null;
  let suppressServiceClickUntil = 0;
  activateService(0);
  serviceLinks.forEach((link, i) => link.addEventListener('click', (event) => {
    event.preventDefault();
    if (performance.now() < suppressServiceClickUntil) return;
    activateService(i, true, true);
  }));
  serviceTrack.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'touch') serviceTouchStart = { x: event.clientX, y: event.clientY };
  }, { passive: true });
  serviceTrack.addEventListener('pointerup', (event) => {
    if (!serviceTouchStart || event.pointerType !== 'touch') return;
    const dx = event.clientX - serviceTouchStart.x, dy = event.clientY - serviceTouchStart.y;
    serviceTouchStart = null;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      suppressServiceClickUntil = performance.now() + 300;
      activateService(serviceIndex + (dx < 0 ? 1 : -1), false, true);
    }
  }, { passive: true });
  serviceTrack.addEventListener('pointercancel', () => { serviceTouchStart = null; }, { passive: true });
  $<HTMLButtonElement>('[data-service-prev]')?.addEventListener('click', () => activateService(serviceIndex - 1, true, true));
  $<HTMLButtonElement>('[data-service-next]')?.addEventListener('click', () => activateService(serviceIndex + 1, true, true));
  serviceTrack.addEventListener('scroll', () => {
    const max = serviceTrack.scrollWidth - serviceTrack.clientWidth;
    if (max < 2) return;
    const first = serviceLinks[0].getBoundingClientRect();
    const second = serviceLinks[1]?.getBoundingClientRect();
    const stride = second ? second.left - first.left : first.width;
    const index = serviceTrack.scrollLeft >= max - 2 ? serviceLinks.length - 1 : Math.round(serviceTrack.scrollLeft / Math.max(stride, 1));
    if (index !== serviceIndex) activateService(index, false, true);
  }, { passive: true });
}

// Process steps use ordinary links as a no-JS fallback, upgraded to a selector.
const stepLinks = $$<HTMLAnchorElement>('[data-process-select]');
const stepPanels = $$<HTMLElement>('[data-process-panel]');
const stepStatus = $<HTMLElement>('[data-process-status]');
function activateStep(index: number, announce = false) {
  if (!stepLinks.length) return;
  const active = (index + stepLinks.length) % stepLinks.length;
  stepLinks.forEach((link, i) => {
    link.classList.toggle('is-active', i === active);
    if (i === active) link.setAttribute('aria-current', 'step'); else link.removeAttribute('aria-current');
  });
  stepPanels.forEach((panel, i) => { panel.classList.toggle('is-active', i === active); panel.hidden = i !== active; });
  if (announce && stepStatus) stepStatus.textContent = `Step ${active + 1}: ${stepLinks[active].querySelector('strong')?.textContent || ''}`;
}
if (stepLinks.length && stepPanels.length) {
  activateStep(0);
  stepLinks.forEach((link, i) => {
    link.addEventListener('click', (event) => { event.preventDefault(); activateStep(i, true); });
    link.addEventListener('keydown', (event) => {
      if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(event.key)) return;
      event.preventDefault(); const next = (i + (event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1) + stepLinks.length) % stepLinks.length;
      activateStep(next, true); stepLinks[next].focus();
    });
  });
}

// Portfolio strip + native modal dialogs. The <details> within each card is a
// complete no-JS fallback, and native dialog supplies focus trapping + Escape.
const projectTrack = $<HTMLElement>('[data-project-track]');
const projectCards = $$<HTMLElement>('[data-project-card]');
const projectPrev = $<HTMLButtonElement>('[data-project-prev]');
const projectNext = $<HTMLButtonElement>('[data-project-next]');
const projectStatus = $<HTMLElement>('[data-project-status]');
function projectIsHorizontal() {
  return !!projectTrack && getComputedStyle(projectTrack).flexDirection.startsWith('row');
}
function updateProjectControls(announce = false) {
  if (!projectTrack) return;
  const horizontal = projectIsHorizontal();
  const offset = horizontal ? projectTrack.scrollLeft : projectTrack.scrollTop;
  const max = horizontal ? projectTrack.scrollWidth - projectTrack.clientWidth : projectTrack.scrollHeight - projectTrack.clientHeight;
  if (projectPrev) projectPrev.disabled = offset <= 2;
  if (projectNext) projectNext.disabled = offset >= max - 2;
  if (announce && projectStatus && projectCards.length) {
    const container = projectTrack.getBoundingClientRect();
    const start = horizontal ? container.left : container.top;
    const position = (card: HTMLElement) => horizontal ? card.getBoundingClientRect().left : card.getBoundingClientRect().top;
    const index = projectCards.reduce((best, card, i) => Math.abs(position(card) - start) < Math.abs(position(projectCards[best]) - start) ? i : best, 0);
    projectStatus.textContent = `Showing portfolio placeholders, starting near project ${index + 1} of ${projectCards.length}`;
  }
}
if (projectTrack && projectCards.length) {
  const scrollProject = (direction: number) => {
    const gap = parseFloat(getComputedStyle(projectTrack).gap) || 0;
    const horizontal = projectIsHorizontal();
    const rect = projectCards[0].getBoundingClientRect();
    const amount = direction * ((horizontal ? rect.width : rect.height) + gap);
    projectTrack.scrollBy({ left: horizontal ? amount : 0, top: horizontal ? 0 : amount, behavior: behavior() });
  };
  projectPrev?.addEventListener('click', () => scrollProject(-1));
  projectNext?.addEventListener('click', () => scrollProject(1));
  projectTrack.addEventListener('scroll', () => updateProjectControls(true), { passive: true });
  window.addEventListener('resize', () => updateProjectControls(), { passive: true });
  updateProjectControls();
}
projectCards.forEach((card) => {
  const summary = $<HTMLElement>('.project-details-toggle', card);
  const dialog = $<HTMLDialogElement>('[data-project-dialog]', card);
  const closer = $<HTMLButtonElement>('[data-close-dialog]', card);
  if (!summary || !dialog || typeof dialog.showModal !== 'function') return;
  let closeTimer = 0;
  const close = (restoreFocus = true) => {
    if (!dialog.open || dialog.hasAttribute('data-closing')) return;
    if (reduced.matches) { dialog.close(); if (restoreFocus) summary.focus(); return; }
    dialog.setAttribute('data-closing', '');
    closeTimer = window.setTimeout(() => {
      dialog.removeAttribute('data-closing'); dialog.close();
      if (restoreFocus) summary.focus({ preventScroll: true });
    }, 180);
  };
  summary.addEventListener('click', (event) => {
    event.preventDefault();
    window.clearTimeout(closeTimer);
    dialog.removeAttribute('data-closing');
    dialog.showModal();
  });
  closer?.addEventListener('click', () => close());
  dialog.addEventListener('cancel', (event) => { event.preventDefault(); close(); });
  dialog.addEventListener('click', (event) => { if (event.target === dialog) close(); });
  $<HTMLAnchorElement>('[data-dialog-contact]', dialog)?.addEventListener('click', () => { dialog.close(); });
});

// A desktop-only, low-amplitude response. Every action remains available by
// click, touch and keyboard; no information is revealed only on hover.
$$<HTMLElement>('.magnetic').forEach((element) => {
  element.addEventListener('pointermove', (event) => {
    if (!finePointer.matches || reduced.matches || event.pointerType !== 'mouse') return;
    const rect = element.getBoundingClientRect();
    element.style.setProperty('--mag-x', `${Math.max(-7, Math.min(7, (event.clientX - rect.left - rect.width / 2) * .1))}px`);
    element.style.setProperty('--mag-y', `${Math.max(-5, Math.min(5, (event.clientY - rect.top - rect.height / 2) * .12))}px`);
  });
  element.addEventListener('pointerleave', () => { element.style.removeProperty('--mag-x'); element.style.removeProperty('--mag-y'); });
});
projectCards.forEach((card) => {
  const visual = $<HTMLElement>('.project-tilt', card);
  if (!visual) return;
  card.addEventListener('pointermove', (event) => {
    if (!finePointer.matches || reduced.matches || event.pointerType !== 'mouse') return;
    const rect = card.getBoundingClientRect();
    visual.style.setProperty('--tilt-x', `${Math.max(-2, Math.min(2, -(event.clientY - rect.top - rect.height / 2) / rect.height * 4))}deg`);
    visual.style.setProperty('--tilt-y', `${Math.max(-2, Math.min(2, (event.clientX - rect.left - rect.width / 2) / rect.width * 4))}deg`);
  });
  card.addEventListener('pointerleave', () => { visual.style.removeProperty('--tilt-x'); visual.style.removeProperty('--tilt-y'); });
});

// Native disclosure is accessible without JS. Close other answers when one is opened.
const faqs = $$<HTMLDetailsElement>('.faq-item');
faqs.forEach((item) => item.addEventListener('toggle', () => { if (item.open) faqs.forEach((other) => { if (other !== item) other.open = false; }); }));

// Show only controls whose handlers have been attached.
$$<HTMLElement>('[data-js-control]').forEach((control) => { control.hidden = false; });

// Retain the template's GSAP/ScrollTrigger reveal approach but load it only
// when motion is allowed. Visible-by-default CSS is the failure fallback.
let motionContext: { revert: () => void } | null = null;
let loadingMotion = false;
async function syncReveals() {
  if (reduced.matches) { motionContext?.revert(); motionContext = null; return; }
  if (motionContext || loadingMotion) return;
  loadingMotion = true;
  try {
    const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
    if (reduced.matches) return;
    gsap.registerPlugin(ScrollTrigger);
    motionContext = gsap.context(() => {
      $$<HTMLElement>('.reveal').forEach((element) => {
        // Anchored sections fade without moving their heading: translating an
        // anchor while smooth-scrolling would otherwise shift the landing spot.
        const lift = element.matches('section[id]') ? 0 : 20;
        gsap.fromTo(element, { y: lift, opacity: 0 }, { y: 0, opacity: 1, duration: .75, ease: 'power3.out', scrollTrigger: { trigger: element, start: 'top 92%', once: true } });
      });
    });
  } catch { /* The page remains visible without the optional animation. */ }
  finally { loadingMotion = false; }
}
reduced.addEventListener('change', syncReveals);
syncReveals();


// Keep these browser-only bindings module-scoped during TypeScript checks.
export {};
