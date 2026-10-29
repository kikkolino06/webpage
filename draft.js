(function () {
  const TEAMS = 4;
  const ROUNDS = 6;
  const GAMES_PER_WEEK = 3;
  const REG_WEEKS = 9;
  const NEEDS = { F: 3, D: 2, G: 1 };
  const STORE_KEY = "rinkdraft-v2";
  const CPU_NAMES = ["Lakeshore Loons", "Gravel Bay Grinders", "Pine Ridge Moose"];
  // Round robin for 4 teams; team 0 is always you.
  const ROUND_ROBIN = [[[0, 1], [2, 3]], [[0, 2], [1, 3]], [[0, 3], [1, 2]]];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const $ = (id) => document.getElementById(id);
  const byId = (id) => PLAYERS[id];

  // ---------- Projections ----------
  function projSkater(p) {
    const o = p.off / 99, d = p.def / 99, fwd = p.pos === "F";
    const g = (fwd ? 0.55 : 0.2) * o * o;
    const a = (fwd ? 0.8 : 0.65) * o * o;
    const s = fwd ? 1.2 + 2.4 * o : 1.0 + 1.6 * o;
    const b = fwd ? 0.2 + 0.4 * d : 0.8 + 1.2 * d;
    return GAMES_PER_WEEK * (3 * g + 2 * a + 0.5 * s + 0.5 * b);
  }

  function projGoalie(p) {
    const sv = p.sv / 99, team = (TEAM_STRENGTH[p.team] || 65) / 99;
    const shots = 30, ga = shots * (1 - (0.87 + 0.05 * sv));
    const win = Math.min(0.9, Math.max(0.1, 0.15 + 0.3 * sv + 0.3 * team - 0.08 * (ga - 2)));
    return GAMES_PER_WEEK * (4 * win + 0.2 * (shots - ga) - ga + 3 * Math.exp(-ga));
  }

  PLAYERS.forEach((p) => { p.proj = p.pos === "G" ? projGoalie(p) : projSkater(p); });

  // Value over replacement: compare each player to the last starter at his position.
  const REPLACEMENT = {};
  for (const pos of Object.keys(NEEDS)) {
    const sorted = PLAYERS.filter((p) => p.pos === pos).map((p) => p.proj).sort((a, b) => b - a);
    REPLACEMENT[pos] = sorted[Math.min(sorted.length - 1, TEAMS * NEEDS[pos])];
  }
  const vor = (p) => p.proj - REPLACEMENT[p.pos];

  // ---------- State ----------
  function freshState() {
    return { phase: "setup", name: "", order: [], picks: [], results: [] };
  }

  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(STORE_KEY));
      if (s && Array.isArray(s.picks) && Array.isArray(s.results)) return s;
    } catch (e) { /* storage blocked or corrupt */ }
    return freshState();
  }

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  let state = load();
  let view = { pos: "ALL", search: "", week: null };
  let cpuTimer = null;

  const teamName = (t) => t === 0 ? (state.name || "Your team") : CPU_NAMES[t - 1];

  function ownerOf(pickNo) {
    const round = Math.floor(pickNo / TEAMS);
    const i = pickNo % TEAMS;
    return state.order[round % 2 === 0 ? i : TEAMS - 1 - i];
  }

  const rosterOf = (t) => state.picks.filter((_, n) => ownerOf(n) === t);
  const taken = () => new Set(state.picks);

  function needsOf(t) {
    const need = { ...NEEDS };
    for (const id of rosterOf(t)) need[byId(id).pos]--;
    return need;
  }

  const draftDone = () => state.picks.length >= TEAMS * ROUNDS;
  const onClock = () => draftDone() ? null : ownerOf(state.picks.length);

  // ---------- Draft ----------
  function bestFor(t, randomize) {
    const need = needsOf(t), gone = taken();
    const pool = PLAYERS.filter((p) => !gone.has(p.id) && need[p.pos] > 0).sort((a, b) => vor(b) - vor(a));
    if (!randomize) return pool[0];
    const weights = [0.55, 0.25, 0.12, 0.08];
    let r = Math.random();
    for (let i = 0; i < Math.min(weights.length, pool.length); i++) {
      if ((r -= weights[i]) <= 0) return pool[i];
    }
    return pool[0];
  }

  function makePick(id) {
    state.picks.push(id);
    if (draftDone()) {
      state.phase = "season";
      flash(`Draft complete. Your season is ready below.`);
    }
    save();
    render();
  }

  function runCpu() {
    clearTimeout(cpuTimer);
    if (state.phase !== "draft") return;
    const t = onClock();
    if (t === null || t === 0) return;
    cpuTimer = setTimeout(() => {
      makePick(bestFor(t, true).id);
      runCpu();
    }, reducedMotion ? 0 : 450);
  }

  function userPick(id) {
    if (state.phase !== "draft" || onClock() !== 0) return;
    const p = byId(id);
    if (taken().has(id)) return;
    if (needsOf(0)[p.pos] <= 0) return flash(`You already have all your ${posWord(p.pos)}.`);
    flash("");
    makePick(id);
    runCpu();
  }

  function startDraft(e) {
    e.preventDefault();
    const name = $("team-name").value.trim();
    if (!name) return flash("Give your team a name first.");
    state = freshState();
    state.name = name;
    state.phase = "draft";
    state.order = shuffled([0, 1, 2, 3]);
    flash(`You pick ${ordinal(state.order.indexOf(0) + 1)} in round 1.`);
    save();
    render();
    runCpu();
  }

  // Two clicks to reset, so a stray tap doesn't wipe a league.
  let resetArmed = null;
  function resetLeague() {
    const btn = $("reset");
    if (state.phase !== "setup" && !resetArmed) {
      btn.textContent = "Click again to confirm";
      resetArmed = setTimeout(() => { resetArmed = null; btn.textContent = "New draft"; }, 4000);
      return;
    }
    clearTimeout(resetArmed);
    clearTimeout(cpuTimer);
    resetArmed = null;
    btn.textContent = "New draft";
    const name = state.name;
    state = freshState();
    state.name = name;
    save();
    flash("Name your team and start a new draft.");
    render();
    $("team-name").focus();
  }

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
    const o = p.off / 99, d = p.def / 99, fwd = p.pos === "F";
    const x = { g: 0, a: 0, s: 0, b: 0 };
    for (let i = 0; i < GAMES_PER_WEEK; i++) {
      x.g += poisson((fwd ? 0.55 : 0.2) * o * o);
      x.a += poisson((fwd ? 0.8 : 0.65) * o * o);
      x.s += poisson(fwd ? 1.2 + 2.4 * o : 1.0 + 1.6 * o);
      x.b += poisson(fwd ? 0.2 + 0.4 * d : 0.8 + 1.2 * d);
    }
    // A goal is always a shot on goal.
    x.s = Math.max(x.s, x.g);
    x.pts = 3 * x.g + 2 * x.a + 0.5 * x.s + 0.5 * x.b;
    return x;
  }

  function simGoalie(p) {
    const sv = p.sv / 99, team = (TEAM_STRENGTH[p.team] || 65) / 99;
    const x = { w: 0, sv: 0, ga: 0, so: 0 };
    for (let i = 0; i < GAMES_PER_WEEK; i++) {
      const shots = 24 + Math.floor(Math.random() * 13);
      const saves = binomial(shots, 0.87 + 0.05 * sv);
      const ga = shots - saves;
      x.sv += saves;
      x.ga += ga;
      if (ga === 0) { x.so++; x.w++; }
      else if (Math.random() < 0.15 + 0.3 * sv + 0.3 * team - 0.08 * (ga - 2)) x.w++;
    }
    x.pts = 4 * x.w + 0.2 * x.sv - x.ga + 3 * x.so;
    return x;
  }

  function simTeam(t) {
    const rows = rosterOf(t).map((id) => ({ id, x: byId(id).pos === "G" ? simGoalie(byId(id)) : simSkater(byId(id)) }));
    const total = Math.round(rows.reduce((s, r) => s + r.x.pts, 0) * 10) / 10;
    return { rows, total };
  }

  function standings() {
    const rec = [0, 1, 2, 3].map((t) => ({ t, w: 0, l: 0, tie: 0, pf: 0 }));
    for (const wk of state.results) {
      if (wk.final) continue;
      for (const g of wk.games) {
        const [a, b] = g.teams, sa = g.box[0].total, sb = g.box[1].total;
        rec[a].pf += sa; rec[b].pf += sb;
        if (sa > sb) { rec[a].w++; rec[b].l++; }
        else if (sb > sa) { rec[b].w++; rec[a].l++; }
        else { rec[a].tie++; rec[b].tie++; }
      }
    }
    return rec.sort((x, y) => (y.w + y.tie / 2) - (x.w + x.tie / 2) || y.pf - x.pf);
  }

  function playWeek() {
    if (state.phase !== "season") return;
    const wk = state.results.length + 1;
    let pairs, final = false;
    if (wk <= REG_WEEKS) {
      pairs = ROUND_ROBIN[(wk - 1) % 3];
    } else {
      const top = standings();
      pairs = [[top[0].t, top[1].t]];
      final = true;
    }
    const games = pairs.map((teams) => {
      let box = teams.map(simTeam);
      // A final can't end level; replay a tied week as overtime.
      while (final && box[0].total === box[1].total) box = teams.map(simTeam);
      return { teams, box };
    });
    state.results.push({ week: wk, final, games });
    if (final) state.phase = "done";
    view.week = wk;
    save();
    render();
  }

  // ---------- Helpers ----------
  function shuffled(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  const ordinal = (n) => n + (["th", "st", "nd", "rd"][n] || "th");
  const posWord = (pos) => ({ F: "forwards", D: "defensemen", G: "goalie" })[pos];
  const flash = (t) => { $("draft-msg").textContent = t; };

  function el(tag, attrs, ...kids) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === "class") n.className = v;
      else if (k === "onclick") n.addEventListener("click", v);
      else if (v !== false && v != null) n.setAttribute(k, v === true ? "" : v);
    }
    for (const c of kids) if (c != null) n.append(c);
    return n;
  }
  const posTag = (pos) => el("span", { class: `pos ${pos}` }, pos);

  // ---------- Rendering ----------
  function renderScoreboard() {
    const n = state.picks.length;
    const slot = state.order.indexOf(0);
    $("sb-slot").textContent = slot >= 0 ? `#${slot + 1}` : "-";
    const clock = $("sb-clock");
    clock.classList.remove("you");
    if (state.phase === "setup") {
      $("sb-round").textContent = "-";
      $("sb-pick").textContent = "-";
      clock.textContent = "Waiting to start";
    } else if (!draftDone()) {
      $("sb-round").textContent = `${Math.floor(n / TEAMS) + 1}/${ROUNDS}`;
      $("sb-pick").textContent = String(n + 1).padStart(2, "0");
      const t = onClock();
      clock.textContent = t === 0 ? "You" : CPU_NAMES[t - 1];
      if (t === 0) clock.classList.add("you");
    } else {
      $("sb-round").textContent = "END";
      $("sb-pick").textContent = String(TEAMS * ROUNDS);
      clock.textContent = "Draft complete";
    }
    $("setup").hidden = state.phase !== "setup";
    $("autopick").disabled = !(state.phase === "draft" && onClock() === 0);
  }

  function renderPool() {
    const gone = taken();
    const myTurn = state.phase === "draft" && onClock() === 0;
    const need = needsOf(0);
    const q = view.search.trim().toLowerCase();
    const list = PLAYERS
      .filter((p) => (view.pos === "ALL" || p.pos === view.pos) &&
        (!q || p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q)))
      .sort((a, b) => (gone.has(a.id) - gone.has(b.id)) || b.proj - a.proj);
    const rows = list.map((p) => {
      const isTaken = gone.has(p.id);
      let action;
      if (isTaken) action = el("span", { class: "note" }, "Taken");
      else action = el("button", {
        class: "btn small", type: "button",
        disabled: !myTurn || need[p.pos] <= 0,
        title: need[p.pos] <= 0 ? "You've filled this position" : null,
        onclick: () => userPick(p.id),
      }, "Draft");
      return el("tr", { class: isTaken ? "taken" : null },
        el("td", {}, posTag(p.pos)),
        el("td", {}, p.name),
        el("td", {}, p.team),
        el("td", { class: "num" }, p.proj.toFixed(1)),
        el("td", { class: "num" }, action));
    });
    if (!rows.length) rows.push(el("tr", {}, el("td", { colspan: "5", class: "note" }, "No players match that search.")));
    $("pool-body").replaceChildren(...rows);
  }

  function renderCard() {
    $("card-title").textContent = state.name || "Your lineup card";
    const mine = rosterOf(0).map(byId);
    const lines = [];
    const labels = { F: ["Forward", "Forward", "Forward"], D: ["Defense", "Defense"], G: ["Goalie"] };
    for (const pos of Object.keys(NEEDS)) {
      const atPos = mine.filter((p) => p.pos === pos);
      labels[pos].forEach((lab, i) => {
        const p = atPos[i];
        lines.push(el("div", { class: "card-line" },
          el("span", { class: "lab" }, lab),
          p ? el("span", { class: "who" }, p.name, " ", el("span", { class: "team" }, p.team))
            : el("span", { class: "who empty" }, "Open")));
      });
    }
    $("card-lines").replaceChildren(...lines);
    const total = mine.reduce((s, p) => s + p.proj, 0);
    $("card-sub").textContent = mine.length
      ? `${mine.length} of 6 drafted, ${total.toFixed(1)} proj per week`
      : "3 F, 2 D, 1 G";
  }

  function renderBoard() {
    const order = state.order.length ? state.order : [0, 1, 2, 3];
    $("board-head").replaceChildren(el("tr", {},
      el("th", { class: "rnd" }, "Rd"),
      ...order.map((t) => el("th", { class: t === 0 ? "mine" : null }, state.order.length ? teamName(t) : `Slot ${order.indexOf(t) + 1}`))));
    const body = [];
    const now = state.phase === "draft" ? state.picks.length : -1;
    for (let r = 0; r < ROUNDS; r++) {
      const cells = order.map((t, col) => {
        const i = r % 2 === 0 ? col : TEAMS - 1 - col;
        const n = r * TEAMS + i;
        const id = state.picks[n];
        const p = id === undefined ? null : byId(id);
        const cls = [state.order.length && t === 0 ? "mine" : "", n === now ? "now" : ""].join(" ").trim();
        return el("td", { class: cls || null },
          p ? el("span", {}, posTag(p.pos), " ", p.name) : el("small", {}, `Pick ${n + 1}`),
          p ? el("small", {}, `Pick ${n + 1}, ${p.team}`) : null);
      });
      body.push(el("tr", {}, el("td", { class: "rnd" }, String(r + 1)), ...cells));
    }
    $("board-body").replaceChildren(...body);
  }

  function boxTable(name, box) {
    const rows = box.rows.map((r) => {
      const p = byId(r.id), x = r.x;
      const line = p.pos === "G"
        ? `${x.w} W, ${x.sv} SV, ${x.ga} GA${x.so ? `, ${x.so} SO` : ""}`
        : `${x.g} G, ${x.a} A, ${x.s} SOG, ${x.b} BLK`;
      return el("tr", {}, el("td", {}, posTag(p.pos), " ", p.name), el("td", {}, line), el("td", { class: "num" }, x.pts.toFixed(1)));
    });
    return el("div", { class: "box scroll" }, el("table", {},
      el("thead", {}, el("tr", {}, el("th", {}, name), el("th", {}, "3 games"), el("th", { class: "num" }, "Pts"))),
      el("tbody", {}, ...rows),
      el("tfoot", {}, el("tr", {}, el("th", {}, "Total"), el("th", {}), el("th", { class: "num" }, box.total.toFixed(1))))));
  }

  function myGame(wk) {
    return wk.games.find((g) => g.teams.includes(0));
  }

  function renderSeason() {
    const active = state.phase === "season" || state.phase === "done";
    $("season-empty").hidden = active;
    $("season-grid").hidden = !active;
    if (!active) return;

    const table = standings();
    $("standings-body").replaceChildren(...table.map((r, i) => el("tr", { class: r.t === 0 ? "me" : null },
      el("td", {}, String(i + 1)), el("td", {}, teamName(r.t)),
      el("td", { class: "num" }, String(r.w)), el("td", { class: "num" }, String(r.l)),
      el("td", { class: "num" }, String(r.tie)), el("td", { class: "num" }, r.pf.toFixed(1)))));

    const log = state.results.map((wk) => {
      const g = myGame(wk);
      const label = wk.final ? "Final" : String(wk.week);
      if (!g) return el("tr", { class: "log-row", onclick: () => { view.week = wk.week; renderSeason(); } },
        el("td", {}, label), el("td", { class: "note" }, "Not in the final"), el("td", {}));
      const me = g.teams.indexOf(0), opp = g.teams[1 - me];
      const a = g.box[me].total, b = g.box[1 - me].total;
      const res = a > b ? "W" : a < b ? "L" : "T";
      return el("tr", { class: "log-row", onclick: () => { view.week = wk.week; renderSeason(); } },
        el("td", {}, label), el("td", {}, teamName(opp)),
        el("td", { class: "num" }, `${a.toFixed(1)}-${b.toFixed(1)} ${res}`));
    });
    $("log-body").replaceChildren(...(log.length ? log : [el("tr", {}, el("td", { colspan: "3", class: "note" }, "No games played yet."))]));

    const played = state.results.length;
    const btn = $("play-week");
    if (state.phase === "done") {
      btn.disabled = true;
      btn.textContent = "Season over";
    } else {
      btn.disabled = false;
      btn.textContent = played + 1 > REG_WEEKS ? "Play the final" : `Play week ${played + 1}`;
    }

    const shown = state.results.find((w) => w.week === view.week) || state.results[played - 1];
    const detail = $("week-detail");
    const matchups = $("matchups");
    if (!shown) {
      $("week-title").textContent = "Week 1";
      const pairs = ROUND_ROBIN[0];
      matchups.replaceChildren(...pairs.map(([a, b]) => el("div", { class: "matchup" },
        el("span", {}, teamName(a)), el("span", { class: "score" }, "vs"), el("span", { class: "t2" }, teamName(b)))));
      detail.replaceChildren(el("p", { class: "note" }, "Press Play week 1 to simulate the first three games for every team."));
      return;
    }

    $("week-title").textContent = shown.final ? "Week 10: the final" : `Week ${shown.week}`;
    matchups.replaceChildren(...shown.games.map((g) => {
      const [a, b] = g.teams, sa = g.box[0].total, sb = g.box[1].total;
      return el("div", { class: "matchup" },
        el("span", { class: sa > sb ? "won" : null }, teamName(a)),
        el("span", { class: "score" }, `${sa.toFixed(1)} - ${sb.toFixed(1)}`),
        el("span", { class: "t2" + (sb > sa ? " won" : "") }, teamName(b)));
    }));

    const parts = [];
    const g = myGame(shown);
    if (state.phase === "done" && shown.final) {
      const champ = shown.games[0].box[0].total > shown.games[0].box[1].total ? shown.games[0].teams[0] : shown.games[0].teams[1];
      parts.push(el("p", { class: "result " + (champ === 0 ? "win" : "loss") },
        champ === 0 ? "You won the league" : `${teamName(champ)} won the league`));
      parts.push(el("p", { class: "note" }, "Start a new draft from the lineup card to play again."));
    }
    if (g) {
      const me = g.teams.indexOf(0), opp = g.teams[1 - me];
      const a = g.box[me].total, b = g.box[1 - me].total;
      if (!shown.final) parts.push(el("p", { class: "result " + (a > b ? "win" : a < b ? "loss" : "") }, a > b ? "Win" : a < b ? "Loss" : "Tie"));
      parts.push(boxTable(teamName(0), g.box[me]), boxTable(teamName(opp), g.box[1 - me]));
    } else {
      parts.push(el("p", { class: "note" }, "You missed the final. Here's how the top two did."));
      shown.games[0].teams.forEach((t, i) => parts.push(boxTable(teamName(t), shown.games[0].box[i])));
    }
    detail.replaceChildren(...parts);
  }

  function render() {
    renderScoreboard();
    renderPool();
    renderCard();
    renderBoard();
    renderSeason();
  }

  // ---------- Wiring ----------
  document.querySelectorAll(".tabs button").forEach((b) => b.addEventListener("click", () => {
    view.pos = b.dataset.pos;
    document.querySelectorAll(".tabs button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    renderPool();
  }));
  $("search").addEventListener("input", (e) => { view.search = e.target.value; renderPool(); });
  $("setup").addEventListener("submit", startDraft);
  $("autopick").addEventListener("click", () => { const p = bestFor(0, false); if (p) userPick(p.id); });
  $("reset").addEventListener("click", resetLeague);
  $("play-week").addEventListener("click", playWeek);
  $("team-name").value = state.name;

  render();
  runCpu();
})();
