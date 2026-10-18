const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const range = (p, a, b) => clamp((p - a) / (b - a));
const ease = (t) => 1 - Math.pow(1 - t, 3);
const $ = (id) => document.getElementById(id);

// Szöveg bontása betűkre vagy szavakra; a CSS a --p érték alapján jeleníti meg őket
function split(el) {
  const mode = el.dataset.split;
  let i = 0;
  const walk = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 1) return walk(n);
      if (n.nodeType !== 3) return;
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) return frag.append(' ');
        const word = document.createElement('span');
        word.className = 'w';
        if (mode === 'char') {
          [...part].forEach((ch) => {
            const c = document.createElement('span');
            c.className = 'c';
            c.textContent = ch;
            c.style.setProperty('--i', i++);
            word.append(c);
          });
        } else {
          word.textContent = part;
          word.style.setProperty('--i', i++);
        }
        frag.append(word);
      });
      n.replaceWith(frag);
    });
  };
  walk(el);
  el.style.setProperty('--n', i);
  el.setAttribute('aria-label', el.textContent.trim());
}
document.querySelectorAll('.split').forEach(split);

// Vászon segéd: retina felbontás és átméretezés
function makeCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  const state = { canvas, ctx, w: 0, h: 0 };
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    state.w = canvas.clientWidth;
    state.h = canvas.clientHeight;
    canvas.width = state.w * dpr;
    canvas.height = state.h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener('resize', resize);
  return state;
}

/* ---------- 1. Hero: naplemente feloldódik drótvázas tájjá ---------- */
const hero = makeCanvas($('heroCanvas'));
const stars = Array.from({ length: 160 }, () => [Math.random(), Math.random() * 0.55, Math.random()]);
const terrain = (x, z) => (Math.sin(x * 0.55 + z * 0.3) * 0.6 + Math.sin(x * 1.3 - z * 0.45) * 0.3 + Math.sin(z * 0.9) * 0.15) * (0.15 + Math.abs(x) * 0.22);

function drawHero(p, t) {
  const { ctx, w, h } = hero;
  ctx.clearRect(0, 0, w, h);
  const a = range(p, 0.1, 0.42);
  if (a <= 0) return;

  const horizon = h * (0.5 - p * 0.08);
  const F = Math.min(w, h * 1.4) * 0.9;
  const camH = 1.6;
  const travel = p * 14 + (reduced ? 0 : t * 0.0004);
  const dz = 0.7;
  const offset = travel % dz;
  const xs = [];
  for (let x = -16; x <= 16; x += 0.8) xs.push(x);

  const project = (x, z) => {
    const wz = z + travel - offset;
    const y = terrain(x, wz);
    return [w / 2 + (x / z) * F, horizon + ((camH - y) / z) * F * 0.5];
  };

  ctx.lineWidth = 1;
  // Vízszintes sorok
  for (let z = 26; z > 1.2; z -= dz) {
    const zz = z - offset;
    const fade = a * (1 - zz / 26) * 0.9;
    ctx.strokeStyle = `rgba(198,255,61,${fade * 0.55})`;
    ctx.beginPath();
    xs.forEach((x, i) => {
      const [sx, sy] = project(x, zz);
      i ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy);
    });
    ctx.stroke();
  }
  // Hosszanti vonalak
  xs.forEach((x) => {
    ctx.beginPath();
    let first = true;
    for (let z = 26; z > 1.2; z -= dz) {
      const [sx, sy] = project(x, z - offset);
      first ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
      first = false;
    }
    ctx.strokeStyle = `rgba(140,200,255,${a * 0.18})`;
    ctx.stroke();
  });
  // Csillagok
  stars.forEach(([sx, sy, s]) => {
    const tw = reduced ? 1 : 0.6 + Math.sin(t * 0.002 + s * 20) * 0.4;
    ctx.fillStyle = `rgba(255,255,255,${a * s * tw * 0.8})`;
    ctx.fillRect(sx * w, sy * horizon, 1.4, 1.4);
  });
  // Ragyogó horizont
  const g = ctx.createLinearGradient(0, horizon - 60, 0, horizon + 40);
  g.addColorStop(0, 'rgba(198,255,61,0)');
  g.addColorStop(0.6, `rgba(198,255,61,${a * 0.12})`);
  g.addColorStop(1, 'rgba(198,255,61,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, horizon - 60, w, 100);
}

