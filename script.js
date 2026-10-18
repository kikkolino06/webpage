const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const range = (p, a, b) => clamp((p - a) / (b - a));
const ease = (t) => 1 - Math.pow(1 - t, 3);
const $ = (id) => document.getElementById(id);

/* ---------- Snippetek: lejátszás + előre kiszámolt spektrum, amire a vizuálok mozognak ---------- */
const tracks = [
  { id: 'untitled-01', title: 'untitled.01', src: 'audio/untitled-01.mp3' },
  { id: 'opiumshi3', title: 'opiumshi3', src: 'audio/opiumshi3.mp3' },
];
const decode = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
tracks.forEach((tr) => {
  const d = window.SNIPPET_DATA[tr.id];
  tr.fps = d.fps;
  tr.bands = d.bands;
  tr.frames = d.frames;
  tr.spec = decode(d.spec);
  tr.kick = decode(d.kick);
  tr.peaks = d.peaks;
});

const player = new Audio();
player.preload = 'none';
let current = 0;
let playing = false;

function load(i) {
  if (player.dataset.track === String(i)) return;
  current = i;
  player.src = tracks[i].src;
  player.dataset.track = i;
}

function play(i = current, at) {
  load(i);
  if (at !== undefined) {
    const seek = () => { player.currentTime = at; };
    player.readyState >= 1 ? seek() : player.addEventListener('loadedmetadata', seek, { once: true });
  }
  player.play().catch(() => {});
}

const playButtons = [...document.querySelectorAll('.js-play')];
const trackEls = [...document.querySelectorAll('.track')];

function setPlaying(on) {
  playing = on;
  document.body.classList.toggle('is-playing', on);
  const label = on ? 'Pause snippet' : 'Play snippet';
  playButtons.forEach((b) => {
    b.setAttribute('aria-pressed', on);
    b.setAttribute('aria-label', label);
    const l = b.querySelector('.js-play-label');
    if (l) l.textContent = on ? `Now playing · ${tracks[current].title}` : label;
  });
  trackEls.forEach((el, i) => {
    el.classList.toggle('is-current', i === current);
    el.classList.toggle('is-playing', on && i === current);
    el.querySelector('.track__play').setAttribute('aria-label', `${on && i === current ? 'Pause' : 'Play'} ${tracks[i].title}`);
  });
}

player.addEventListener('play', () => setPlaying(true));
player.addEventListener('pause', () => setPlaying(false));
player.addEventListener('ended', () => play((current + 1) % tracks.length, 0));

playButtons.forEach((btn) => btn.addEventListener('click', () => (playing ? player.pause() : play())));
trackEls.forEach((el, i) => {
  el.querySelector('.track__play').addEventListener('click', () => {
    if (playing && i === current) return player.pause();
    play(i);
  });
  el.querySelector('.track__wave').addEventListener('click', (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    play(i, clamp((e.clientX - r.left) / r.width) * 30);
  });
});

// Aktuális zenei állapot: kick (0–1), sávok (0–1), lépésszámláló. Lejátszás nélkül halk „üresjárat”.
const idleBands = new Float32Array(32);
function beat(t) {
  if (playing && player.currentTime > 0) {
    const tr = tracks[current];
    const f = Math.min(tr.frames - 1, Math.floor(player.currentTime * tr.fps));
    const bands = new Float32Array(tr.bands);
    for (let k = 0; k < tr.bands; k++) bands[k] = tr.spec[f * tr.bands + k] / 255;
    return { kick: tr.kick[f] / 255, bands, step: player.currentTime * 8, amt: 1 };
  }
  const amt = reduced ? 0 : 0.3;
  const phase = (t / 1000 / 0.8) % 1;
  for (let k = 0; k < 32; k++) idleBands[k] = (0.25 + 0.2 * Math.sin(t * 0.0015 + k * 0.5)) * amt * (1 - k / 48);
  return { kick: Math.exp(-phase * 5) * amt, bands: idleBands, step: t / 1000 * 4, amt };
}

// Hullámforma rajzolása a lejátszókártyákon
const waves = trackEls.map((el) => makeCanvasLazy(el.querySelector('.track__wave')));
const times = trackEls.map((el) => el.querySelector('.track__time'));
const fmt = (sec) => `0:${String(Math.floor(sec)).padStart(2, '0')}`;

