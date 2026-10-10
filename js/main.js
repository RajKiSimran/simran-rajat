/* ==========================================================================
   Wedding Invitation — behaviour
   No build step, no framework. Reads content from js/config.js and media
   from assets/media-manifest.js (written by tools/optimize-media.sh).
   ========================================================================== */
(() => {
  'use strict';

  const C = window.WEDDING || {};
  const M = window.MEDIA || { images: {}, videos: {}, gallery: [] };
  M.images = M.images || {}; M.videos = M.videos || {}; M.gallery = M.gallery || [];

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
  const TZ = C.timezone || 'Asia/Kolkata';

  const reduced  = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePtr  = matchMedia('(pointer: fine)').matches;
  const saveData = !!(navigator.connection && navigator.connection.saveData);
  const portrait = () => innerHeight > innerWidth * 1.05;

  function h(tag, attrs = {}, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style') el.style.cssText = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) {
      if (kid == null || kid === false) continue;
      el.append(kid.nodeType ? kid : document.createTextNode(kid));
    }
    return el;
  }

  /* ---------------- Media helpers ---------------- */
  const srcset = m => (m.sizes || [800, 1600]).map(w => `${m.s}-${w}.webp ${w}w`).join(', ');
  const largest = m => `${m.s}-${(m.sizes || [800, 1600]).slice(-1)[0]}.webp`;

  function picture(m, { sizes = '100vw', alt = '', eager = false, cls = '' } = {}) {
    const img = h('img', {
      class: cls, alt, sizes, srcset: srcset(m), src: largest(m),
      width: m.w, height: m.h, loading: eager ? 'eager' : 'lazy', decoding: 'async',
      fetchpriority: eager ? 'high' : null
    });
    const done = () => img.classList.add('is-loaded');
    img.complete ? done() : img.addEventListener('load', done, { once: true });
    return img;
  }

  function video(v, { autoplay = true, cls = '' } = {}) {
    const el = h('video', { class: cls, muted: true, loop: true, playsinline: true, 'webkit-playsinline': true,
      preload: autoplay ? 'auto' : 'none', poster: v.p, width: v.w, height: v.h, 'aria-hidden': 'true' });
    el.muted = true; el.defaultMuted = true;
    el.append(h('source', { src: v.v, type: 'video/mp4' }));
    el.addEventListener('playing', () => el.classList.add('is-playing'));
    return el;
  }

  const placeholder = label => h('div', { class: 'ph' }, label);

  /* ---------------- 1. Bind text from config ---------------- */
  $$('[data-bind]').forEach(el => {
    const v = get(C, el.dataset.bind);
    if (v != null) el.textContent = v;
  });
  $$('[data-split]').forEach(el => {
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.innerHTML = '';
    words.forEach((w, i) => {
      const wi = h('span', { class: 'wi', style: `--i:${i}` }, w);
      el.append(h('span', { class: 'w', 'aria-hidden': 'true' }, wi), ' ');
    });
  });

  /* ---------------- 2. Hero media ---------------- */
  const heroMedia = $('#heroMedia');
  function mountHero() {
    heroMedia.innerHTML = '';
    const p = portrait();
    const photo = (p && M.images['hero-photo-mobile']) || M.images['hero-photo'];
    if (photo) heroMedia.append(picture(photo, { eager: true }));
    const vid = (p && M.videos['hero-video-mobile']) || M.videos['hero-video'];
    if (vid && !reduced && !saveData) {
      const v = video(vid);
      heroMedia.append(v);
      v.play().catch(() => {});
    }
  }
  mountHero();

  /* ---------------- 3. Story ---------------- */
  [['storyPhoto1', 'couple-01', '(min-width: 900px) 45vw, 88vw'], ['storyPhoto2', 'couple-02', '(min-width: 900px) 22vw, 42vw']]
    .forEach(([id, key, sizes], i) => {
      const fig = $('#' + id);
      const m = M.images[key];
      fig.append(m ? picture(m, { sizes, alt: '' }) : placeholder(key));
      fig.dataset.parallax = i ? '-0.08' : '0.06';
      fig.style.setProperty('--d', i ? '.25s' : '0s');
      fig.setAttribute('data-reveal-clip', '');
    });

  const timeline = $('#timeline');
  (get(C, 'story.milestones') || []).forEach((ms, i) => {
    const key = 'timeline-' + String(i + 1).padStart(2, '0');
    const m = M.images[key];
    const li = h('li', { class: 'milestone' },
      m ? h('figure', { class: 'milestone__img', 'data-reveal-clip': '' }, picture(m, { sizes: '(min-width: 900px) 34vw, 80vw' })) : null,
      h('div', { class: 'milestone__copy', 'data-reveal': '' },
        h('div', { class: 'milestone__when' }, ms.when),
        h('h3', { class: 'milestone__title' }, ms.title),
        h('p', { class: 'milestone__text' }, ms.text)
      )
    );
    timeline.append(li);
  });

  /* ---------------- 4. Film ---------------- */
  const filmMedia = $('#filmMedia');
  {
    const still = M.images['film-photo'] || M.images['hero-photo'];
    if (still) filmMedia.append(picture(still, { sizes: '100vw' }));
    const fv = M.videos['film-video'];
    if (fv && !reduced && !saveData) {
      const v = video(fv, { autoplay: false });
      filmMedia.append(v);
      lazyPlay(v);
    }
  }

  /* ---------------- 5. Events ---------------- */
  const fmtDate = d => new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ }).format(d);
  const fmtTime = d => new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: TZ }).format(d);
  const at = (date, time) => new Date(`${date}T${time || '00:00'}:00+05:30`);
  const gcal = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  /* Editions: js/edition.js says which invitation version this copy is;
     config.js → editions says which events that version hides (see docs/EDITIONS.md). */
  const EDITION = (C.editions && C.editions[window.EDITION]) ? window.EDITION : 'full';
  const edition = (C.editions || {})[EDITION] || {};
  const events = (C.events || []).filter(ev =>
    (!edition.only || edition.only.includes(ev.id)) && !(edition.exclude || []).includes(ev.id));
  const dayIndex = [...new Set(events.map(e => e.date))].sort();
  const list = $('#eventsList');
  events.forEach((ev, i) => {
    const start = at(ev.date, ev.start);
    const end = ev.end ? at(ev.date, ev.end) : new Date(start.getTime() + 3 * 3600e3);
    if (end < start) end.setDate(end.getDate() + 1);
    const where = [ev.venue, ev.address].filter(Boolean).join(', ');
    const maps = ev.mapsUrl || (where ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(where)}` : '');
    const cal = 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
      `&text=${encodeURIComponent(`${ev.name} · ${C.couple.first} & ${C.couple.second}`)}` +
      `&dates=${gcal(start)}/${gcal(end)}&ctz=${encodeURIComponent(TZ)}` +
      `&location=${encodeURIComponent(where)}&details=${encodeURIComponent(location.href.split('#')[0])}`;
    const m = M.images['event-' + ev.id];
    const media = h('div', { class: 'event__media', style: `--tone:${ev.tone || ''}`, 'data-reveal-clip': '' },
      m ? picture(m, { sizes: '(min-width: 900px) 46vw, 92vw', alt: ev.name })
        : h('div', { class: 'event__mark', html: '<svg aria-hidden="true" viewBox="0 0 120 160"><use href="#arch"/></svg>' }, h('span', {}, ev.name))
    );
    if (m) media.dataset.parallax = '0.06';
    const time = fmtTime(start) + (ev.end ? ` – ${fmtTime(end)}` : ' onwards');
    list.append(h('article', { class: 'event' },
      media,
      h('div', { class: 'event__body', 'data-reveal': '' },
        h('p', { class: 'event__index' }, `${String(i + 1).padStart(2, '0')} — Day ${dayIndex.indexOf(ev.date) + 1}`),
        h('h3', { class: 'event__name' }, ev.name),
        ev.tagline ? h('p', { class: 'event__tagline' }, ev.tagline) : null,
        h('dl', { class: 'event__meta' },
          h('div', {}, h('dt', {}, 'Date'), h('dd', {}, fmtDate(start))),
          h('div', {}, h('dt', {}, 'Time'), h('dd', {}, time)),
          h('div', {}, h('dt', {}, 'Venue'), h('dd', {}, where ? [ev.venue, ev.address ? h('small', {}, ev.address) : null] : h('small', {}, 'Details to follow'))),
          ev.dress ? h('div', {}, h('dt', {}, 'Dress code'), h('dd', {}, ev.dress)) : null
        ),
        h('div', { class: 'event__actions' },
          maps ? h('a', { class: 'btn', href: maps, target: '_blank', rel: 'noopener' }, 'Open in Maps ↗') : null,
          h('a', { class: 'link', href: cal, target: '_blank', rel: 'noopener' }, 'Add to calendar')
        )
      )
    ));
  });

  /* ---------------- 6. Gallery ---------------- */
  const track = $('#galleryTrack');
  let galleryItems = M.gallery.slice();
  const demo = !galleryItems.length;
  if (demo) {
    const ratios = [[4, 5], [3, 2], [2, 3], [1, 1], [4, 5], [16, 9], [3, 4], [2, 3], [4, 5], [3, 2]];
    galleryItems = ratios.map(([w, h], i) => ({ t: 'ph', w, h, label: 'gallery-' + String(i + 1).padStart(2, '0') }));
  }
  galleryItems.forEach((it, i) => {
    const btn = h('button', { class: 'g-item', type: 'button', style: `aspect-ratio:${it.w}/${it.h}`,
      'aria-label': `Open ${it.t === 'v' ? 'video' : 'photo'} ${i + 1}`, 'data-reveal': '' });
    btn.style.setProperty('--d', `${(i % 4) * 0.08}s`);
    if (it.t === 'i') btn.append(picture(it, { sizes: '(min-width: 900px) 40vw, (min-width: 640px) 33vw, 50vw' }));
    else if (it.t === 'v') { const v = video(it, { autoplay: false }); btn.append(v, h('span', { class: 'g-item__badge', 'aria-hidden': 'true' }, '▶')); lazyPlay(v); }
    else { btn.append(placeholder(it.label)); btn.style.setProperty('--a', i % 2 ? '#3b3129' : '#2f2a24'); }
    if (it.t !== 'ph') btn.addEventListener('click', () => openLightbox(i));
    track.append(btn);
  });

  /* ---------------- 7. RSVP events + contacts ---------------- */
  const chipBox = $('#rsvpEvents');
  events.forEach(ev => chipBox.append(
    h('label', { class: 'pill' }, h('input', { type: 'checkbox', name: 'events', value: ev.name }), h('span', {}, ev.name))
  ));
  const contacts = $('#contacts');
  (C.contacts || []).forEach(c => contacts.append(h('div', { class: 'contact' },
    h('span', {}, c.label),
    c.phones ? [h('a', {}, c.name), ...c.phones.map(p => h('a', { href: 'tel:' + String(p).replace(/[^\d+]/g, '') }, p))]
             : h('a', { href: 'tel:' + String(c.phone).replace(/[^\d+]/g, '') }, `${c.name} · ${c.phone}`))));
  if (!get(C, 'rsvp.deadline')) { const dl = $('#deadlineLine'); if (dl) dl.hidden = true; }

  /* ---------------- 8. Statement: word-by-word ---------------- */
  const statement = $('#statement');
  const sWords = statement.textContent.trim().split(/\s+/);
  statement.innerHTML = sWords.map(w => `<span class="sw">${w.replace(/</g, '&lt;')}</span>`).join(' ');
  const swEls = $$('.sw', statement);

  /* ---------------- 9. Reveal on scroll ---------------- */
  $$('[data-reveal-clip]').forEach(el => { el.removeAttribute('data-reveal-clip'); el.classList.add('clip'); });
  const revealTargets = $$('[data-reveal], [data-split], .milestone');
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      [e.target, ...(e.target._clipKids || [])].forEach(k => k.classList.add('is-in'));
      io.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  revealTargets.forEach(el => io.observe(el));
  // clip-path hides an element from IntersectionObserver, so watch its parent instead
  $$('.clip').forEach(el => {
    const parent = el.parentElement;
    (parent._clipKids = parent._clipKids || []).push(el);
    io.observe(parent);
  });

  function lazyPlay(v) {
    const o = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { if (v.preload === 'none') v.preload = 'auto'; v.play().catch(() => {}); }
      else v.pause();
    }, { rootMargin: '200px 0px' });
    o.observe(v);
  }

  /* ---------------- 10. Scroll engine ---------------- */
  const hero = $('.hero'), heroContent = $('.hero__content');
  const nav = $('#nav');
  const film = $('#film'), filmFrame = $('#filmFrame'), filmQuote = $('#filmQuote');
  const tl = $('.timeline__line');
  const gallery = $('#gallery'), bar = $('#galleryBar');
  const parallaxEls = () => $$('[data-parallax]');
  let pEls = parallaxEls();
  let horizontal = false, hDist = 0;
  let lastY = 0;

  function layout() {
    horizontal = !reduced && innerWidth >= 900;
    gallery.classList.toggle('is-horizontal', horizontal);
    if (horizontal) {
      hDist = Math.max(0, track.scrollWidth - innerWidth);
      gallery.style.height = `${hDist + innerHeight}px`;
    } else {
      gallery.style.height = '';
      track.style.transform = '';
    }
    pEls = parallaxEls();
    update();
  }

  function update() {
    const y = scrollY, vh = innerHeight;

    // nav: solid after the hero, hides while scrolling down
    const past = y > hero.offsetHeight * 0.85;
    nav.classList.toggle('is-solid', past);
    nav.classList.toggle('is-hidden', past && y > lastY + 2 && y > hero.offsetHeight * 1.3);
    if (y < lastY - 2) nav.classList.remove('is-hidden');
    lastY = y;

    if (reduced) return;

    // hero: slow media, fade content
    if (y < vh * 1.2 && hero.classList.contains('is-settled')) {
      const p = clamp(y / hero.offsetHeight);
      heroMedia.style.transform = `translate3d(0, ${p * 22}%, 0) scale(${1 + p * 0.08})`;
      heroContent.style.transform = `translate3d(0, ${-p * 90}px, 0)`;
      heroContent.style.opacity = 1 - p * 1.5;
    }

    // statement words light up
    const sr = statement.getBoundingClientRect();
    if (sr.top < vh && sr.bottom > 0) {
      const p = clamp((vh * 0.85 - sr.top) / (sr.height + vh * 0.35));
      const n = swEls.length, lit = p * (n + 2);
      swEls.forEach((w, i) => { w.style.opacity = 0.14 + 0.86 * clamp(lit - i); });
    }

    // parallax images
    for (const el of pEls) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) continue;
      const speed = parseFloat(el.dataset.parallax) || 0.06;
      const offset = (r.top + r.height / 2 - vh / 2) * -speed;
      const img = el.querySelector('img');
      if (img) img.style.setProperty('--py', `${offset.toFixed(1)}px`);
      else el.style.setProperty('--py', `${offset.toFixed(1)}px`);
    }

    // timeline line fill
    const tr = tl.getBoundingClientRect();
    if (tr.top < vh && tr.bottom > 0) tl.style.setProperty('--fill', clamp((vh * 0.65 - tr.top) / tr.height).toFixed(4));

    // film: frame expands to full-bleed, then quote appears
    const fr = film.getBoundingClientRect();
    if (fr.top < vh && fr.bottom > 0) {
      const p = clamp(-fr.top / (fr.height - vh));
      const e = easeOut(clamp(p / 0.5));
      const inv = 1 - e;
      filmFrame.style.setProperty('--ci-y', `${(inv * 14).toFixed(2)}%`);
      filmFrame.style.setProperty('--ci-x', `${(inv * (innerWidth < 700 ? 6 : 10)).toFixed(2)}%`);
      filmFrame.style.setProperty('--ci-r', `${(inv * 24).toFixed(1)}px`);
      filmMedia.style.setProperty('--fs', (1.2 - e * 0.2).toFixed(4));
      const q = clamp((p - 0.42) / 0.22);
      filmFrame.style.setProperty('--fo', q.toFixed(3));
      filmQuote.style.setProperty('--qo', q.toFixed(3));
    }

    // gallery: vertical scroll drives horizontal track
    if (horizontal) {
      const gr = gallery.getBoundingClientRect();
      if (gr.top < vh && gr.bottom > 0) {
        const p = clamp(-gr.top / Math.max(1, hDist));
        track.style.transform = `translate3d(${(-p * hDist).toFixed(1)}px, 0, 0)`;
        bar.parentElement.style.setProperty('--gp', p.toFixed(4));
        bar.style.setProperty('--gp', p.toFixed(4));
      }
    }
  }

  let ticking = false;
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; update(); }); } };
  addEventListener('scroll', onScroll, { passive: true });
  let rT;
  addEventListener('resize', () => {
    clearTimeout(rT);
    rT = setTimeout(() => {
      // ignore the mobile address-bar height jiggle; only re-layout on real width changes
      layout();
    }, 150);
  });
  addEventListener('load', layout);

  /* ---------------- 11. Smooth scrolling (desktop) ---------------- */
  let lenis = null;
  function initLenis() {
    if (lenis || reduced || !finePtr || !window.Lenis) return;
    lenis = new window.Lenis({ lerp: 0.085, wheelMultiplier: 0.95 });
    document.documentElement.classList.add('lenis');
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    if (document.body.classList.contains('is-locked')) lenis.stop();
  }
  initLenis();
  addEventListener('load', initLenis);

  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    const target = id === '#top' ? document.body : $(id);
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(id === '#top' ? 0 : target, { duration: 1.6 });
    else (id === '#top' ? scrollTo({ top: 0, behavior: 'smooth' }) : target.scrollIntoView({ behavior: 'smooth' }));
  }));

  /* ---------------- 12. Countdown ---------------- */
  const cd = $('#countdown');
  const target = C.countdownTo ? new Date(C.countdownTo) : null;
  function tick() {
    if (!target) { cd.hidden = true; return; }
    const ms = target - Date.now();
    if (ms <= 0) { cd.classList.add('is-past'); cd.textContent = 'Just married'; return; }
    const s = Math.floor(ms / 1000);
    const parts = { d: Math.floor(s / 86400), h: Math.floor(s / 3600) % 24, m: Math.floor(s / 60) % 60, s: s % 60 };
    for (const k in parts) { const el = $(`[data-cd="${k}"]`, cd); if (el) el.textContent = String(parts[k]).padStart(2, '0'); }
    setTimeout(tick, 1000 - (Date.now() % 1000));
  }
  tick();

  /* ---------------- 13. Opening screen + music ---------------- */
  const intro = $('#intro');
  const soundBtn = $('#sound');
  let audio = null;
  if (M.music) {
    audio = h('audio', { src: M.music, loop: true, preload: 'none' });
    soundBtn.addEventListener('click', () => {
      if (audio.paused) { audio.play().catch(() => {}); soundBtn.classList.add('is-on'); }
      else { audio.pause(); soundBtn.classList.remove('is-on'); }
    });
  }
  function startMusic() {
    if (!audio) return;
    soundBtn.hidden = false;
    audio.volume = 0;
    audio.play().then(() => {
      soundBtn.classList.add('is-on');
      let v = 0; const fade = setInterval(() => { v = Math.min(0.55, v + 0.03); audio.volume = v; if (v >= 0.55) clearInterval(fade); }, 120);
    }).catch(() => {});
  }

  const fontsReady = Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise(r => setTimeout(r, 1500))]);
  function revealHero() {
    requestAnimationFrame(() => {
      hero.classList.add('is-ready');
      setTimeout(() => { hero.classList.add('is-settled'); update(); }, 3300);
    });
  }

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (C.intro && C.intro.enabled !== false && !location.hash) {
    document.body.classList.add('is-locked');
    scrollTo(0, 0);
    $('#introOpen').addEventListener('click', () => {
      startMusic();
      intro.classList.add('is-leaving');
      document.body.classList.remove('is-locked');
      if (lenis) lenis.start();
      setTimeout(revealHero, 350);
      setTimeout(() => { intro.remove(); layout(); }, 1700);
    }, { once: true });
  } else {
    intro.remove();
    if (M.music) soundBtn.hidden = false;
    fontsReady.then(revealHero);
  }

  /* ---------------- 14. Lightbox ---------------- */
  const lb = $('#lightbox'), stage = $('#lightboxStage'), count = $('#lightboxCount');
  const real = galleryItems.map((it, i) => ({ it, i })).filter(x => x.it.t !== 'ph');
  let cur = 0;
  function show(idx) {
    cur = (idx + real.length) % real.length;
    const { it } = real[cur];
    stage.innerHTML = '';
    if (it.t === 'i') stage.append(h('img', { src: largest(it), alt: `Photo ${cur + 1}` }));
    else { const v = h('video', { src: it.v, poster: it.p, controls: true, autoplay: true, playsinline: true, loop: true }); stage.append(v); }
    count.textContent = `${cur + 1} / ${real.length}`;
  }
  function openLightbox(galleryIndex) {
    if (!real.length) return;
    show(real.findIndex(x => x.i === galleryIndex));
    lb.hidden = false;
    requestAnimationFrame(() => lb.classList.add('is-open'));
    if (lenis) lenis.stop(); else document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    lb.classList.remove('is-open');
    setTimeout(() => { lb.hidden = true; stage.innerHTML = ''; }, 400);
    if (lenis) lenis.start(); else document.body.style.overflow = '';
  }
  $('.lightbox__close').addEventListener('click', closeLightbox);
  $('.lightbox__nav--prev').addEventListener('click', () => show(cur - 1));
  $('.lightbox__nav--next').addEventListener('click', () => show(cur + 1));
  lb.addEventListener('click', e => { if (e.target === lb || e.target === stage) closeLightbox(); });
  addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') show(cur + 1);
    if (e.key === 'ArrowLeft') show(cur - 1);
  });
  let sx = null;
  lb.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    if (sx == null) return;
    const dx = e.changedTouches[0].clientX - sx; sx = null;
    if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1));
  });

  /* ---------------- 15. RSVP ---------------- */
  const form = $('#rsvpForm'), errorEl = $('#formError'), submit = $('#rsvpSubmit');
  const whenYes = $('#whenYes'), guests = $('#guests'), guestsOut = $('#guestsOut');
  const maxGuests = get(C, 'rsvp.maxGuests') || 6;
  const thanks = $('#thanks');

  function setGuests(n) {
    n = Math.max(1, Math.min(maxGuests, n));
    guests.value = n; guestsOut.textContent = n;
    $('[data-step="-1"]', form).disabled = n <= 1;
    $('[data-step="1"]', form).disabled = n >= maxGuests;
  }
  setGuests(1);
  $$('[data-step]', form).forEach(b => b.addEventListener('click', () => setGuests(+guests.value + +b.dataset.step)));
  $$('input[name="attending"]', form).forEach(r => r.addEventListener('change', () => {
    whenYes.hidden = form.attending.value !== 'Yes';
    layout();
  }));

  function fail(msg, field) {
    errorEl.textContent = msg;
    if (field) { field.closest('.field').classList.add('has-error'); field.focus({ preventScroll: false }); }
  }
  $$('input, textarea', form).forEach(i => i.addEventListener('input', () => {
    const f = i.closest('.field'); if (f) f.classList.remove('has-error'); errorEl.textContent = '';
  }));

  function showThanks(name, attending) {
    form.hidden = true; thanks.hidden = false;
    $('#thanksName').textContent = name ? `, ${name.split(' ')[0]}` : '';
    $('#thanksText').textContent = attending === 'Yes'
      ? 'We have your response and cannot wait to celebrate with you.'
      : 'We will miss you, and we are grateful for your blessings.';
    layout();
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    errorEl.textContent = '';
    const name = form.name.value.trim();
    const phone = form.phone.value.trim();
    const attending = form.attending.value;
    const chosen = $$('input[name="events"]:checked', form).map(c => c.value);

    if (name.length < 2) return fail('Please enter your name.', form.name);
    if (phone.replace(/\D/g, '').length < 8) return fail('Please enter a valid phone number.', form.phone);
    if (attending === 'Yes' && events.length && !chosen.length) return fail('Please choose at least one event.');

    const endpoint = get(C, 'rsvp.endpoint');
    if (!endpoint) return fail('RSVP isn’t connected yet. (Site owner: add your Google Script URL in js/config.js.)');
    if (form.website.value) return showThanks(name, attending); // bot

    const body = new URLSearchParams({
      name, phone, attending,
      guests: attending === 'Yes' ? guests.value : '0',
      events: attending === 'Yes' ? chosen.join(', ') : '',
      message: form.message.value.trim(),
      edition: EDITION,
      source: location.href.split('#')[0],
      userAgent: navigator.userAgent.slice(0, 180)
    });

    submit.classList.add('is-loading'); submit.disabled = true;
    try {
      const res = await fetch(endpoint, { method: 'POST', body });
      const data = await res.json().catch(() => ({ ok: res.ok }));
      if (!data.ok) throw new Error(data.error || 'Server error');
      showThanks(name, attending);
    } catch (err) {
      // Apps Script sometimes blocks reading the reply even though the row was saved.
      if (err instanceof TypeError && navigator.onLine) showThanks(name, attending);
      else fail('Something went wrong sending your RSVP. Please check your connection and try again.');
    } finally {
      submit.classList.remove('is-loading'); submit.disabled = false;
    }
  });

  $('#rsvpAgain').addEventListener('click', () => {
    form.reset(); setGuests(1); whenYes.hidden = false;
    thanks.hidden = true; form.hidden = false; layout();
  });

  /* ---------------- go ---------------- */
  layout();
  if (document.fonts) document.fonts.ready.then(layout);
})();
