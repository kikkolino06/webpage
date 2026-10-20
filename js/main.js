(function () {
  "use strict";

  const Art = window.EmberArt;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (t) => t * t * (3 - 2 * t);
  const lerp = (a, b, t) => a + (b - a) * t;

  // Paint every [data-art] container from the art library.
  document.querySelectorAll("[data-art]").forEach((el) => {
    const draw = Art[el.dataset.art];
    if (!draw) return;
    const target = el.querySelector(":scope > .art") || el;
    target.innerHTML = draw();
  });

  /* ================= scroll story ================= */
  const story = document.getElementById("story");
  const scenes = Array.from(story.querySelectorAll(".scene"));
  const N = scenes.length;
  story.style.setProperty("--scenes", N);

  const badge = story.querySelector(".temp-badge");
  const badgeValue = badge.querySelector(".temp-value");
  const badgePlace = badge.querySelector(".temp-place");
  const hint = story.querySelector(".scroll-hint");
  const header = document.querySelector(".site-header");
  const dock = document.querySelector(".dock");

  const sceneData = scenes.map((el) => ({
    el,
    art: el.querySelector(".art"),
    copy: el.querySelector(".copy"),
    zoom: parseFloat(el.dataset.zoom || "0"),
    temp: el.dataset.temp ? parseFloat(el.dataset.temp) : null,
    place: el.dataset.place || ""
  }));
  sceneData.forEach((s) => { s.art.style.transformOrigin = s.el.dataset.origin || "50% 50%"; });

  // Scene-specific pieces
  const ringEls = Array.from(story.querySelectorAll(".duct-ring"));
  const explodedScene = story.querySelector(".scene-exploded");
  const parts = Array.from(explodedScene.querySelectorAll(".part"));
  const shell = explodedScene.querySelector(".shell");
  const callouts = Array.from(explodedScene.querySelectorAll(".callout"));
  const checks = Array.from(explodedScene.querySelectorAll(".checklist li"));
  const checkCount = explodedScene.querySelector(".checklist-count");
  const checklist = explodedScene.querySelector(".checklist");

  function tempColor(t) {
    const k = clamp((t - 61) / 9, 0, 1);
    const c1 = [156, 195, 220], c2 = [240, 160, 90];
    return "rgb(" + c1.map((c, i) => Math.round(lerp(c, c2[i], k))).join(",") + ")";
  }

  // Temperature along the story: linear between scenes that report one.
  const tempKeys = sceneData.map((s, i) => [i, s.temp]).filter((k) => k[1] !== null);
  function tempAt(p) {
    if (p <= tempKeys[0][0]) return tempKeys[0][1];
    for (let i = 0; i < tempKeys.length - 1; i++) {
      const a = tempKeys[i], b = tempKeys[i + 1];
      if (p <= b[0]) return lerp(a[1], b[1], (p - a[0]) / (b[0] - a[0]));
    }
    return tempKeys[tempKeys.length - 1][1];
  }

  function renderStory() {
    const rect = story.getBoundingClientRect();
    const vh = window.innerHeight;
    const total = story.offsetHeight - vh;
    const raw = clamp(-rect.top / total, 0, 1);
    const p = raw * (N - 1);

    sceneData.forEach((s, i) => {
      const t = p - i;
      // Each scene fades in over the previous one, then zooms "into" itself as it leaves.
      const vis = i === 0 ? 1 : smooth(clamp((t + 0.32) / 0.32, 0, 1));
      const hidden = t < -0.4 || t > 1.05;
      s.el.style.opacity = hidden ? 0 : vis;
      s.el.style.visibility = hidden ? "hidden" : "visible";
      if (hidden) return;

      const out = smooth(clamp(t / 1, 0, 1));
      const enter = 1 - vis;
      const scale = reduceMotion ? 1 : 1 + out * s.zoom + enter * 0.06;
      s.art.style.transform = "scale(" + scale.toFixed(4) + ")";
      s.art.style.filter = s.zoom > 1 && out > 0.05 && !reduceMotion ? "blur(" + (out * 6).toFixed(1) + "px)" : "";

      if (s.copy) {
        const c = clamp(1 - Math.abs(t - 0.05) * 3.2, 0, 1);
        s.copy.style.opacity = c;
        s.copy.style.transform = "translateY(" + ((t - 0.05) * -60).toFixed(1) + "px)";
        s.copy.style.pointerEvents = c > 0.5 ? "auto" : "none";
      }
    });

    // duct fly-through: rings come towards the camera
    const ductT = p - 3;
    if (ringEls.length && ductT > -0.5 && ductT < 1.2) {
      const travel = (ductT + 0.5) * 3;
      ringEls.forEach((ring, k) => {
        let d = (k - travel) % ringEls.length;
        if (d < 0) d += ringEls.length;
        const s = 1 / (1 + d * 0.55);
        ring.setAttribute("transform", "translate(800 450) scale(" + s.toFixed(4) + ") translate(-800 -450)");
        ring.style.opacity = clamp(d < 0.4 ? d / 0.4 : 1 - d / ringEls.length, 0, 1).toFixed(3);
      });
    }

    // exploded unit
    const exT = p - 5;
    const e = smooth(clamp((exT + 0.35) / 0.55, 0, 1));
    parts.forEach((g) => {
      g.style.transform = "translate(" + (parseFloat(g.dataset.dx) * e).toFixed(1) + "px," + (parseFloat(g.dataset.dy) * e).toFixed(1) + "px)";
    });
    shell.style.opacity = (1 - e).toFixed(3);
    callouts.forEach((c, i) => c.setAttribute("opacity", smooth(clamp((e - 0.55 - i * 0.08) / 0.2, 0, 1)).toFixed(3)));
    const done = Math.round(clamp((exT + 0.25) / 0.85, 0, 1) * checks.length);
    checks.forEach((li, i) => li.classList.toggle("done", i < done));
    checkCount.textContent = done + "/" + checks.length;
    checklist.style.opacity = clamp(1 - Math.abs(exT) * 2.6, 0, 1);

    // temperature badge
    const cur = sceneData[clamp(Math.floor(p + 0.3), 0, N - 1)];
    const showBadge = cur.temp !== null && p > 0.6;
    badge.style.opacity = showBadge ? 1 : 0;
    if (showBadge) {
      const temp = tempAt(p);
      badgeValue.textContent = Math.round(temp) + "°";
      badgePlace.textContent = cur.place;
      badge.style.setProperty("--tcolor", tempColor(temp));
      badge.style.setProperty("--fill", (20 + clamp((temp - 58) / 16, 0, 1) * 75).toFixed(0) + "%");
    }

    hint.style.opacity = clamp(1 - p * 4, 0, 1) * 0.7;
    header.classList.toggle("is-solid", rect.bottom <= 80);
    dock.classList.toggle("is-on", p > 0.5);
  }

  /* ---------- snow over the hero ---------- */
  const snow = story.querySelector(".snow");
  const ctx = snow.getContext("2d");
  let flakes = [];
  function sizeSnow() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    snow.width = snow.clientWidth * dpr;
    snow.height = snow.clientHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(snow.clientWidth * snow.clientHeight / 9000);
    flakes = Array.from({ length: count }, () => ({
      x: Math.random() * snow.clientWidth,
      y: Math.random() * snow.clientHeight,
      r: 0.6 + Math.random() * 2.2,
      v: 0.3 + Math.random() * 0.9,
      w: Math.random() * Math.PI * 2
    }));
  }
  function tickSnow() {
    const w = snow.clientWidth, h = snow.clientHeight;
    ctx.clearRect(0, 0, w, h);
    if (scenes[0].style.visibility !== "hidden") {
      ctx.fillStyle = "rgba(255,255,255,.85)";
      for (const f of flakes) {
        f.y += f.v * f.r * 0.6;
        f.w += 0.01;
        f.x += Math.sin(f.w) * 0.35;
        if (f.y > h + 4) { f.y = -4; f.x = Math.random() * w; }
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    requestAnimationFrame(tickSnow);
  }

  let queued = false;
  function onScroll() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; renderStory(); });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => { sizeSnow(); renderStory(); });
  sizeSnow();
  renderStory();
  if (!reduceMotion) requestAnimationFrame(tickSnow);

  // "Ride the airflow" jumps to the second scene.
  story.querySelector(".btn-play").addEventListener("click", (e) => {
    e.preventDefault();
    const total = story.offsetHeight - window.innerHeight;
    window.scrollTo({ top: story.offsetTop + total / (N - 1), behavior: reduceMotion ? "auto" : "smooth" });
  });
  // The tune-up nav link lands mid-story on the exploded unit.
  document.querySelector('.nav a[href="#tune-ups"]').addEventListener("click", (e) => {
    e.preventDefault();
    const total = story.offsetHeight - window.innerHeight;
    window.scrollTo({ top: story.offsetTop + total * (5.15 / (N - 1)), behavior: reduceMotion ? "auto" : "smooth" });
  });

  /* ================= thermostat dial ================= */
  const MIN = 58, MAX = 74, START = 135, SWEEP = 270;
  const dialSvg = document.querySelector(".dial-svg");
  const dialCard = document.querySelector(".dial-card");
  const tintCold = dialCard.querySelector(".dial-tint-cold");
  const tintWarm = dialCard.querySelector(".dial-tint-warm");
  const frost = dialCard.querySelector(".dial-frost");
  const statusTag = dialCard.querySelector(".dial-status-tag");
  const statusText = dialCard.querySelector(".dial-status-text");
  const roomSvg = dialCard.querySelector(".dial-room svg");
  let setTemp = 63;

  function polar(deg, r) {
    const a = (deg * Math.PI) / 180;
    return [100 + Math.cos(a) * r, 100 + Math.sin(a) * r];
  }
  function arc(from, to, r) {
    const a = polar(from, r), b = polar(to, r);
    const large = to - from > 180 ? 1 : 0;
    return "M" + a[0].toFixed(2) + " " + a[1].toFixed(2) + " A" + r + " " + r + " 0 " + large + " 1 " + b[0].toFixed(2) + " " + b[1].toFixed(2);
  }
  dialSvg.querySelector(".dial-track").setAttribute("d", arc(START, START + SWEEP, 80));

  const moods = [
    [61, "Frost on the glass", "Socks, blankets, and the heat running nonstop."],
    [65, "Sweater weather", "Better. Still a draft by the windows."],
    [69, "Comfortable", "Even heat, wall to wall. Nobody's fighting over the thermostat."],
    [99, "Warm. Finally.", "Every room reaches the number on the dial."]
  ];

  function renderDial() {
    const k = (setTemp - MIN) / (MAX - MIN);
    const deg = START + k * SWEEP;
    dialSvg.querySelector(".dial-fill").setAttribute("d", k > 0.001 ? arc(START, deg, 80) : "");
    const kp = polar(deg, 80);
    const knob = dialSvg.querySelector(".dial-knob");
    knob.setAttribute("cx", kp[0].toFixed(2));
    knob.setAttribute("cy", kp[1].toFixed(2));
    dialSvg.querySelector(".dial-temp").textContent = setTemp + "°";
    dialSvg.setAttribute("aria-valuenow", setTemp);
    dialSvg.setAttribute("aria-valuetext", setTemp + " degrees");
    dialSvg.querySelector(".dial-fill").style.stroke = tempColor(setTemp);

    const w = smooth(k);
    tintCold.style.opacity = (0.75 * (1 - w)).toFixed(3);
    tintWarm.style.opacity = (0.9 * w).toFixed(3);
    frost.style.opacity = (1 - k * 1.6).toFixed(3);
    if (roomSvg) {
      roomSvg.style.setProperty("--frost", clamp(0.8 - k * 1.3, 0, 0.8).toFixed(3));
      roomSvg.style.filter = "saturate(" + (0.4 + w * 0.8).toFixed(2) + ") brightness(" + (0.85 + w * 0.15).toFixed(2) + ")";
    }
    const mood = moods.find((m) => setTemp <= m[0]);
    statusTag.textContent = mood[1];
    statusText.textContent = mood[2];
  }

  function setFromPointer(e) {
    const r = dialSvg.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    let deg = (Math.atan2(y, x) * 180) / Math.PI;
    if (deg < 0) deg += 360;
    let rel = deg - START;
    if (rel < 0) rel += 360;
    if (rel > SWEEP) rel = rel > SWEEP + (360 - SWEEP) / 2 ? 0 : SWEEP;
    setTemp = Math.round(MIN + (rel / SWEEP) * (MAX - MIN));
    renderDial();
  }
  dialSvg.addEventListener("pointerdown", (e) => {
    dialSvg.setPointerCapture(e.pointerId);
    dialSvg.style.cursor = "grabbing";
    setFromPointer(e);
  });
  dialSvg.addEventListener("pointermove", (e) => { if (dialSvg.hasPointerCapture(e.pointerId)) setFromPointer(e); });
  dialSvg.addEventListener("pointerup", () => { dialSvg.style.cursor = ""; });
  dialSvg.addEventListener("keydown", (e) => {
    const step = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[e.key];
    if (e.key === "Home") setTemp = MIN;
    else if (e.key === "End") setTemp = MAX;
    else if (step) setTemp = clamp(setTemp + step, MIN, MAX);
    else return;
    e.preventDefault();
    renderDial();
  });
  document.querySelectorAll(".dial-btn").forEach((b) => b.addEventListener("click", () => {
    setTemp = clamp(setTemp + parseInt(b.dataset.step, 10), MIN, MAX);
    renderDial();
  }));
  renderDial();

  /* ================= filter before/after ================= */
  const compare = document.querySelector(".compare");
  const compareRange = compare.querySelector(".compare-range");
  compareRange.addEventListener("input", () => compare.style.setProperty("--pos", compareRange.value + "%"));

  /* ================= systems picker ================= */
  const systems = {
    furnace: {
      kicker: "Natural gas · ducted",
      name: "Gas furnace",
      best: "Best for: Homes with natural gas and existing ductwork. Pairs with central AC for summer.",
      stats: [["Up to 98%", "AFUE efficiency"], ["15–20 yrs", "Typical life"], ["$4.5–9k", "Installed"]],
      cta: "Get a free furnace quote"
    },
    heatpump: {
      kicker: "Heats and cools in one",
      name: "Heat pump",
      best: "Best for: All-electric homes, or as a hybrid with a gas furnace backing it up on the coldest days.",
      stats: [["2 in 1", "Heat + cool"], ["10–15 yrs", "Typical life"], ["$7–14k", "Installed"]],
      cta: "Get a free heat pump quote"
    },
    minisplit: {
      kicker: "Comfort where the ducts don't reach",
      name: "Ductless mini-split",
      best: "Best for: Additions, finished basements, garages, sunrooms and that one bedroom over the garage.",
      stats: [["Room by room", "Own thermostat"], ["15–20 yrs", "Typical life"], ["$3.5–7k", "Per zone"]],
      cta: "Get a free ductless mini-split quote"
    }
  };
  const sysRoot = document.getElementById("systems");
  function showSystem(key) {
    const s = systems[key];
    sysRoot.querySelectorAll(".chip").forEach((c) => {
      const on = c.dataset.system === key;
      c.classList.toggle("is-on", on);
      c.setAttribute("aria-selected", on);
    });
    sysRoot.querySelector(".system-art").innerHTML = Art.product(key);
    sysRoot.querySelector(".system-kicker").textContent = s.kicker;
    sysRoot.querySelector(".system-name").textContent = s.name;
    sysRoot.querySelector(".system-best").textContent = s.best;
    sysRoot.querySelector(".system-stats").innerHTML = s.stats.map((x) => "<div><strong>" + x[0] + "</strong><span>" + x[1] + "</span></div>").join("");
    sysRoot.querySelector(".system-cta").textContent = s.cta;
  }
  sysRoot.querySelectorAll(".chip").forEach((c) => c.addEventListener("click", () => showSystem(c.dataset.system)));
  showSystem("furnace");

  /* ================= repair or replace ================= */
  const calc = document.getElementById("repair");
  const ageIn = calc.querySelector(".calc-age");
  const quoteIn = calc.querySelector(".calc-quote");
  const lifespan = { furnace: 18, heatpump: 13, ac: 14 };
  const sysNames = { furnace: "furnace", heatpump: "heat pump", ac: "AC" };
  const money = (n) => "$" + Math.round(n).toLocaleString("en-US");

  calc.querySelectorAll('[data-group="system"] .chip').forEach((c) => c.addEventListener("click", () => {
    calc.querySelectorAll('[data-group="system"] .chip').forEach((o) => o.classList.toggle("is-on", o === c));
    renderCalc();
  }));
  calc.querySelectorAll('[data-group="symptoms"] .chip').forEach((c) => c.addEventListener("click", () => {
    c.classList.toggle("is-on");
    c.setAttribute("aria-pressed", c.classList.contains("is-on"));
    renderCalc();
  }));
  [ageIn, quoteIn].forEach((i) => i.addEventListener("input", renderCalc));

  function renderCalc() {
    const age = +ageIn.value, quote = +quoteIn.value;
    const sys = calc.querySelector('[data-group="system"] .is-on').dataset.v;
    const symptoms = calc.querySelectorAll('[data-group="symptoms"] .is-on').length;
    calc.querySelector(".calc-age-out").textContent = age + (age === 1 ? " yr" : " yrs");
    calc.querySelector(".calc-quote-out").textContent = money(quote);
    [ageIn, quoteIn].forEach((i) => i.style.setProperty("--p", ((i.value - i.min) / (i.max - i.min)) * 100 + "%"));

    const score = age * quote;
    // Each warning sign and an over-age system push the needle toward "replace".
    const pressure = score + symptoms * 600 + (age > lifespan[sys] ? 1500 : 0);
    const m = clamp(pressure / 10000, 0.02, 0.98);
    let verdict, cls, why;
    if (pressure >= 5000) {
      verdict = "Time to replace"; cls = "";
      why = age + " yrs × " + money(quote) + " = " + money(score) + (score >= 5000 ? ", over the $5,000 line." : ".") +
        " Money is better spent on a new, efficient " + sysNames[sys] + ".";
    } else if (pressure >= 3800) {
      verdict = "Close call"; cls = "is-close";
      why = age + " yrs × " + money(quote) + " = " + money(score) + ", just under the $5,000 line. Repair it if the rest of the system checks out, and start planning.";
    } else {
      verdict = "Repair it"; cls = "is-repair";
      why = age + " yrs × " + money(quote) + " = " + money(score) + ", well under the $5,000 line. Fix it and keep it tuned; it has years left.";
    }
    if (symptoms) why += " " + symptoms + (symptoms === 1 ? " warning sign pushes" : " warning signs push") + " it toward replacing.";
    if (age > lifespan[sys]) why += " At " + age + ", it's past a typical " + sysNames[sys] + "'s life.";
    const v = calc.querySelector(".verdict");
    v.textContent = verdict;
    v.className = "verdict " + cls;
    calc.querySelector(".meter").style.setProperty("--m", (m * 100).toFixed(1) + "%");
    calc.querySelector(".verdict-why").textContent = why;
  }
  renderCalc();

  /* ================= booking dialog ================= */
  const dialog = document.getElementById("book");
  const form = dialog.querySelector("form");
  const doneMsg = dialog.querySelector(".book-done");
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-book]");
    if (!t) return;
    e.preventDefault();
    doneMsg.hidden = true;
    form.querySelectorAll("input,select,.btn").forEach((el) => { el.disabled = false; });
    if (typeof dialog.showModal === "function") dialog.showModal();
  });
  form.addEventListener("submit", (e) => {
    if (e.submitter && e.submitter.value === "cancel") return;
    e.preventDefault();
    if (!form.reportValidity()) return;
    doneMsg.hidden = false;
    form.querySelectorAll("input,select,.btn").forEach((el) => { el.disabled = true; });
    setTimeout(() => { dialog.close(); form.reset(); }, 2600);
  });
})();