function drawWaves(b) {
  waves.forEach((wv, i) => {
    const { ctx, w, h } = wv.size();
    const tr = tracks[i];
    const active = i === current && player.currentTime > 0;
    const prog = active ? player.currentTime / 30 : 0;
    ctx.clearRect(0, 0, w, h);
    const n = tr.peaks.length;
    const bw = w / n;
    for (let k = 0; k < n; k++) {
      const boost = active && playing && Math.abs(k / n - prog) < 0.02 ? 1 + b.kick * 0.5 : 1;
      const ph = Math.max(2, tr.peaks[k] * h * 0.9 * boost);
      ctx.fillStyle = k / n < prog ? '#c6ff3d' : 'rgba(255,255,255,0.22)';
      ctx.fillRect(k * bw + bw * 0.2, (h - ph) / 2, bw * 0.6, ph);
    }
    times[i].textContent = `${fmt(active ? player.currentTime : 0)} / 0:30`;
  });
}

/* ---------- Szöveg bontás ---------- */
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

function makeCanvasLazy(canvas) {
  const ctx = canvas.getContext('2d');
  let w = 0, h = 0;
  return {
    size() {
      const cw = canvas.clientWidth, ch = canvas.clientHeight;
      if (cw !== w || ch !== h) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = cw; h = ch;
        canvas.width = w * dpr; canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      return { ctx, w, h };
    },
  };
}

/* ---------- 1. Hero: éjszakai város → hullámzó drótváz ---------- */
function buildSkyline() {
  let back = '';
  let front = '';
  let windows = '';
  let x = 0;
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  while (x < 1600) {
    const w = 40 + rnd() * 70;
    const h = 120 + rnd() * 220;
    back += `<rect x="${x.toFixed(0)}" y="${(400 - h - 40).toFixed(0)}" width="${(w + 2).toFixed(0)}" height="${(h + 40).toFixed(0)}"/>`;
    x += w * 0.8;
  }
  x = 0;
  while (x < 1600) {
    const w = 50 + rnd() * 90;
    const h = 60 + rnd() * 200;
    const top = 400 - h;
    front += `<rect x="${x.toFixed(0)}" y="${top.toFixed(0)}" width="${(w + 1).toFixed(0)}" height="${h.toFixed(0)}"/>`;
    for (let wy = top + 12; wy < 390; wy += 14) {
      for (let wx = x + 8; wx < x + w - 8; wx += 11) {
        if (rnd() < 0.16) windows += `<rect x="${wx.toFixed(0)}" y="${wy.toFixed(0)}" width="4" height="6" fill="${rnd() < 0.3 ? '#ff5fa2' : '#ffd88a'}" opacity="${(0.5 + rnd() * 0.5).toFixed(2)}"/>`;
      }
    }
    x += w + rnd() * 6;
  }
  $('skyline').innerHTML = `<g fill="#3a1847" opacity=".8">${back}</g><g fill="#0d0812">${front}</g><g>${windows}</g>`;
}
buildSkyline();

const hero = makeCanvas($('heroCanvas'));
const stars = Array.from({ length: 160 }, () => [Math.random(), Math.random() * 0.55, Math.random()]);
// A táj közeli sorai hangszínképként emelkednek: középen a mély, kifelé a magas sávok
const terrain = (x, wz, z, b) => {
  const base = Math.sin(x * 0.55 + wz * 0.3) * 0.6 + Math.sin(x * 1.3 - wz * 0.45) * 0.3 + Math.sin(wz * 0.9) * 0.15;
  const band = b.bands[Math.min(31, Math.floor((Math.abs(x) / 16) * 32))];
  const eq = band * 2.4 * Math.exp(-z * 0.09) + b.kick * Math.exp(-Math.abs(x) * 0.3) * 0.8;
  return base * (0.15 + Math.abs(x) * 0.22) + eq;
};