const heroEls = { photo: document.querySelector('.hero__photo'), t1: $('t1'), t2: $('t2'), t3: $('t3'), scroll: $('heroScroll') };
const loadStart = performance.now();

function updateHero(p, t) {
  const intro = reduced ? 1 : ease(clamp((t - loadStart) / 1800));
  heroEls.photo.style.setProperty('--photo', 1 - range(p, 0.12, 0.45));
  heroEls.photo.style.setProperty('--zoom', range(p, 0, 0.45));
  heroEls.t1.style.setProperty('--p', intro);
  heroEls.t1.style.setProperty('--o', 1 - range(p, 0.08, 0.2));
  heroEls.t2.style.setProperty('--p', range(p, 0.24, 0.4));
  heroEls.t2.style.setProperty('--o', 1 - range(p, 0.48, 0.56));
  heroEls.t3.style.setProperty('--p', range(p, 0.6, 0.76));
  heroEls.t3.style.setProperty('--o', 1 - range(p, 0.9, 1));
  heroEls.scroll.style.setProperty('--o', intro * (1 - range(p, 0, 0.06)));
  drawHero(p, t);
}

/* ---------- 2. Sötét rács, majd felcsúszó fehér panel ---------- */
const grid = makeCanvas($('gridCanvas'));
const mouse = { x: -999, y: -999 };
window.addEventListener('pointermove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
const flicker = new Map();

function drawGrid(p, t) {
  const { ctx, w, h } = grid;
  const size = w < 600 ? 40 : 64;
  ctx.clearRect(0, 0, w, h);
  const cols = Math.ceil(w / size) + 1;
  const rows = Math.ceil(h / size) + 1;
  const ox = (w % size) / 2;
  const oy = (h % size) / 2 - p * 80;

  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.beginPath();
  for (let c = 0; c <= cols; c++) { ctx.moveTo(ox + c * size + 0.5, 0); ctx.lineTo(ox + c * size + 0.5, h); }
  for (let r = -2; r <= rows + 2; r++) { const y = oy % size + r * size + 0.5; ctx.moveTo(0, y); ctx.lineTo(w, y); }
  ctx.stroke();

  // Véletlenszerűen felvillanó cellák
  if (!reduced && Math.random() < 0.25) flicker.set(`${(Math.random() * cols) | 0},${(Math.random() * rows) | 0}`, t);
  flicker.forEach((born, key) => {
    const age = (t - born) / 1400;
    if (age > 1) return flicker.delete(key);
    const [c, r] = key.split(',').map(Number);
    ctx.fillStyle = `rgba(198,255,61,${Math.sin(age * Math.PI) * 0.12})`;
    ctx.fillRect(ox + c * size + 1, oy % size + r * size + 1, size - 1, size - 1);
  });

  // Egér körüli fény
  const mg = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 220);
  mg.addColorStop(0, 'rgba(198,255,61,0.10)');
  mg.addColorStop(1, 'rgba(198,255,61,0)');
  ctx.fillStyle = mg;
  ctx.fillRect(0, 0, w, h);
}

const kicker = $('kicker');
const panel = $('panel');
const manifestoText = $('manifestoText');

function updateManifesto(p, t) {
  kicker.style.setProperty('--o', range(p, 0, 0.08) * (1 - range(p, 0.16, 0.26)));
  panel.style.setProperty('--r', 1 - ease(range(p, 0.18, 0.4)));
  manifestoText.style.setProperty('--p', range(p, 0.38, 0.9));
  if (p < 0.42) drawGrid(p, t);
  return p > 0.3 ? 'light' : 'dark';
}

