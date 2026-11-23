/* Spaced repetition: storage, scheduling (SM-2, Anki-style) and typed-answer checking.
   Works with window.CARDS (assets/cards.js). Everything is saved in this browser only.
   Every review is logged, so the scheduler can be swapped (e.g. for FSRS) without losing history. */
(function () {
  "use strict";

  var KEY = "rev:srs:v1";
  var DAY = 86400000;

  // ---- Days (local calendar days, as integers) ------------------------------
  function dayNum(d) { d = d || new Date(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / DAY); }
  function dayToDate(n) { var d = new Date(n * DAY); return new Date(d.getTime() + d.getTimezoneOffset() * 60000); }

  // ---- Storage ---------------------------------------------------------------
  function blank() { return { cards: {}, log: [], settings: { newPerDay: 15, excluded: [], exam: null }, day: { n: 0, newDone: 0 } }; }
  function load() {
    try {
      var s = JSON.parse(window.localStorage.getItem(KEY));
      if (s && s.cards && s.settings) { s.log = s.log || []; s.day = s.day || { n: 0, newDone: 0 }; return s; }
    } catch (e) { /* fall through */ }
    return blank();
  }
  function save(s) {
    if (s.log.length > 20000) s.log = s.log.slice(-20000);
    try { window.localStorage.setItem(KEY, JSON.stringify(s)); return true; } catch (e) { return false; }
  }

  // ---- Pool and queue ----------------------------------------------------------
  function inPool(s, card) { return s.settings.excluded.indexOf(card.lesson) === -1; }
  function newQuota(s) {
    var today = dayNum();
    if (s.day.n !== today) { s.day = { n: today, newDone: 0 }; }
    return Math.max(0, s.settings.newPerDay - s.day.newDone);
  }
  function counts(s, cards) {
    var today = dayNum(), due = 0, fresh = 0, learned = 0;
    cards.forEach(function (c) {
      if (!inPool(s, c)) return;
      var st = s.cards[c.id];
      if (!st) fresh++;
      else { learned++; if (st.due <= today) due++; }
    });
    return { due: due, fresh: fresh, learned: learned, newToday: Math.min(fresh, newQuota(s)) };
  }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  // Due cards (oldest first, shuffled within a day), then new cards in course order, interleaved.
  function buildQueue(s, cards, onlyLesson) {
    var today = dayNum();
    var pool = cards.filter(function (c) { return onlyLesson ? c.lesson === onlyLesson : inPool(s, c); });
    var due = shuffle(pool.filter(function (c) { var st = s.cards[c.id]; return st && st.due <= today; }))
      .sort(function (a, b) { return s.cards[a.id].due - s.cards[b.id].due; });
    var fresh = pool.filter(function (c) { return !s.cards[c.id]; }).slice(0, onlyLesson ? 50 : newQuota(s));
    var q = [];
    while (due.length || fresh.length) {
      if (due.length) q.push(due.shift());
      if (due.length) q.push(due.shift());
      if (fresh.length) q.push(fresh.shift());
    }
    return q;
  }

  // ---- SM-2 scheduling -----------------------------------------------------------
  // grade: 1 Again, 2 Hard, 3 Good, 4 Easy. Returns the new state without saving it.
  function next(st, grade) {
    var today = dayNum();
    st = st ? { ivl: st.ivl, ease: st.ease, reps: st.reps, lapses: st.lapses } : { ivl: 0, ease: 2.5, reps: 0, lapses: 0 };
    var ivl;
    if (grade === 1) {
      st.lapses += st.reps > 0 ? 1 : 0; st.ease = Math.max(1.3, st.ease - 0.2); ivl = 0;
    } else if (st.ivl === 0) {          // new or relearning: first successful step
      ivl = grade === 2 ? 1 : grade === 3 ? 1 : 4;
      if (grade === 4) st.ease += 0.15;
    } else if (grade === 2) {
      ivl = Math.max(st.ivl + 1, Math.round(st.ivl * 1.2)); st.ease = Math.max(1.3, st.ease - 0.15);
    } else if (grade === 3) {
      ivl = Math.max(st.ivl + 1, Math.round(st.ivl * st.ease));
    } else {
      ivl = Math.max(st.ivl + 2, Math.round(st.ivl * st.ease * 1.3)); st.ease += 0.15;
    }
    st.ivl = ivl; st.reps += 1; st.due = today + ivl;
    return st;
  }
  function capToExam(s, st) {
    var ex = s.settings.exam, today = dayNum();
    if (ex && ex > today + 1 && st.due >= ex) { st.due = ex - 1; st.ivl = st.due - today; }
    return st;
  }
  function preview(s, id, grade) { return capToExam(s, next(s.cards[id], grade)).ivl; }
  function record(s, card, grade, ok, typed) {
    var wasNew = !s.cards[card.id];
    var st = capToExam(s, next(s.cards[card.id], grade));
    st.last = Date.now();
    s.cards[card.id] = st;
    if (wasNew) { newQuota(s); s.day.newDone += 1; }
    s.log.push({ id: card.id, t: Date.now(), g: grade, ivl: st.ivl, ok: ok ? 1 : 0, a: String(typed || "").slice(0, 60) });
    save(s);
    return st;
  }
  function ivlText(d) {
    if (d <= 0) return "again today";
    if (d === 1) return "tomorrow";
    if (d < 31) return d + " days";
    if (d < 365) return Math.round(d / 30) + " months";
    return (Math.round(d / 36.5) / 10) + " years";
  }

  // ---- Answer checking ------------------------------------------------------------
  // Normalise typed text: case, spaces, punctuation, symbol variants.
  function norm(t) {
    return String(t).toLowerCase()
      .replace(/[−–—]/g, "-").replace(/[×*]/g, "x").replace(/÷/g, "/")
      .replace(/²/g, "^2").replace(/√/g, "sqrt")
      .replace(/ω/g, "ohm").replace(/Ω/gi, "ohm").replace(/ohms\b/g, "ohm")
      .replace(/[.,!?;:"'()]/g, " ")
      .replace(/^\s*(the|a|an)\s+/, "")
      .replace(/\s*([+\-x\/=^])\s*/g, "$1")
      .replace(/\s+/g, " ").trim();
  }
  function lev(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 9;
    var p = [], i, j;
    for (j = 0; j <= b.length; j++) p[j] = j;
    for (i = 1; i <= a.length; i++) {
      var prev = p[0]; p[0] = i;
      for (j = 1; j <= b.length; j++) {
        var tmp = p[j];
        p[j] = Math.min(p[j] + 1, p[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
        prev = tmp;
      }
    }
    return p[b.length];
  }
  // Read a number from typed text: "13", "13.04 A", "200,000,000", "1/1000", "10^6", "1e6", "2 x 10^-3".
  function parseNum(t) {
    // Skip leading words, so "Zone 0", "Part 7" and "Section 701" read as numbers.
    var s = String(t).replace(/[−–]/g, "-").replace(/,/g, "").toLowerCase().replace(/^[a-z][a-z\s.:]*?(?=[-\d.])/, "").replace(/\s+/g, "").replace(/[×*]/g, "x").replace(/^\+/, "");
    var m;
    if ((m = s.match(/^(-?\d*\.?\d+)x10\^(-?\d+)/))) return parseFloat(m[1]) * Math.pow(10, parseInt(m[2], 10));
    if ((m = s.match(/^10\^(-?\d+)/))) return Math.pow(10, parseInt(m[1], 10));
    if ((m = s.match(/^(-?\d*\.?\d+)\/(\d*\.?\d+)/))) return parseFloat(m[1]) / parseFloat(m[2]);
    if ((m = s.match(/^(-?\d*\.?\d+(?:e-?\d+)?)/))) return parseFloat(m[1]);
    return NaN;
  }
  // Evaluate a typed maths expression safely (no eval): numbers, + − × ÷ ^, brackets,
  // square roots (√, sqrt, root, "square root of") and π. Implicit multiplication like "2π" works.
  // Returns NaN for anything it can't read.
  function evalExpr(t) {
    var src = String(t).toLowerCase()
      .replace(/square\s*root\s*of|squareroot|sqrt|root|√/g, "√")
      .replace(/pi|π/g, "π").replace(/[×*]|(?<=[\d)π])\s*x\s*(?=[\d(√π])/g, "*")
      .replace(/÷/g, "/").replace(/[−–—]/g, "-").replace(/,/g, "").replace(/\s+/g, "");
    var toks = src.match(/\d*\.?\d+(?:e-?\d+)?|[+\-*\/^()√π]/g);
    if (!toks || toks.join("") !== src) return NaN;
    var i = 0;
    function peek() { return toks[i]; }
    function expr() { var v = term(); while (peek() === "+" || peek() === "-") { var op = toks[i++]; var r = term(); v = op === "+" ? v + r : v - r; } return v; }
    function term() {
      var v = factor();
      for (;;) {
        var p = peek();
        if (p === "*" || p === "/") { i++; var r = factor(); v = p === "*" ? v * r : v / r; }
        else if (p !== undefined && /^[\d.(√π]/.test(p)) v = v * factor();   // implicit: 2π, 3√2
        else return v;
      }
    }
    function factor() { var b = unary(); if (peek() === "^") { i++; return Math.pow(b, factor()); } return b; }
    function unary() {
      var p = peek();
      if (p === "-") { i++; return -unary(); }
      if (p === "+") { i++; return unary(); }
      if (p === "√") { i++; return Math.sqrt(unary()); }
      return primary();
    }
    function primary() {
      var p = toks[i++];
      if (p === undefined) return NaN;
      if (p === "π") return Math.PI;
      if (p === "(") { var v = expr(); if (toks[i++] !== ")") return NaN; return v; }
      var n = parseFloat(p); return isNaN(n) ? NaN : n;
    }
    var out = expr();
    return i === toks.length ? out : NaN;
  }

  // Returns { ok, typo } for a card. Numeric cards: card.num (+ optional card.tol, a fraction, default 0.02).
  function check(card, typed) {
    if (!String(typed).trim()) return { ok: false };
    if (typeof card.num === "number") {
      var v = parseNum(typed);
      if (isNaN(v) || /[\^√(]|sqrt|root|pi|π/i.test(typed)) { var e = evalExpr(typed); if (!isNaN(e)) v = e; }
      if (isNaN(v)) return { ok: false };
      var tol = card.tol != null ? card.tol : 0.02;
      return { ok: Math.abs(v - card.num) <= Math.max(Math.abs(card.num) * tol, 1e-12) };
    }
    var n = norm(typed);
    var accept = (card.accept || []).map(norm);
    if (accept.indexOf(n) !== -1) return { ok: true };
    // Allow one typo in longer word answers (not in short symbols like "I" or "R"),
    // but never one that changes a number: "sqrt2" must not pass for "sqrt3".
    // Nor one that changes a short word: "type a" must not pass for "type b", or "part p" for "part b".
    var digits = function (x) { return x.replace(/\D/g, ""); };
    var shorts = function (x) { return x.split(/[^a-z0-9]+/).filter(function (w) { return w && w.length <= 2; }).join(" "); };
    for (var i = 0; i < accept.length; i++) {
      if (accept[i].length >= 5 && /[a-z]{3}/.test(accept[i]) && digits(n) === digits(accept[i]) && shorts(n) === shorts(accept[i]) && lev(n, accept[i]) <= 1) return { ok: true, typo: true };
    }
    // Cards with a numeric value as well (e.g. √2): accept anything that works out to it.
    if (typeof card.alsoNum === "number") {
      var ev = evalExpr(typed);
      if (!isNaN(ev) && Math.abs(ev - card.alsoNum) <= Math.abs(card.alsoNum) * (card.alsoTol || 0.005)) return { ok: true };
    }
    return { ok: false };
  }

  window.SRS = {
    load: load, save: save, blank: blank, counts: counts, buildQueue: buildQueue, record: record, preview: preview,
    ivlText: ivlText, check: check, evalExpr: evalExpr, dayNum: dayNum, dayToDate: dayToDate, inPool: inPool, newQuota: newQuota, KEY: KEY
  };
})();