function drawHero(p, t, b) {
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
    const y = terrain(x, wz, z, b);
    return [w / 2 + (x / z) * F, horizon + ((camH - y) / z) * F * 0.5];
  };

  ctx.lineWidth = 1;
  for (let z = 26; z > 1.2; z -= dz) {
    const zz = z - offset;
    const fade = a * (1 - zz / 26) * 0.9;
    ctx.strokeStyle = `rgba(198,255,61,${fade * (0.5 + b.kick * 0.4)})`;
    ctx.beginPath();
    xs.forEach((x, i) => {
      const [sx, sy] = project(x, zz);
      i ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy);
    });
    ctx.stroke();
  }
  xs.forEach((x) => {
    ctx.beginPath();
    let first = true;
    for (let z = 26; z > 1.2; z -= dz) {
      const [sx, sy] = project(x, z - offset);
      first ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
      first = false;
    }
    ctx.strokeStyle = `rgba(255,95,162,${a * 0.18})`;
    ctx.stroke();
  });
  stars.forEach(([sx, sy, s]) => {
    const tw = reduced ? 1 : 0.6 + Math.sin(t * 0.002 + s * 20) * 0.4;
    ctx.fillStyle = `rgba(255,255,255,${a * s * tw * 0.8})`;
    ctx.fillRect(sx * w, sy * horizon, 1.4, 1.4);
  });
  const g = ctx.createLinearGradient(0, horizon - 60, 0, horizon + 40);
  g.addColorStop(0, 'rgba(198,255,61,0)');
  g.addColorStop(0.6, `rgba(198,255,61,${a * (0.1 + b.kick * 0.15)})`);
  g.addColorStop(1, 'rgba(198,255,61,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, horizon - 60, w, 100);
}

const heroEls = { photo: document.querySelector('.hero__photo'), t1: $('t1'), t2: $('t2'), t3: $('t3'), bottom: $('heroScroll') };
const loadStart = performance.now();

function updateHero(p, t, b) {
  const intro = reduced ? 1 : ease(clamp((t - loadStart) / 1800));
  heroEls.photo.style.setProperty('--photo', 1 - range(p, 0.12, 0.45));
  heroEls.photo.style.setProperty('--zoom', range(p, 0, 0.45));
  heroEls.t1.style.setProperty('--p', intro);
  heroEls.t1.style.setProperty('--o', 1 - range(p, 0.08, 0.2));
  heroEls.t1.style.setProperty('--k', b.kick.toFixed(3));
  heroEls.t2.style.setProperty('--p', range(p, 0.24, 0.4));
  heroEls.t2.style.setProperty('--o', 1 - range(p, 0.48, 0.56));
  heroEls.t3.style.setProperty('--p', range(p, 0.6, 0.76));
  heroEls.t3.style.setProperty('--o', 1 - range(p, 0.9, 1));
  const o = intro * (1 - range(p, 0, 0.06));
  heroEls.bottom.style.setProperty('--o', o);
  heroEls.bottom.style.setProperty('--pe', o > 0.5 ? 'auto' : 'none');
  drawHero(p, t, b);
}

/* ---------- 2. Szekvenszer-rács, majd fehér panel ---------- */
const grid = makeCanvas($('gridCanvas'));
const mouse = { x: -999, y: -999 };
window.addEventListener('pointermove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
const cellOn = (c, r) => (Math.sin(c * 12.9898 + r * 78.233) * 43758.5453) % 1 > 0.62;

function drawGrid(p, t, b) {
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

  // Lejátszófej: tizenhatodonként lép, az aktív cellák felvillannak
  const head = Math.floor(b.step) % cols;
  const frac = b.step - Math.floor(b.step);
  for (let c = 0; c < cols; c++) {
    const dist = (head - c + cols) % cols;
    if (dist > 4) continue;
    const glow = Math.exp(-(dist + frac) * 0.9) * (0.25 + b.amt * 0.4 + b.kick * 0.9);
    for (let r = -1; r <= rows; r++) {
      const y = oy % size + r * size;
      if (cellOn(c, r)) {
        ctx.fillStyle = `rgba(198,255,61,${glow * 0.35})`;
        ctx.fillRect(ox + c * size + 1, y + 1, size - 1, size - 1);
      } else if (dist === 0) {
        ctx.fillStyle = `rgba(255,255,255,${0.025 * (1 - frac)})`;
        ctx.fillRect(ox + c * size + 1, y + 1, size - 1, size - 1);
      }
    }
  }

  const mg = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 220);
  mg.addColorStop(0, 'rgba(198,255,61,0.10)');
  mg.addColorStop(1, 'rgba(198,255,61,0)');
  ctx.fillStyle = mg;
  ctx.fillRect(0, 0, w, h);
}

