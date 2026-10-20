/* Illustrated scenes, drawn as SVG so the page has no image dependencies.
   Each function returns an SVG string sized 1600x900 (slice-fit to its box). */
(function () {
  "use strict";

  function rng(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function svg(body, defs, viewBox) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + (viewBox || "0 0 1600 900") +
      '" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>' + (defs || "") + "</defs>" + body + "</svg>";
  }

  // Bare winter tree, recursive branches.
  function tree(x, y, len, angle, depth, r, out) {
    if (depth === 0 || len < 4) return;
    const x2 = x + Math.cos(angle) * len;
    const y2 = y + Math.sin(angle) * len;
    out.push('<path d="M' + x.toFixed(1) + " " + y.toFixed(1) + "L" + x2.toFixed(1) + " " + y2.toFixed(1) +
      '" stroke-width="' + Math.max(0.6, depth * depth * 0.32).toFixed(2) + '"/>');
    const n = depth > 5 ? 2 : 2 + (r() > 0.6 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      const spread = 0.35 + r() * 0.45;
      const a = angle + (i - (n - 1) / 2) * spread + (r() - 0.5) * 0.3;
      tree(x2, y2, len * (0.68 + r() * 0.14), a, depth - 1, r, out);
    }
  }

  /* ---------------- house in snow ---------------- */
  function house() {
    const r = rng(7);
    const trees = [];
    tree(150, 700, 150, -Math.PI / 2 - 0.05, 8, r, trees);
    tree(1460, 720, 170, -Math.PI / 2 + 0.08, 8, r, trees);
    tree(1290, 650, 90, -Math.PI / 2, 7, r, trees);
    tree(-20, 640, 120, -Math.PI / 2 + 0.15, 7, r, trees);
    const far = [];
    for (let i = 0; i < 28; i++) {
      const x = i * 60 + r() * 30;
      tree(x, 610, 30 + r() * 30, -Math.PI / 2, 5, r, far);
    }
    let windows = "";
    const upX = [520, 620, 720, 870, 970, 1070];
    upX.forEach(function (x) { windows += win(x, 385, 56, 84); });
    [520, 620, 970, 1070].forEach(function (x) { windows += win(x, 515, 56, 104); });
    windows += win(300, 500, 50, 92) + win(370, 500, 50, 92);
    function win(x, y, w, h) {
      return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="#363c43" stroke="#fbfbfa" stroke-width="5"/>' +
        '<path d="M' + (x + w / 2) + " " + y + "v" + h + "M" + x + " " + (y + h / 2) + "h" + w + '" stroke="#fbfbfa" stroke-width="2.5"/>' +
        '<rect x="' + (x - 4) + '" y="' + (y + h) + '" width="' + (w + 8) + '" height="5" fill="#fff"/>';
    }
    let shrubs = "";
    for (let i = 0; i < 18; i++) {
      const x = 250 + i * 55 + r() * 20;
      if (x > 780 && x < 880) continue;
      shrubs += '<ellipse cx="' + x + '" cy="' + (655 + r() * 6) + '" rx="' + (24 + r() * 10) + '" ry="' + (16 + r() * 6) +
        '" fill="#2e3631"/><ellipse cx="' + x + '" cy="' + (645 + r() * 4) + '" rx="' + (18 + r() * 6) + '" ry="6" fill="#eef1f3" opacity=".85"/>';
    }
    const defs =
      '<linearGradient id="hSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b7bec6"/><stop offset="1" stop-color="#e3e7ea"/></linearGradient>' +
      '<linearGradient id="hGround" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9edf0"/><stop offset="1" stop-color="#c9d1d8"/></linearGradient>' +
      '<linearGradient id="hWall" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#eceeed"/><stop offset="1" stop-color="#dcdfe0"/></linearGradient>';
    return svg(
      '<rect width="1600" height="900" fill="url(#hSky)"/>' +
      '<g stroke="#7e858b" fill="none" stroke-linecap="round" opacity=".55">' + far.join("") + "</g>" +
      '<path d="M0 610 Q400 590 800 600 T1600 590 V900 H0Z" fill="url(#hGround)"/>' +
      // side wing
      '<rect x="250" y="440" width="200" height="220" fill="url(#hWall)"/>' +
      '<polygon points="232,445 320,372 470,372 470,445" fill="#7d848b"/>' +
      '<polygon points="232,445 320,372 330,372 246,445" fill="#f4f6f7"/>' +
      // main house
      '<rect x="450" y="340" width="720" height="320" fill="url(#hWall)"/>' +
      '<polygon points="420,345 545,190 1075,190 1200,345" fill="#868d94"/>' +
      '<polygon points="420,345 545,190 560,190 440,345" fill="#f4f6f7"/>' +
      '<polygon points="545,190 1075,190 1072,198 548,198" fill="#f7f8f9"/>' +
      '<rect x="1010" y="150" width="44" height="60" fill="#8a7d74"/><rect x="1004" y="146" width="56" height="10" fill="#f2f4f5"/>' +
      '<g stroke="#d3d6d8" stroke-width="1.2">' + [380, 420, 460, 500, 540, 580, 620].map(function (y) { return '<path d="M450 ' + y + 'H1170"/>'; }).join("") + "</g>" +
      windows +
      // door + portico
      '<rect x="790" y="530" width="72" height="130" fill="#1c1f22"/><rect x="782" y="522" width="88" height="8" fill="#fff"/>' +
      '<polygon points="770,522 826,486 882,522" fill="#f6f7f7" stroke="#d0d3d5"/>' +
      '<rect x="768" y="522" width="8" height="138" fill="#fafafa"/><rect x="876" y="522" width="8" height="138" fill="#fafafa"/>' +
      '<circle cx="752" cy="560" r="7" fill="#2a2a2a"/><circle cx="900" cy="560" r="7" fill="#2a2a2a"/>' +
      shrubs +
      '<path d="M800 662 L860 662 L960 900 L700 900Z" fill="#d7dde2"/>' +
      '<g stroke="#3a3532" fill="none" stroke-linecap="round">' + trees.join("") + "</g>" +
      '<rect width="1600" height="900" fill="#cfd9e2" opacity=".12"/>',
      defs
    );
  }

  /* ---------------- living room ---------------- */
  function room(id) {
    const r = rng(11);
    const vpX = 800, vpY = 560;
    let planks = "";
    for (let x = -2400; x <= 4000; x += 130) {
      const top = vpX + (x - vpX) * 0.22;
      planks += '<path d="M' + top.toFixed(0) + " 640L" + x + ' 900"/>';
    }
    let seams = "";
    for (let i = 0; i < 40; i++) {
      const y = 650 + Math.pow(r(), 1.4) * 250;
      const x = r() * 1600;
      seams += '<path d="M' + x.toFixed(0) + " " + y.toFixed(0) + "h" + (30 + (y - 640) * 0.4).toFixed(0) + '"/>';
    }
    let stones = "";
    for (let y = 130; y < 640; y += 34) {
      const off = (y / 34) % 2 ? 0 : 30;
      for (let x = 1180 - off; x < 1480; x += 62) {
        const c = 110 + Math.floor(r() * 40);
        stones += '<rect x="' + Math.max(1180, x) + '" y="' + y + '" width="' + (Math.min(1480, x + 58) - Math.max(1180, x)) +
          '" height="30" rx="4" fill="rgb(' + c + "," + (c - 6) + "," + (c - 12) + ')"/>';
      }
    }
    let knit = "";
    for (let x = 1015; x < 1225; x += 11) {
      knit += '<path d="M' + x + " 398 Q" + (x + 4) + " 500 " + (x + 8 + (x - 1015) * 0.05) + ' 605"/>';
    }
    let mull = "";
    [40, 245, 450, 655, 860].forEach(function (x) { mull += '<rect x="' + (x - 8) + '" y="160" width="16" height="460" fill="#f6f4f1"/>'; });
    [142, 347, 552, 757].forEach(function (x) { mull += '<rect x="' + (x - 3) + '" y="160" width="6" height="460" fill="#f6f4f1"/>'; });
    [160, 313, 466, 612].forEach(function (y) { mull += '<rect x="32" y="' + (y - 4) + '" width="836" height="8" fill="#f6f4f1"/>'; });
    const defs =
      '<linearGradient id="' + id + 'wall" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#dfdad3"/><stop offset="1" stop-color="#cbc4ba"/></linearGradient>' +
      '<linearGradient id="' + id + 'floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8e6b4b"/><stop offset="1" stop-color="#5e4330"/></linearGradient>' +
      '<linearGradient id="' + id + 'out" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1f4f6"/><stop offset="1" stop-color="#e0e6ea"/></linearGradient>' +
      '<linearGradient id="' + id + 'sofa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#85878b"/><stop offset="1" stop-color="#5b5d61"/></linearGradient>' +
      '<filter id="' + id + 'frost"><feTurbulence type="fractalNoise" baseFrequency=".012 .03" numOctaves="3" seed="4"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.4 -.45"/></filter>';
    return svg(
      '<rect width="1600" height="900" fill="#e7e2db"/>' +
      '<polygon points="0,0 1600,0 1600,105 0,150" fill="#efebe6"/>' +
      '<polygon points="0,40 1600,10 1600,36 0,72" fill="#5e4733"/>' +
      '<polygon points="0,112 1600,72 1600,92 0,136" fill="#5e4733"/>' +
      '<polygon points="0,150 1600,105 1600,640 0,640" fill="url(#' + id + 'wall)"/>' +
      // windows with snowy view
      '<rect x="32" y="160" width="836" height="460" fill="url(#' + id + 'out)"/>' +
      '<path d="M32 470 Q120 440 200 460 T380 450 T560 462 T740 448 T868 458 V620 H32Z" fill="#9aa2a8" opacity=".55"/>' +
      '<path d="M32 520 H868 V620 H32Z" fill="#f4f6f7"/>' +
      '<rect class="frost" x="32" y="160" width="836" height="460" filter="url(#' + id + 'frost)" style="opacity:var(--frost, .6)"/>' +
      mull +
      '<rect x="20" y="612" width="860" height="14" fill="#faf9f7"/>' +
      // small window right
      '<rect x="1500" y="230" width="80" height="140" fill="url(#' + id + 'out)" stroke="#f6f4f1" stroke-width="8"/>' +
      // fireplace wall
      '<rect x="1180" y="130" width="300" height="510" fill="#8b847d"/>' + stones +
      '<rect x="1165" y="335" width="330" height="22" fill="#5a4330"/>' +
      '<rect x="1225" y="205" width="210" height="112" fill="#ece8e0" stroke="#2a2a2a" stroke-width="5"/>' +
      '<path d="M1240 300 L1300 250 L1340 285 L1370 262 L1420 300Z" fill="#9aa4ab"/>' +
      '<rect x="1185" y="295" width="22" height="40" fill="#f2efe9"/><path d="M1196 296 q-12 -40 -2 -70 q10 30 2 70" fill="#6f7c64"/>' +
      '<rect x="0" y="628" width="1600" height="14" fill="#efebe5"/>' +
      // floor
      '<rect x="0" y="640" width="1600" height="260" fill="url(#' + id + 'floor)"/>' +
      '<g stroke="#3f2d20" stroke-width="2" opacity=".45">' + planks + "</g>" +
      '<g stroke="#3f2d20" stroke-width="1.5" opacity=".35">' + seams + "</g>" +
      // light on floor from windows
      '<polygon points="80,640 860,640 1040,900 -160,900" fill="#fff8ec" opacity=".12"/>' +
      // floor register
      '<polygon points="300,684 520,684 548,712 280,712" fill="#2b2a29"/>' +
      '<g stroke="#8d8f90" stroke-width="2">' + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(function (i) {
        const t = i / 12; return '<path d="M' + (306 + t * 6) + " " + (688 + t * 20) + "H" + (516 + t * 26) + '"/>'; }).join("") + "</g>" +
      // sofa (seen from behind)
      '<ellipse cx="1000" cy="712" rx="420" ry="26" fill="#2c2018" opacity=".45"/>' +
      '<rect x="630" y="440" width="700" height="260" rx="34" fill="url(#' + id + 'sofa)"/>' +
      '<rect x="645" y="412" width="330" height="70" rx="26" fill="#7a7c80"/>' +
      '<rect x="985" y="412" width="330" height="70" rx="26" fill="#74767a"/>' +
      '<rect x="1300" y="460" width="96" height="236" rx="34" fill="#66686c"/>' +
      '<rect x="600" y="470" width="60" height="226" rx="26" fill="#6d6f73"/>' +
      '<rect x="660" y="690" width="16" height="22" fill="#2a2420"/><rect x="1360" y="690" width="16" height="22" fill="#2a2420"/>' +
      // knit throw
      '<path d="M1005 398 Q1110 375 1225 392 L1240 610 Q1150 628 1050 614 Z" fill="#e8dfcf"/>' +
      '<g stroke="#c9bca6" stroke-width="4" fill="none" stroke-linecap="round">' + knit + "</g>" +
      '<path d="M1050 614 Q1150 628 1240 610" stroke="#d8cbb4" stroke-width="10" fill="none" stroke-dasharray="2 9" stroke-linecap="round"/>' +
      // side lamp
      '<rect x="1468" y="520" width="8" height="170" fill="#3a2e25"/><path d="M1432 520 L1512 520 L1496 456 L1448 456Z" fill="#efe6d6" class="lamp"/>',
      defs
    );
  }

  /* ---------------- floor register close-up ---------------- */
  function vent() {
    let planks = "";
    for (let x = -4000; x <= 5600; x += 160) {
      planks += '<path d="M' + (800 + (x - 800) * 0.05).toFixed(0) + " 300L" + x + ' 900"/>';
    }
    let slats = "";
    for (let i = 0; i <= 18; i++) {
      const t = i / 18;
      const y = 520 + Math.pow(t, 1.25) * 190;
      const xl = 540 - t * 130, xr = 1060 + t * 130;
      slats += '<path d="M' + (xl + 14) + " " + y.toFixed(1) + "H" + (xr - 14) + '"/>';
    }
    const defs =
      '<linearGradient id="vFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a88a6a"/><stop offset="1" stop-color="#6a4d36"/></linearGradient>' +
      '<radialGradient id="vDark" cx=".5" cy=".55" r=".6"><stop offset="0" stop-color="#050506"/><stop offset="1" stop-color="#1d1e20"/></radialGradient>' +
      '<linearGradient id="vWin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f6f8"/><stop offset="1" stop-color="#dfe5ea"/></linearGradient>';
    return svg(
      '<rect width="1600" height="300" fill="#dcd8d2"/>' +
      '<rect x="0" y="0" width="1600" height="230" fill="url(#vWin)"/>' +
      '<g fill="#f7f5f2">' + [0, 400, 800, 1200, 1600].map(function (x) { return '<rect x="' + (x - 14) + '" y="0" width="28" height="240"/>'; }).join("") + "</g>" +
      '<rect x="0" y="226" width="1600" height="22" fill="#f6f4f1"/>' +
      '<rect x="0" y="248" width="1600" height="40" fill="#d9d5ce"/><rect x="0" y="282" width="1600" height="20" fill="#f1eee9"/>' +
      '<rect x="0" y="300" width="1600" height="600" fill="url(#vFloor)"/>' +
      '<g stroke="#3e2c1e" stroke-width="3" opacity=".4">' + planks + "</g>" +
      '<polygon points="0,300 1600,300 1600,520 0,520" fill="#fff6e6" opacity=".14"/>' +
      '<polygon points="520,505 1080,505 1200,725 400,725" fill="#9ea2a6"/>' +
      '<polygon points="540,518 1060,518 1176,712 424,712" fill="url(#vDark)"/>' +
      '<g stroke="#b6babd" stroke-width="7" stroke-linecap="round">' + slats + "</g>" +
      '<polygon points="400,725 1200,725 1206,738 394,738" fill="#6d7175"/>',
      defs
    );
  }

  /* ---------------- duct tunnel (rings animate in main.js) ---------------- */
  function duct() {
    const rings = [];
    for (let i = 0; i < 12; i++) {
      rings.push('<g class="duct-ring"><rect x="0" y="0" width="1600" height="900" fill="none" stroke="#c9b48f" stroke-width="10"/>' +
        '<rect x="12" y="12" width="1576" height="876" fill="none" stroke="#3b3125" stroke-width="5"/>' +
        '<g fill="#e4d2ae">' + [[30, 30], [1570, 30], [30, 870], [1570, 870], [800, 30], [800, 870]].map(function (p) {
          return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="7"/>'; }).join("") + "</g></g>");
    }
    const r = rng(3);
    let leaks = "";
    for (let i = 0; i < 30; i++) {
      const side = i % 4;
      const t = r();
      let x, y, dx, dy;
      if (side === 0) { x = 300 + t * 1000; y = 150 + r() * 60; dx = (r() - .5) * 60; dy = -120; }
      else if (side === 1) { x = 300 + t * 1000; y = 700 + r() * 60; dx = (r() - .5) * 60; dy = 120; }
      else if (side === 2) { x = 200 + r() * 80; y = 250 + t * 400; dx = -140; dy = (r() - .5) * 60; }
      else { x = 1320 + r() * 80; y = 250 + t * 400; dx = 140; dy = (r() - .5) * 60; }
      leaks += '<circle class="leak" cx="' + x.toFixed(0) + '" cy="' + y.toFixed(0) + '" r="' + (1.5 + r() * 2.5).toFixed(1) +
        '" style="--dx:' + dx.toFixed(0) + "px;--dy:" + dy.toFixed(0) + "px;animation-delay:-" + (r() * 2.4).toFixed(2) + 's"/>';
    }
    const defs =
      '<linearGradient id="dTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b5a43"/><stop offset="1" stop-color="#2b241c"/></linearGradient>' +
      '<linearGradient id="dBot" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#8a7656"/><stop offset="1" stop-color="#3a3024"/></linearGradient>' +
      '<linearGradient id="dL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7a6a52"/><stop offset="1" stop-color="#2a241d"/></linearGradient>' +
      '<linearGradient id="dR" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#6f604a"/><stop offset="1" stop-color="#262019"/></linearGradient>' +
      '<radialGradient id="dEnd" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffcf8a"/><stop offset=".5" stop-color="#b9783a"/><stop offset="1" stop-color="#3a2a1a"/></radialGradient>' +
      '<filter id="dGrain"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="2"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 .9  0 0 0 0 .8  0 0 0 .25 0"/></filter>';
    const ix = 800 - 80, iy = 450 - 45;
    return svg(
      '<rect width="1600" height="900" fill="#1a1510"/>' +
      '<polygon points="0,0 1600,0 ' + (ix + 160) + "," + iy + " " + ix + "," + iy + '" fill="url(#dTop)"/>' +
      '<polygon points="0,900 1600,900 ' + (ix + 160) + "," + (iy + 90) + " " + ix + "," + (iy + 90) + '" fill="url(#dBot)"/>' +
      '<polygon points="0,0 0,900 ' + ix + "," + (iy + 90) + " " + ix + "," + iy + '" fill="url(#dL)"/>' +
      '<polygon points="1600,0 1600,900 ' + (ix + 160) + "," + (iy + 90) + " " + (ix + 160) + "," + iy + '" fill="url(#dR)"/>' +
      '<path d="M0 0 L' + ix + " " + iy + "M1600 0 L" + (ix + 160) + " " + iy + "M0 900 L" + ix + " " + (iy + 90) + "M1600 900 L" + (ix + 160) + " " + (iy + 90) + '" stroke="#d8c39c" stroke-width="3" opacity=".5"/>' +
      '<rect x="' + ix + '" y="' + iy + '" width="160" height="90" fill="url(#dEnd)"/>' +
      '<g class="duct-rings">' + rings.join("") + "</g>" +
      '<g fill="#fff6e4" opacity=".8">' + leaks + "</g>" +
      '<rect width="1600" height="900" filter="url(#dGrain)" opacity=".5"/>',
      defs
    );
  }

  /* ---------------- outdoor condenser ---------------- */
  function condenser(r) {
    let grill = "";
    for (let i = 0; i <= 26; i++) {
      const t = i / 26, x = 565 + t * 270;
      grill += '<path d="M' + x.toFixed(1) + " " + (318 + t * 30).toFixed(1) + "V" + (596 + t * 34).toFixed(1) + '"/>';
    }
    for (let i = 0; i <= 15; i++) {
      const t = i / 15, x = 848 + t * 145;
      grill += '<path d="M' + x.toFixed(1) + " " + (336 - t * 38).toFixed(1) + "V" + (630 - t * 34).toFixed(1) + '"/>';
    }
    return '<ellipse cx="790" cy="650" rx="290" ry="40" fill="#000" opacity=".22"/>' +
      '<polygon points="555,305 845,338 845,642 555,606" fill="#9ea2a5"/>' +
      '<polygon points="845,338 1005,295 1005,600 845,642" fill="#8a8e91"/>' +
      '<polygon points="555,305 715,262 1005,295 845,338" fill="#c3c6c8"/>' +
      '<ellipse cx="780" cy="300" rx="150" ry="30" fill="#55595c"/>' +
      '<g stroke="#6d7174" stroke-width="2">' + [0, 1, 2, 3, 4, 5, 6].map(function (i) {
        return '<ellipse cx="780" cy="300" rx="' + (24 + i * 20) + '" ry="' + (5 + i * 4) + '" fill="none"/>'; }).join("") + "</g>" +
      '<g stroke="#5f6366" stroke-width="3.2">' + grill + "</g>" +
      '<path d="M555 305 V606 M845 338 V642 M1005 295 V600" stroke="#d6d9db" stroke-width="9"/>' +
      '<rect x="640" y="356" width="70" height="20" rx="3" fill="#7f8487" transform="skewY(6)"/>' +
      '<path d="M1005 420 C1060 420 1050 380 1090 370 V200" stroke="#2a2a2a" stroke-width="12" fill="none"/>' +
      '<path d="M1005 450 C1070 455 1065 400 1110 392 V200" stroke="#3a3a3a" stroke-width="9" fill="none"/>';
  }

  function outside(dusk) {
    const r = rng(21);
    let siding = "";
    for (let y = 0; y < 570; y += 24) siding += '<path d="M0 ' + y + 'H1600"/>';
    let shrubs = "";
    const bushes = [[140, 610, 90], [330, 660, 70], [120, 800, 110], [1240, 640, 85], [1420, 740, 120], [1250, 860, 90], [420, 860, 70]];
    bushes.forEach(function (b) {
      for (let i = 0; i < 14; i++) {
        const a = r() * Math.PI * 2, d = r() * b[2] * 0.6;
        const g = 90 + Math.floor(r() * 60);
        shrubs += '<circle cx="' + (b[0] + Math.cos(a) * d).toFixed(0) + '" cy="' + (b[1] + Math.sin(a) * d * 0.6).toFixed(0) +
          '" r="' + (b[2] * (0.3 + r() * 0.25)).toFixed(0) + '" fill="rgb(' + Math.floor(g * 0.45) + "," + g + "," + Math.floor(g * 0.35) + ')"/>';
      }
    });
    let leaves = "";
    const cols = ["#b5652b", "#c98a3b", "#8f4a22", "#d4a050", "#a35a2c"];
    for (let i = 0; i < 70; i++) {
      const x = 380 + r() * 900, y = 560 + r() * 300;
      leaves += '<path d="M0 -9 L4 -2 L10 -3 L5 3 L6 10 L0 6 L-6 10 L-5 3 L-10 -3 L-4 -2Z" fill="' + cols[i % 5] +
        '" transform="translate(' + x.toFixed(0) + " " + y.toFixed(0) + ") rotate(" + (r() * 360).toFixed(0) + ") scale(" + (0.7 + r() * 0.8).toFixed(2) + ')"/>';
    }
    const defs =
      '<linearGradient id="oWall" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d9d7d2"/><stop offset="1" stop-color="#c3c1bc"/></linearGradient>';
    return svg(
      '<rect width="1600" height="570" fill="url(#oWall)"/>' +
      '<g stroke="#a9a7a2" stroke-width="2">' + siding + "</g>" +
      '<rect x="1140" y="40" width="260" height="290" fill="#2a2e33" stroke="#f1f0ed" stroke-width="12"/>' +
      '<path d="M1270 40V330M1140 185H1400" stroke="#f1f0ed" stroke-width="6"/>' +
      '<rect x="1080" y="40" width="48" height="290" fill="#2e3338"/><rect x="1412" y="40" width="48" height="290" fill="#2e3338"/>' +
      '<rect x="0" y="552" width="1600" height="22" fill="#9a958c"/>' +
      '<rect x="0" y="570" width="1600" height="330" fill="#3b2a1e"/>' +
      '<polygon points="440,560 1170,560 1270,840 360,840" fill="#bdb8ae"/>' +
      '<polygon points="360,840 1270,840 1276,856 354,856" fill="#8f8a80"/>' +
      (dusk ? "" : condenser(r)) + leaves + shrubs +
      (dusk ? '<rect width="1600" height="900" fill="#0d1a22" opacity=".62"/>' : ""),
      defs
    );
  }

  /* ---------------- exploded wireframe on top of the dusk scene ---------------- */
  function exploded() {
    function label(x, y, title, text, anchorX, anchorY) {
      return '<g class="callout" opacity="0">' +
        '<path d="M' + anchorX + " " + anchorY + "L" + x + " " + (y + 22) + '" stroke="#bfe7dc" stroke-width="1.2" opacity=".7"/>' +
        '<circle cx="' + anchorX + '" cy="' + anchorY + '" r="5" fill="#bfe7dc"/>' +
        '<rect x="' + x + '" y="' + y + '" width="250" height="46" rx="8" fill="rgba(10,16,16,.82)" stroke="#9fd6c8" stroke-width="1.2"/>' +
        '<text x="' + (x + 14) + '" y="' + (y + 18) + '" class="cx-t">' + title + "</text>" +
        '<text x="' + (x + 14) + '" y="' + (y + 36) + '" class="cx-b">' + text + "</text></g>";
    }
    let coil = "";
    for (let i = 0; i < 9; i++) {
      const y = 445 + i * 14;
      coil += '<path d="M610 ' + y + " H960 a7 7 0 0 1 0 14 H610 a7 7 0 0 0 0 14" + '" />';
    }
    let fins = "";
    for (let x = 620; x < 960; x += 12) fins += '<path d="M' + x + ' 440 V570"/>';
    let blades = "";
    for (let i = 0; i < 4; i++) {
      blades += '<path d="M800 380 Q' + (800 + Math.cos(i * Math.PI / 2) * 60) + " " + (380 + Math.sin(i * Math.PI / 2) * 18 - 14) + " " +
        (800 + Math.cos(i * Math.PI / 2 + 0.6) * 150) + " " + (380 + Math.sin(i * Math.PI / 2 + 0.6) * 34) + " Q" +
        (800 + Math.cos(i * Math.PI / 2 + 0.3) * 90) + " " + (380 + Math.sin(i * Math.PI / 2 + 0.3) * 30) + ' 800 380Z"/>';
    }
    let spokes = "";
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * Math.PI * 2;
      spokes += '<path d="M800 290 L' + (800 + Math.cos(a) * 190).toFixed(0) + " " + (290 + Math.sin(a) * 46).toFixed(0) + '"/>';
    }
    let rings = "";
    for (let i = 1; i <= 6; i++) rings += '<ellipse cx="800" cy="290" rx="' + (i * 32) + '" ry="' + (i * 7.8) + '"/>';
    let chip = "";
    for (let i = 0; i < 5; i++) chip += '<rect x="' + (925 + (i % 3) * 30) + '" y="' + (610 + Math.floor(i / 3) * 34) + '" width="20" height="14" rx="2"/>';
    const defs = '<filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
      '<style>.cx-t{font:700 10px "JetBrains Mono",monospace;letter-spacing:.14em;fill:#bfe7dc}.cx-b{font:600 13px "Inter Tight",sans-serif;fill:#fff}</style>';
    return svg(
      outside(true).replace(/^<svg[^>]*>|<\/svg>$/g, "") +
      '<g filter="url(#glow)" fill="none" stroke="#bfe7dc" stroke-width="2.2" stroke-linejoin="round">' +
        '<g class="part" data-dy="0" data-dx="0">' +
          '<polygon points="560,690 1040,690 1000,740 600,740" fill="rgba(191,231,220,.06)"/>' +
          '<path d="M600 740 V700 M1000 740 V700"/></g>' +
        '<g class="part" data-dy="10" data-dx="-30">' +
          '<rect x="690" y="580" width="120" height="120" rx="40" fill="rgba(10,14,14,.75)"/>' +
          '<ellipse cx="750" cy="585" rx="60" ry="16" fill="rgba(10,14,14,.75)"/>' +
          '<path d="M690 630 H810 M700 660 h100" opacity=".6"/><path d="M810 620 q30 0 40 -40" stroke="#e39a5c"/></g>' +
        '<g class="part" data-dy="-30" data-dx="80">' +
          '<rect x="900" y="590" width="120" height="90" rx="6" fill="rgba(10,30,24,.7)"/>' +
          '<g stroke-width="1.4">' + chip + "</g>" +
          '<path d="M900 650 h-30 M900 670 h-40" stroke-width="1.4"/></g>' +
        '<g class="part" data-dy="-90" data-dx="0">' +
          '<polygon points="600,430 980,430 980,580 600,580" fill="rgba(10,14,14,.55)"/>' +
          '<g stroke-width="1" opacity=".55">' + fins + "</g>" +
          '<g stroke="#e39a5c" stroke-width="3">' + coil + "</g>" +
          '<path d="M980 430 l40 -24 v150 l-40 24" /></g>' +
        '<g class="part" data-dy="-150" data-dx="0">' +
          '<g fill="rgba(191,231,220,.12)">' + blades + "</g>" +
          '<circle cx="800" cy="380" r="16" fill="rgba(10,14,14,.8)"/><path d="M800 396 V430"/></g>' +
        '<g class="part" data-dy="-200" data-dx="0">' +
          '<ellipse cx="800" cy="290" rx="200" ry="50" fill="rgba(10,14,14,.55)"/>' +
          '<g stroke-width="1.1" opacity=".75">' + rings + spokes + "</g>" +
          '<path d="M600 290 v14 a200 50 0 0 0 400 0 v-14"/></g>' +
        '<g class="shell"><polygon points="560,300 1040,300 1040,700 560,700" /><path d="M560 300 l60 -40 h480 l-60 40 M1040 700 l60 -40 V260"/></g>' +
      "</g>" +
      '<g class="callouts">' +
        label(1060, 70, "FAN + MOTOR", "Amp draw, bearings, blade balance", 960, 180) +
        label(240, 300, "COPPER COIL", "Cleaned, fins combed straight", 620, 350) +
        label(1100, 520, "CONTROL BOARD", "Capacitor, contactor, wiring", 1000, 580) +
        label(300, 560, "COMPRESSOR", "Refrigerant charge + pressures", 700, 620) +
      "</g>",
      defs
    );
  }

  /* ---------------- furnace burners ---------------- */
  function furnace() {
    let burners = "", flames = "", back = "";
    for (let i = 0; i < 6; i++) {
      const cx = 330 + i * 188;
      flames += '<path class="flame" d="M' + (cx - 46) + " 640 C" + (cx - 50) + " 560 " + (cx - 20) + " 500 " + (cx + 6) + " 430 C" +
        (cx + 18) + " 500 " + (cx + 50) + " 560 " + (cx + 46) + ' 640Z" fill="url(#fBlue)"/>' +
        '<path class="flame" d="M' + (cx - 22) + " 640 C" + (cx - 22) + " 590 " + (cx - 6) + " 550 " + (cx + 2) + " 520 C" +
        (cx + 10) + " 550 " + (cx + 24) + " 590 " + (cx + 22) + ' 640Z" fill="url(#fCore)"/>';
      burners += '<rect x="' + (cx - 58) + '" y="640" width="116" height="130" fill="url(#fBrass)"/>' +
        '<ellipse cx="' + cx + '" cy="770" rx="58" ry="22" fill="#5a3b1d"/>' +
        '<ellipse cx="' + cx + '" cy="770" rx="40" ry="14" fill="#1a0f07"/>' +
        '<ellipse cx="' + cx + '" cy="640" rx="58" ry="16" fill="#c99a5c"/>' +
        '<rect x="' + (cx - 58) + '" y="700" width="116" height="10" fill="#7b5228" opacity=".7"/>';
    }
    for (let i = 0; i < 9; i++) {
      const x = 150 + i * 170;
      back += '<path class="fire-back" d="M' + (x - 80) + " 330 C" + (x - 70) + " 230 " + (x - 10) + " 160 " + (x + 10) + " 70 C" +
        (x + 40) + " 170 " + (x + 90) + " 230 " + (x + 80) + ' 330Z" fill="url(#fOrange)" style="animation-delay:-' + (i * 0.13).toFixed(2) + 's"/>';
    }
    const defs =
      '<radialGradient id="fGlow" cx=".5" cy=".25" r=".7"><stop offset="0" stop-color="#ff8a2a" stop-opacity=".9"/><stop offset=".45" stop-color="#7a2c08" stop-opacity=".6"/><stop offset="1" stop-color="#120804"/></radialGradient>' +
      '<linearGradient id="fOrange" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffcf6a"/><stop offset=".5" stop-color="#ff7a1c" stop-opacity=".8"/><stop offset="1" stop-color="#ff5a00" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="fBlue" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#2d54ff"/><stop offset=".55" stop-color="#5f8dff" stop-opacity=".75"/><stop offset="1" stop-color="#a7c4ff" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="fCore" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#e7f0ff"/><stop offset="1" stop-color="#8fb4ff" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="fBrass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6b4521"/><stop offset=".35" stop-color="#d6a764"/><stop offset=".6" stop-color="#a6743c"/><stop offset="1" stop-color="#4f3216"/></linearGradient>' +
      '<linearGradient id="fTube" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3532"/><stop offset=".3" stop-color="#bdb6ae"/><stop offset=".5" stop-color="#8d8379"/><stop offset="1" stop-color="#2a2522"/></linearGradient>' +
      '<filter id="fBlur"><feGaussianBlur stdDeviation="10"/></filter>';
    return svg(
      '<rect width="1600" height="900" fill="url(#fGlow)"/>' +
      '<g filter="url(#fBlur)" opacity=".85">' + back + "</g>" +
      '<path d="M120 380 H1330 A120 120 0 0 1 1330 620 H160" stroke="url(#fTube)" stroke-width="92" fill="none" stroke-linecap="round"/>' +
      '<path d="M120 345 H1330" stroke="#e8e1d8" stroke-width="5" opacity=".45"/>' +
      '<g style="mix-blend-mode:screen">' + flames + "</g>" +
      burners +
      '<rect x="0" y="790" width="1600" height="60" fill="#2c1d12"/><rect x="0" y="796" width="1600" height="10" fill="#6c4a2a" opacity=".6"/>' +
      '<rect width="1600" height="900" fill="none" stroke="#000" stroke-width="160" opacity=".45" filter="url(#fBlur)"/>',
      defs
    );
  }

  /* ---------------- HVAC filter, dirty or clean ---------------- */
  function airFilter(dirty) {
    let pleats = "";
    for (let x = 140; x <= 1460; x += 34) {
      pleats += '<path d="M' + x + " 170 L" + (x + 17) + " 180 L" + (x + 17) + " 720 L" + x + ' 730Z" fill="' + (dirty ? "#7e705d" : "#f4f1ea") + '"/>' +
        '<path d="M' + (x + 17) + " 180 L" + (x + 34) + " 170 L" + (x + 34) + " 730 L" + (x + 17) + ' 720Z" fill="' + (dirty ? "#5f5242" : "#d9d4ca") + '"/>';
    }
    const id = dirty ? "fd" : "fc";
    const defs = '<filter id="' + id + 'dust"><feTurbulence type="fractalNoise" baseFrequency=".02 .06" numOctaves="4" seed="9"/>' +
      '<feColorMatrix values="0 0 0 0 .33  0 0 0 0 .27  0 0 0 0 .2  0 0 0 1.6 -.55"/></filter>' +
      '<filter id="' + id + 'fuzz"><feTurbulence type="turbulence" baseFrequency=".5" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 .55  0 0 0 0 .5  0 0 0 0 .44  0 0 0 .5 0"/></filter>' +
      '<linearGradient id="' + id + 'bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3735"/><stop offset="1" stop-color="#232120"/></linearGradient>';
    return svg(
      '<rect width="1600" height="900" fill="url(#' + id + 'bg)"/>' +
      '<rect x="100" y="130" width="1400" height="640" rx="8" fill="#000" opacity=".35" transform="translate(16 22)"/>' +
      '<rect x="100" y="130" width="1400" height="640" rx="8" fill="' + (dirty ? "#b8ad9a" : "#ece8e0") + '"/>' +
      pleats +
      (dirty ? '<rect x="140" y="170" width="1320" height="560" filter="url(#' + id + 'dust)"/><rect x="140" y="170" width="1320" height="560" filter="url(#' + id + 'fuzz)" opacity=".7"/>' : "") +
      '<rect x="100" y="130" width="1400" height="640" rx="8" fill="none" stroke="' + (dirty ? "#a19681" : "#fff") + '" stroke-width="40"/>' +
      '<path d="M140 450 H1460 M800 170 V730" stroke="' + (dirty ? "#6a5f4f" : "#bdb8ae") + '" stroke-width="6"/>' +
      '<text x="160" y="160" font-family="JetBrains Mono, monospace" font-size="22" font-weight="700" fill="' + (dirty ? "#5e5446" : "#8a857c") + '">MERV 8 · 16x25x1 · AIRFLOW →</text>',
      defs
    );
  }

  /* ---------------- product renders for the systems picker ---------------- */
  function product(kind) {
    const defs =
      '<linearGradient id="pWhite" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d7d8d6"/><stop offset=".4" stop-color="#f6f6f4"/><stop offset="1" stop-color="#b9bab8"/></linearGradient>' +
      '<linearGradient id="pSide" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#a7a8a6"/><stop offset="1" stop-color="#7b7c7a"/></linearGradient>' +
      '<linearGradient id="pCopper" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7a3d17"/><stop offset=".5" stop-color="#c9773a"/><stop offset="1" stop-color="#5a2a0e"/></linearGradient>' +
      '<radialGradient id="pFan" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#4a4c4e"/><stop offset="1" stop-color="#1a1b1c"/></radialGradient>' +
      '<linearGradient id="pFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>';
    function fan(cx, cy, rad) {
      let s = '<circle cx="' + cx + '" cy="' + cy + '" r="' + rad + '" fill="url(#pFan)" stroke="#2b2c2d" stroke-width="6"/>';
      for (let i = 0; i < 3; i++) {
        const a = i * 2.094;
        s += '<path d="M' + cx + " " + cy + " Q" + (cx + Math.cos(a) * rad * 0.9) + " " + (cy + Math.sin(a) * rad * 0.9) + " " +
          (cx + Math.cos(a + 0.9) * rad * 0.85) + " " + (cy + Math.sin(a + 0.9) * rad * 0.85) + 'Z" fill="#8c8f92" opacity=".85"/>';
      }
      for (let i = 1; i <= 5; i++) s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (rad * i / 5) + '" fill="none" stroke="#777a7c" stroke-width="2"/>';
      s += '<path d="M' + (cx - rad) + " " + cy + "H" + (cx + rad) + "M" + cx + " " + (cy - rad) + "V" + (cy + rad) + '" stroke="#777a7c" stroke-width="2"/>';
      return s + '<circle cx="' + cx + '" cy="' + cy + '" r="' + (rad * 0.14) + '" fill="#3b3d3f"/>';
    }
    let body = "";
    if (kind === "furnace") {
      body = '<polygon points="300,170 330,150 330,760 300,780" fill="url(#pCopper)"/>' +
        '<rect x="330" y="150" width="290" height="610" rx="6" fill="url(#pWhite)"/>' +
        '<polygon points="620,150 700,190 700,790 620,760" fill="url(#pSide)"/>' +
        '<polygon points="330,150 410,120 700,190 620,150" fill="#e9eae8"/>' +
        '<path d="M350 430 H600 M350 560 H600" stroke="#c4c5c3" stroke-width="3"/>' +
        '<g stroke="#b0b1af" stroke-width="5" stroke-linecap="round">' + [470, 490, 510, 530].map(function (y) { return '<path d="M400 ' + y + 'H550"/>'; }).join("") + "</g>" +
        '<rect x="455" y="190" width="40" height="14" rx="3" fill="#3a3c3e"/>';
    } else if (kind === "heatpump") {
      body = '<rect x="260" y="230" width="430" height="480" rx="10" fill="url(#pWhite)"/>' +
        '<polygon points="690,230 760,270 760,750 690,710" fill="url(#pSide)"/>' +
        '<polygon points="260,230 330,200 760,270 690,230" fill="#ececea"/>' +
        fan(440, 470, 150) +
        '<rect x="620" y="250" width="50" height="440" fill="#e0e1df"/><path d="M620 250V690" stroke="#c4c5c3" stroke-width="3"/>' +
        '<rect x="250" y="706" width="450" height="14" fill="#2a2b2c"/>';
    } else {
      body = '<rect x="150" y="330" width="420" height="140" rx="40" fill="url(#pWhite)"/>' +
        '<path d="M175 440 H545" stroke="#bfc0be" stroke-width="5"/><path d="M190 455 H530" stroke="#9fa09e" stroke-width="3"/>' +
        '<rect x="560" y="300" width="250" height="260" rx="8" fill="url(#pWhite)"/>' +
        '<polygon points="810,300 850,320 850,575 810,560" fill="url(#pSide)"/>' +
        fan(670, 430, 92) +
        '<g stroke="#d4d5d3" stroke-width="3">' + [320, 340, 360, 380, 400, 420, 440, 460, 480, 500, 520, 540].map(function (y) { return '<path d="M770 ' + y + 'H800"/>'; }).join("") + "</g>";
    }
    return svg(
      '<rect width="900" height="900" fill="transparent"/>' +
      '<ellipse cx="460" cy="790" rx="340" ry="40" fill="#000" opacity=".5"/>' +
      '<rect x="0" y="780" width="900" height="120" fill="url(#pFloor)" opacity=".4"/>' + body,
      defs, "0 0 900 900"
    );
  }

  window.EmberArt = {
    house: house,
    "room-cold": function () { return room("rc"); },
    "room-warm": function () { return room("rw"); },
    "room-dial": function () { return room("rd"); },
    vent: vent,
    duct: duct,
    outside: function () { return outside(false); },
    exploded: exploded,
    furnace: furnace,
    "filter-dirty": function () { return airFilter(true); },
    "filter-clean": function () { return airFilter(false); },
    product: product
  };
})();
