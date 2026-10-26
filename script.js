/* ==========================================================================
   Alvar Pascual García · Portfolio
   1. Navigation (smooth scroll, active section, mobile menu)
   2. Reveal on scroll and small interactions (cards, video, copy email)
   3. Hero flora: a garden of Arabidopsis thaliana, Nicotiana benthamiana,
      grasses and seedlings, grown procedurally on two canvases and pushed
      around by the pointer. No libraries.
   ========================================================================== */
(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  initNavigation();
  initReveal();
  initCards();
  initVideoCards();
  initCopy();
  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });
  initFlora();

  /* ------------------------------------------------------------------------
     1. Navigation
     ------------------------------------------------------------------------ */
  function initNavigation() {
    const header = document.querySelector('.site-header');
    const toggle = document.querySelector('.nav-toggle');
    const menu = document.getElementById('nav-menu');
    if (!header || !toggle || !menu) return;

    const setMenu = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      header.classList.toggle('menu-open', open);
    };
    toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && header.classList.contains('menu-open')) {
        setMenu(false);
        toggle.focus();
      }
    });
    document.addEventListener('click', (e) => {
      if (header.classList.contains('menu-open') && !header.contains(e.target)) setMenu(false);
    });

    // Smooth scroll for in-page links. CSS scroll-padding keeps targets clear of the fixed header.
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;
      const hash = link.getAttribute('href');
      const target = hash.length > 1 ? document.getElementById(hash.slice(1)) : null;
      if (!target) return;
      e.preventDefault();
      setMenu(false);
      target.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
      if (history.pushState) history.pushState(null, '', hash);
      // Move focus for keyboard and screen-reader users without a second jump.
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });

    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Highlight the section currently in the middle of the viewport.
    const links = [...menu.querySelectorAll('a[href^="#"]')];
    const ids = new Set(links.map((a) => a.getAttribute('href').slice(1)));
    const sections = [...document.querySelectorAll('main > section[id]')];
    if (!('IntersectionObserver' in window)) return;
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = ids.has(entry.target.id) ? entry.target.id : '';
        links.forEach((a) => {
          const on = a.getAttribute('href') === '#' + id;
          a.classList.toggle('is-active', on);
          if (on) a.setAttribute('aria-current', 'location');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => spy.observe(s));
  }

  /* ------------------------------------------------------------------------
     2. Reveal on scroll and small interactions
     ------------------------------------------------------------------------ */
  function initReveal() {
    const items = document.querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    items.forEach((el) => io.observe(el));
  }

  // Subtle 3D tilt and a spotlight that follows the pointer on project cards.
  function initCards() {
    if (!finePointer.matches) return;
    document.querySelectorAll('.project').forEach((card) => {
      let raf = 0;
      let px = 0.5;
      let py = 0.5;
      let amp = 3;
      const apply = () => {
        raf = 0;
        card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
        if (reduceMotion.matches) return;
        card.style.setProperty('--rx', ((0.5 - py) * amp).toFixed(2) + 'deg');
        card.style.setProperty('--ry', ((px - 0.5) * amp * 1.2).toFixed(2) + 'deg');
      };
      card.addEventListener('pointerenter', () => card.classList.add('is-tilting'));
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        px = (e.clientX - r.left) / r.width;
        py = (e.clientY - r.top) / r.height;
        amp = Math.min(3.2, 1500 / r.width); // wide cards tilt less
        if (!raf) raf = requestAnimationFrame(apply);
      });
      card.addEventListener('pointerleave', () => {
        card.classList.remove('is-tilting');
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }

  // Blender render: play the animation on hover (desktop) or when in view (touch).
  function initVideoCards() {
    document.querySelectorAll('[data-video-card]').forEach((card) => {
      const video = card.querySelector('video');
      if (!video) return;
      const play = () => {
        if (reduceMotion.matches) return;
        const p = video.play();
        if (p && p.then) p.then(() => card.classList.add('is-playing')).catch(() => {});
        else card.classList.add('is-playing');
      };
      const pause = () => {
        video.pause();
        card.classList.remove('is-playing');
      };
      if (!('IntersectionObserver' in window)) return;
      if (finePointer.matches) {
        card.addEventListener('pointerenter', play);
        card.addEventListener('pointerleave', pause);
        card.addEventListener('focusin', play);
        card.addEventListener('focusout', pause);
        // Warm the video up once the card gets close, so hover starts instantly.
        const warm = new IntersectionObserver(([entry]) => {
          if (!entry.isIntersecting) return;
          video.preload = 'auto';
          warm.disconnect();
        }, { rootMargin: '400px 0px' });
        warm.observe(card);
      } else {
        new IntersectionObserver(([entry]) => (entry.isIntersecting ? play() : pause()), { threshold: 0.6 }).observe(card);
      }
    });
  }

  function initCopy() {
    const status = document.getElementById('copy-status');
    document.querySelectorAll('[data-copy]').forEach((btn) => {
      const label = btn.querySelector('[data-copy-label]');
      let timer = 0;
      btn.addEventListener('click', async () => {
        const text = btn.getAttribute('data-copy');
        let ok = false;
        try {
          await navigator.clipboard.writeText(text);
          ok = true;
        } catch (err) {
          const ta = document.createElement('textarea');
          ta.value = text;
          ta.setAttribute('readonly', '');
          ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
          document.body.appendChild(ta);
          ta.select();
          try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
          ta.remove();
        }
        if (!ok) return;
        btn.classList.add('is-done');
        if (label) label.textContent = 'Copied';
        if (status) status.textContent = 'Email address copied to the clipboard';
        clearTimeout(timer);
        timer = setTimeout(() => {
          btn.classList.remove('is-done');
          if (label) label.textContent = 'Copy';
          if (status) status.textContent = '';
        }, 1800);
      });
    });
  }

  /* ------------------------------------------------------------------------
     3. Hero flora
     ------------------------------------------------------------------------ */
  function initFlora() {
    const hero = document.querySelector('.hero');
    const backCanvas = document.getElementById('flora-back');
    const frontCanvas = document.getElementById('flora-front');
    if (!hero || !backCanvas || !frontCanvas || !backCanvas.getContext) return;
    const bctx = backCanvas.getContext('2d');
    const fctx = frontCanvas.getContext('2d');
    if (!bctx || !fctx) return;
    const content = hero.querySelector('.hero-inner');
    const header = document.querySelector('.site-header');

    const TAU = Math.PI * 2;
    const BG = [236, 238, 231];           // hero background, used for depth haze
    const BRUSH = 0.022;                   // how strongly a moving pointer sweeps the stems
    const still = /[?&]still\b/.test(location.search);

    let W = 0;
    let H = 0;
    let dpr = 1;
    let lite = false;
    let plants = [];
    let back = [];
    let front = [];
    let textBox = null;
    let groundGradient = null;
    let groundDepth = 80;
    let reach = 120;
    let gust = 0.05;
    let born = 0;
    let growEnd = 0;
    let growing = false;
    let running = false;
    let raf = 0;
    let lastT = 0;
    let pausedAt = 0;
    let heroVisible = true;
    let frames = 0;
    let slowFrames = 0;
    let built = false;

    const pointer = { cx: -1e4, cy: -1e4, x: -1e4, y: -1e4, px: 0, py: 0, vx: 0, vy: 0, active: false, fresh: true };
    const glow = { x: -1e4, y: -1e4, a: 0 };
    const tmp = { x: 0, y: 0, a: 0 };

    const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
    const ease = (v) => {
      const t = clamp01(v);
      return 1 - (1 - t) * (1 - t) * (1 - t);
    };

    function mulberry32(seed) {
      let a = seed >>> 0;
      return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    function hslToRgb(h, s, l) {
      const sat = s / 100;
      const lig = l / 100;
      const a = sat * Math.min(lig, 1 - lig);
      const f = (n) => {
        const k = (n + h / 30) % 12;
        return lig - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
      };
      return [f(0) * 255, f(8) * 255, f(4) * 255];
    }

    // A colour mixed toward the background by `haze` (far plants look paler).
    function color(h, s, l, haze, alpha) {
      const c = hslToRgb(h, Math.max(0, Math.min(100, s)), Math.max(0, Math.min(100, l)));
      const r = Math.round(c[0] + (BG[0] - c[0]) * haze);
      const g = Math.round(c[1] + (BG[1] - c[1]) * haze);
      const b = Math.round(c[2] + (BG[2] - c[2]) * haze);
      return alpha == null ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${alpha})`;
    }

    function sprite(w, h, paint) {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      paint(c.getContext('2d'), w, h);
      return c;
    }
    const glowSprite = sprite(256, 256, (c, w) => {
      const g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
      g.addColorStop(0, 'rgba(255,246,220,0.9)');
      g.addColorStop(0.45, 'rgba(255,246,220,0.35)');
      g.addColorStop(1, 'rgba(255,246,220,0)');
      c.fillStyle = g;
      c.fillRect(0, 0, w, w);
    });
    const shadowSprite = sprite(128, 32, (c, w, h) => {
      c.scale(1, h / w);
      const g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
      g.addColorStop(0, 'rgba(46,58,38,0.32)');
      g.addColorStop(1, 'rgba(46,58,38,0)');
      c.fillStyle = g;
      c.fillRect(0, 0, w, w);
    });

    /* ---------- painted leaves ---------- */

    // Every leaf type is painted once, pixel by pixel, into offscreen canvases: the upper surface,
    // the paler lower surface and a dark silhouette used for shading. The outline follows the real
    // leaf (a spatulate Arabidopsis rosette leaf with a shallow, irregular toothed margin; a broad
    // ovate N. benthamiana leaf with a heart-shaped base and wavy margin), with a slightly curved
    // midrib and unequal halves. Each frame only maps these bitmaps into 3D poses.
    const HAZE = [0, 0.16, 0.5];
    const hazeIndex = (hz) => (hz < 0.1 ? 0 : hz < 0.36 ? 1 : 2);
    const LEAF_TYPES = {
      // m: widest point (0 base … 1 tip) · eb/et: base/tip exponents (higher = narrower)
      // lobe/sinus: heart-shaped base · teeth/wave: margin · bend: midrib curvature
      rosette: {
        len: 200, ratio: 0.58, m: 0.68, eb: 1.9, et: 0.55, lobe: 0, sinus: 0, teeth: 0.05, teethN: 6, wave: 0.012,
        veins: 4, rise: 0.34, cell: 7, gloss: 0.1, veinAmt: 0.55, mid: 0.03, bend: 0.04,
        colors: [[88, 40, 38], [95, 37, 35], [101, 35, 33], [107, 32, 31]],
      },
      benth: {
        len: 300, ratio: 0.72, m: 0.32, eb: 0.75, et: 1.35, lobe: 0.32, sinus: 0.06, teeth: 0, teethN: 0, wave: 0.035,
        veins: 6, rise: 0.27, cell: 9, gloss: 0.18, veinAmt: 0.75, mid: 0.028, bend: 0.05,
        colors: [[100, 33, 31], [106, 31, 29], [112, 29, 27]],
      },
      cauline: {
        len: 120, ratio: 0.34, m: 0.38, eb: 0.8, et: 1.25, lobe: 0.2, sinus: 0, teeth: 0.03, teethN: 3, wave: 0,
        veins: 3, rise: 0.32, cell: 6, gloss: 0.08, veinAmt: 0.45, mid: 0.03, bend: 0.04,
        colors: [[90, 40, 40], [100, 36, 37]],
      },
      coty: {
        len: 100, ratio: 0.9, m: 0.5, eb: 0.55, et: 0.55, lobe: 0.1, sinus: 0.03, teeth: 0, teethN: 0, wave: 0,
        veins: 2, rise: 0.36, cell: 6, gloss: 0.16, veinAmt: 0.3, mid: 0.022, bend: 0.02,
        colors: [[84, 48, 47], [92, 44, 45]],
      },
    };
    let leafSprites = null;
    let flowerSprite = null;

    const smooth = (t) => {
      const v = clamp01(t);
      return v * v * (3 - 2 * v);
    };

    // Half-width of the blade (fraction of the maximum) at v, from the base (0) to the tip (1).
    function baseProfile(T, v) {
      if (v >= 1) return 0;
      if (v < T.m) return T.lobe + (1 - T.lobe) * Math.pow(Math.sin((v / T.m) * Math.PI * 0.5), T.eb);
      return Math.pow(Math.cos(((v - T.m) / (1 - T.m)) * Math.PI * 0.5), T.et);
    }

    function valueNoise(seed) {
      const hash = (i, j) => {
        let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + seed) | 0;
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
      };
      return (x, y) => {
        const xi = Math.floor(x);
        const yi = Math.floor(y);
        const xf = x - xi;
        const yf = y - yi;
        const u = xf * xf * (3 - 2 * xf);
        const w = yf * yf * (3 - 2 * yf);
        const a = hash(xi, yi);
        const b = hash(xi + 1, yi);
        const c = hash(xi, yi + 1);
        const e = hash(xi + 1, yi + 1);
        return a + (b - a) * u + (c - a) * w + (a - b - c + e) * u * w;
      };
    }

    function hazed(src, hz) {
      const c = document.createElement('canvas');
      c.width = src.width;
      c.height = src.height;
      const g = c.getContext('2d');
      g.drawImage(src, 0, 0);
      g.globalCompositeOperation = 'source-atop';
      g.fillStyle = `rgba(${BG[0]},${BG[1]},${BG[2]},${hz})`;
      g.fillRect(0, 0, c.width, c.height);
      return c;
    }

    function paintLeaf(T, col, seed, scale) {
      const rand = mulberry32(seed);
      const noise = valueNoise(seed);
      const L = Math.round(T.len * scale);
      const hw = Math.round(L * T.ratio * 0.5);
      const N = 160;

      // Outline: per-side half-widths with irregular teeth, a wavy margin and unequal halves.
      const bendAmt = T.bend * L * (rand() < 0.5 ? -1 : 1) * (0.6 + rand() * 0.6);
      const asym = (rand() - 0.5) * 0.12;
      const amps = [];
      for (let i = 0; i < 40; i++) amps.push(0.35 + rand() * 0.9);
      const phL = rand();
      const phR = rand();
      const wpL = rand() * TAU;
      const wpR = rand() * TAU;
      const waveF = 14 + rand() * 8;
      const tooth = (v, ph, side) => {
        if (!T.teeth) return 0;
        const f = v * T.teethN + ph;
        const t = f - Math.floor(f);
        const env = smooth((v - 0.2) / 0.3) * (1 - smooth((v - 0.9) / 0.1));
        const saw = t < 0.75 ? t / 0.75 : (1 - t) / 0.25;
        return T.teeth * amps[(Math.floor(f) * 2 + (side > 0 ? 1 : 0)) % amps.length] * (saw - 0.5) * 2 * env;
      };
      const shift = new Float32Array(N + 1);
      const wl = new Float32Array(N + 1);
      const wr = new Float32Array(N + 1);
      for (let i = 0; i <= N; i++) {
        const v = i / N;
        const p = baseProfile(T, v);
        shift[i] = bendAmt * v * v;
        let ml = 1 + tooth(v, phL, -1) + 0.03 * (noise(v * 7, 3.1) - 0.5);
        let mr = 1 + tooth(v, phR, 1) + 0.03 * (noise(v * 7, 9.7) - 0.5);
        if (T.wave) {
          ml *= 1 + T.wave * Math.sin(v * waveF + wpL);
          mr *= 1 + T.wave * Math.sin(v * waveF + wpR);
        }
        wl[i] = p * ml;
        wr[i] = p * mr * (1 + asym);
      }

      const pad = 4;
      const cw = Math.ceil(2 * (hw * 1.2 + Math.abs(bendAmt)) + 2 * pad);
      const ch = L + 2 * pad;
      const cx = cw / 2;
      const by = ch - pad;
      const ay = by - T.sinus * L;           // where the petiole joins the blade
      const X = (i, side) => cx + shift[i] + side * hw * (side < 0 ? wl[i] : wr[i]);
      const Y = (i) => by - (i / N) * L;
      const outline = new Path2D();
      outline.moveTo(cx, ay);
      outline.quadraticCurveTo(cx - hw * T.lobe * 0.45, by + 1, X(0, -1), Y(0));   // left basal lobe
      for (let i = 1; i <= N; i++) outline.lineTo(X(i, -1), Y(i));
      for (let i = N - 1; i >= 0; i--) outline.lineTo(X(i, 1), Y(i));
      outline.quadraticCurveTo(cx + hw * T.lobe * 0.45, by + 1, cx, ay);
      outline.closePath();

      const canvas = () => {
        const c = document.createElement('canvas');
        c.width = cw;
        c.height = ch;
        return c;
      };
      const cAd = canvas();
      const cAb = canvas();
      const cDk = canvas();
      const gAd = cAd.getContext('2d');
      const gAb = cAb.getContext('2d');
      const gDk = cDk.getContext('2d');
      const [h, s, l] = col;
      const hB = h + 6;
      const sB = Math.max(10, s - 12);
      const lB = l + 13;                     // the underside is paler and greyer
      gAd.fillStyle = `hsl(${h}, ${s}%, ${l}%)`;
      gAd.fill(outline);
      gAb.fillStyle = `hsl(${hB}, ${sB}%, ${lB}%)`;
      gAb.fill(outline);
      gDk.fillStyle = 'rgb(14,24,10)';
      gDk.fill(outline);

      // Areoles: the small islands of tissue between the finest veins (a Worley-noise network),
      // plus a cupped blade lit from the left, mottling and grain. One pass paints both surfaces.
      const cell = Math.max(3, T.cell * scale);
      const gx = Math.ceil(cw / cell) + 2;
      const gy = Math.ceil(ch / cell) + 2;
      const fx = new Float32Array(gx * gy);
      const fy = new Float32Array(gx * gy);
      for (let j = 0; j < gy; j++) {
        for (let i = 0; i < gx; i++) {
          fx[j * gx + i] = (i - 1 + 0.15 + rand() * 0.7) * cell;
          fy[j * gx + i] = (j - 1 + 0.15 + rand() * 0.7) * cell;
        }
      }
      const imA = gAd.getImageData(0, 0, cw, ch);
      const imB = gAb.getImageData(0, 0, cw, ch);
      const a = imA.data;
      const b = imB.data;
      const ns = 0.035 / scale;
      const liftA = 24 * T.veinAmt;
      const liftB = 34 * T.veinAmt;
      for (let y = 0; y < ch; y++) {
        const v = (by - y) / L;
        const iv = Math.max(0, Math.min(N, Math.round(v * N)));
        const mid = cx + shift[iv];
        const wL = Math.max(0.05, wl[iv]) * hw;
        const wR = Math.max(0.05, wr[iv]) * hw;
        const cj = Math.floor(y / cell) + 1;
        for (let x = 0; x < cw; x++) {
          const idx = (y * cw + x) * 4;
          if (a[idx + 3] === 0) continue;
          const un = x < mid ? (x - mid) / wL : (x - mid) / wR;
          const au = Math.min(1, Math.abs(un));
          const ci = Math.floor(x / cell) + 1;
          let d1 = 1e9;
          let d2 = 1e9;
          for (let j = cj - 1; j <= cj + 1; j++) {
            for (let i = ci - 1; i <= ci + 1; i++) {
              const k = j * gx + i;
              const dx = fx[k] - x;
              const dy = fy[k] - y;
              const dd = dx * dx + dy * dy;
              if (dd < d1) { d2 = d1; d1 = dd; } else if (dd < d2) d2 = dd;
            }
          }
          const edge = (Math.sqrt(d2) - Math.sqrt(d1)) / cell;
          const veinlet = edge < 0.16 ? 1 - edge / 0.16 : 0;
          const mott = noise(x * ns, y * ns) - 0.5;
          const grain = noise(x * 0.45, y * 0.45) - 0.5;
          const kA = 1 - 0.2 * Math.pow(au, 2.2) + (un < 0 ? 0.08 : -0.06) * Math.min(1, au * 3.5)
            + 0.05 * (v - 0.4) + 0.1 * mott + 0.035 * grain;
          const kB = 1 + 0.07 * (1 - au * au) - 0.05 * au + 0.06 * mott + 0.03 * grain;
          const vA = veinlet * liftA;
          const vB = veinlet * liftB;
          a[idx] = a[idx] * kA + vA * 0.8;
          a[idx + 1] = a[idx + 1] * kA + vA;
          a[idx + 2] = a[idx + 2] * kA + vA * 0.35;
          b[idx] = b[idx] * kB + vB * 0.85;
          b[idx + 1] = b[idx + 1] * kB + vB;
          b[idx + 2] = b[idx + 2] * kB + vB * 0.6;
        }
      }
      gAd.putImageData(imA, 0, 0);
      gAb.putImageData(imB, 0, 0);

      // Pinnate secondary veins curving toward the tip; left and right are not mirror images.
      const veins = [];
      for (let k = 0; k < T.veins; k++) {
        veins.push({
          v0: T.sinus + 0.05 + ((0.8 - T.sinus) * (k + 0.25 + rand() * 0.5)) / T.veins,
          dv: (rand() - 0.5) * 0.04,
          rise: T.rise * (0.8 + rand() * 0.4),
          reach: 0.72 + rand() * 0.2,
        });
      }
      const veinPath = (g, off, sg, V, from, until) => {
        g.beginPath();
        let first = true;
        for (let t = from; t <= until + 1e-6; t += 0.04) {
          const vv = Math.min(0.99, V.v0 + (sg > 0 ? V.dv : 0) + t * V.rise + t * t * 0.07);
          const i = Math.round(vv * N);
          const xx = cx + shift[i] + sg * V.reach * Math.pow(t, 0.7) * hw * (sg < 0 ? wl[i] : wr[i]) + off;
          const yy = by - vv * L + off;
          if (first) g.moveTo(xx, yy);
          else g.lineTo(xx, yy);
          first = false;
        }
      };
      const midW = (v, mul) => L * T.mid * mul * (1 - 0.8 * v);
      const midrib = (g, off, mul) => {
        g.beginPath();
        for (let k = 0; k <= 24; k++) {
          const v = T.sinus + (k / 24) * (0.96 - T.sinus);
          const xx = cx + shift[Math.round(v * N)] - midW(v, mul) / 2 + off;
          if (k) g.lineTo(xx, by - v * L + off);
          else g.moveTo(xx, by - v * L + off);
        }
        for (let k = 24; k >= 0; k--) {
          const v = T.sinus + (k / 24) * (0.96 - T.sinus);
          g.lineTo(cx + shift[Math.round(v * N)] + midW(v, mul) / 2 + off, by - v * L + off);
        }
        g.closePath();
      };
      const finish = (g, o) => {
        g.save();
        g.clip(outline);
        g.lineCap = 'round';
        g.lineJoin = 'round';
        const sh = Math.max(0.6, L * 0.004);
        for (const pass of [0, 1]) {
          g.strokeStyle = pass ? o.vein : o.dark;
          const off = pass ? 0 : sh;
          for (const V of veins) {
            for (const sg of [-1, 1]) {
              // thick near the midrib, thin and fading toward the margin
              veinPath(g, off, sg, V, 0, 0.45);
              g.lineWidth = Math.max(0.9, L * 0.0075 * o.mul);
              g.stroke();
              veinPath(g, off, sg, V, 0.4, 0.75);
              g.lineWidth = Math.max(0.6, L * 0.0045 * o.mul);
              g.stroke();
              g.globalAlpha = 0.45;
              veinPath(g, off, sg, V, 0.7, 1);
              g.lineWidth = Math.max(0.5, L * 0.003 * o.mul);
              g.stroke();
              g.globalAlpha = 1;
            }
          }
        }
        midrib(g, sh * 1.3, o.mul);
        g.fillStyle = o.dark;
        g.fill();
        midrib(g, 0, o.mul);
        g.fillStyle = o.mid;
        g.fill();
        if (o.gloss) {
          // waxy sheen on the lit half
          g.globalCompositeOperation = 'screen';
          g.translate(cx + shift[Math.round(0.56 * N)] - hw * 0.34, by - L * 0.56);
          g.scale(1, (L * 0.36) / (hw * 0.42));
          const sheen = g.createRadialGradient(0, 0, 0, 0, 0, hw * 0.42);
          sheen.addColorStop(0, `rgba(255,255,240,${o.gloss})`);
          sheen.addColorStop(1, 'rgba(255,255,240,0)');
          g.fillStyle = sheen;
          g.fillRect(-hw * 0.42, -hw * 0.42, hw * 0.84, hw * 0.84);
        }
        g.restore();
        g.lineWidth = Math.max(0.8, L * 0.004);
        g.strokeStyle = o.rim;
        g.stroke(outline);
      };
      finish(gAd, {
        vein: `hsla(${h - 12}, ${s - 6}%, ${Math.min(90, l + 26)}%, ${0.35 + 0.4 * T.veinAmt})`,
        dark: `hsla(${h + 8}, ${s}%, ${Math.max(6, l - 18)}%, ${0.18 + 0.15 * T.veinAmt})`,
        mid: `hsla(${h - 14}, ${s - 8}%, ${Math.min(92, l + 32)}%, 0.85)`,
        rim: `hsla(${h + 6}, ${s}%, ${Math.max(5, l - 20)}%, 0.28)`,
        mul: 1,
        gloss: T.gloss,
      });
      // On the underside the veins stand out: thicker, lighter, raised.
      finish(gAb, {
        vein: `hsla(${hB - 10}, ${sB - 4}%, ${Math.min(92, lB + 18)}%, ${0.45 + 0.4 * T.veinAmt})`,
        dark: `hsla(${hB + 6}, ${sB}%, ${Math.max(6, lB - 18)}%, 0.22)`,
        mid: `hsla(${hB - 12}, ${sB - 4}%, ${Math.min(94, lB + 24)}%, 0.9)`,
        rim: `hsla(${hB + 6}, ${sB}%, ${Math.max(5, lB - 22)}%, 0.3)`,
        mul: 1.35,
        gloss: 0,
      });

      return {
        ad: HAZE.map((hz) => (hz ? hazed(cAd, hz) : cAd)),
        ab: HAZE.map((hz) => (hz ? hazed(cAb, hz) : cAb)),
        dark: cDk, cw, ch, cx, anchorY: ay, L, hw, hue: h,
      };
    }

    // Arabidopsis flower: four white, slightly cupped petals with a green-yellow centre.
    function paintFlower() {
      const S = 72;
      const r = S * 0.42;
      const cx = S / 2;
      const c = document.createElement('canvas');
      c.width = S;
      c.height = S;
      const g = c.getContext('2d');
      g.save();
      g.shadowColor = 'rgba(40,52,30,0.4)';
      g.shadowBlur = 3;
      g.shadowOffsetY = 1;
      for (let i = 0; i < 4; i++) {
        g.save();
        g.translate(cx, cx);
        g.rotate(i * (Math.PI / 2) + Math.PI / 4);
        g.beginPath();
        g.moveTo(0, 0);
        g.bezierCurveTo(r * 0.35, -r * 0.06, r * 0.62, -r * 0.42, r * 0.9, -r * 0.25);
        g.quadraticCurveTo(r * 1.08, 0, r * 0.9, r * 0.25);
        g.bezierCurveTo(r * 0.62, r * 0.42, r * 0.35, r * 0.06, 0, 0);
        const pg = g.createLinearGradient(0, 0, r, 0);
        pg.addColorStop(0, 'rgb(196,212,150)');
        pg.addColorStop(0.32, 'rgb(244,246,232)');
        pg.addColorStop(1, 'rgb(255,255,252)');
        g.fillStyle = pg;
        g.fill();
        g.restore();
      }
      g.restore();
      g.strokeStyle = 'rgba(140,152,110,0.22)';
      g.lineWidth = 0.6;
      for (let i = 0; i < 4; i++) {
        const t = i * (Math.PI / 2) + Math.PI / 4;
        for (const sp of [-0.16, 0, 0.16]) {
          g.beginPath();
          g.moveTo(cx + Math.cos(t) * r * 0.28, cx + Math.sin(t) * r * 0.28);
          g.lineTo(cx + Math.cos(t + sp) * r * 0.82, cx + Math.sin(t + sp) * r * 0.82);
          g.stroke();
        }
      }
      g.fillStyle = 'hsl(84, 42%, 50%)';
      g.beginPath();
      g.arc(cx, cx, r * 0.13, 0, TAU);
      g.fill();
      g.fillStyle = 'hsl(48, 86%, 58%)';
      for (let i = 0; i < 6; i++) {
        const q = (i / 6) * TAU + 0.3;
        g.beginPath();
        g.arc(cx + Math.cos(q) * r * 0.21, cx + Math.sin(q) * r * 0.21, r * 0.065, 0, TAU);
        g.fill();
      }
      return { img: HAZE.map((hz) => (hz ? hazed(c, hz) : c)), size: S, r };
    }

    function paintSprites() {
      if (leafSprites) return;
      const scale = (window.innerWidth < 640 ? 0.75 : 1) * ((window.devicePixelRatio || 1) >= 1.5 ? 1 : 0.8);
      leafSprites = {};
      let seed = 11;
      for (const kind of Object.keys(LEAF_TYPES)) {
        const T = LEAF_TYPES[kind];
        leafSprites[kind] = T.colors.map((col) => paintLeaf(T, col, (seed++) * 7919, scale));
      }
      flowerSprite = paintFlower();
    }

    /* ---------- building blocks ---------- */

    // A leaf in 3D: azimuth around the stem (phi), petiole elevation above the horizontal (ep),
    // and a blade that bends down in two steps, d1 near its base and d2 toward the tip.
    function leaf(o) {
      paintSprites();
      const set = leafSprites[o.kind];
      let spr = set[0];
      for (const v of set) if (Math.abs(v.hue - o.hue) < Math.abs(spr.hue - o.hue)) spr = v;
      return {
        cphi: Math.cos(o.phi),
        sphi: Math.sin(o.phi),
        depth: Math.sin(o.phi),          // > 0: pointing toward the viewer
        ep: o.ep,
        // blades twist about their midrib to face the light; turning toward the viewer means
        // rolling against the sign of cos(phi)
        roll: -(Math.cos(o.phi) >= 0 ? 1 : -1) * (o.roll || 0),
        d1: o.d1,
        d2: o.d2,
        pl: o.pl,
        bl: o.bl,
        bw: o.bw,
        at: o.at || 0,
        appear: o.appear || 0,
        flex: o.flex == null ? 1 : o.flex,
        spr,
        hz: hazeIndex(o.haze || 0),
        cStalk: color(o.hue - 6, o.sat - 6, o.lit + 10, o.haze || 0),
        flap: 0,
        vel: 0,
        la: 0,
        lx: -1e4,
        ly: -1e4,
      };
    }

    // A flexible stem made of segments; it bends most toward the tip.
    function stalk(o) {
      const seg = o.seg || 10;
      return {
        len: o.len,
        angle: o.angle || 0,
        curve: o.curve || 0,
        w0: o.w0,
        w1: o.w1,
        seg,
        stiff: o.stiff || 16,
        damp: o.damp || 3,
        flex: o.flex == null ? 1 : o.flex,
        phase: o.phase || 0,
        parent: o.parent || null,
        at: o.at || 0,
        offset: o.offset || 0,
        bend: 0,
        vel: 0,
        g: 0,
        pts: new Float32Array((seg + 1) * 3),
      };
    }

    function layoutStalk(st, bx, by, ba, g) {
      const p = st.pts;
      const n = st.seg;
      const ds = (st.len * g) / n;
      const curve = st.curve * g;
      let x = bx;
      let y = by;
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const a = ba + curve * t + st.bend * t * Math.sqrt(t);
        const j = i * 3;
        p[j] = x;
        p[j + 1] = y;
        p[j + 2] = a;
        x += Math.sin(a) * ds;
        y -= Math.cos(a) * ds;
      }
    }

    function sampleStalk(st, f, out) {
      const p = st.pts;
      const s = clamp01(f) * st.seg;
      const i = Math.min(st.seg - 1, Math.floor(s));
      const u = s - i;
      const a = i * 3;
      const b = a + 3;
      out.x = p[a] + (p[b] - p[a]) * u;
      out.y = p[a + 1] + (p[b + 1] - p[a + 1]) * u;
      out.a = p[a + 2] + (p[b + 2] - p[a + 2]) * u;
      return out;
    }

    function stepStalk(st, dt, target) {
      const acc = st.stiff * (target - st.bend) - st.damp * st.vel;
      st.vel += acc * dt;
      st.bend += st.vel * dt;
      if (st.bend > 1.15) { st.bend = 1.15; st.vel = 0; }
      else if (st.bend < -1.15) { st.bend = -1.15; st.vel = 0; }
    }

    function stepLeaf(L, dt, target) {
      const acc = 28 * (target - L.flap) - 3.8 * L.vel;
      L.vel += acc * dt;
      L.flap += L.vel * dt;
      if (L.flap > 0.9) { L.flap = 0.9; L.vel = 0; }
      else if (L.flap < -0.9) { L.flap = -0.9; L.vel = 0; }
    }

    function windAt(x, time, phase) {
      return (Math.sin(time * 0.8 + x * 0.004) * 0.6 + Math.sin(time * 2.1 + x * 0.013 + phase) * 0.4) * gust;
    }

    // Pointer parts the stems: they lean away from it and get swept along by its motion.
    function pushOnStalk(st, r, dt) {
      const p = st.pts;
      const n = st.seg;
      let best = Infinity;
      let bx = 0;
      for (let i = Math.ceil(n * 0.35); i <= n; i += 2) {
        const dx = p[i * 3] - pointer.x;
        const dy = p[i * 3 + 1] - pointer.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < best) { best = d2; bx = p[i * 3]; }
      }
      const tx = p[n * 3] - pointer.x;
      const ty = p[n * 3 + 1] - pointer.y;
      if (tx * tx + ty * ty < best) { best = tx * tx + ty * ty; bx = p[n * 3]; }
      if (best >= r * r) return 0;
      const f = 1 - Math.sqrt(best) / r;
      const ff = f * f * (3 - 2 * f);
      st.vel += pointer.vx * BRUSH * ff * st.flex * dt * 4;
      const side = Math.max(-1, Math.min(1, (bx - pointer.x) / (r * 0.3)));
      return side * ff * 0.85 * st.flex;
    }

    function pushOnLeaf(L, r, dt) {
      const dx = L.lx - pointer.x;
      const dy = L.ly - pointer.y;
      const d2 = dx * dx + dy * dy;
      if (d2 >= r * r) return 0;
      const d = Math.sqrt(d2);
      const f = 1 - d / r;
      const ff = f * f * (3 - 2 * f);
      // direction the leaf blade moves when it rotates clockwise
      const mx = Math.cos(L.la);
      const my = Math.sin(L.la);
      L.vel += (pointer.vx * mx + pointer.vy * 0.5 * my) * BRUSH * 1.3 * ff * L.flex * dt * 4;
      return ((mx * dx + my * dy) / (d + 1)) * ff * 0.6 * L.flex;
    }

    /* ---------- drawing ---------- */

    // Camera slightly above the plants; light from the upper left and a little in front.
    const VIEW = 0.36;
    const CV = Math.cos(VIEW);
    const SV = Math.sin(VIEW);
    const LX = -0.45;
    const LY = 0.82;
    const LZ = 0.36;

    function drawLeaf(ctx, L, x, y, rot, k) {
      if (k <= 0.02) return;
      // While unfolding, the leaf starts raised along the stem and opens to its final pose.
      const ep = L.ep + (1 - k) * (1.3 - L.ep);
      const e1 = ep - L.d1 * k;
      const e2 = e1 - L.d2 * k;
      const c = L.cphi;
      const s = L.sphi;
      // projected directions (screen y grows downward), rotated with the stem and the flutter
      const r = rot + L.flap;
      const cr = Math.cos(r);
      const sr = Math.sin(r);
      const pdx = c * Math.cos(ep);
      const pdy = -(Math.sin(ep) * CV - s * Math.cos(ep) * SV);
      const a1x = c * Math.cos(e1);
      const a1y = -(Math.sin(e1) * CV - s * Math.cos(e1) * SV);
      const a2x = c * Math.cos(e2);
      const a2y = -(Math.sin(e2) * CV - s * Math.cos(e2) * SV);
      const pl = L.pl * k;
      const bl = L.bl * k;
      const hwid = L.bw * 0.5 * k;
      const Px = (pdx * cr - pdy * sr) * pl;
      const Py = (pdx * sr + pdy * cr) * pl;
      const A1x = (a1x * cr - a1y * sr) * bl;
      const A1y = (a1x * sr + a1y * cr) * bl;
      const A2x = (a2x * cr - a2y * sr) * bl;
      const A2y = (a2x * sr + a2y * cr) * bl;
      // Blade width direction and upper-surface normal (for the base of the blade), rolled.
      const n0x = -Math.sin(e1) * c;
      const n0y = Math.cos(e1);
      const n0z = -Math.sin(e1) * s;
      const cro = Math.cos(L.roll);
      const sro = Math.sin(L.roll);
      const wvx = -s * cro + n0x * sro;
      const wvy = n0y * sro;
      const wvz = c * cro + n0z * sro;
      const nx = n0x * cro + s * sro;
      const ny = n0y * cro;
      const nz = n0z * cro - c * sro;
      const wsx = wvx;
      const wsy = -(wvy * CV - wvz * SV);
      let Wx = (wsx * cr - wsy * sr) * hwid;
      let Wy = (wsx * sr + wsy * cr) * hwid;

      // Which surface faces us, and how much light it catches.
      const under = ny * SV + nz * CV < 0;
      const lum = (under ? -1 : 1) * (nx * LX + ny * LY + nz * LZ);
      // keep the painted light side of the bitmap toward the upper-left light
      if (Wx * 0.45 + Wy * 0.89 < 0) { Wx = -Wx; Wy = -Wy; }

      const bx = x + Px;
      const by = y + Py;
      if (pl > 0.8) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + Px * 0.5, y + Py * 0.5 - pl * 0.12, bx, by);
        ctx.strokeStyle = L.cStalk;
        ctx.lineWidth = Math.max(0.7, hwid * 0.11);
        ctx.stroke();
      }

      const sp = L.spr;
      const img = (under ? sp.ab : sp.ad)[L.hz];
      const ySplit = sp.anchorY - 0.45 * sp.L;
      const ox = bx + A1x * 0.45;
      const oy = by + A1y * 0.45;
      // Map the bitmap onto the leaf plane: x along the width, y along the blade.
      const seg = (Ox, Oy, Ax, Ay, t0, y0, y1, im) => {
        const ma = Wx / sp.hw;
        const mb = Wy / sp.hw;
        const mc = -Ax / sp.L;
        const md = -Ay / sp.L;
        const me = Ox - ma * sp.cx + (Ax / sp.L) * (sp.anchorY - t0);
        const mf = Oy - mb * sp.cx + (Ay / sp.L) * (sp.anchorY - t0);
        ctx.save();
        ctx.transform(ma, mb, mc, md, me, mf);
        ctx.drawImage(im, 0, y0, sp.cw, y1 - y0, 0, y0, sp.cw, y1 - y0);
        ctx.restore();
      };
      seg(bx, by, A1x, A1y, 0, Math.max(0, ySplit - 1.5), sp.ch, img);
      seg(ox, oy, A2x, A2y, 0.45 * sp.L, 0, ySplit + 1.5, img);
      const shade = under ? 0.08 : Math.max(0, 0.62 - lum) * 0.5;
      if (shade > 0.03 && L.hz < 2) {
        ctx.globalAlpha = shade;
        seg(bx, by, A1x, A1y, 0, ySplit - 0.5, sp.ch, sp.dark);
        seg(ox, oy, A2x, A2y, 0.45 * sp.L, 0, ySplit + 0.5, sp.dark);
        ctx.globalAlpha = 1;
      }
      L.la = Math.atan2(A1x, -A1y);
      L.lx = bx + A1x * 0.5;
      L.ly = by + A1y * 0.5;
    }

    // Tapered stem; with hi/lo colours it gets a highlight and a shadow line so it reads as round.
    function drawStalk(ctx, st, fill, k, hi, lo) {
      const p = st.pts;
      const n = st.seg;
      const w0 = st.w0 * (0.45 + 0.55 * k);
      const w1 = st.w1 * (0.45 + 0.55 * k);
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const j = i * 3;
        const w = (w0 + ((w1 - w0) * i) / n) / 2;
        const a = p[j + 2];
        const x = p[j] - Math.cos(a) * w;
        const y = p[j + 1] - Math.sin(a) * w;
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      }
      for (let i = n; i >= 0; i--) {
        const j = i * 3;
        const w = (w0 + ((w1 - w0) * i) / n) / 2;
        const a = p[j + 2];
        ctx.lineTo(p[j] + Math.cos(a) * w, p[j + 1] + Math.sin(a) * w);
      }
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      if (!hi || w0 < 1.3) return;
      const line = (side, color, width) => {
        ctx.beginPath();
        for (let i = 0; i <= n; i++) {
          const j = i * 3;
          const w = ((w0 + ((w1 - w0) * i) / n) / 2) * side;
          const x = p[j] + Math.cos(p[j + 2]) * w;
          const y = p[j + 1] + Math.sin(p[j + 2]) * w;
          if (i) ctx.lineTo(x, y);
          else ctx.moveTo(x, y);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke();
      };
      line(-0.42, hi, Math.max(0.5, w0 * 0.22));
      if (lo) line(0.62, lo, Math.max(0.5, w0 * 0.2));
    }

    function drawShadow(ctx, P, w) {
      ctx.globalAlpha = Math.min(1, P.g * 2) * (0.45 + 0.55 * P.z);
      ctx.drawImage(shadowSprite, P.x - w / 2, P.baseY - w * 0.1, w, w * 0.22);
      ctx.globalAlpha = 1;
    }

    // Arabidopsis flower, seen at an angle (squashed) and opening with F.o.
    function drawFlower(ctx, P, x, y, a, F) {
      const fs = flowerSprite;
      const k = (F.size * (0.35 + 0.65 * Math.max(0, F.o))) / fs.r;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      ctx.scale(1, F.squash);
      ctx.rotate(F.spin);
      ctx.drawImage(fs.img[hazeIndex(P.haze)], -fs.size * 0.5 * k, -fs.size * 0.5 * k, fs.size * k, fs.size * k);
      ctx.restore();
    }

    /* ---------- plants ---------- */

    function makeArabidopsis(rand, x, z, avail, s) {
      const hue = 88 + rand() * 16;
      const sat = 32 + rand() * 14;
      const lit = 32 + rand() * 7;
      const haze = (1 - z) * 0.6;
      const P = {
        type: 'ara', x, z, s, haze, g: 0, delay: 0, dur: 3.1 + rand() * 1.3,
        rosette: [], stems: [], siliques: [], flowers: [], cauline: [], span: 50 * s,
        cStem: color(hue - 8, sat - 4, lit + 12, haze),
        cStemHi: color(hue - 14, sat - 10, lit + 30, haze, 0.6),
        cStemLo: color(hue + 6, sat, lit - 4, haze, 0.45),
        cSil: color(hue - 14, sat + 2, lit + 14, haze),
        cBud: color(hue - 12, sat, lit + 18, haze),
        cPetal: color(60, 30, 98, haze * 0.8),
        cPetalEdge: color(85, 12, 50, haze, 0.5),
        cCenter: color(54, 62, 58, haze),
      };

      // Rosette: leaves spiral out at the golden angle (137.5 degrees), lying almost flat; the older
      // outer ones are larger with drooping (epinastic) tips, the young inner ones more upright.
      const n = 10 + Math.floor(rand() * 6);
      let phi = rand() * TAU;
      for (let k = 0; k < n; k++) {
        phi += 2.39996;
        const age = k / n;
        const size = s * (30 + rand() * 12) * (1.1 - age * 0.55);
        P.rosette.push(leaf({
          kind: 'rosette', phi, roll: rand() * 0.15,
          ep: 0.06 + age * 0.55 + rand() * 0.1,
          d1: 0.05 + rand() * 0.12,
          d2: (0.15 + rand() * 0.2) * (1 - age * 0.6),
          pl: size * 0.38, bl: size * 0.62, bw: size * 0.62 * (0.5 + rand() * 0.12),
          hue: hue + (rand() - 0.5) * 6 + age * 4, sat, lit: lit + age * 4, haze,
          appear: age * 0.32, flex: 0.45,
        }));
      }
      P.rosette.sort((a, b) => a.depth - b.depth);

      // Inflorescence: a main stem, maybe side branches, siliques below and flowers on top.
      const h = Math.min(avail * (0.55 + rand() * 0.4), s * (320 + rand() * 220));
      if (h < 60 * s) return P;
      P.span = Math.max(P.span, h * 0.4);
      const main = stalk({
        len: h, angle: (rand() - 0.5) * 0.22, curve: (rand() - 0.5) * 0.4,
        w0: 2.4 * s, w1: 0.8 * s, seg: 12, stiff: 11 + rand() * 6, damp: 2.4, flex: 1, phase: rand() * TAU,
      });
      P.stems.push(main);
      const branches = h > 160 * s ? 1 + Math.floor(rand() * 2) : 0;
      let side = rand() < 0.5 ? -1 : 1;
      for (let i = 0; i < branches; i++) {
        const at = 0.16 + rand() * 0.3;
        P.stems.push(stalk({
          parent: main, at, offset: side * (0.35 + rand() * 0.35), len: h * (0.38 + rand() * 0.3),
          curve: -side * (0.15 + rand() * 0.25), w0: 1.6 * s, w1: 0.7 * s, seg: 9,
          stiff: 14 + rand() * 6, damp: 2.4, flex: 1.1, phase: rand() * TAU,
        }));
        P.cauline.push({
          st: main, at,
          l: leaf({
            kind: 'cauline', phi: rand() * TAU, roll: 0.3, ep: 0.75 + rand() * 0.3, d1: 0.12, d2: 0.22,
            pl: 0, bl: s * (12 + rand() * 6), bw: s * (4 + rand() * 1.5), hue, sat, lit: lit + 4, haze, flex: 0.8,
          }),
        });
        side = -side;
      }
      for (const st of P.stems) {
        const count = Math.max(2, Math.round(st.len / s / 24));
        let sd = rand() < 0.5 ? -1 : 1;
        for (let i = 0; i < count; i++) {
          P.siliques.push({
            st, side: sd, at: 0.3 + (0.52 * i) / count + (rand() - 0.5) * 0.04, off: 0.32 + rand() * 0.3,
            len: s * (14 + rand() * 12) * (1 - (i / count) * 0.35), ped: s * (4 + rand() * 3),
          });
          if (rand() < 0.85) sd = -sd;
        }
        const nf = 3 + Math.floor(rand() * 3);
        for (let i = 0; i < nf; i++) {
          P.flowers.push({
            st, side: i % 2 ? 1 : -1, at: 0.86 + (0.11 * i) / nf, off: 0.35 + rand() * 0.6,
            ped: s * (5 + rand() * 4), size: s * (3.6 + rand() * 1.2), open: 0.75 + rand() * 0.25,
            squash: 0.55 + rand() * 0.45, spin: rand() * TAU, o: 0, ov: 0, lx: -1e4, ly: -1e4,
          });
        }
      }
      return P;
    }

    function updateAra(P, dt, time, near) {
      const gs = ease((P.g - 0.26) / 0.64);
      const r = reach * (0.7 + 0.5 * P.z);
      for (const st of P.stems) {
        st.g = st.parent ? ease(((gs - st.at) / (1 - st.at)) * 1.15) : gs;
        let target = windAt(P.x, time, st.phase) * st.flex * (0.4 + 0.6 * st.g);
        if (near && st.g > 0.05) target += pushOnStalk(st, r, dt);
        stepStalk(st, dt, target);
        if (st.parent) {
          sampleStalk(st.parent, st.at, tmp);
          layoutStalk(st, tmp.x, tmp.y, tmp.a + st.offset, st.g);
        } else {
          layoutStalk(st, P.x, P.baseY - 2 * P.s, st.angle, st.g);
        }
      }
      for (const L of P.rosette) {
        let target = windAt(P.x, time, L.depth * 3) * 0.2;
        if (near) target += pushOnLeaf(L, r * 0.75, dt);
        stepLeaf(L, dt, target);
      }
      for (const C of P.cauline) {
        let target = 0;
        if (near) target += pushOnLeaf(C.l, r * 0.6, dt);
        stepLeaf(C.l, dt, target);
      }
      for (const F of P.flowers) {
        let target = F.open * ease((F.st.g - 0.84) / 0.16);
        if (near && target > 0.1) {
          const d = Math.hypot(F.lx - pointer.x, F.ly - pointer.y);
          if (d < r) target += (1 - d / r) * 0.45;   // flowers open wider near the pointer
        }
        const acc = 60 * (target - F.o) - 7 * F.ov;
        F.ov += acc * dt;
        F.o += F.ov * dt;
        if (dt === 0) F.o = target;
      }
    }

    function drawAra(ctx, P) {
      const g = P.g;
      if (g <= 0) return;
      const s = P.s;
      const x = P.x;
      const ry = P.baseY - 2 * s;
      drawShadow(ctx, P, 70 * s);
      const R = P.rosette;
      let i = 0;
      for (; i < R.length && R[i].depth < 0; i++) drawLeaf(ctx, R[i], x, ry, 0, ease((g - R[i].appear) / 0.3));

      if (P.stems.length && P.stems[0].g > 0.01) {
        for (let k = P.stems.length - 1; k >= 0; k--) {
          const st = P.stems[k];
          if (st.g > 0.01) drawStalk(ctx, st, P.cStem, st.g, P.haze < 0.2 ? P.cStemHi : null, P.cStemLo);
        }
        for (const C of P.cauline) {
          const k = ease((C.st.g - C.at) / 0.25);
          if (k <= 0) continue;
          sampleStalk(C.st, C.at, tmp);
          drawLeaf(ctx, C.l, tmp.x, tmp.y, tmp.a, k);
        }
        // Siliques (seed pods), older ones lower on the stem.
        ctx.beginPath();
        for (const S of P.siliques) {
          const st = S.st;
          const k = ease((st.g - 0.5 - S.at * 0.4) / 0.2);
          if (k <= 0) continue;
          sampleStalk(st, S.at, tmp);
          const a = tmp.a + S.side * S.off + st.bend * 0.15;
          const px = tmp.x + Math.sin(a) * S.ped * k;
          const py = tmp.y - Math.cos(a) * S.ped * k;
          const a2 = a - S.side * 0.42;   // pods turn upward, almost parallel to the stem
          ctx.moveTo(tmp.x, tmp.y);
          ctx.quadraticCurveTo(px, py, px + Math.sin(a2) * S.len * k, py - Math.cos(a2) * S.len * k);
        }
        ctx.strokeStyle = P.cSil;
        ctx.lineWidth = 1.5 * s;
        ctx.stroke();

        // Pedicels, then flowers and buds at the apex.
        ctx.beginPath();
        for (const F of P.flowers) {
          const st = F.st;
          if (st.g < 0.6) continue;
          sampleStalk(st, F.at, tmp);
          const a = tmp.a + F.side * F.off * (0.6 + 0.4 * st.g) + st.bend * 0.2;
          F.fx = tmp.x + Math.sin(a) * F.ped;
          F.fy = tmp.y - Math.cos(a) * F.ped;
          F.fa = a;
          ctx.moveTo(tmp.x, tmp.y);
          ctx.lineTo(F.fx, F.fy);
        }
        ctx.strokeStyle = P.cStem;
        ctx.lineWidth = 0.8 * s;
        ctx.stroke();
        ctx.fillStyle = P.cBud;
        for (const st of P.stems) {
          if (st.g < 0.45) continue;
          const j = st.seg * 3;
          const tx = st.pts[j];
          const ty = st.pts[j + 1];
          const ta = st.pts[j + 2];
          ctx.beginPath();
          ctx.arc(tx, ty, 2 * s, 0, TAU);
          ctx.arc(tx + Math.cos(ta) * 2.4 * s, ty + Math.sin(ta) * 2.4 * s + 1.5 * s, 1.6 * s, 0, TAU);
          ctx.arc(tx - Math.cos(ta) * 2.2 * s, ty - Math.sin(ta) * 2.2 * s + 1.8 * s, 1.5 * s, 0, TAU);
          ctx.fill();
        }
        for (const F of P.flowers) {
          if (F.st.g < 0.6) continue;
          if (F.o < 0.08) {
            ctx.beginPath();
            ctx.arc(F.fx, F.fy, 1.7 * s, 0, TAU);
            ctx.fill();
          } else {
            drawFlower(ctx, P, F.fx, F.fy, F.fa, F);
          }
          F.lx = F.fx;
          F.ly = F.fy;
        }
      }
      for (; i < R.length; i++) drawLeaf(ctx, R[i], x, ry, 0, ease((g - R[i].appear) / 0.3));
    }

    function makeBenth(rand, x, z, avail, s) {
      const h = Math.min(avail * (0.5 + rand() * 0.35), s * (230 + rand() * 120));
      if (h < 100 * s) return null;
      const hue = 102 + rand() * 12;
      const sat = 26 + rand() * 10;
      const lit = 27 + rand() * 6;
      const haze = (1 - z) * 0.6;
      const P = {
        type: 'benth', x, z, s, haze, g: 0, delay: 0, dur: 3.2 + rand(), leaves: [], flowers: [],
        span: Math.max(130 * s, h * 0.45),
        stem: stalk({
          len: h, angle: (rand() - 0.5) * 0.16, curve: (rand() - 0.5) * 0.25, w0: 4.2 * s, w1: 1.4 * s,
          seg: 12, stiff: 22 + rand() * 6, damp: 3.4, flex: 0.55, phase: rand() * TAU,
        }),
        cStem: color(hue - 6, sat - 4, lit + 12, haze),
        cStemHi: color(hue - 12, sat - 10, lit + 28, haze, 0.55),
        cStemLo: color(hue + 6, sat, lit - 6, haze, 0.4),
        cCalyx: color(hue - 4, sat, lit + 6, haze),
        cTube: color(78, 24, 88, haze),
        cPetal: color(70, 25, 97, haze * 0.8),
        cPetalEdge: color(85, 10, 72, haze, 0.55),
      };
      // Leaves spiral up the stem at the golden angle. Internodes are short at the base and
      // lengthen upward; the big lower leaves sit on long petioles and droop, the upper ones
      // are smaller, nearly sessile and held up.
      const n = 9 + Math.floor(rand() * 5);
      const big = s * (84 + rand() * 20);
      let phi = rand() * TAU;
      for (let k = 0; k < n; k++) {
        phi += 2.39996 + (rand() - 0.5) * 0.2;
        const q = k / (n - 1);
        const size = big * (k === 0 ? 0.8 : 1 - 0.62 * Math.pow(q, 1.2)) * (0.9 + rand() * 0.2);
        P.leaves.push(leaf({
          kind: 'benth', phi, roll: 0.3 + rand() * 0.45,
          at: 0.03 + 0.82 * Math.pow(q, 1.5),
          ep: 0.5 + 0.55 * q + rand() * 0.1,
          d1: (0.45 + rand() * 0.2) * (1 - 0.5 * q),
          d2: (0.4 + rand() * 0.25) * (1 - 0.55 * q),
          pl: size * (0.5 - 0.38 * q), bl: size, bw: size * (0.66 + rand() * 0.08),
          hue: hue + (rand() - 0.5) * 5, sat, lit: lit + q * 3, haze, flex: 0.9,
        }));
      }
      P.leaves.sort((a, b) => a.depth - b.depth);
      const nf = 1 + Math.floor(rand() * 3);
      for (let i = 0; i < nf; i++) {
        P.flowers.push({ at: 0.9 + i * 0.03, side: i % 2 ? 1 : -1, off: 0.45 + rand() * 0.45, tube: s * (17 + rand() * 6), size: s * (5 + rand() * 1.5), tilt: 0.22 + rand() * 0.18 });
      }
      return P;
    }

    function updateBenth(P, dt, time, near) {
      const st = P.stem;
      st.g = ease(P.g / 0.85);
      const r = reach * (0.7 + 0.5 * P.z);
      let target = windAt(P.x, time, st.phase) * st.flex;
      if (near && st.g > 0.05) target += pushOnStalk(st, r, dt);
      stepStalk(st, dt, target);
      layoutStalk(st, P.x, P.baseY, st.angle, st.g);
      for (const L of P.leaves) {
        let t = windAt(P.x + L.at * 100, time, L.at * 9) * 0.6;
        if (near) t += pushOnLeaf(L, r * 0.9, dt);
        stepLeaf(L, dt, t);
      }
    }

    function drawBenthLeaf(ctx, P, L) {
      const k = ease((P.stem.g - L.at * 0.55) / 0.35);
      if (k <= 0) return;
      sampleStalk(P.stem, L.at, tmp);
      drawLeaf(ctx, L, tmp.x, tmp.y, tmp.a, k);
    }

    function drawBenth(ctx, P) {
      if (P.g <= 0) return;
      const st = P.stem;
      drawShadow(ctx, P, 90 * P.s);
      for (const L of P.leaves) if (L.depth < 0) drawBenthLeaf(ctx, P, L);
      drawStalk(ctx, st, P.cStem, st.g, P.cStemHi, P.cStemLo);
      for (const L of P.leaves) if (L.depth >= 0) drawBenthLeaf(ctx, P, L);

      // Trumpet flowers at the apex, seen from the side: green calyx, long narrow white
      // corolla tube, and the flat five-lobed limb at its mouth seen edge-on.
      const k = ease((st.g - 0.8) / 0.2);
      if (k <= 0) return;
      const s = P.s;
      for (const F of P.flowers) {
        sampleStalk(st, F.at, tmp);
        const a = tmp.a + F.side * (F.off + F.tilt);
        const L = F.tube * k;
        const r = F.size * k;
        ctx.save();
        ctx.translate(tmp.x, tmp.y);
        ctx.rotate(a);                       // local -y runs along the tube
        // pedicel and calyx
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -L * 0.12);
        ctx.strokeStyle = P.cStem;
        ctx.lineWidth = 0.9 * s;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-0.6 * s, -L * 0.1);
        ctx.quadraticCurveTo(-2.1 * s, -L * 0.2, -1.2 * s, -L * 0.3);
        ctx.lineTo(1.2 * s, -L * 0.3);
        ctx.quadraticCurveTo(2.1 * s, -L * 0.2, 0.6 * s, -L * 0.1);
        ctx.closePath();
        ctx.fillStyle = P.cCalyx;
        ctx.fill();
        // corolla tube, widening slightly towards the mouth
        ctx.beginPath();
        ctx.moveTo(-0.75 * s, -L * 0.26);
        ctx.lineTo(-1.15 * s, -L * 0.95);
        ctx.quadraticCurveTo(0, -L * 0.98, 1.15 * s, -L * 0.95);
        ctx.lineTo(0.75 * s, -L * 0.26);
        ctx.closePath();
        ctx.fillStyle = P.cTube;
        ctx.fill();
        // limb: the tube flares into five lobes; seen from the side it is a shallow trumpet
        const m = -L * 0.93;                 // where the flare starts
        const e = r * 0.34;                  // foreshortened depth of the open face
        ctx.beginPath();
        ctx.moveTo(-1.1 * s, m);
        ctx.quadraticCurveTo(-1.4 * s, -L * 0.99, -r, -L);
        // far rim, scalloped into five lobes
        for (let i = 0; i < 5; i++) {
          const t0 = Math.PI + (i / 5) * Math.PI;
          const t1 = Math.PI + ((i + 1) / 5) * Math.PI;
          const tm = (t0 + t1) / 2;
          ctx.quadraticCurveTo(
            Math.cos(tm) * r * 1.12, -L + Math.sin(tm) * e * 1.25,
            Math.cos(t1) * r, -L + Math.sin(t1) * e,
          );
        }
        ctx.quadraticCurveTo(1.4 * s, -L * 0.99, 1.1 * s, m);
        ctx.closePath();
        ctx.fillStyle = P.cPetal;
        ctx.fill();
        // near rim and a hint of the greenish throat
        ctx.beginPath();
        ctx.ellipse(0, -L, r, e, 0, 0, Math.PI);
        ctx.lineWidth = 0.7;
        ctx.strokeStyle = P.cPetalEdge;
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(0, -L - e * 0.15, r * 0.22, e * 0.35, 0, 0, TAU);
        ctx.fillStyle = P.cTube;
        ctx.fill();
        ctx.restore();
      }
    }

    function makeGrass(rand, x, z, avail, s) {
      const haze = (1 - z) * 0.6;
      const n = 4 + Math.floor(rand() * 6);
      const cap = Math.min(avail * 0.75, s * (70 + rand() * 110));
      const P = { type: 'grass', x, z, s, haze, g: 0, delay: 0, dur: 1.6 + rand() * 0.9, blades: [], span: cap * 0.5 + 20 * s };
      for (let i = 0; i < n; i++) {
        const a = (rand() - 0.5) * 0.9;
        const bl = stalk({
          len: Math.max(18 * s, cap * (0.45 + rand() * 0.55)), angle: a,
          curve: (a >= 0 ? 1 : -1) * (0.2 + rand() * 0.9), w0: s * (2.6 + rand() * 2.8), w1: 0.15,
          seg: 8, stiff: 16 + rand() * 14, damp: 2.6, flex: 1.25, phase: rand() * TAU,
        });
        bl.dx = (rand() - 0.5) * 8 * s;
        const bh = 78 + rand() * 26;
        const bs = 26 + rand() * 20;
        const bli = 34 + rand() * 18;
        bl.fill = color(bh, bs, bli, haze);
        bl.hi = color(bh - 8, bs - 8, bli + 22, haze, 0.45);
        P.blades.push(bl);
      }
      return P;
    }

    function updateGrass(P, dt, time, near) {
      const g = ease(P.g / 0.8);
      const r = reach * (0.6 + 0.5 * P.z);
      for (const bl of P.blades) {
        bl.g = g;
        let target = windAt(P.x + bl.dx, time, bl.phase) * bl.flex * 1.3;
        if (near && g > 0.05) target += pushOnStalk(bl, r, dt);
        stepStalk(bl, dt, target);
        layoutStalk(bl, P.x + bl.dx, P.baseY, bl.angle, g);
      }
    }

    function drawGrass(ctx, P) {
      if (P.g <= 0) return;
      drawShadow(ctx, P, 40 * P.s);
      for (const bl of P.blades) drawStalk(ctx, bl, bl.fill, bl.g, P.haze < 0.2 ? bl.hi : null, null);
    }

    function makeSeedling(rand, x, z, avail, s) {
      const haze = (1 - z) * 0.6;
      const hue = 88 + rand() * 10;
      const P = {
        type: 'seed', x, z, s, haze, g: 0, delay: 0, dur: 1.8, leaves: [], span: 20 * s,
        stem: stalk({
          len: s * (14 + rand() * 12), angle: (rand() - 0.5) * 0.3, curve: (rand() - 0.5) * 0.4,
          w0: 1.6 * s, w1: 1.2 * s, seg: 6, stiff: 30, damp: 3.2, flex: 0.7, phase: rand() * TAU,
        }),
        cStem: color(78, 30, 64, haze),
      };
      const phi = rand() * TAU;
      for (const turn of [0, Math.PI]) {
        const size = s * (8 + rand() * 3);
        P.leaves.push(leaf({
          kind: 'coty', phi: phi + turn, ep: 0.3 + rand() * 0.25, d1: 0.08, d2: 0.12,
          pl: s * 2.5, bl: size, bw: size * 0.9, hue, sat: 44, lit: 46, haze, flex: 1,
        }));
      }
      P.leaves.sort((a, b) => a.depth - b.depth);
      return P;
    }

    function updateSeed(P, dt, time, near) {
      const st = P.stem;
      st.g = ease(P.g);
      const r = reach * 0.8;
      let target = windAt(P.x, time, st.phase) * 0.6;
      if (near && st.g > 0.05) target += pushOnStalk(st, r, dt);
      stepStalk(st, dt, target);
      layoutStalk(st, P.x, P.baseY, st.angle, st.g);
      for (const L of P.leaves) {
        let t = 0;
        if (near) t += pushOnLeaf(L, r * 0.6, dt);
        stepLeaf(L, dt, t);
      }
    }

    function drawSeed(ctx, P) {
      if (P.g <= 0) return;
      const st = P.stem;
      drawShadow(ctx, P, 24 * P.s);
      drawStalk(ctx, st, P.cStem, st.g);
      const j = st.seg * 3;
      const open = ease((P.g - 0.2) / 0.8);   // cotyledons unfold like a germinating seedling
      for (const L of P.leaves) drawLeaf(ctx, L, st.pts[j], st.pts[j + 1], st.pts[j + 2], open);
    }

    const UPDATE = { ara: updateAra, benth: updateBenth, grass: updateGrass, seed: updateSeed };
    const DRAW = { ara: drawAra, benth: drawBenth, grass: drawGrass, seed: drawSeed };
    const MAKE = { ara: makeArabidopsis, benth: makeBenth, grass: makeGrass, seed: makeSeedling };

    /* ---------- garden ---------- */

    // Highest point a plant at x may reach: below the headline, below the header elsewhere.
    function ceilingAt(x) {
      const navBottom = (header ? header.offsetHeight : 68) + 28;
      if (textBox && x < textBox.right + 40) return Math.max(navBottom, textBox.bottom + 26);
      return navBottom;
    }

    function measureText(heroRect) {
      if (!content) return null;
      let l = Infinity;
      let r = -Infinity;
      let b = -Infinity;
      for (const el of content.children) {
        const rr = el.getBoundingClientRect();
        if (!rr.width) continue;
        l = Math.min(l, rr.left);
        r = Math.max(r, rr.right);
        b = Math.max(b, rr.bottom);
      }
      if (b === -Infinity) return null;
      return { left: l - heroRect.left, right: r - heroRect.left, bottom: b - heroRect.top };
    }

    // Far plants stand higher on the screen, as on a ground plane seen slightly from above.
    function baseYFor(z) {
      return H - 30 - (1 - z) * groundDepth;
    }

    function buildGarden() {
      const rand = mulberry32(0x5eed + Math.round(W / 40));
      const small = W < 640;
      const area = W / 1000;
      const scale = small ? 0.82 : Math.min(1.12, 0.9 + W / 6000);
      groundDepth = Math.min(80, H * 0.1);
      reach = small ? 85 : 125;
      const list = [];
      const add = (kind, count, zMin, zMax, from = -20, to = W + 20, clump = 0) => {
        // Most plants gather in loose patches around a few centres; the rest fill the gaps.
        const centres = [];
        const nc = clump ? Math.max(1, Math.round(count / clump)) : 0;
        for (let i = 0; i < nc; i++) centres.push(from + ((i + 0.2 + rand() * 0.6) / nc) * (to - from));
        for (let i = 0; i < count; i++) {
          let x = from + ((i + 0.1 + rand() * 0.8) / count) * (to - from);
          if (nc && rand() < 0.7) x = centres[Math.floor(rand() * nc)] + (rand() + rand() + rand() - 1.5) * 60 * scale;
          const z = zMin + rand() * (zMax - zMin);
          const s = scale * (0.55 + 0.6 * z);
          const baseY = baseYFor(z);
          const P = MAKE[kind](rand, x, z, Math.max(0, baseY - ceilingAt(x)), s);
          if (!P) continue;
          P.baseY = baseY;
          P.delay = 0.1 + rand() * 0.9 + (1 - x / W) * 0.4 + (kind === 'grass' ? -0.1 : 0);
          list.push(P);
        }
      };
      // Tall, leafy plants go where there is room: right of the headline on wide screens.
      const open = textBox && textBox.right + 60 < W * 0.8 ? textBox.right + 40 : -20;
      add('grass', Math.max(6, Math.round(area * 14)), 0, 0.4, -20, W + 20, 4);
      add('ara', Math.max(3, Math.round(area * 8)), 0, 0.38, -20, W + 20, 3);
      add('benth', Math.max(1, Math.round(((W - open) / 1000) * 4)), 0.5, 0.88, open, W + 30);
      add('ara', Math.max(4, Math.round(area * 10)), 0.45, 1, -20, W + 20, 3);
      add('grass', Math.max(8, Math.round(area * 20)), 0.45, 1, -20, W + 20, 4);
      add('seed', Math.max(2, Math.round(area * 5)), 0.85, 1, -20, W + 20, 2);
      list.sort((a, b) => a.z - b.z);
      plants = list;
      back = list.filter((p) => p.z < 0.42);
      front = list.filter((p) => p.z >= 0.42);
      growEnd = list.reduce((m, p) => Math.max(m, p.delay + p.dur), 0);
      layoutAll();
    }

    function layoutAll() {
      for (const P of plants) {
        if (!growing) P.g = 1;
        UPDATE[P.type](P, 0, 0, false);
      }
    }

    function resizeCanvases() {
      dpr = lite ? 1 : Math.min(window.devicePixelRatio || 1, W < 640 ? 1.75 : 2);
      for (const c of [backCanvas, frontCanvas]) {
        c.width = Math.max(1, Math.round(W * dpr));
        c.height = Math.max(1, Math.round(H * dpr));
      }
      const g = bctx.createLinearGradient(0, H - 140, 0, H);
      g.addColorStop(0, 'rgba(210,216,199,0)');
      g.addColorStop(1, 'rgba(210,216,199,0.6)');
      groundGradient = g;
    }

    function measure() {
      const r = hero.getBoundingClientRect();
      const newW = Math.round(r.width);
      const newH = Math.round(r.height);
      if (!newW || !newH) return;
      const widthChanged = newW !== W;
      const heightChanged = newH !== H;
      W = newW;
      H = newH;
      textBox = measureText(r);
      resizeCanvases();
      if (widthChanged || !built) {
        if (built) growing = false;     // only the first garden grows from seed
        buildGarden();
        built = true;
      } else if (heightChanged) {
        groundDepth = Math.min(80, H * 0.1);
        for (const P of plants) P.baseY = baseYFor(P.z);
        layoutAll();
      }
      if (!running) render();
    }

    /* ---------- loop ---------- */

    function update(now, dt) {
      const time = now / 1000;
      gust = 0.05 * (0.75 + 0.25 * Math.sin(time * 0.27) + 0.12 * Math.sin(time * 0.77 + 1.3));

      // Pointer in hero coordinates; recomputed every frame so scrolling is accounted for.
      const rect = hero.getBoundingClientRect();
      const x = pointer.cx - rect.left;
      const y = pointer.cy - rect.top;
      if (pointer.fresh) {
        pointer.px = x;
        pointer.py = y;
        pointer.vx = 0;
        pointer.vy = 0;
        pointer.fresh = false;
      }
      const vx = Math.max(-2600, Math.min(2600, (x - pointer.px) / dt));
      const vy = Math.max(-2600, Math.min(2600, (y - pointer.py) / dt));
      pointer.vx += (vx - pointer.vx) * 0.5;
      pointer.vy += (vy - pointer.vy) * 0.5;
      pointer.px = x;
      pointer.py = y;
      pointer.x = x;
      pointer.y = y;
      const inside = pointer.active && x > -40 && x < W + 40 && y > -40 && y < H + 40;

      // A soft patch of light follows the pointer.
      if (glow.x < -1e3) { glow.x = x; glow.y = y; }
      glow.a += ((inside ? 1 : 0) - glow.a) * Math.min(1, dt * 3);
      glow.x += (x - glow.x) * Math.min(1, dt * 5);
      glow.y += (y - glow.y) * Math.min(1, dt * 5);

      if (growing && (now - born) / 1000 > growEnd) growing = false;
      for (const P of plants) {
        if (growing) {
          const t = (now - born) / 1000 - P.delay;
          P.g = t <= 0 ? 0 : Math.min(1, t / P.dur);
        } else {
          P.g = 1;
        }
        const near = inside && Math.abs(P.x - x) < P.span + reach;
        UPDATE[P.type](P, dt, time, near);
      }
    }

    function render() {
      bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bctx.clearRect(0, 0, W, H);
      fctx.clearRect(0, 0, W, H);
      bctx.lineCap = fctx.lineCap = 'round';
      bctx.imageSmoothingQuality = fctx.imageSmoothingQuality = 'high';
      bctx.lineJoin = fctx.lineJoin = 'round';
      if (glow.a > 0.01) {
        bctx.globalAlpha = glow.a * 0.9;
        bctx.drawImage(glowSprite, glow.x - 280, glow.y - 280, 560, 560);
        bctx.globalAlpha = 1;
      }
      bctx.fillStyle = groundGradient;
      bctx.fillRect(0, H - 140, W, 140);
      for (const P of back) DRAW[P.type](bctx, P);
      for (const P of front) DRAW[P.type](fctx, P);
    }

    // Fall back to a lighter mode (1x resolution, no blur) if drawing a frame takes too long.
    // This measures our own work, not the frame interval, so a throttled tab or a 30 Hz
    // battery-saver display does not lower the quality for nothing.
    function watchPerformance(work) {
      if (lite) return;
      frames++;
      if (frames < 60) return;          // ignore start-up jank
      if (work > 12) slowFrames++;
      if (frames >= 150) {
        if (slowFrames > 45) {
          lite = true;
          hero.classList.add('flora-lite');
          resizeCanvases();
        }
        frames = 60;
        slowFrames = 0;
      }
    }

    function frame(now) {
      raf = 0;
      if (!running) return;
      let dt = (now - lastT) / 1000;
      lastT = now;
      if (!(dt > 0)) dt = 1 / 60;
      if (dt > 0.05) dt = 0.05;
      const t0 = performance.now();
      update(now, dt);
      render();
      watchPerformance(performance.now() - t0);
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (running || reduceMotion.matches) return;
      if (pausedAt) {
        if (growing) born += performance.now() - pausedAt;   // growth resumes where it stopped
        pausedAt = 0;
      }
      running = true;
      lastT = performance.now();
      raf = requestAnimationFrame(frame);
    }

    function stop() {
      if (!running) return;
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      pausedAt = performance.now();
    }

    /* ---------- input ---------- */

    window.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      if (!pointer.active) pointer.fresh = true;
      pointer.cx = e.clientX;
      pointer.cy = e.clientY;
      pointer.active = true;
    }, { passive: true });
    document.addEventListener('mouseout', (e) => {
      if (!e.relatedTarget) pointer.active = false;
    });
    window.addEventListener('blur', () => { pointer.active = false; });
    const onTouch = (e) => {
      const t = e.touches[0];
      if (!t) return;
      if (!pointer.active) pointer.fresh = true;
      pointer.cx = t.clientX;
      pointer.cy = t.clientY;
      pointer.active = true;
    };
    const endTouch = () => { pointer.active = false; };
    hero.addEventListener('touchstart', onTouch, { passive: true });
    hero.addEventListener('touchmove', onTouch, { passive: true });
    hero.addEventListener('touchend', endTouch, { passive: true });
    hero.addEventListener('touchcancel', endTouch, { passive: true });

    /* ---------- start ---------- */

    const fontsReady = document.fonts && document.fonts.ready
      ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 700))])
      : Promise.resolve();

    fontsReady.then(() => {
      growing = !reduceMotion.matches && !still;
      born = performance.now();
      measure();
      setTimeout(() => hero.classList.add('flora-ready'), growing ? 2600 : 300);

      if ('ResizeObserver' in window) {
        let timer = 0;
        new ResizeObserver(() => {
          clearTimeout(timer);
          timer = setTimeout(measure, 120);
        }).observe(hero);
      } else {
        window.addEventListener('resize', () => measure());
      }

      if ('IntersectionObserver' in window) {
        new IntersectionObserver(([entry]) => {
          heroVisible = entry.isIntersecting;
          if (heroVisible && !document.hidden) start();
          else stop();
        }).observe(hero);
      } else {
        start();
      }
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) stop();
        else if (heroVisible) start();
      });

      const onMotionPref = () => {
        if (reduceMotion.matches) {
          stop();
          growing = false;
          layoutAll();
          render();
        } else if (heroVisible) {
          start();
        }
      };
      if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', onMotionPref);
      else if (reduceMotion.addListener) reduceMotion.addListener(onMotionPref);

      if (reduceMotion.matches) render();
      else start();
    });
  }
})();
