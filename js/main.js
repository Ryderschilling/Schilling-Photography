/* ============================================================
   SCHILLING PHOTOGRAPHY : motion
   GSAP + ScrollTrigger + Lenis
   ============================================================ */

gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- smooth scroll ---------- */
let lenis = null;
if (!reduceMotion) {
  lenis = new Lenis({
    duration: 1.7,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 0.9,
    touchMultiplier: 2,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ---------- preloader + entrance ---------- */
const preloader = document.querySelector('.preloader');
const isHome = document.body.classList.contains('page-home');

function heroEntrance() {
  const tl = gsap.timeline();
  if (isHome) {
    // Entrance touches opacity + scale only; scroll parallax owns yPercent.
    tl.fromTo('.hero__panel', { opacity: 0 }, {
      opacity: 1, duration: 1.3, stagger: 0.12, ease: 'power2.out',
    });
    tl.fromTo('.hero__panel img', { scale: 1.14 }, {
      scale: 1, duration: 1.8, stagger: 0.12, ease: 'power3.out',
    }, 0);
    tl.fromTo('.hero__content > *', { y: 46, opacity: 0 }, {
      y: 0, opacity: 1, duration: 1.1, stagger: 0.14, ease: 'power3.out',
    }, '-=1.4');
    tl.fromTo('.hero__scroll', { opacity: 0 }, { opacity: 1, duration: 0.8 }, '-=0.4');
  } else {
    tl.fromTo('.page-hero__bg img', { scale: 1.12, opacity: 0.4 }, {
      scale: 1, opacity: 1, duration: 1.5, ease: 'power3.out',
    });
    tl.fromTo('.page-hero__content > *', { y: 46, opacity: 0 }, {
      y: 0, opacity: 1, duration: 1, stagger: 0.12, ease: 'power3.out',
    }, '-=1');
  }
}

const curtain = document.querySelector('.curtain');
const fromNav = document.documentElement.classList.contains('from-nav');
if (fromNav) sessionStorage.removeItem('sp_nav');

if (preloader && !reduceMotion && !fromNav && !sessionStorage.getItem('sp_seen')) {
  sessionStorage.setItem('sp_seen', '1');
  document.body.style.overflow = 'hidden';
  // Warm up the hero images while the preloader plays, so the reveal is fully painted.
  document.querySelectorAll('.hero__panel img, .page-hero__bg img').forEach((img) => {
    if (img.decode) img.decode().catch(() => {});
  });
  const tl = gsap.timeline({
    onComplete: () => { document.body.style.overflow = ''; preloader.remove(); },
  });
  tl.to('.preloader__mark span', { y: 0, duration: 0.9, ease: 'power3.out', delay: 0.2 })
    .to('.preloader__sub span', { y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.55')
    .to('.preloader__line', { width: '120px', duration: 0.7, ease: 'power2.inOut' }, '-=0.4')
    .to(['.preloader__mark span', '.preloader__sub span', '.preloader__line'], {
      opacity: 0, y: -14, duration: 0.5, ease: 'power2.in', delay: 0.5,
    })
    .to(preloader, { yPercent: -100, duration: 1.15, ease: 'power4.inOut' }, '-=0.15')
    .add(heroEntrance, '-=0.85');
} else {
  if (preloader) preloader.remove();
  if (fromNav && curtain && !reduceMotion) {
    // Arrived covered (inline head script) -> lift the curtain, then run the entrance.
    const tl = gsap.timeline();
    tl.to(curtain, { y: '-101%', duration: 0.7, ease: 'power3.inOut', delay: 0.06 })
      .set(curtain, { y: '101%' })
      .add(heroEntrance, 0.3);
  } else {
    if (fromNav && curtain) curtain.style.transform = 'translateY(101%)';
    if (!reduceMotion) heroEntrance();
  }
}

/* ---------- page curtain transitions (outgoing) ---------- */
if (curtain && !reduceMotion) {
  let leaving = false;
  document.querySelectorAll('a[href$=".html"]').forEach((link) => {
    if (link.hostname !== location.hostname) return;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      if (leaving) return;
      leaving = true;
      sessionStorage.setItem('sp_nav', '1');
      gsap.fromTo(curtain, { y: '101%' }, {
        y: '0%', duration: 0.55, ease: 'power3.inOut',
        onComplete: () => { window.location.href = link.href; },
      });
    });
  });
  // Back/forward cache restore: never come back with the curtain stuck covering.
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) { leaving = false; gsap.set(curtain, { y: '101%' }); }
  });
}

/* ---------- nav state ---------- */
ScrollTrigger.create({
  start: 'top -90',
  onUpdate: (self) => document.querySelector('.nav')?.classList.toggle('is-scrolled', self.progress > 0),
});

/* ---------- menu overlay ---------- */
const menu = document.getElementById('menu');
const menuBtn = document.getElementById('menu-btn');
if (menu && menuBtn) {
  let open = false;
  const label = menuBtn.querySelector('.menu-btn__label');
  menuBtn.addEventListener('click', () => {
    open = !open;
    menu.classList.toggle('is-open', open);
    menuBtn.classList.toggle('is-open', open);
    if (label) label.textContent = open ? 'Close' : 'Menu';
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Menu');
    if (lenis) open ? lenis.stop() : lenis.start();
  });
}

/* ---------- scroll reveals ---------- */
gsap.utils.toArray('[data-reveal]').forEach((el) => {
  gsap.fromTo(el, { opacity: 0, y: 60 }, {
    opacity: 1, y: 0, duration: 1.1, ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 88%' },
  });
});

