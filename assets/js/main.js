/* Aranykapu Zenekar Webshop – közös fejléc, lábléc, termékmegjelenítés és animációk. */
(function () {
  "use strict";

  var SHOP = "https://aranykapuwebshop.hu";
  var PRODUCTS = window.AK_PRODUCTS || [];
  var CATS = window.AK_CATEGORIES || {};
  var IMG = "assets/img/";

  var ICONS = {
    cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 6h15l-1.5 9h-12z"/><path d="M6 6 5 3H2"/><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.9v3h2.6V21z"/></svg>',
    youtube: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM10 15V9l5.2 3z"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-1.8-2.5V9.7a5.7 5.7 0 1 0 4.9 5.7V9.1a7.3 7.3 0 0 0 4.3 1.4V7.4a4.3 4.3 0 0 1-3.2-1.6z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/></svg>'
  };
  window.AK_ICONS = ICONS;

  /* ---------- Segédfüggvények ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function money(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + '<small>Ft</small>';
  }
  function byId(id) { return PRODUCTS.find(function (p) { return p.id === id; }); }
  function bySlug(s) { return PRODUCTS.find(function (p) { return p.slug === s; }); }
  function productUrl(p) { return "termek.html?t=" + encodeURIComponent(p.slug); }
  /* A kosár és a fizetés az eredeti WooCommerce webshopban történik. */
  function cartUrl(p, qty) { return SHOP + "/kosar/?add-to-cart=" + p.id + "&quantity=" + (qty || 1); }
  function param(name) { return new URLSearchParams(location.search).get(name); }

  var MONTHS = ["JAN", "FEB", "MÁR", "ÁPR", "MÁJ", "JÚN", "JÚL", "AUG", "SZEP", "OKT", "NOV", "DEC"];
  /* Belépőjegy neve pl. "2026.12.21. 10:30 óra Karácsonyváró … – Győr Pedró Pajta" */
  function parseEvent(p) {
    var m = p.name.match(/^(\d{4})\.\s?(\d{1,2})\.\s?(\d{1,2})\.?,?\s*(?:(\d{1,2})(?::(\d{2}))?\s*óra\s*)?(.*)$/);
    if (!m) return { title: p.name, place: "", sort: 9e15 };
    var rest = m[6].split(" – ");
    var place = rest.length > 1 ? rest.pop() : "";
    var date = new Date(+m[1], +m[2] - 1, +m[3], m[4] ? +m[4] : 0, m[5] ? +m[5] : 0);
    return {
      day: +m[3], month: MONTHS[+m[2] - 1], year: m[1],
      time: m[4] ? m[4] + ":" + (m[5] || "00") : "",
      title: rest.join(" – "), place: place, sort: date.getTime()
    };
  }

  /* ---------- Fejléc + lábléc ---------- */
  var NAV = [
    ["Főoldal", "index.html", "home"],
    ["Rólunk", "rolunk.html", "rolunk"],
    ["Könyvek", "termekek.html?kategoria=konyv", "konyv"],
    ["CD-k", "termekek.html?kategoria=cd", "cd"],
    ["Ajándék", "termekek.html?kategoria=ajandek", "ajandek"],
    ["Belépőjegy", "termekek.html?kategoria=belepojegy", "belepojegy"]
  ];

  function renderHeader() {
    var el = document.getElementById("site-header");
    if (!el) return;
    var page = document.body.dataset.page;
    var current = page === "shop" ? (param("kategoria") || "") : page;
    var ticker = ["Aranykapu Zenekar Webshop", "A hangok érintése", "Könyvek · CD-k · Ajándék · Belépőjegy", "Tel: +36-20/5036611", "info@aranykapuwebshop.hu"];
    var t = ticker.concat(ticker).concat(ticker).concat(ticker).map(function (s) { return "<span>" + esc(s) + "</span>"; }).join("");
    el.outerHTML =
      '<div class="topbar" aria-hidden="true"><div class="topbar-track">' + t + "</div></div>" +
      '<header class="site-header" id="header"><div class="wrap nav">' +
      '<a class="nav-logo" href="index.html" aria-label="Aranykapu Zenekar Webshop – főoldal"><img src="' + IMG + 'aranykapuzenekar-logo.webp" alt="Aranykapu Zenekar" width="458" height="178"></a>' +
      '<ul class="nav-links" id="nav-links">' +
      NAV.map(function (n) {
        return '<li><a href="' + n[1] + '"' + (n[2] === current ? ' aria-current="page"' : "") + ">" + n[0] + "</a></li>";
      }).join("") +
      '<li><a href="' + SHOP + '/fiokom/">Fiók</a></li></ul>' +
      '<div class="nav-actions">' +
      '<a class="icon-btn" href="' + SHOP + '/fiokom/" aria-label="Fiókom">' + ICONS.user + "</a>" +
      '<a class="icon-btn" href="' + SHOP + '/kosar/" aria-label="Kosár">' + ICONS.cart + "</a>" +
      '<button class="icon-btn nav-toggle" id="nav-toggle" aria-label="Menü" aria-expanded="false" aria-controls="nav-links">' + ICONS.menu + "</button>" +
      "</div></div></header>";

    var header = document.getElementById("header");
    var toggle = document.getElementById("nav-toggle");
    toggle.addEventListener("click", function () {
      var open = header.classList.toggle("menu-open");
      toggle.setAttribute("aria-expanded", open);
      toggle.innerHTML = open ? ICONS.close : ICONS.menu;
    });
    var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 40); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  function renderFooter() {
    var el = document.getElementById("site-footer");
    if (!el) return;
    el.outerHTML =
      '<footer class="site-footer"><div class="wrap">' +
      '<div class="footer-cta"><h2 class="display">Kövess<br><span class="script">minket!</span></h2>' +
      '<a class="btn btn-pink" href="termekek.html">Irány a webshop ' + ICONS.arrow + "</a></div>" +
      '<div class="footer-grid">' +
      '<div><a class="footer-logo" href="index.html"><img src="' + IMG + 'aranykapuzenekar-logo.webp" alt="Aranykapu Zenekar" width="458" height="178"></a>' +
      '<div class="socials">' +
      '<a href="https://www.facebook.com/aranykapuzenekar" target="_blank" rel="noopener" aria-label="Facebook">' + ICONS.facebook + "</a>" +
      '<a href="https://www.youtube.com/c/AranykapuZenekar" target="_blank" rel="noopener" aria-label="YouTube">' + ICONS.youtube + "</a>" +
      '<a href="https://www.tiktok.com/@aranykapuzenekar" target="_blank" rel="noopener" aria-label="TikTok">' + ICONS.tiktok + "</a>" +
      '<a href="https://aranykapuzenekar.wixsite.com/aranykapuzenekar" target="_blank" rel="noopener" aria-label="Az Aranykapu Zenekar weboldala">' + ICONS.globe + "</a>" +
      '<a href="mailto:info@aranykapuwebshop.hu" aria-label="E-mail">' + ICONS.mail + "</a>" +
      "</div></div>" +
      '<div><h3>Elérhetőség</h3><ul>' +
      '<li><a href="tel:+36205036611">Tel: +36-20/5036611</a></li>' +
      '<li><a href="mailto:info@aranykapuwebshop.hu">info@aranykapuwebshop.hu</a></li>' +
      '<li><a href="aszf.html">ÁSZF</a></li>' +
      '<li><a href="adatvedelmi-nyilatkozat.html">Adatvédelmi nyilatkozat</a></li>' +
      "</ul></div>" +
      '<div><h3>Webshop</h3><ul>' +
      NAV.map(function (n) { return '<li><a href="' + n[1] + '">' + n[0] + "</a></li>"; }).join("") +
      '<li><a href="' + SHOP + '/fiokom/">Fiók</a></li>' +
      "</ul></div></div>" +
      '<div class="footer-word" aria-hidden="true">Aranykapu</div>' +
      '<div class="footer-bottom"><span>© 2022 Minden jog fenntartva</span><span>Aranykapu Zenekar Webshop – A hangok érintése</span></div>' +
      "</div></footer>";
  }

  /* ---------- Termékkártya ---------- */
  function card(p) {
    var badges = "";
    if (!p.inStock) badges += '<span class="badge dark">Elfogyott</span>';
    if (/ELŐRENDELÉS/.test(p.name)) badges += '<span class="badge pink">Előrendelés</span>';
    if (p.sale) badges += '<span class="badge pink">Akció</span>';
    var add = p.inStock
      ? '<a class="card-add" href="' + cartUrl(p, 1) + '" aria-label="' + esc(p.name) + ' kosárba">' + ICONS.plus + "</a>"
      : "";
    return (
      '<article class="card reveal' + (p.inStock ? "" : " is-out") + '" data-cat="' + p.cat + '">' +
      '<div class="card-media"><div class="card-badges">' + badges + "</div>" +
      '<img src="' + IMG + p.images[0] + '" alt="' + esc(p.name) + '" loading="lazy"></div>' +
      '<div class="card-body"><span class="card-cat">' + esc(CATS[p.cat] || "") + "</span>" +
      '<h3 class="card-title"><a href="' + productUrl(p) + '">' + esc(p.name) + "</a></h3>" +
      '<div class="card-foot"><span class="price">' + money(p.price) + "</span>" + add + "</div></div></article>"
    );
  }

  function eventRow(p) {
    var e = parseEvent(p);
    return (
      '<article class="event reveal' + (p.inStock ? "" : " is-out") + '">' +
      '<div class="event-date"><b>' + (e.day || "") + "</b><span>" + (e.month || "") + "</span>" + (e.year ? "<small>" + e.year + "</small>" : "") + "</div>" +
      '<div class="event-thumb"><img src="' + IMG + p.images[0] + '" alt="" loading="lazy"></div>' +
      '<div><h3 class="event-title"><a href="' + productUrl(p) + '">' + esc(e.title) + "</a></h3>" +
      '<div class="event-meta">' + (e.time ? "<span>🕒 " + e.time + "</span>" : "") + (e.place ? "<span>📍 " + esc(e.place) + "</span>" : "") + "</div></div>" +
      '<div class="event-side"><span class="price">' + money(p.price) + "</span>" +
      (p.inStock
        ? '<a class="btn btn-pink" href="' + cartUrl(p, 1) + '">Jegyet kérek</a>'
        : '<span class="btn btn-gray is-disabled">Elfogyott</span>') +
      "</div></article>"
    );
  }
  function sortedEvents(list) {
    return list.slice().sort(function (a, b) { return parseEvent(a).sort - parseEvent(b).sort; });
  }

  /* Mennyiségválasztó + Kosárba gomb */
  function buyBox(p, opts) {
    opts = opts || {};
    if (!p.inStock) {
      return '<span class="price">' + money(p.price) + '</span><span class="btn btn-gray is-disabled">Elfogyott</span>' +
        (opts.details ? '<a class="btn btn-ghost" href="' + productUrl(p) + '">Részletek</a>' : "");
    }
    return (
      '<span class="price">' + money(p.price) + "</span>" +
      '<div class="qty" data-qty><button type="button" data-step="-1" aria-label="Kevesebb">−</button>' +
      '<input type="number" min="1" value="1" aria-label="' + esc(p.name) + ' mennyiség"><button type="button" data-step="1" aria-label="Több">+</button></div>' +
      '<a class="btn btn-pink" data-add="' + p.id + '" href="' + cartUrl(p, 1) + '">' + ICONS.cart + " Kosárba</a>" +
      (opts.details ? '<a class="btn ' + (opts.dark ? "btn-light btn-ghost" : "btn-gray") + '" href="' + productUrl(p) + '">Részletek</a>' : "")
    );
  }
  function wireQty(root) {
    root.querySelectorAll("[data-qty]").forEach(function (q) {
      var input = q.querySelector("input");
      var link = q.parentElement.querySelector("[data-add]");
      var p = link && byId(+link.dataset.add);
      var sync = function () {
        var v = Math.max(1, parseInt(input.value, 10) || 1);
        input.value = v;
        if (p) link.href = cartUrl(p, v);
      };
      q.querySelectorAll("button").forEach(function (b) {
        b.addEventListener("click", function () { input.value = (parseInt(input.value, 10) || 1) + +b.dataset.step; sync(); });
      });
      input.addEventListener("change", sync);
    });
  }

  /* ---------- Oldalak ---------- */
  function initHome() {
    document.querySelectorAll("[data-buy]").forEach(function (el) {
      var p = byId(+el.dataset.buy);
      if (p) el.innerHTML = buyBox(p, { details: true, dark: el.hasAttribute("data-dark") });
    });
    wireQty(document);

    var grid = document.getElementById("home-grid");
    var chips = document.getElementById("home-chips");
    if (grid && chips) {
      var shopItems = PRODUCTS.filter(function (p) { return p.cat !== "belepojegy"; });
      var draw = function (cat) {
        var list = cat ? shopItems.filter(function (p) { return p.cat === cat; }) : shopItems;
        grid.innerHTML = list.map(card).join("");
        observe(grid);
      };
      chips.addEventListener("click", function (e) {
        var b = e.target.closest("[data-cat]");
        if (!b) return;
        chips.querySelectorAll(".chip").forEach(function (c) { c.classList.toggle("is-active", c === b); c.setAttribute("aria-pressed", c === b); });
        draw(b.dataset.cat);
      });
      draw("");
    }

    var ev = document.getElementById("home-events");
    if (ev) {
      var list = sortedEvents(PRODUCTS.filter(function (p) { return p.cat === "belepojegy"; }));
      var avail = list.filter(function (p) { return p.inStock; });
      ev.innerHTML = (avail.length ? avail : list).slice(0, 5).map(eventRow).join("");
    }

    var rv = document.getElementById("reviews");
    if (rv) {
      document.querySelectorAll("[data-slide]").forEach(function (b) {
        b.addEventListener("click", function () {
          rv.scrollBy({ left: +b.dataset.slide * (rv.firstElementChild.offsetWidth + 20), behavior: "smooth" });
        });
      });
    }
  }

  function initShop() {
    var cat = param("kategoria") || "";
    if (!CATS[cat]) cat = "";
    var grid = document.getElementById("shop-grid");
    var chips = document.getElementById("shop-chips");
    var sort = document.getElementById("shop-sort");
    var title = document.getElementById("shop-title");
    var count = document.getElementById("shop-count");
    var crumb = document.getElementById("shop-crumb");

    var titles = { "": ["Összes", "termék"], konyv: ["Könyvek", "mesés lapok"], cd: ["CD-k", "dalok otthonra"], ajandek: ["Ajándék", "szívből"], belepojegy: ["Belépő", "jegyek"] };
    title.innerHTML = '<span class="split-line"><span>' + titles[cat][0] + '</span></span><span class="split-line"><span class="script">' + titles[cat][1] + "</span></span>";
    document.title = (cat ? CATS[cat] : "Webshop") + " – Aranykapu Zenekar Webshop";
    crumb.textContent = cat ? CATS[cat] : "Összes termék";

    chips.innerHTML = [["", "Összes", PRODUCTS.length]].concat(Object.keys(CATS).map(function (k) {
      return [k, CATS[k], PRODUCTS.filter(function (p) { return p.cat === k; }).length];
    })).map(function (c) {
      return '<a class="chip' + (c[0] === cat ? " is-active" : "") + '" href="termekek.html' + (c[0] ? "?kategoria=" + c[0] : "") + '"' + (c[0] === cat ? ' aria-current="page"' : "") + ">" + c[1] + "<sup>" + c[2] + "</sup></a>";
    }).join("");

    var draw = function () {
      var list = PRODUCTS.filter(function (p) { return !cat || p.cat === cat; });
      var mode = sort.value;
      if (mode === "asc") list = list.slice().sort(function (a, b) { return a.price - b.price; });
      if (mode === "desc") list = list.slice().sort(function (a, b) { return b.price - a.price; });
      if (mode === "date") list = sortedEvents(list);
      if (mode === "stock") list = list.slice().sort(function (a, b) { return b.inStock - a.inStock; });
      count.textContent = list.length + " termék";
      if (cat === "belepojegy") {
        grid.className = "events";
        grid.innerHTML = list.map(eventRow).join("");
      } else {
        grid.className = "grid";
        grid.innerHTML = list.length ? list.map(card).join("") : '<p class="empty">Nincs termék ebben a kategóriában.</p>';
      }
      observe(grid);
    };
    if (cat === "belepojegy") sort.value = "date";
    sort.addEventListener("change", draw);
    draw();
  }

  function initProduct() {
    var p = bySlug(param("t") || "");
    var root = document.getElementById("product");
    if (!p) {
      root.innerHTML = '<div class="empty"><h1 class="display section-title">Hoppá!</h1><p>Ez a termék nem található.</p><a class="btn" href="termekek.html">Vissza a webshopba</a></div>';
      return;
    }
    document.title = p.name + " – Aranykapu Zenekar Webshop";
    var meta = document.querySelector('meta[name="description"]');
    if (meta) meta.content = p.name + " – Aranykapu Zenekar Webshop";
    document.getElementById("crumb-cat").innerHTML = '<a href="termekek.html?kategoria=' + p.cat + '">' + esc(CATS[p.cat]) + "</a>";
    document.getElementById("crumb-name").textContent = p.name;

    var thumbs = p.images.length > 1
      ? '<div class="gallery-thumbs">' + p.images.map(function (src, i) {
          return '<button type="button" class="' + (i ? "" : "is-active") + '" data-src="' + IMG + src + '" aria-label="' + (i + 1) + '. kép"><img src="' + IMG + src + '" alt="" loading="lazy"></button>';
        }).join("") + "</div>"
      : "";

    root.innerHTML =
      '<div class="product">' +
      '<div class="reveal"><div class="gallery-main"><img id="gallery-main" src="' + IMG + p.images[0] + '" alt="' + esc(p.name) + '"></div>' + thumbs + "</div>" +
      '<div class="product-info reveal reveal-d1"><span class="eyebrow">' + esc(CATS[p.cat]) + "</span>" +
      "<h1>" + esc(p.name) + "</h1>" +
      '<div><span class="price">' + money(p.price) + '</span><span class="stock' + (p.inStock ? "" : " out") + '">' + (p.inStock ? "Raktáron" : "Elfogyott") + "</span></div>" +
      (p.short ? '<div class="product-short prose">' + p.short + "</div>" : "") +
      '<div class="buy-row">' + buyBox(p).replace(/<span class="price">.*?<\/span>/, "") + "</div>" +
      '<p class="buy-note">A kosár és a biztonságos fizetés az aranykapuwebshop.hu rendszerén keresztül történik.</p>' +
      (p.desc ? '<div class="product-desc"><h2>Leírás</h2><div class="prose">' + p.desc + "</div></div>" : "") +
      "</div></div>";
    wireQty(root);

    root.querySelectorAll(".gallery-thumbs button").forEach(function (b) {
      b.addEventListener("click", function () {
        document.getElementById("gallery-main").src = b.dataset.src;
        root.querySelectorAll(".gallery-thumbs button").forEach(function (x) { x.classList.toggle("is-active", x === b); });
      });
    });

    var rel = PRODUCTS.filter(function (x) { return x.cat === p.cat && x.id !== p.id; });
    if (p.cat === "belepojegy") rel = sortedEvents(rel);
    rel = rel.slice(0, 4);
    var relEl = document.getElementById("related");
    if (rel.length) {
      relEl.querySelector(".grid").innerHTML = rel.map(card).join("");
    } else {
      relEl.remove();
    }
  }

  /* ---------- Görgetéses megjelenés ---------- */
  var io = "IntersectionObserver" in window
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" })
    : null;
  function observe(root) {
    (root || document).querySelectorAll(".reveal:not(.is-in), .split-line:not(.is-in)").forEach(function (el) {
      if (io) io.observe(el); else el.classList.add("is-in");
    });
  }

  /* Hero: a lebegő borítók finoman követik az egeret */
  function heroParallax() {
    var stage = document.querySelector(".hero-stage");
    if (!stage || matchMedia("(prefers-reduced-motion: reduce)").matches || matchMedia("(hover: none)").matches) return;
    var cards = stage.querySelectorAll(".float-card");
    stage.closest(".hero").addEventListener("mousemove", function (e) {
      var r = stage.getBoundingClientRect();
      var x = (e.clientX - r.left - r.width / 2) / r.width;
      var y = (e.clientY - r.top - r.height / 2) / r.height;
      cards.forEach(function (c, i) {
        var d = (i + 1) * 10;
        c.style.translate = (x * d).toFixed(1) + "px " + (y * d).toFixed(1) + "px";
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderHeader();
    renderFooter();
    var page = document.body.dataset.page;
    if (page === "home") initHome();
    if (page === "shop") initShop();
    if (page === "product") initProduct();
    observe(document);
    heroParallax();
  });
})();