const kicker = $('kicker');
const panel = $('panel');
const manifestoText = $('manifestoText');

function updateManifesto(p, t, b) {
  kicker.style.setProperty('--o', range(p, 0, 0.08) * (1 - range(p, 0.16, 0.26)));
  panel.style.setProperty('--r', 1 - ease(range(p, 0.18, 0.4)));
  manifestoText.style.setProperty('--p', range(p, 0.38, 0.9));
  if (p < 0.42) drawGrid(p, t, b);
  return p > 0.3 ? 'light' : 'dark';
}

/* ---------- 3. Folyamat: izometrikus stúdiópult, render → drótváz ---------- */
const PAD = ['#c6ff3d', '#2b2533', '#ff4d8d', '#2b2533', '#2b2533', '#8a5cff', '#2b2533', '#c6ff3d', '#ff4d8d', '#2b2533', '#2b2533', '#8a5cff', '#2b2533', '#c6ff3d', '#2b2533', '#ff4d8d'];
const boxes = [{ b: [0, 0, 0, 9, 7, 0.5], color: '#3a3446', label: 'CONSOLE · 9×7' }];
for (let i = 0; i < 16; i++) {
  const col = i % 4;
  const row = Math.floor(i / 4);
  boxes.push({ b: [0.6 + col * 1.3, 0.6 + row * 1.3, 0.5, 1.05, 1.05, 0.3], color: PAD[i], label: i === 3 ? 'PAD 4×4' : '' });
}
[[6.1, 0.8], [7.5, 0.8], [6.1, 2.2], [7.5, 2.2]].forEach(([x, y], i) => boxes.push({ b: [x, y, 0.5, 0.7, 0.7, 0.8], color: '#4a4358', label: i === 1 ? 'KNOB · FILTER' : '' }));
[6.1, 6.9, 7.7].forEach((x, i) => boxes.push({ b: [x, 3.9, 0.5, 0.35, 2.4, 0.15], color: '#15111b', label: i === 2 ? 'FADER' : '' }));
[[6.05, 4.3], [6.85, 5.4], [7.65, 4.8]].forEach(([x, y]) => boxes.push({ b: [x, y, 0.65, 0.45, 0.4, 0.35], color: '#e8e4ee', label: '' }));

function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v) => Math.round(clamp(f > 1 ? v + (255 - v) * (f - 1) : v * f, 0, 255));
  return `rgb(${ch(n >> 16)},${ch((n >> 8) & 255)},${ch(n & 255)})`;
}

function buildIso() {
  const s = 37;
  const ox = 268;
  const oy = 190;
  const cx = Math.cos(Math.PI / 6) * s;
  const sy = Math.sin(Math.PI / 6) * s;
  const P = (x, y, z) => `${(ox + (x - y) * cx).toFixed(1)},${(oy + (x + y) * sy - z * s).toFixed(1)}`;
  let photo = '';
  let wire = '';
  [...boxes].sort((a, b) => a.b[0] + a.b[1] + a.b[2] - (b.b[0] + b.b[1] + b.b[2])).forEach(({ b: [x, y, z, w, d, h], color, label }) => {
    const top = [P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)];
    const left = [P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)];
    const right = [P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)];
    const lit = color === '#c6ff3d' || color === '#ff4d8d' || color === '#8a5cff';
    photo += `<polygon points="${left.join(' ')}" fill="${shade(color, 0.7)}"/><polygon points="${right.join(' ')}" fill="${shade(color, 0.45)}"/><polygon points="${top.join(' ')}" fill="${shade(color, 1.12)}"${lit ? ` style="filter:drop-shadow(0 0 6px ${color})"` : ''}/>`;
    wire += `<path d="M${P(x, y, z)}L${P(x + w, y, z)}M${P(x, y, z)}L${P(x, y + d, z)}M${P(x, y, z)}L${P(x, y, z + h)}" stroke="rgba(255,95,162,.35)" stroke-dasharray="3 4" fill="none"/>`;
    [top, left, right].forEach((f) => { wire += `<polygon points="${f.join(' ')}" fill="rgba(198,255,61,.03)" stroke="#c6ff3d" stroke-width="1"/>`; });
    if (label) {
      const [lx, ly] = P(x + w, y, z + h).split(',').map(Number);
      wire += `<text x="${lx + 8}" y="${ly - 4}" fill="#9aa3b2" font-family="JetBrains Mono, monospace" font-size="10">${label}</text>`;
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
  processTag.textContent = w < 0.5 ? 'REC · STUDIO' : 'REC · WIREFRAME';
  const active = Math.min(2, Math.floor(range(p, 0.1, 0.95) * 3));
  steps.forEach((s, i) => s.classList.toggle('is-active', i === active));
}

