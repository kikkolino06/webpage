// Téma (világos / sötét)
const root = document.documentElement;
const themeToggle = document.getElementById('themeToggle');

function applyTheme(theme) {
  root.setAttribute('data-theme', theme);
  themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
}

let savedTheme = null;
try { savedTheme = localStorage.getItem('theme'); } catch (e) {}
applyTheme(savedTheme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));

themeToggle.addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  try { localStorage.setItem('theme', next); } catch (e) {}
});

// Mobil menü
const nav = document.getElementById('nav');
const menuToggle = document.getElementById('menuToggle');

menuToggle.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  menuToggle.setAttribute('aria-expanded', open);
  menuToggle.textContent = open ? '✕' : '☰';
});

nav.querySelectorAll('a').forEach((link) =>
  link.addEventListener('click', () => {
    nav.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.textContent = '☰';
  })
);

// Fejléc árnyék görgetéskor
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header.classList.toggle('is-scrolled', window.scrollY > 10);
}, { passive: true });

// Számláló animáció
function animateCount(el) {
  const target = Number(el.dataset.count);
  const duration = 1200;
  const start = performance.now();
  function step(now) {
    const p = Math.min((now - start) / duration, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// Megjelenés görgetéskor
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    const counter = entry.target.querySelector('[data-count]');
    if (counter) animateCount(counter);
    observer.unobserve(entry.target);
  });
}, { threshold: 0.15 });

document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

// Projekt szűrés
const filters = document.querySelectorAll('.filter');
const projects = document.querySelectorAll('.project');

filters.forEach((btn) =>
  btn.addEventListener('click', () => {
    filters.forEach((b) => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    const cat = btn.dataset.filter;
    projects.forEach((p) => {
      p.classList.toggle('is-hidden', cat !== 'all' && p.dataset.cat !== cat);
    });
  })
);

// Kapcsolati űrlap ellenőrzése
const form = document.getElementById('contactForm');
const status = document.getElementById('formStatus');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  let valid = true;
  form.querySelectorAll('input, textarea').forEach((field) => {
    const ok = field.checkValidity() && field.value.trim() !== '';
    field.classList.toggle('is-invalid', !ok);
    if (!ok) valid = false;
  });

  if (!valid) {
    status.textContent = 'Kérjük, tölts ki minden mezőt helyesen!';
    status.className = 'form__status err';
    return;
  }

  status.textContent = 'Köszönjük az üzenetet! Hamarosan jelentkezünk.';
  status.className = 'form__status ok';
  form.reset();
});

// Aktuális év a láblécben
document.getElementById('year').textContent = new Date().getFullYear();