gsap.utils.toArray('[data-stagger]').forEach((parent) => {
  gsap.fromTo([...parent.children], { opacity: 0, y: 50 }, {
    opacity: 1, y: 0, duration: 0.9, stagger: 0.12, ease: 'power2.out',
    scrollTrigger: { trigger: parent, start: 'top 84%' },
  });
});

/* ---------- parallax images ---------- */
gsap.utils.toArray('[data-parallax]').forEach((el) => {
  // Mobile shows the meet photo fully contained; parallax would slide it around, so skip it there.
  if (window.innerWidth <= 640 && el.closest('.meet__bg')) return;
  const speed = parseFloat(el.dataset.parallax || 0.14);
  gsap.fromTo(el, { yPercent: -speed * 50 }, {
    yPercent: speed * 50, ease: 'none',
    scrollTrigger: {
      trigger: el.closest('section') || el.parentElement,
      start: 'top bottom', end: 'bottom top', scrub: true,
    },
  });
});

/* ---------- hero parallax: images drift up at different speeds ---------- */
/* Only the oversized inner images move (never the panels), and only upward,
   so no edges are ever exposed. Entrance never touches yPercent, so nothing fights. */
if (isHome && !reduceMotion) {
  const speeds = [-8, -17, -11, -22];
  gsap.utils.toArray('.hero__panel img').forEach((img, i) => {
    gsap.fromTo(img, { yPercent: 0 }, {
      yPercent: speeds[i % speeds.length], ease: 'none', overwrite: false,
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.4 },
    });
  });
  gsap.fromTo('.hero__content', { yPercent: 0 }, {
    yPercent: -14, opacity: 0.1, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.4 },
  });
}

/* ---------- masonry columns at different speeds ---------- */
gsap.utils.toArray('.masonry').forEach((grid) => {
  if (reduceMotion) return;
  const speeds = [0, -8, -16];
  grid.querySelectorAll('.masonry__col').forEach((col, i) => {
    gsap.to(col, {
      yPercent: speeds[i % speeds.length], ease: 'none',
      scrollTrigger: { trigger: grid, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
});

/* ---------- testimonial slider (pinned: scroll steps through the reviews) ---------- */
(() => {
  const section = document.querySelector('.testimonials');
  const slides = [...document.querySelectorAll('.t-slide')];
  if (!section || !slides.length) return;
  const media = [...document.querySelectorAll('.testimonials__media img')];
  let i = 0;
  const show = (next) => {
    const target = (next + slides.length) % slides.length;
    if (target === i && slides[i].classList.contains('is-active')) return;
    slides[i].classList.remove('is-active');
    media[i]?.style.setProperty('opacity', 0);
    i = target;
    slides[i].classList.add('is-active');
    media[i]?.style.setProperty('opacity', 1);
    // Crossfade lives in CSS transitions now; nothing snaps.
  };
  document.querySelector('.t-next')?.addEventListener('click', () => show(i + 1));
  document.querySelector('.t-prev')?.addEventListener('click', () => show(i - 1));
  media.forEach((m, k) => m.style.setProperty('opacity', k === 0 ? 1 : 0));

  // Pin the section; each scroll chunk advances one review, then it releases.
  if (!reduceMotion && window.innerWidth >= 900) {
    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: () => '+=' + Math.round(window.innerHeight * slides.length * 0.75),
      pin: true,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const idx = Math.min(slides.length - 1, Math.floor(self.progress * slides.length));
        show(idx);
      },
    });
  }
})();

/* ---------- galleries index (pinned: scroll highlights each gallery) ---------- */
(() => {
  const section = document.querySelector('.galleries-index');
  const items = [...document.querySelectorAll('.gi-item')];
  const bgs = [...document.querySelectorAll('.galleries-index__bgs img')];
  if (!section || !items.length) return;
  const activate = (key) => {
    bgs.forEach((b) => b.classList.toggle('is-active', b.dataset.key === key));
    items.forEach((it) => it.classList.toggle('is-current', it.dataset.key === key));
  };
  // No hover behavior: only scroll position decides which gallery is highlighted.
  activate(items[0].dataset.key);

  // Pin the section; scrolling moves the highlight Weddings -> Couples -> Lifestyle, then releases.
  if (!reduceMotion && window.innerWidth >= 900) {
    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: () => '+=' + Math.round(window.innerHeight * items.length * 0.7),
      pin: true,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const idx = Math.min(items.length - 1, Math.floor(self.progress * items.length));
        activate(items[idx].dataset.key);
      },
    });
  }
})();

/* ---------- big display text creeps in ---------- */
gsap.utils.toArray('[data-drift]').forEach((el) => {
  if (reduceMotion) return;
  const dir = el.dataset.drift === 'left' ? -1 : 1;
  gsap.fromTo(el, { xPercent: dir * 8 }, {
    xPercent: 0, ease: 'none',
    scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 30%', scrub: true },
  });
});

/* ---------- contact form (demo) ---------- */
document.querySelector('.contact-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('[type="submit"]');
  const original = btn.textContent;
  btn.textContent = 'Sending...';
  btn.disabled = true;
  await new Promise((r) => setTimeout(r, 1200));
  btn.textContent = 'Thank you! We will be in touch soon';
  setTimeout(() => { btn.textContent = original; btn.disabled = false; e.target.reset(); }, 3800);
});