/* ---------- 4. Betűszó ---------- */
const acro = $('acro');
const acroSub = $('acroSub');
const acroGrid = document.querySelector('.acro__grid');

function updateAcro(p, t, b) {
  acro.style.setProperty('--in', ease(range(p, 0.02, 0.18)));
  acro.style.setProperty('--s', ease(range(p, 0.18, 0.4)));
  const e = ease(range(p, 0.42, 0.72));
  acro.style.setProperty('--e', e);
  acro.style.transform = `scale(${1 + b.kick * 0.02})`;
  acroGrid.style.setProperty('--e', e);
  acroSub.style.setProperty('--sub', range(p, 0.72, 0.85));
}

/* ---------- 5. Szolgáltatások vízszintesen ---------- */
const track = $('baysTrack');
const bays = [...track.children];
const baysBar = $('baysBar');

const baysStage = $('baysStage');
function updateBays(p, t, b) {
  baysStage.style.setProperty('--kick', b.kick.toFixed(3));
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

/* ---------- 6. Forgó bakelit spektrummal ---------- */
const vinyl = makeCanvas($('vinylCanvas'));
let spin = 0;
let lastT = performance.now();

function drawVinyl(p, t, b) {
  const { ctx, w, h } = vinyl;
  ctx.clearRect(0, 0, w, h);
  const rise = ease(range(p, 0, 0.35));
  const mobile = w < 760;
  const R = mobile ? Math.min(w * 0.3, h * 0.14) : Math.min(w * 0.26, h * 0.34);
  const cx = mobile ? w * 0.5 : w * 0.7;
  const cy = (mobile ? h * 0.69 : h * 0.52) + (1 - rise) * h * 0.7;
  ctx.globalAlpha = mobile ? 0.85 : 1;
  const dt = t - lastT;
  lastT = t;
  if (!reduced) spin += dt * (playing ? 0.0035 : 0.0006);
  const rot = spin + p * 4;

  // Spektrum a lemez körül
  const bars = 120;
  const reach = range(p, 0.2, 0.5);
  for (let i = 0; i < bars; i++) {
    const ang = (i / bars) * Math.PI * 2 - Math.PI / 2;
    const k = Math.min(i, bars - i);
    const low = Math.exp(-k / 10);
    const band = b.bands[Math.min(31, Math.floor((k / (bars / 2)) * 32))];
    const len = (6 + band * R * 0.45 + low * b.kick * R * 0.25) * reach;
    if (len < 0.5) continue;
    const r0 = R * 1.06;
    ctx.strokeStyle = `rgba(198,255,61,${0.35 + low * b.kick * 0.6})`;
    ctx.lineWidth = Math.max(1.5, (Math.PI * 2 * r0) / bars * 0.45);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0);
    ctx.lineTo(cx + Math.cos(ang) * (r0 + len), cy + Math.sin(ang) * (r0 + len));
    ctx.stroke();
  }

  // Lemez
  const glow = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.5);
  glow.addColorStop(0, `rgba(255,77,141,${0.12 + b.kick * 0.15})`);
  glow.addColorStop(1, 'rgba(255,77,141,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#0a090c';
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = 1;
  for (let r = R * 0.38; r < R * 0.98; r += 3) {
    ctx.strokeStyle = `rgba(255,255,255,${0.025 + ((r * 7) % 5) * 0.006})`;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  }
  // Fényvisszaverődés
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.6);
  [0, Math.PI].forEach((o) => {
    const sheen = ctx.createLinearGradient(0, 0, Math.cos(o) * R, Math.sin(o) * R * 0.2);
    sheen.addColorStop(0, 'rgba(255,255,255,0)');
    sheen.addColorStop(1, 'rgba(255,255,255,0.07)');
    ctx.fillStyle = sheen;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R * 0.98, o - 0.35, o + 0.35); ctx.closePath(); ctx.fill();
  });
  ctx.restore();

  // Címke
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  const L = R * 0.33;
  const lg = ctx.createRadialGradient(0, 0, 0, 0, 0, L);
  lg.addColorStop(0, '#d8ff6a');
  lg.addColorStop(1, '#a6e01a');
  ctx.fillStyle = lg;
  ctx.beginPath(); ctx.arc(0, 0, L, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#07090d';
  ctx.textAlign = 'center';
  ctx.font = `600 ${Math.round(L * 0.26)}px "Inter Tight", sans-serif`;
  ctx.fillText('kikkolino', 0, -L * 0.25);
  ctx.font = `500 ${Math.round(L * 0.13)}px "JetBrains Mono", monospace`;
  ctx.fillText(`${tracks[current].title.toUpperCase()} · SIDE ${current ? 'B' : 'A'}`, 0, L * 0.5);
  ctx.beginPath(); ctx.arc(0, 0, L * 0.07, 0, Math.PI * 2); ctx.fillStyle = '#050307'; ctx.fill();
  ctx.restore();
  ctx.globalAlpha = 1;
}

