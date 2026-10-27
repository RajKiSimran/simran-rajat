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
      if (!fig) return;
      const m = M.images[key];
      fig.append(m ? picture(m, { sizes, alt: '' }) : placeholder(key));
      fig.dataset.parallax = i ? '-0.08' : '0.06';
      fig.style.setProperty('--d', i ? '.25s' : '0s');
      fig.setAttribute('data-reveal-clip', '');
    });


  /* ---------------- Story sprinkles (little illustrations that scatter around each photo on scroll) ---------------- */
  const petalSet = (n, rx, ry, cy, fill, rot0 = 0, op = 1) => Array.from({ length: n }, (_, i) =>
    `<ellipse cx="0" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" opacity="${op}" transform="rotate(${rot0 + i * 360 / n})"/>`).join('');
  const SPRITE = {
    sunflower: `<svg viewBox="-12 -12 24 24">${petalSet(14, 1.9, 4.6, -6.6, '#F2B53A')}${petalSet(14, 1.5, 3.6, -6.2, '#F8CB5A', 12.9, .9)}<circle r="4.4" fill="#7A4A22"/><circle r="3" fill="#94592B"/><circle cx="-1" cy="-1" r=".55" fill="#C88A4E"/><circle cx="1.2" cy=".2" r=".55" fill="#C88A4E"/><circle cx="-.2" cy="1.4" r=".55" fill="#C88A4E"/></svg>`,
    sparkle: `<svg viewBox="-12 -12 24 24"><path d="M0-11C.9-3.6 3.6-.9 11 0 3.6.9.9 3.6 0 11-.9 3.6-3.6.9-11 0-3.6-.9-.9-3.6 0-11Z" fill="currentColor"/></svg>`,
    plane: `<svg viewBox="0 0 32 20"><path d="M3.2 4.4h2.4l3.6 3.4H4.6z" fill="#E7A3AE" stroke="#C96F82" stroke-width="1" stroke-linejoin="round"/><path d="M4.4 7.2h18.1c3.6 0 6.5 1.3 6.5 2.8s-2.9 2.8-6.5 2.8H5.6c-1.2 0-2-.8-2-1.9V9c0-1 .4-1.8.8-1.8z" fill="#F6E3E6" stroke="#C96F82" stroke-width="1.1" stroke-linejoin="round"/><path d="M13 12.6l-3.2 5.2h2.6l5.4-5.2z" fill="#E7A3AE" stroke="#C96F82" stroke-width="1" stroke-linejoin="round"/><path d="M14 7.4l-2.4-3.8h2.2l4.4 3.8z" fill="#E7A3AE" stroke="#C96F82" stroke-width="1" stroke-linejoin="round"/><circle cx="17.2" cy="9.6" r=".9" fill="#C96F82"/><circle cx="20" cy="9.6" r=".9" fill="#C96F82"/><circle cx="22.8" cy="9.6" r=".9" fill="#C96F82"/><path d="M26.2 8.6c.9.3 1.5.8 1.6 1.4" stroke="#fff" stroke-width=".9" fill="none" stroke-linecap="round"/></svg>`,
    carnation: `<svg viewBox="-12 -12 24 24">${petalSet(8, 3.6, 5.6, -5, '#F4B7C9')}${petalSet(8, 2.8, 4, -3.6, '#EC98B2', 22.5)}<circle r="2.4" fill="#E07F9E"/></svg>`,
    lilac: `<svg viewBox="-12 -12 24 24">${petalSet(5, 4.2, 5.4, -5.4, '#CDB8EC')}${petalSet(5, 1.4, 2.6, -4.4, '#9F85D1', 0, .55)}<circle r="2.6" fill="#F4D27A"/></svg>`,
    blossom: `<svg viewBox="-12 -12 24 24">${petalSet(5, 4.2, 5.4, -5.4, '#F6C3CF')}${petalSet(5, 1.4, 2.6, -4.4, '#E58FA7', 0, .55)}<circle r="2.6" fill="#F7D88A"/></svg>`,
    leaf: `<svg viewBox="-12 -12 24 24"><path d="M-9 9C-9-3-2-9 9-9 9 3 2 9-9 9Z" fill="#9DB06A"/><path d="M-8 8 7-7" stroke="#7E9450" stroke-width="1" stroke-linecap="round"/></svg>`
  };
  //            sprite      x%    y%   size  rot  delay parallax  [colour]
  const SPRINKLES = {
    travel: [
      ['plane',     -18,  12,  46, -14, .00, 26],
      ['carnation', -12,  44,  30,  10, .08, 14],
      ['lilac',     112,   8,  28,   0, .04, 20],
      ['blossom',   -6,   26,  18,  40, .16, 22],
      ['plane',     112,  60,  40,  12, .14, 30],
      ['carnation', 114,  34,  20, -20, .20, 12],
      ['blossom',   106,  90,  26,  20, .24, 12],
      ['lilac',     -14,  80,  24, -10, .28, 18],
      ['sunflower',  -4, 102,  20,   0, .34, 10],
      ['lilac',      60, 108,  18,  30, .38, 16]
    ],
    sparkle: [
      ['sparkle', -14,   8, 30, 0, .00, 22, '#E9B44C'],
      ['sparkle',  -6,  28, 16, 0, .10, 14, '#F3BDB8'],
      ['sparkle', 114,  14, 24, 0, .04, 26, '#E9B44C'],
      ['sparkle', 104,  -2, 14, 0, .16, 12, '#C96F82'],
      ['sparkle', 116,  48, 34, 0, .12, 18, '#F3BDB8'],
      ['sparkle', -12,  58, 24, 0, .20, 24, '#E9B44C'],
      ['sparkle',  -2,  82, 14, 0, .26, 16, '#C96F82'],
      ['sparkle', 110,  78, 18, 0, .24, 16, '#E9B44C'],
      ['sparkle', 104, 100, 26, 0, .30, 20, '#E9B44C'],
      ['sparkle',  -8, 104, 18, 0, .34, 20, '#F3BDB8'],
      ['sparkle',  58, 108, 20, 0, .40, 14, '#E9B44C']
    ],
    sunflower: [
      ['sunflower', -16,  10, 40, -10, .00, 24],
      ['leaf',      -10,  30, 20,  30, .12, 14],
      ['sunflower', 113,  18, 30,  15, .04, 20],
      ['sunflower',  -6,  48, 22,  10, .16, 18],
      ['leaf',      116,  42, 18, -40, .22, 12],
      ['sunflower', 110,  66, 42,  -6, .10, 16],
      ['sunflower', -14,  76, 28,   0, .20, 28],
      ['sunflower', 106,  98, 22,   0, .30, 22],
      ['leaf',       -2, 100, 18,  60, .32, 12],
      ['sunflower',  48, 108, 24,  20, .36, 18]
    ]
  };
  function sprinkleLayer(kind) {
    const set = SPRINKLES[kind]; if (!set) return null;
    const layer = h('div', { class: 'sprinkles', 'aria-hidden': 'true' });
    set.forEach(([sp, x, y, size, rot, d, par, col]) => {
      const el = h('span', { class: 'sprinkle sprinkle--' + sp,
        style: `left:${x}%;top:${y}%;width:${size}px;height:${sp === 'plane' ? Math.round(size * .625) : size}px;--r:${rot};${col ? 'color:' + col + ';' : ''}--tw:${(1.6 + (x * 7 + y) % 13 / 10).toFixed(2)}s`,
        html: SPRITE[sp] });
      el._d = d; el._par = par; el._x = x;
      layer.append(el);
    });
    return layer;
  }

  const timeline = $('#timeline');
  (get(C, 'story.milestones') || []).forEach((ms, i) => {
    const key = 'timeline-' + String(i + 1).padStart(2, '0');
    const m = M.images[key];
    const p = ms.photo;
    const li = h('li', { class: 'milestone' + (p ? ' has-print' : '') },
      p ? h('figure', { class: 'milestone__img milestone__print', 'data-reveal': '' },
            sprinkleLayer(p.sprinkle),
            h('div', { class: 'print' },
              picture({ s: p.s, w: p.w, h: p.h, sizes: [480, 800] }, { sizes: '(min-width: 900px) 340px, 72vw', alt: p.alt || '' }),
              p.caption ? h('figcaption', {}, p.caption) : null))
        : m ? h('figure', { class: 'milestone__img', 'data-reveal-clip': '' }, picture(m, { sizes: '(min-width: 900px) 34vw, 80vw' })) : null,
      h('div', { class: 'milestone__copy', 'data-reveal': '' },
        h('div', { class: 'milestone__when' }, ms.when),
        h('h3', { class: 'milestone__title' }, ms.title),
        h('p', { class: 'milestone__text' }, ms.text)
      )
    );
    timeline.append(li);
  });

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
        : ev.art
          ? [h('img', { class: 'event__art', src: ev.art, alt: '', loading: 'lazy', decoding: 'async' })]
          : h('div', { class: 'event__mark', html: '<svg aria-hidden="true" viewBox="0 0 120 160"><use href="#arch"/></svg>' }, h('span', {}, ev.name))
    );
    if (!m && ev.art) media.classList.add('event__media--art');
    if (m) media.dataset.parallax = '0.06';
    const time = fmtTime(start) + (ev.end ? ` – ${fmtTime(end)}` : ' onwards');
    list.append(h('article', { class: 'event', id: 'event-' + ev.id },
      media,
      h('div', { class: 'event__body', 'data-reveal': '' },
        h('p', { class: 'event__index' }, `Day ${dayIndex.indexOf(ev.date) + 1}`),
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
  const tl = $('.timeline__line');
  const gallery = $('#gallery'), bar = $('#galleryBar');
  const parallaxEls = () => $$('[data-parallax]');
  let pEls = parallaxEls();
  const prints = $$('.milestone__print').map(el => {
    const print = $('.print', el);
    return { el, print, spr: $$('.sprinkle', el), tilt: parseFloat(getComputedStyle(print).getPropertyValue('--tilt')) || -2.2 };
  });
  const gItems = $$('.g-item');
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
    // stacked gallery (phones/tablets): masonry that keeps the photo order reading left to right
    const items = $$('.g-item', track);
    if (!horizontal && items.length) {
      const colW = items[0].getBoundingClientRect().width, gap = 10, unit = 4;
      items.forEach(el => {
        const [w, hh] = el.style.aspectRatio.split('/').map(Number);
        el.style.gridRowEnd = `span ${Math.ceil((colW * hh / w + gap) / unit)}`;
      });
    } else items.forEach(el => { el.style.gridRowEnd = ''; });
    pEls = parallaxEls();
    // story sprinkles: on desktop, move the ones facing the timeline to the photo's open side
    const wide = innerWidth >= 900;
    for (const f of prints) {
      const r = f.el.getBoundingClientRect();
      const onRight = r.left + r.width / 2 > innerWidth / 2;
      for (const s of f.spr) {
        let x = s._x;
        if (wide && onRight && x < 0) x = 100 - x;
        else if (wide && !onRight && x > 100) x = 100 - x;
        s.style.left = x < 0 ? `max(${x}%, -6vw)` : `${x}%`;
      }
    }
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

    // story prints: tilt follows the scroll, sprinkles scatter out as the photo rises into view
    for (const f of prints) {
      const r = f.el.getBoundingClientRect();
      if (r.bottom < -80 || r.top > vh + 80) continue;
      const c = clamp((r.top + r.height / 2 - vh / 2) / (vh / 2), -1.2, 1.2);
      f.print.style.setProperty('--rot', `${(f.tilt * c).toFixed(2)}deg`);
      const sp = clamp((vh * 0.92 - r.top) / (vh * 0.55));
      for (const s of f.spr) {
        s.style.setProperty('--k', easeOut(clamp((sp - s._d) / 0.4)).toFixed(3));
        s.style.setProperty('--dr', `${(c * s._par).toFixed(1)}px`);
      }
    }

    // timeline line fill
    const tr = tl.getBoundingClientRect();
    if (tr.top < vh && tr.bottom > 0) tl.style.setProperty('--fill', clamp((vh * 0.65 - tr.top) / tr.height).toFixed(4));

    // gallery photos: gentle zoom tied to scroll (settles to normal size as each photo reaches the centre)
    for (const el of gItems) {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh || r.right < 0 || r.left > innerWidth) continue;
      const d = horizontal ? (r.left + r.width / 2 - innerWidth / 2) / innerWidth
                           : (r.top + r.height / 2 - vh / 2) / vh;
      el.style.setProperty('--gz', (1 + Math.min(1, Math.abs(d) * 1.4) * 0.12).toFixed(4));
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

  /* ---------------- 14. Lightbox: a swipeable strip that follows the finger ---------------- */
  const lb = $('#lightbox'), lbTrack = $('#lightboxTrack'), count = $('#lightboxCount');
  const real = galleryItems.map((it, i) => ({ it, i })).filter(x => x.it.t !== 'ph');
  let cur = 0;
  real.forEach(({ it }, k) => {
    const slide = h('div', { class: 'lb-slide' });
    if (it.t === 'i') slide.append(h('img', { srcset: srcset(it), src: largest(it), alt: `Photo ${k + 1}`, decoding: 'async',
      sizes: `min(92vw, ${(it.w / it.h * 78).toFixed(1)}vh)`, loading: 'lazy' }));
    else slide.append(h('video', { src: it.v, poster: it.p, controls: true, playsinline: true, loop: true, preload: 'none' }));
    lbTrack.append(slide);
  });
  const slides = $$('.lb-slide', lbTrack);
  const setCount = () => { count.textContent = `${cur + 1} / ${real.length}`; };
  function warm(k) {   // load the photo on screen and its neighbours straight away
    [k - 1, k, k + 1].forEach(j => { const img = slides[j] && $('img', slides[j]); if (img) img.loading = 'eager'; });
  }
  function go(k, smooth = true) {
    cur = Math.max(0, Math.min(real.length - 1, k));
    warm(cur); setCount();
    const left = cur * lbTrack.clientWidth;
    if (smooth) lbTrack.scrollTo({ left, behavior: 'smooth' }); else lbTrack.scrollLeft = left;
  }
  let scrollT;
  lbTrack.addEventListener('scroll', () => {
    const k = Math.round(lbTrack.scrollLeft / Math.max(1, lbTrack.clientWidth));
    if (k !== cur && k >= 0 && k < real.length) {
      cur = k; warm(cur); setCount();
      slides.forEach((s, j) => { const v = $('video', s); if (v && j !== cur) v.pause(); });
    }
  }, { passive: true });
  function openLightbox(galleryIndex) {
    if (!real.length) return;
    lb.hidden = false;
    go(real.findIndex(x => x.i === galleryIndex), false);
    requestAnimationFrame(() => lb.classList.add('is-open'));
    if (lenis) lenis.stop(); else document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    lb.classList.remove('is-open');
    slides.forEach(s => { const v = $('video', s); if (v) v.pause(); });
    setTimeout(() => { lb.hidden = true; }, 300);
    if (lenis) lenis.start(); else document.body.style.overflow = '';
  }
  $('.lightbox__close').addEventListener('click', closeLightbox);
  $('.lightbox__nav--prev').addEventListener('click', () => go(cur - 1));
  $('.lightbox__nav--next').addEventListener('click', () => go(cur + 1));
  lbTrack.addEventListener('click', e => { if (e.target.classList.contains('lb-slide')) closeLightbox(); });
  addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') go(cur + 1);
    if (e.key === 'ArrowLeft') go(cur - 1);
  });
  addEventListener('resize', () => { if (!lb.hidden) go(cur, false); });

  /* ---------------- 15. RSVP ---------------- */
  const form = $('#rsvpForm'), errorEl = $('#formError'), submit = $('#rsvpSubmit');
  const thanks = $('#thanks');


  function fail(msg, field) {
    errorEl.textContent = msg;
    if (field) { field.closest('.field').classList.add('has-error'); field.focus({ preventScroll: false }); }
  }
  $$('input, textarea', form).forEach(i => i.addEventListener('input', () => {
    const f = i.closest('.field'); if (f) f.classList.remove('has-error'); errorEl.textContent = '';
  }));

  /* the thank-you animations: start downloading as soon as the guest reaches the RSVP form,
     so they're usually ready by the time they press Send; show a playful loader until then */
  function loadArt(img) {
    if (!img.getAttribute('src')) img.src = img.dataset.src;
    return img.complete && img.naturalWidth ? Promise.resolve()
      : new Promise(res => { img.addEventListener('load', res, { once: true }); img.addEventListener('error', res, { once: true }); });
  }
  function showWhenLoaded(fig, img) {
    fig.classList.remove('is-ready');
    loadArt(img).then(() => requestAnimationFrame(() => fig.classList.add('is-ready')));
  }
  const preloadArt = () => { loadArt($('.dance__cats')); loadArt($('.sad__cat')); };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { preloadArt(); io.disconnect(); } },
      { rootMargin: '900px 0px' });
    io.observe($('#rsvp'));
  } else preloadArt();
  form.addEventListener('focusin', preloadArt, { once: true });

  function showThanks(name, attending) {
    form.hidden = true; thanks.hidden = false;
    const yes = attending === 'Yes';
    const first = name ? name.split(' ')[0] : '';
    $('.thanks__title').firstChild.textContent = yes ? 'Thank you' : 'We’ll miss you';
    $('#thanksName').textContent = first ? `, ${first}${yes ? '!' : ''}` : '';
    $('#thanksText').textContent = yes
      ? 'We’re already doing our happy dance. Can’t wait to celebrate with you!'
      : 'Thank you for letting us know. We’re grateful for your love and blessings.';
    // a "yes" gets the two of us dancing, a "no" gets one very sad cat
    const dance = $('#thanksDance'), sad = $('#thanksSad');
    dance.hidden = !yes; sad.hidden = yes;
    if (yes) showWhenLoaded(dance, $('.dance__cats', dance));
    else showWhenLoaded(sad, $('.sad__cat', sad));
    layout();
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    errorEl.textContent = '';
    const name = form.name.value.trim();
    const phone = form.phone.value.trim();
    const attending = form.attending.value;

    if (name.length < 2) return fail('Please enter your name.', form.name);
    if (phone.replace(/\D/g, '').length < 8) return fail('Please enter a valid phone number.', form.phone);

    const endpoint = get(C, 'rsvp.endpoint');
    if (!endpoint) return fail('RSVP isn’t connected yet. (Site owner: add your Google Script URL in js/config.js.)');
    if (form.website.value) return showThanks(name, attending); // bot

    const body = new URLSearchParams({
      name, phone, attending,
      guests: attending === 'Yes' ? '1' : '0',
      events: attending === 'Yes' ? events.map(e => e.name).join(', ') : '',
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
    form.reset();
    thanks.hidden = true; form.hidden = false; layout();
  });

  /* ---------------- go ---------------- */
  layout();
  if (document.fonts) document.fonts.ready.then(layout);
})();