/* ---------- 3. Folyamat: izometrikus blokkok, fotó → drótváz ---------- */
const boxes = [
  [0, 0, 0, 7, 6, 0.4],
  [0.5, 0.5, 0.4, 2.2, 2.2, 4.2],
  [3.2, 0.5, 0.4, 3.2, 1.6, 2.2],
  [3.2, 2.6, 0.4, 1.4, 1.4, 1.4],
  [5, 2.6, 0.4, 1.4, 1.4, 2.8],
  [0.5, 3.3, 0.4, 2.2, 2.2, 1.2],
  [3.2, 4.4, 0.4, 3.2, 1.2, 0.8],
];

function buildIso() {
  const s = 46;
  const ox = 300;
  const oy = 200;
  const cx = Math.cos(Math.PI / 6) * s;
  const sy = Math.sin(Math.PI / 6) * s;
  const P = (x, y, z) => `${(ox + (x - y) * cx).toFixed(1)},${(oy + (x + y) * sy - z * s).toFixed(1)}`;
  let photo = `<defs>
    <linearGradient id="top" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe2c2"/><stop offset="1" stop-color="#f3b98a"/></linearGradient>
    <linearGradient id="left" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e08f58"/><stop offset="1" stop-color="#b8653a"/></linearGradient>
    <linearGradient id="right" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a4129"/><stop offset="1" stop-color="#4b261a"/></linearGradient>
  </defs>`;
  let wire = '';
  [...boxes].sort((a, b) => a[0] + a[1] + a[2] - (b[0] + b[1] + b[2])).forEach(([x, y, z, w, d, h], i) => {
    const top = [P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)];
    const left = [P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)];
    const right = [P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)];
    photo += `<polygon points="${left.join(' ')}" fill="url(#left)"/><polygon points="${right.join(' ')}" fill="url(#right)"/><polygon points="${top.join(' ')}" fill="url(#top)"/>`;
    const hidden = [P(x, y, z), P(x + w, y, z), P(x, y, z), P(x, y + d, z), P(x, y, z), P(x, y, z + h)];
    wire += `<path d="M${hidden[0]}L${hidden[1]}M${hidden[2]}L${hidden[3]}M${hidden[4]}L${hidden[5]}" stroke="rgba(140,200,255,.35)" stroke-dasharray="3 4" fill="none"/>`;
    [top, left, right].forEach((f) => { wire += `<polygon points="${f.join(' ')}" fill="rgba(198,255,61,.03)" stroke="#c6ff3d" stroke-width="1"/>`; });
    if (i > 0) {
      const [lx, ly] = P(x + w, y, z + h).split(',').map(Number);
      wire += `<text x="${lx + 8}" y="${ly}" fill="#9aa3b2" font-family="JetBrains Mono, monospace" font-size="10">B-${String(i).padStart(2, '0')} · ${w}×${d}×${h}</text>`;
    }
  });
  $('isoPhoto').innerHTML = photo;
  $('isoWire').innerHTML = wire;
}
buildIso();

const processVisual = $('processVisual');
const processTag = $('processTag');
const steps = [...document.querySelectorAll('.step')];

function updateProcess(p) {
  processVisual.style.setProperty('--in', ease(range(p, 0, 0.18)));
  const w = range(p, 0.42, 0.72);
  processVisual.style.setProperty('--w', w);
  processTag.textContent = w < 0.5 ? 'RENDER · v1' : 'DRÓTVÁZ · v1';
  const active = Math.min(2, Math.floor(range(p, 0.1, 0.95) * 3));
  steps.forEach((s, i) => s.classList.toggle('is-active', i === active));
}

/* ---------- 4. Betűszó ---------- */
const acro = $('acro');
const acroSub = $('acroSub');
const acroStage = acro.parentElement;

function updateAcro(p) {
  acro.style.setProperty('--in', ease(range(p, 0.02, 0.18)));
  acro.style.setProperty('--s', ease(range(p, 0.18, 0.4)));
  const e = ease(range(p, 0.42, 0.72));
  acro.style.setProperty('--e', e);
  acroStage.querySelector('.acro__grid').style.setProperty('--e', e);
  acroSub.style.setProperty('--sub', range(p, 0.72, 0.85));
}

/* ---------- 5. Szolgáltatások vízszintesen ---------- */
const track = $('baysTrack');
const bays = [...track.children];
const baysBar = $('baysBar');