const vinylHead = $('vinylHead');
const vinylLinks = $('vinylLinks');
const tracksEl = $('tracks');

function updateVinyl(p, t, b) {
  vinylHead.style.setProperty('--o', range(p, 0.05, 0.18));
  const to = range(p, 0.12, 0.28);
  tracksEl.style.setProperty('--o', to);
  tracksEl.style.setProperty('--pe', to > 0.5 ? 'auto' : 'none');
  tracksEl.style.setProperty('--kick', b.kick.toFixed(3));
  const o = range(p, 0.25, 0.4);
  vinylLinks.style.setProperty('--o', o);
  vinylLinks.style.setProperty('--pe', o > 0.5 ? 'auto' : 'none');
  drawVinyl(p, t, b);
  drawWaves(b);
}

/* ---------- 7. Idézet ---------- */
const quoteText = $('quoteText');
const quoteBy = $('quoteBy');
function updateQuote(p) {
  quoteText.style.setProperty('--p', range(p, 0.05, 0.7));
  quoteBy.style.setProperty('--o', range(p, 0.7, 0.8));
}

/* ---------- Jelenetvezérlő ---------- */
const handlers = { hero: updateHero, manifesto: updateManifesto, process: updateProcess, acro: updateAcro, bays: updateBays, vinyl: updateVinyl, quote: updateQuote };
const scenes = [...document.querySelectorAll('[data-scene]')].map((el) => ({ el, fn: handlers[el.dataset.scene] }));
const navSections = [...document.querySelectorAll('[data-nav]')];
const nav = $('nav');

function frame(t) {
  const vh = window.innerHeight;
  const b = beat(t);
  let theme = null;
  scenes.forEach(({ el, fn }) => {
    const r = el.getBoundingClientRect();
    if (r.bottom < 0 || r.top > vh) return;
    const p = clamp(-r.top / (r.height - vh));
    const result = fn(p, t, b);
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

/* ---------- Booking űrlap: ellenőrzés, majd levél megnyitása ---------- */
const form = $('contactForm');
const status = $('formStatus');
const bookingEmail = $('bookingMail').textContent.trim();
form.addEventListener('submit', (e) => {
  e.preventDefault();
  let valid = true;
  form.querySelectorAll('input, textarea, select').forEach((field) => {
    const ok = field.checkValidity() && field.value.trim() !== '';
    field.classList.toggle('is-invalid', !ok);
    if (!ok) valid = false;
  });
  if (!valid) {
    status.textContent = 'Please fill in every field correctly.';
    status.className = 'form__status err';
    return;
  }
  const d = Object.fromEntries(new FormData(form));
  const subject = `${d.type} – ${d.name}`;
  const body = `${d.message}\n\n${d.name}\n${d.email}`;
  window.location.href = `mailto:${bookingEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  status.textContent = 'Thanks! Your mail app just opened — just hit send.';
  status.className = 'form__status ok';
});

$('year').textContent = new Date().getFullYear();
