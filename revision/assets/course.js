/* Electrical Theory Revision — shared behaviour: navigation, progress, quizzes,
   practice questions and the formula-triangle calculator. No dependencies. */
(function () {
  "use strict";

  // ---- Course map ----------------------------------------------------------
  // Organised by topic, not by course video. New material goes into the module (and lesson)
  // where it logically belongs; add a module when a new topic area starts.
  var MODULES = [
    {
      id: "principles", dir: "principles", title: "Electrical principles",
      desc: "What electricity is, and the relationships every calculation is built on.",
      lessons: [
        { id: "atoms", file: "atoms.html", title: "Atoms and free electrons", desc: "Why metals conduct and insulators don't." },
        { id: "vir", file: "voltage-current-resistance.html", title: "Voltage, current and resistance", desc: "The pressure, the flow and the opposition." },
        { id: "ohms-law", file: "ohms-law.html", title: "Ohm's law", desc: "V = I × R, units, and where current really goes." },
        { id: "series-parallel", file: "series-and-parallel.html", title: "Series and parallel circuits", desc: "Switches, Kirchhoff's laws, and combining resistances." },
        { id: "power", file: "power.html", title: "Power", desc: "Watts, appliance currents and heat in cables." },
        { id: "dc-ac", file: "dc-and-ac.html", title: "DC and AC", desc: "Steady and alternating current, sine waves, RMS, and DC safety." },
        { id: "impedance", file: "impedance.html", title: "Impedance and power factor", desc: "Reactance, Z = √(R² + X²), phase shift, W, VA and var." }
      ]
    },
    {
      id: "cables", dir: "cables", title: "Cables",
      desc: "What cables are made of, how they're sized, and why size matters.",
      lessons: [
        { id: "conductors", file: "conductors-and-cables.html", title: "Conductors and cables", desc: "Metals, cross-sectional area, insulation and heat." }
      ]
    },
    {
      id: "supply", dir: "supply", title: "Supply and distribution",
      desc: "How electricity reaches a building, and what each conductor does when it gets there.",
      lessons: [
        { id: "three-phase", file: "three-phase.html", title: "Three-phase supplies", desc: "How three phases are generated, the star point, and single vs three-phase." },
        { id: "grid", file: "the-grid.html", title: "The grid and transformers", desc: "From 400 kV to 230 V, and how transformers do it." },
        { id: "your-supply", file: "your-supply.html", title: "Your supply: conductors and earthing", desc: "Who owns what, and what each conductor does." },
        { id: "consumer-units", file: "consumer-units.html", title: "Consumer units and protective devices", desc: "Main switch, MCBs, RCDs, RCBOs, and split-load vs RCBO boards." }
      ]
    },
    {
      id: "regulations", dir: "regulations", title: "Regulations and compliance",
      desc: "The laws and standards behind the work, what must be notified, and the rules for bathrooms.",
      lessons: [
        { id: "laws", file: "laws-and-guidance.html", title: "Laws and guidance", desc: "Statutory and non-statutory, and the Building Regulations." },
        { id: "bs7671", file: "bs-7671.html", title: "BS 7671 and its definitions", desc: "How the Wiring Regulations are organised, and what their terms mean." },
        { id: "part-p", file: "part-p-and-notification.html", title: "Part P and notification", desc: "Where Part P applies, notifiable work, and certificates." },
        { id: "bathrooms", file: "bathrooms.html", title: "Bathrooms and special locations", desc: "Zones, IP ratings and socket distances." }
      ]
    }
  ];
  // Flat list in reading order, so Previous/Next runs straight through all modules.
  var ALL = [];
  MODULES.forEach(function (m) { m.lessons.forEach(function (l, i) { ALL.push({ module: m, index: i, lesson: l }); }); });

  // ---- Storage (safe: works without localStorage) --------------------------
  function sget(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function sset(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  function score(id) { var s = sget("rev:quiz:" + id); return s ? JSON.parse(s) : null; }
  // One-off: carry quiz scores over from the old video-based lesson ids.
  [["v01-1", "atoms"], ["v01-2", "vir"], ["v01-3", "ohms-law"], ["v01-4", "power"], ["v01-5", "grid"], ["v01-6", "your-supply"], ["ac", "three-phase"]].forEach(function (p) {
    var old = sget("rev:quiz:" + p[0]);
    if (old && !sget("rev:quiz:" + p[1])) sset("rev:quiz:" + p[1], old);
  });

  function findLesson(id) {
    for (var i = 0; i < ALL.length; i++) if (ALL[i].lesson.id === id) return { pos: i, module: ALL[i].module, index: ALL[i].index, lesson: ALL[i].lesson };
    return null;
  }
  // Link from the current lesson's folder to any lesson.
  function href(from, to) { return to.module === from.module ? to.lesson.file : "../" + to.module.dir + "/" + to.lesson.file; }

  // ---- Number formatting ---------------------------------------------------
  function sig(n, s) {
    if (!isFinite(n)) return "—";
    if (n === 0) return "0";
    var d = Math.max(0, (s || 3) - 1 - Math.floor(Math.log10(Math.abs(n))));
    var r = Number(n.toFixed(Math.min(d, 6)));
    return r.toLocaleString("en-GB", { maximumFractionDigits: Math.min(d, 6) });
  }
  // Format with SI prefix: unit("Ω") → 1.2 kΩ, 450 mA etc.
  function si(n, unit, s) {
    if (!isFinite(n)) return "— " + unit;
    if (n === 0) return "0 " + unit;
    var a = Math.abs(n);
    var p = [[1e9, "G"], [1e6, "M"], [1e3, "k"], [1, ""], [1e-3, "m"], [1e-6, "µ"]];
    for (var i = 0; i < p.length; i++) if (a >= p[i][0] * 0.9995 || i === p.length - 1) return sig(n / p[i][0], s) + " " + p[i][1] + unit;
    return sig(n, s) + " " + unit;
  }

  // ---- Navigation ----------------------------------------------------------
  function nav() {
    var id = document.body.getAttribute("data-lesson");
    var top = document.getElementById("topbar");
    var pager = document.getElementById("pager");
    var f = id ? findLesson(id) : null;
    if (f) {
      var eb = document.querySelector(".lesson-head .eyebrow");
      if (eb) eb.textContent = f.module.title + " · Lesson " + (f.index + 1) + " of " + f.module.lessons.length;
    }
    if (top) {
      // Path back to the course root: lesson pages and pages that set data-root live one folder down.
      var root = document.body.getAttribute("data-root") || (f ? "../" : "");
      var html = '<div class="topbar-inner"><span><a href="' + root + 'index.html">Electrical Theory Revision</a>';
      if (f) html += ' <span class="crumb">/ ' + f.module.title + "</span>";
      html += "</span>";
      if (f) {
        html += '<span class="dots" aria-label="Lessons in ' + f.module.title + '">';
        f.module.lessons.forEach(function (l, i) {
          var cls = (l.id === id ? "current" : score(l.id) ? "done" : "");
          html += '<a class="' + cls + '" href="' + l.file + '" title="' + l.title + '"' + (l.id === id ? ' aria-current="page"' : "") + ">" + (i + 1) + "</a>";
        });
        html += "</span>";
      }
      html += '<a class="toplink" href="' + root + 'review/">Flashcards</a>';
      top.innerHTML = html + "</div>";
    }
    if (pager && f) {
      var h = "", prev = ALL[f.pos - 1], next = ALL[f.pos + 1];
      var label = function (to, dir) { return to.module === f.module ? dir : dir + " · " + to.module.title; };
      if (prev) h += '<a class="prev" href="' + href(f, prev) + '"><span class="eyebrow">← ' + label(prev, "Previous") + "</span><span>" + prev.lesson.title + "</span></a>";
      if (next) h += '<a class="next" href="' + href(f, next) + '"><span class="eyebrow">' + label(next, "Next") + ' →</span><span>' + next.lesson.title + "</span></a>";
      else h += '<a class="next" href="../index.html"><span class="eyebrow">Finished →</span><span>Back to all lessons</span></a>';
      pager.innerHTML = h;
    }
  }

  // ---- Quiz ----------------------------------------------------------------
  // questions: [{ q, options: [..], answer: index, why }]
  function quiz(root, qs) {
    if (typeof root === "string") root = document.querySelector(root);
    var lessonId = document.body.getAttribute("data-lesson");
    root.classList.add("quiz");
    root.innerHTML = "";
    var answered = 0, correct = 0;
    qs.forEach(function (q, i) {
      var fs = document.createElement("fieldset"); fs.className = "q";
      fs.innerHTML = '<legend><span class="qn">' + (i + 1) + ".</span><span>" + q.q + "</span></legend>";
      var opts = document.createElement("div"); opts.className = "opts";
      // Shuffle the options each time, so the right answer isn't always in the same place.
      // Keep the written order when it's a natural sequence: all numbers, or a question marked fixed: true.
      var order = q.options.map(function (o, j) { return j; });
      var numeric = q.options.every(function (o) { return /^[−\-+]?[\d.,]/.test(o.replace(/<[^>]+>/g, "")); });
      if (!q.fixed && !numeric) {
        for (var n = order.length - 1; n > 0; n--) { var r = Math.floor(Math.random() * (n + 1)), t = order[n]; order[n] = order[r]; order[r] = t; }
      }
      var rightBtn = null;
      order.forEach(function (j) {
        var o = q.options[j];
        var b = document.createElement("button"); b.type = "button"; b.className = "opt"; b.innerHTML = o;
        if (j === q.answer) rightBtn = b;
        b.addEventListener("click", function () {
          if (fs.getAttribute("data-done")) return;
          fs.setAttribute("data-done", "1"); answered++;
          var ok = j === q.answer; if (ok) correct++;
          b.classList.add(ok ? "right" : "wrong");
          rightBtn.classList.add("right");
          Array.prototype.forEach.call(opts.children, function (x) { x.disabled = true; });
          var w = document.createElement("p"); w.className = "why " + (ok ? "ok" : "bad");
          w.innerHTML = "<strong>" + (ok ? "Correct." : "Not quite.") + "</strong>" + q.why;
          fs.appendChild(w);
          if (answered === qs.length) finish();
        });
        opts.appendChild(b);
      });
      fs.appendChild(opts); root.appendChild(fs);
    });
    var res = document.createElement("div"); res.className = "quiz-result"; res.hidden = true; root.appendChild(res);
    function finish() {
      var prev = score(lessonId);
      if (lessonId && (!prev || correct >= prev.correct)) sset("rev:quiz:" + lessonId, JSON.stringify({ correct: correct, total: qs.length }));
      res.hidden = false;
      res.innerHTML = "<span>You scored <strong>" + correct + " out of " + qs.length + "</strong>." +
        (correct === qs.length ? " Nailed it." : " Re-read the sections you missed, then try again.") +
        '</span><button type="button" class="btn">Try again</button>';
      res.querySelector("button").addEventListener("click", function () { quiz(root, qs); root.scrollIntoView({ behavior: "smooth", block: "start" }); });
      nav();
    }
  }

  // ---- Practice question generator ----------------------------------------
  // gen() returns { q, answer, unit, working }
  function practice(root, gen) {
    if (typeof root === "string") root = document.querySelector(root);
    var uid = root.id || ("p" + Math.random().toString(36).slice(2, 7));
    root.classList.add("practice");
    root.innerHTML = '<p class="pq"></p><div class="prow"><label class="sr" for="' + uid + '-in" style="position:absolute;left:-9999px">Your answer</label>' +
      '<input type="number" step="any" inputmode="decimal" id="' + uid + '-in"><span class="unit mono"></span>' +
      '<button type="button" class="btn primary">Check</button><button type="button" class="btn ghost">New question</button></div>' +
      '<p class="pfb" aria-live="polite" hidden></p>';
    var cur, input = root.querySelector("input"), fb = root.querySelector(".pfb");
    var btns = root.querySelectorAll("button");
    function next() {
      cur = gen(); root.querySelector(".pq").innerHTML = cur.q; root.querySelector(".unit").textContent = cur.unit;
      input.value = ""; fb.hidden = true;
    }
    function check() {
      var v = parseFloat(input.value);
      if (isNaN(v)) { fb.hidden = false; fb.className = "pfb bad"; fb.innerHTML = "Type a number first."; return; }
      var ok = Math.abs(v - cur.answer) <= Math.max(Math.abs(cur.answer) * 0.02, 0.005);
      fb.hidden = false; fb.className = "pfb " + (ok ? "ok" : "bad");
      fb.innerHTML = (ok ? "<strong>Correct.</strong>" : "<strong>Not quite.</strong> The answer is " + sig(cur.answer, 3) + " " + cur.unit + ".") +
        '<span class="w">' + cur.working + "</span>";
    }
    btns[0].addEventListener("click", check);
    btns[1].addEventListener("click", next);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") check(); });
    next();
  }

  // ---- Formula triangle ----------------------------------------------------
  // cfg: { top: {sym, name, unit}, left: {...}, right: {...}, start: "top"|"left"|"right", values: {top, left, right} }
  // Relationship: top = left × right.
  function triangle(root, cfg) {
    if (typeof root === "string") root = document.querySelector(root);
    var uid = root.id || "tri";
    var keys = ["top", "left", "right"];
    var vals = { top: cfg.values.top, left: cfg.values.left, right: cfg.values.right };
    var unknown = cfg.start || "top";
    root.classList.add("tri");
    root.innerHTML =
      '<svg viewBox="0 0 240 210" role="img" aria-label="Formula triangle: ' + cfg.top.sym + " on top, " + cfg.left.sym + " and " + cfg.right.sym + ' below">' +
      '<path d="M120,10 L230,200 L10,200 Z" fill="var(--surface-2)"/>' +
      '<g class="t-letter" data-k="top" tabindex="0" role="button" aria-label="Find ' + cfg.top.name + '"><path class="t-region" d="M120,10 L177.9,110 L62.1,110 Z"/><text x="120" y="96" text-anchor="middle">' + cfg.top.sym + "</text></g>" +
      '<g class="t-letter" data-k="left" tabindex="0" role="button" aria-label="Find ' + cfg.left.name + '"><path class="t-region" d="M62.1,110 L120,110 L120,200 L10,200 Z"/><text x="78" y="170" text-anchor="middle">' + cfg.left.sym + "</text></g>" +
      '<g class="t-letter" data-k="right" tabindex="0" role="button" aria-label="Find ' + cfg.right.name + '"><path class="t-region" d="M120,110 L177.9,110 L230,200 L120,200 Z"/><text x="162" y="170" text-anchor="middle">' + cfg.right.sym + "</text></g>" +
      '<g class="t-lines"><path d="M120,10 L230,200 L10,200 Z" fill="none" stroke="var(--fg)" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<line x1="62.1" y1="110" x2="177.9" y2="110" stroke="var(--fg)" stroke-width="2"/>' +
      '<line x1="120" y1="110" x2="120" y2="200" stroke="var(--fg)" stroke-width="2"/>' +
      '<text x="120" y="160" text-anchor="middle" font-size="22" fill="var(--muted)" font-family="var(--font-mono)" dx="0" style="paint-order:stroke" stroke="var(--surface-2)" stroke-width="6">×</text></g>' +
      "</svg>" +
      '<div class="t-body"><p class="muted" style="font-size:0.9rem">Tap the letter you want to find. Cover it with your thumb: what\'s left is the formula.</p>' +
      '<div class="t-formula" aria-live="polite"></div><div class="t-inputs"></div><div class="t-result" aria-live="polite"></div></div>';
    var letters = root.querySelectorAll(".t-letter");
    function formula(k) {
      if (k === "top") return cfg.top.sym + " = " + cfg.left.sym + " × " + cfg.right.sym;
      if (k === "left") return cfg.left.sym + " = " + frac(cfg.top.sym, cfg.right.sym);
      return cfg.right.sym + " = " + frac(cfg.top.sym, cfg.left.sym);
    }
    function solve() {
      if (unknown === "top") vals.top = vals.left * vals.right;
      else if (unknown === "left") vals.left = vals.top / vals.right;
      else vals.right = vals.top / vals.left;
    }
    function render() {
      letters.forEach(function (g) { g.classList.toggle("covered", g.getAttribute("data-k") === unknown); g.setAttribute("aria-pressed", String(g.getAttribute("data-k") === unknown)); });
      root.querySelector(".t-formula").innerHTML = formula(unknown);
      var inp = root.querySelector(".t-inputs"); inp.innerHTML = "";
      keys.filter(function (k) { return k !== unknown; }).forEach(function (k) {
        var c = cfg[k];
        var l = document.createElement("label"); l.setAttribute("for", uid + "-" + k);
        l.innerHTML = c.name + " (" + c.unit + ')<input type="number" step="any" id="' + uid + "-" + k + '" value="' + Number(sig(vals[k], 4).replace(/,/g, "")) + '">';
        l.querySelector("input").addEventListener("input", function (e) { var v = parseFloat(e.target.value); if (!isNaN(v)) { vals[k] = v; update(); } });
        inp.appendChild(l);
      });
      update();
    }
    function update() {
      solve();
      var c = cfg[unknown], others = keys.filter(function (k) { return k !== unknown; });
      var a = unknown === "top" ? vals.left : vals.top, b = unknown === "top" ? vals.right : (unknown === "left" ? vals.right : vals.left);
      var expr = unknown === "top" ? sig(a, 4) + " × " + sig(b, 4) : frac(sig(a, 4), sig(b, 4));
      root.querySelector(".t-result").innerHTML = c.sym + " = " + expr + " = " + sig(vals[unknown], 4) + " " + c.unit;
      void others;
    }
    letters.forEach(function (g) {
      function pick() { unknown = g.getAttribute("data-k"); render(); }
      g.addEventListener("click", pick);
      g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } });
    });
    render();
  }

  // ---- Helpers for pages -----------------------------------------------------
  // Stacked fraction markup (numerator over denominator).
  function frac(n, d) { return '<span class="frac"><span>' + n + '</span><span>' + d + '</span></span>'; }
  function cssVar(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  // Map a current to an animation duration: more current = faster dashes.
  function flowDur(amps, ref) {
    if (!(amps > 0)) return 0;
    var x = Math.log10(amps / (ref || 1));
    return Math.max(0.25, Math.min(6, 1.4 - 0.9 * x));
  }
  function setFlow(el, amps, ref, reverse) {
    var d = flowDur(amps, ref);
    el.classList.toggle("off", !d);
    el.classList.toggle("rev", !!reverse);
    if (d) el.style.setProperty("--dur", d.toFixed(2) + "s");
  }
  // Responsive diagrams: calls fn("narrow" | "wide", width) now and whenever the element's width
  // crosses the breakpoint, so a diagram can redraw itself in a layout suited to the space.
  function layout(el, breakpoint, fn) {
    if (typeof el === "string") el = document.querySelector(el);
    var cur = null;
    function check() { var w = el.clientWidth, m = w < breakpoint ? "narrow" : "wide"; if (m !== cur) { cur = m; fn(m, w); } }
    if (window.ResizeObserver) new ResizeObserver(check).observe(el); else window.addEventListener("resize", check);
    check();
  }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  // ---- Acronyms -------------------------------------------------------------
  // The one list of meanings. Pages tag acronyms in their markup with <abbr title> using these
  // same words; this also wraps acronyms in text that scripts add later (quizzes, readouts, captions).
  var ACRONYMS = {
    "AFDD": "arc fault detection device",
    "AC": "alternating current",
    "ADS": "automatic disconnection of supply",
    "BS 7671": "British Standard 7671: the IET Wiring Regulations",
    "CPC": "circuit protective conductor",
    "CPS": "Competent Person Scheme",
    "CSA": "cross-sectional area",
    "DC": "direct current",
    "DNO": "distribution network operator",
    "EAWR": "Electricity at Work Regulations 1989",
    "EIC": "Electrical Installation Certificate",
    "EICR": "Electrical Installation Condition Report",
    "ESQCR": "Electricity Safety, Quality and Continuity Regulations 2002",
    "EV": "electric vehicle",
    "FCU": "fused connection unit",
    "HASAWA": "Health and Safety at Work etc. Act 1974",
    "IET": "Institution of Engineering and Technology",
    "IP": "ingress protection",
    "LED": "light-emitting diode",
    "MCB": "miniature circuit breaker",
    "MEIWC": "Minor Electrical Installation Works Certificate",
    "MET": "main earthing terminal",
    "NAPIT": "National Association of Professional Inspectors and Testers",
    "NICEIC": "National Inspection Council for Electrical Installation Contracting",
    "PAT": "portable appliance testing",
    "PE": "protective earth",
    "PEN": "protective earth and neutral: one conductor doing both jobs",
    "PME": "protective multiple earthing",
    "PV": "photovoltaic",
    "PVC": "polyvinyl chloride",
    "RCBO": "residual current breaker with overcurrent protection",
    "RCCB": "residual current circuit breaker: an RCD without overcurrent protection",
    "RCD": "residual current device",
    "RMS": "root mean square: the effective value of an AC voltage or current",
    "SELV": "separated extra-low voltage",
    "SPD": "surge protective device",
    "TN-C-S": "TN-C-S earthing: supply neutral and earth combined (C) in the supply cable, separate (S) in the installation",
    "TN-S": "TN-S earthing: separate (S) neutral and protective conductors all the way from the transformer",
    "TT": "TT earthing: the installation has its own earth electrode, with no earth from the supply"
  };
  (function () {
    var keys = Object.keys(ACRONYMS).sort(function (a, b) { return b.length - a.length; });
    var esc = function (s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); };
    var RE = new RegExp("(?<![A-Za-z0-9-])(" + keys.map(esc).join("|") + ")(s?)(?![A-Za-z0-9-])", "g");
    var SKIP = { SCRIPT: 1, STYLE: 1, ABBR: 1, TEXTAREA: 1, OPTION: 1, SELECT: 1, TITLE: 1, INPUT: 1, CODE: 1 };
    var SVGNS = "http://www.w3.org/2000/svg";
    function skip(n) {
      for (var el = n.parentNode; el && el.nodeType === 1; el = el.parentNode) {
        if (SKIP[el.nodeName.toUpperCase()] || el.namespaceURI === SVGNS) return true;
      }
      return false;
    }
    function wrap(node) {
      var t = node.nodeValue; RE.lastIndex = 0;
      if (!RE.test(t) || skip(node)) return;
      RE.lastIndex = 0;
      var frag = document.createDocumentFragment(), last = 0, m;
      while ((m = RE.exec(t))) {
        if (m.index > last) frag.appendChild(document.createTextNode(t.slice(last, m.index)));
        var ab = document.createElement("abbr"); ab.title = ACRONYMS[m[1]]; ab.textContent = m[0];
        frag.appendChild(ab); last = m.index + m[0].length;
      }
      if (last < t.length) frag.appendChild(document.createTextNode(t.slice(last)));
      node.parentNode.replaceChild(frag, node);
    }
    function scan(root) {
      if (!root) return;
      if (root.nodeType === 3) { wrap(root); return; }
      if (root.nodeType !== 1 || SKIP[root.nodeName.toUpperCase()] || root.namespaceURI === SVGNS) return;
      var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), list = [], n;
      while ((n = w.nextNode())) list.push(n);
      list.forEach(wrap);
    }
    function start() {
      scan(document.body);
      new MutationObserver(function (muts) {
        muts.forEach(function (mu) { if (mu.type === "characterData") scan(mu.target); else mu.addedNodes.forEach(scan); });
      }).observe(document.body, { childList: true, subtree: true, characterData: true });
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
  })();

  // ---- Scroll position on reload / Back: restore it ourselves.
  // The browser's own restore re-finds an "anchor" element, and inside widgets (whose contents are
  // rebuilt on every click) it can pick the wrong one and land in the wrong place. The diagrams are
  // drawn by script, so once the page's scripts have run a plain pixel offset is reliable.
  (function () {
    try {
      if (!("scrollRestoration" in history)) return;
      history.scrollRestoration = "manual";
      var KEY = "scroll:" + location.pathname;
      addEventListener("pagehide", function () { try { sessionStorage.setItem(KEY, String(scrollY)); } catch (e) {} });
      var nav = performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
      if (!nav || (nav.type !== "reload" && nav.type !== "back_forward") || location.hash) return;
      var y = parseFloat(sessionStorage.getItem(KEY));
      if (!(y > 0)) return;
      var moved = false;
      var go = function () { if (!moved) scrollTo(0, y); };
      // Run after the page's own scripts have built the diagrams, then again once fonts and images
      // have settled (the browser nudges the offset as fonts swap in), unless the reader has taken over.
      // Only real input counts as taking over: scroll events also fire for the browser's own nudges.
      ["wheel", "touchstart", "keydown", "mousedown"].forEach(function (t) {
        addEventListener(t, function () { moved = true; }, { passive: true, capture: true });
      });
      document.addEventListener("DOMContentLoaded", go);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setTimeout(go, 0); });
      addEventListener("load", function () { setTimeout(go, 0); });
    } catch (e) { /* storage blocked: the browser just starts at the top */ }
  })();

  // ---- Clickable diagram parts: focus them without scrolling.
  // Browsers scroll a newly focused element into view, and some SVG groups have odd bounding
  // boxes, so a click could make the page jump. Pressing with a mouse or finger now focuses
  // in place (and doesn't start a text selection); keyboard focus behaves as normal.
  document.addEventListener("mousedown", function (e) {
    var t = e.target.closest && e.target.closest("svg [tabindex]");
    if (!t) return;
    e.preventDefault();
    try { t.focus({ preventScroll: true }); } catch (err) { /* very old browsers: skip focusing */ }
  });

  // ---- Acronyms: tap an <abbr title> to see its meaning (hover tooltips don't work on touch screens)
  (function () {
    var tip = null;
    function hide() { if (tip) { tip.remove(); tip = null; } }
    document.addEventListener("click", function (e) {
      var ab = e.target.closest && e.target.closest("abbr[title]");
      if (!ab || ab.closest("button, a, label")) { hide(); return; }
      hide();
      tip = document.createElement("div"); tip.className = "abbr-tip"; tip.setAttribute("role", "tooltip");
      var b = document.createElement("strong"); b.textContent = ab.textContent + " ";
      tip.appendChild(b); tip.appendChild(document.createTextNode(ab.title));
      document.body.appendChild(tip);
      var r = ab.getBoundingClientRect(), w = tip.offsetWidth;
      tip.style.left = (Math.max(8, Math.min(window.innerWidth - w - 8, r.left + r.width / 2 - w / 2)) + window.scrollX) + "px";
      tip.style.top = (r.bottom + window.scrollY + 6) + "px";
    });
    window.addEventListener("scroll", hide, { passive: true });
    window.addEventListener("resize", hide);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") hide(); });
  })();

  window.Course = {
    MODULES: MODULES, ACRONYMS: ACRONYMS, score: score, frac: frac, quiz: quiz, practice: practice, triangle: triangle,
    sig: sig, si: si, layout: layout, cssVar: cssVar, setFlow: setFlow, rand: rand, pick: pick
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", nav); else nav();
})();