function updateBays(p) {
  const max = Math.max(0, track.scrollWidth - window.innerWidth);
  track.style.transform = `translate3d(${-range(p, 0.05, 0.95) * max}px,0,0)`;
  baysBar.style.setProperty('--p', p);
  const center = window.innerWidth / 2;
  bays.forEach((bay) => {
    const r = bay.getBoundingClientRect();
    const d = Math.abs(r.left + r.width / 2 - center) / (window.innerWidth * 0.6);
    bay.style.setProperty('--open', (0.92 * ease(clamp(1 - d))).toFixed(3));
  });
}

/* ---------- 6. Földgömb ívekkel ---------- */
const globe = makeCanvas($('globeCanvas'));
const N = 4000;
const dots = Array.from({ length: N }, (_, i) => {
  const y = 1 - (i / (N - 1)) * 2;
  const r = Math.sqrt(1 - y * y);
  const th = i * Math.PI * (3 - Math.sqrt(5));
  return [Math.cos(th) * r, y, Math.sin(th) * r];
});
const randOnSphere = () => {
  const u = Math.random() * 2 - 1;
  const th = Math.random() * Math.PI * 2;
  const v = [Math.cos(th), u * 0.8 + 0.6, Math.sin(th)];
  const len = Math.hypot(...v);
  return v.map((c) => c / len);
};
const hub = [0.2, 0.75, 0.6].map((c) => c / Math.hypot(0.2, 0.75, 0.6));
const arcs = Array.from({ length: 28 }, (_, i) => [i % 3 ? randOnSphere() : hub, randOnSphere()]);

function slerp(a, b, s) {
  const dot = clamp(a[0] * b[0] + a[1] * b[1] + a[2] * b[2], -1, 1);
  const om = Math.acos(dot) || 1e-6;
  const k1 = Math.sin((1 - s) * om) / Math.sin(om);
  const k2 = Math.sin(s * om) / Math.sin(om);
  const lift = 1 + Math.sin(s * Math.PI) * 0.08 * om;
  return [(a[0] * k1 + b[0] * k2) * lift, (a[1] * k1 + b[1] * k2) * lift, (a[2] * k1 + b[2] * k2) * lift];
}

