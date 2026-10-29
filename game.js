(function () {
  const CAP = 50;
  const WEEKS = 10;
  const GAMES_PER_WEEK = 3;
  const SLOTS = { F: 3, D: 2, G: 1 };
  const STORE_KEY = "rinkdraft-v1";
  const OPPONENTS = [
    "Lakeshore Loons", "Northfield Plows", "Cedar Point Owls", "Gravel Bay Grinders",
    "Pine Ridge Moose", "Harbor Town Gulls", "Old Mill Beavers", "Westbrook Hawks",
    "Stony Creek Lynx", "Riverside Otters",
  ];

  const byId = (id) => PLAYERS[id];
  const $ = (id) => document.getElementById(id);

  // ---------- State ----------
  function freshState(teamName, lineup) {
    return { teamName: teamName || "", lineup: lineup || { F: [], D: [], G: [] }, results: [] };
  }

  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(STORE_KEY));
      if (s && s.lineup && Array.isArray(s.results)) return s;
    } catch (e) { /* storage blocked or corrupt */ }
    return freshState();
  }

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  let state = load();
  let view = { pos: "ALL", search: "", sort: "price-desc", shownWeek: null };

  const lineupIds = () => [...state.lineup.F, ...state.lineup.D, ...state.lineup.G];
  const capUsed = (ids) => ids.reduce((sum, id) => sum + byId(id).price, 0);
  const lineupFull = () => Object.keys(SLOTS).every((k) => state.lineup[k].length === SLOTS[k]);
  const money = (n) => "$" + n.toFixed(1) + "M";

  // ---------- Simulation ----------
  function poisson(lambda) {
    const L = Math.exp(-lambda);
    let k = 0, p = 1;
    do { k++; p *= Math.random(); } while (p > L);
    return k - 1;
  }

  function binomial(n, p) {
    let k = 0;
    for (let i = 0; i < n; i++) if (Math.random() < p) k++;
    return k;
  }

  function simSkater(p) {
    const o = p.off / 99, d = p.def / 99;
    const fwd = p.pos === "F";
    const line = { g: 0, a: 0, s: 0, b: 0 };
    for (let i = 0; i < GAMES_PER_WEEK; i++) {
      line.g += poisson((fwd ? 0.55 : 0.2) * o * o);
      line.a += poisson((fwd ? 0.8 : 0.65) * o * o);
      line.s += poisson(fwd ? 1.2 + 2.4 * o : 1.0 + 1.6 * o);
      line.b += poisson(fwd ? 0.2 + 0.4 * d : 0.8 + 1.2 * d);
    }
    line.pts = line.g * 3 + line.a * 2 + line.s * 0.5 + line.b * 0.5;
    return line;
  }

  function simGoalie(p) {
    const sv = p.sv / 99, team = (TEAM_STRENGTH[p.team] || 65) / 99;
    const line = { w: 0, sv: 0, ga: 0, so: 0 };
    for (let i = 0; i < GAMES_PER_WEEK; i++) {
      const shots = 24 + Math.floor(Math.random() * 13);
      const saves = binomial(shots, 0.87 + 0.05 * sv);
      const ga = shots - saves;
      const winChance = 0.15 + 0.3 * sv + 0.3 * team - 0.08 * (ga - 2);
      line.sv += saves;
      line.ga += ga;
      if (ga === 0) { line.so++; line.w++; }
      else if (Math.random() < winChance) line.w++;
    }
    line.pts = line.w * 4 + line.sv * 0.2 - line.ga + line.so * 3;
    return line;
  }

  function simLineup(ids) {
    const rows = ids.map((id) => {
      const p = byId(id);
      return { id, line: p.pos === "G" ? simGoalie(p) : simSkater(p) };
    });
    const total = rows.reduce((s, r) => s + r.line.pts, 0);
    return { rows, total: Math.round(total * 10) / 10 };
  }

  function shuffled(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Computer teams spend most of the cap so they stay competitive.
  function cpuLineup() {
    const pools = {};
    for (const k of Object.keys(SLOTS)) pools[k] = PLAYERS.filter((p) => p.pos === k).map((p) => p.id);
    let best = null;
    for (let tries = 0; tries < 500; tries++) {
      const ids = [];
      for (const k of Object.keys(SLOTS)) ids.push(...shuffled(pools[k]).slice(0, SLOTS[k]));
      const cost = capUsed(ids);
      if (cost <= CAP && cost >= 45) return ids;
      if (cost <= CAP && (!best || cost > capUsed(best))) best = ids;
    }
    return best;
  }

  // ---------- Actions ----------
  function addPlayer(id) {
    const p = byId(id);
    const slot = state.lineup[p.pos];
    if (slot.includes(id)) return;
    if (slot.length >= SLOTS[p.pos]) {
      return flash(`Your ${posName(p.pos)} slots are full. Drop someone first.`);
    }
    if (capUsed(lineupIds()) + p.price > CAP + 1e-9) {
      return flash(`${p.name} would put you over the $${CAP}M cap.`);
    }
    slot.push(id);
    flash("");
    save();
    render();
  }

  function dropPlayer(id) {
    const p = byId(id);
    state.lineup[p.pos] = state.lineup[p.pos].filter((x) => x !== id);
    save();
    render();
  }

  function playWeek() {
    if (!lineupFull() || state.results.length >= WEEKS) return;
    const week = state.results.length + 1;
    const opp = OPPONENTS[week - 1];
    const mine = simLineup(lineupIds());
    const theirs = simLineup(cpuLineup());
    state.results.push({ week, opp, mine, theirs });
    view.shownWeek = week;
    save();
    render();
  }

  function newSeason() {
    if (state.results.length && !confirm("Start a new season? Your record resets but your lineup stays.")) return;
    state = freshState(state.teamName, state.lineup);
    view.shownWeek = null;
    save();
    render();
  }

  function posName(pos) {
    return { F: "forward", D: "defense", G: "goalie" }[pos];
  }

  function flash(text) {
    $("msg").textContent = text;
  }

  // ---------- Rendering ----------
  function el(tag, attrs, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === "class") node.className = v;
      else if (k === "onclick") node.addEventListener("click", v);
      else node.setAttribute(k, v);
    }
    for (const c of children) node.append(c);
    return node;
  }

  function renderPool() {
    const taken = new Set(lineupIds());
    const q = view.search.trim().toLowerCase();
    let list = PLAYERS.filter((p) =>
      (view.pos === "ALL" || p.pos === view.pos) &&
      (!q || p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q))
    );
    if (view.sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    else list.sort((a, b) => view.sort === "price-asc" ? a.price - b.price : b.price - a.price);

    const body = $("pool-body");
    body.replaceChildren(...list.map((p) => {
      const btn = taken.has(p.id)
        ? el("button", { class: "btn small secondary", type: "button", onclick: () => dropPlayer(p.id) }, "Drop")
        : el("button", { class: "btn small", type: "button", onclick: () => addPlayer(p.id) }, "Add");
      return el("tr", {},
        el("td", {}, el("span", { class: "pos-tag" }, p.pos)),
        el("td", {}, p.name),
        el("td", {}, p.team),
        el("td", { class: "num" }, money(p.price)),
        el("td", { class: "num" }, btn));
    }));
    if (!list.length) body.append(el("tr", {}, el("td", { colspan: "5", class: "note" }, "No players match that search.")));
  }

  function renderLineup() {
    const slots = $("slots");
    slots.replaceChildren();
    for (const pos of Object.keys(SLOTS)) {
      for (let i = 0; i < SLOTS[pos]; i++) {
        const id = state.lineup[pos][i];
        const row = el("div", { class: "slot" });
        if (id === undefined) {
          row.append(el("span", {}, el("span", { class: "pos-tag" }, pos), " ", el("span", { class: "empty" }, `Empty ${posName(pos)} slot`)));
        } else {
          const p = byId(id);
          row.append(
            el("span", {}, el("span", { class: "pos-tag" }, pos), ` ${p.name} (${p.team})`),
            el("span", {}, money(p.price), " ",
              el("button", { class: "btn small secondary", type: "button", onclick: () => dropPlayer(id) }, "Drop")));
        }
        slots.append(row);
      }
    }
    const used = capUsed(lineupIds());
    const capText = $("cap-text");
    capText.textContent = `${money(used)} of $${CAP}M (${money(CAP - used)} left)`;
    $("cap-bar").style.width = Math.min(100, (used / CAP) * 100) + "%";
  }

  function recordOf(results) {
    let w = 0, l = 0, t = 0;
    for (const r of results) {
      if (r.mine.total > r.theirs.total) w++;
      else if (r.mine.total < r.theirs.total) l++;
      else t++;
    }
    return { w, l, t };
  }

  function renderSeason() {
    const { w, l, t } = recordOf(state.results);
    const played = state.results.length;
    $("record").replaceChildren(
      el("span", {}, `Week ${Math.min(played + 1, WEEKS)} of ${WEEKS}`),
      el("span", {}, `${w}-${l}-${t}`));

    const btn = $("play-week");
    const next = $("next-up");
    if (played >= WEEKS) {
      btn.disabled = true;
      btn.textContent = "Season over";
      next.textContent = `Final record ${w}-${l}-${t}. Start a new season to try a different build.`;
    } else {
      btn.disabled = !lineupFull();
      btn.textContent = `Play week ${played + 1}`;
      next.textContent = lineupFull()
        ? `Next opponent: ${OPPONENTS[played]}.`
        : "Fill all six slots to play.";
    }
  }

  function boxTable(title, res) {
    const rows = res.rows.map((r) => {
      const p = byId(r.id), x = r.line;
      const stats = p.pos === "G"
        ? `${x.w} W, ${x.sv} SV, ${x.ga} GA${x.so ? `, ${x.so} SO` : ""}`
        : `${x.g} G, ${x.a} A, ${x.s} SOG, ${x.b} BLK`;
      return el("tr", {},
        el("td", {}, el("span", { class: "pos-tag" }, p.pos), " " + p.name),
        el("td", {}, stats),
        el("td", { class: "num" }, x.pts.toFixed(1)));
    });
    return el("table", {},
      el("thead", {}, el("tr", {}, el("th", {}, title), el("th", {}, "3 games"), el("th", { class: "num" }, "Pts"))),
      el("tbody", {}, ...rows),
      el("tfoot", {}, el("tr", {}, el("th", {}, "Total"), el("th", {}), el("th", { class: "num" }, res.total.toFixed(1)))));
  }

  function renderResults() {
    const panel = $("results-panel");
    if (!state.results.length) { panel.hidden = true; return; }
    panel.hidden = false;
    const r = state.results.find((x) => x.week === view.shownWeek) || state.results[state.results.length - 1];
    const mine = r.mine.total, theirs = r.theirs.total;
    const outcome = mine > theirs ? "Win" : mine < theirs ? "Loss" : "Tie";
    $("result-title").textContent = `Week ${r.week} vs ${r.opp}`;
    const score = $("result-score");
    score.textContent = `${outcome} ${mine.toFixed(1)} to ${theirs.toFixed(1)}`;
    score.className = outcome === "Win" ? "win" : outcome === "Loss" ? "loss" : "";
    $("my-box").replaceChildren(boxTable(state.teamName || "Your team", r.mine));
    $("opp-box").replaceChildren(boxTable(r.opp, r.theirs));

    $("log-body").replaceChildren(...state.results.map((x) => {
      const o = x.mine.total > x.theirs.total ? "W" : x.mine.total < x.theirs.total ? "L" : "T";
      return el("tr", {},
        el("td", {}, String(x.week)),
        el("td", {}, x.opp),
        el("td", { class: "num" }, `${x.mine.total.toFixed(1)} to ${x.theirs.total.toFixed(1)} (${o})`),
        el("td", { class: "num" }, el("button", {
          class: "btn small secondary", type: "button",
          onclick: () => { view.shownWeek = x.week; renderResults(); },
        }, "View")));
    }));
  }

  function render() {
    renderPool();
    renderLineup();
    renderSeason();
    renderResults();
  }

  // ---------- Wiring ----------
  document.querySelectorAll(".tabs button").forEach((b) => {
    b.addEventListener("click", () => {
      view.pos = b.dataset.pos;
      document.querySelectorAll(".tabs button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      renderPool();
    });
  });
  $("search").addEventListener("input", (e) => { view.search = e.target.value; renderPool(); });
  $("sort").addEventListener("change", (e) => { view.sort = e.target.value; renderPool(); });
  const nameInput = $("team-name");
  nameInput.value = state.teamName;
  nameInput.addEventListener("input", () => { state.teamName = nameInput.value; save(); renderResults(); });
  $("play-week").addEventListener("click", playWeek);
  $("new-season").addEventListener("click", newSeason);

  render();
})();