function drawGlobe(p, t) {
  const { ctx, w, h } = globe;
  ctx.clearRect(0, 0, w, h);
  const R = Math.max(w, h) * 0.55;
  const rise = ease(range(p, 0, 0.35));
  const cx = w / 2;
  const cy = h + R * 0.55 - rise * R * 0.35;
  const rot = (reduced ? 0 : t * 0.00006) + p * 1.6;
  const tilt = 0.45;
  const cr = Math.cos(rot), sr = Math.sin(rot), ct = Math.cos(tilt), st = Math.sin(tilt);
  const tf = ([x, y, z]) => {
    const x1 = x * cr + z * sr;
    const z1 = -x * sr + z * cr;
    const y1 = y * ct - z1 * st;
    const z2 = y * st + z1 * ct;
    return [cx + x1 * R, cy - y1 * R, z2];
  };

  // Légkör és napfelkelte a peremen
  const atm = ctx.createRadialGradient(cx, cy, R * 0.96, cx, cy, R * 1.12);
  atm.addColorStop(0, 'rgba(120,170,255,0.35)');
  atm.addColorStop(1, 'rgba(120,170,255,0)');
  ctx.fillStyle = atm;
  ctx.beginPath(); ctx.arc(cx, cy, R * 1.12, 0, Math.PI * 2); ctx.fill();
  const sun = ctx.createRadialGradient(cx + R * 0.55, cy - R * 0.8, 0, cx + R * 0.55, cy - R * 0.8, R * 0.7);
  sun.addColorStop(0, `rgba(255,220,170,${0.35 * rise})`);
  sun.addColorStop(1, 'rgba(255,220,170,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#04070d';
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();

  dots.forEach((d) => {
    const [x, y, z] = tf(d);
    if (z < 0 || y > h + 4) return;
    ctx.fillStyle = `rgba(170,200,255,${0.15 + z * 0.55})`;
    ctx.fillRect(x, y, 1.6, 1.6);
  });

  const draw = range(p, 0.2, 0.75);
  ctx.lineWidth = 1.2;
  arcs.forEach(([a, b], i) => {
    const k = clamp(draw * 1.6 - (i / arcs.length) * 0.6);
    if (k <= 0) return;
    ctx.beginPath();
    let started = false;
    for (let s = 0; s <= k; s += 0.02) {
      const [x, y, z] = tf(slerp(a, b, s));
      if (z < 0) { started = false; continue; }
      started ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      started = true;
    }
    ctx.strokeStyle = 'rgba(198,255,61,0.75)';
    ctx.shadowColor = 'rgba(198,255,61,0.8)';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;
    const [ex, ey, ez] = tf(slerp(a, b, k));
    if (ez > 0) { ctx.fillStyle = '#e8ffb0'; ctx.beginPath(); ctx.arc(ex, ey, 2.2, 0, Math.PI * 2); ctx.fill(); }
  });
}

const globeHead = $('globeHead');
const globeStats = $('globeStats');
const counters = [...globeStats.querySelectorAll('[data-count]')];

function updateGlobe(p, t) {
  globeHead.style.setProperty('--o', range(p, 0.1, 0.25));
  globeStats.style.setProperty('--o', range(p, 0.35, 0.45));
  const c = ease(range(p, 0.38, 0.75));
  counters.forEach((el) => { el.textContent = Math.round(el.dataset.count * c) + el.dataset.suffix; });
  drawGlobe(p, t);
}

/* ---------- 7. Vélemény ---------- */
const quoteText = $('quoteText');
const quoteBy = $('quoteBy');
function updateQuote(p) {
  quoteText.style.setProperty('--p', range(p, 0.05, 0.7));
  quoteBy.style.setProperty('--o', range(p, 0.7, 0.8));
}

/* ---------- Jelenetvezérlő ---------- */
const handlers = { hero: updateHero, manifesto: updateManifesto, process: updateProcess, acro: updateAcro, bays: updateBays, globe: updateGlobe, quote: updateQuote };
const scenes = [...document.querySelectorAll('[data-scene]')].map((el) => ({ el, fn: handlers[el.dataset.scene] }));
const navSections = [...document.querySelectorAll('[data-nav]')];
const nav = $('nav');

function frame(t) {
  const vh = window.innerHeight;
  let theme = null;
  scenes.forEach(({ el, fn }) => {
    const r = el.getBoundingClientRect();
    if (r.bottom < 0 || r.top > vh) return;
    const p = clamp(-r.top / (r.height - vh));
    const result = fn(p, t);
    if (r.top <= 36 && r.bottom > 36) theme = result || el.dataset.nav;
  });
  if (!theme) {
    const s = navSections.find((el) => { const r = el.getBoundingClientRect(); return r.top <= 36 && r.bottom > 36; });
    theme = s ? s.dataset.nav : 'dark';
  }
  nav.classList.toggle('is-light', theme === 'light');
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* ---------- Mobil menü ---------- */
const navLinks = $('navLinks');
const menuToggle = $('menuToggle');
menuToggle.addEventListener('click', () => {
  const open = navLinks.classList.toggle('is-open');
  menuToggle.setAttribute('aria-expanded', open);
});
navLinks.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
  navLinks.classList.remove('is-open');
  menuToggle.setAttribute('aria-expanded', 'false');
}));

/* ---------- Kapcsolati űrlap ---------- */
const form = $('contactForm');
const status = $('formStatus');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  let valid = true;
  form.querySelectorAll('input, textarea').forEach((field) => {
    const ok = field.checkValidity() && field.value.trim() !== '';
    field.classList.toggle('is-invalid', !ok);
    if (!ok) valid = false;
  });
  status.textContent = valid ? 'Köszönjük az üzenetet! Hamarosan jelentkezünk.' : 'Kérjük, tölts ki minden mezőt helyesen!';
  status.className = `form__status ${valid ? 'ok' : 'err'}`;
  if (valid) form.reset();
});

$('year').textContent = new Date().getFullYear();
