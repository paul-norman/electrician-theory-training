/* Mock exam engine. Mock.mount(rootEl, exam) where exam comes from EXAMS (assets/exams.js) and its
   question bank is window[exam.bank] = { topics: {key: name}, questions: [{ id, topic, q, options, answer, why, ref }] }.
   Two modes: timed (like the real exam: countdown, flag and return, marked at the end) and practice
   (no timer, each answer marked as you go). An attempt in progress survives a reload. */
(function () {
  "use strict";
  var LIVE = function (id) { return "rev:mock:" + id + ":live"; };
  var HIST = function (id) { return "rev:mock:" + id + ":hist"; };
  function load(k) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  function save(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function range(n) { for (var a = [], i = 0; i < n; i++) a.push(i); return a; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function mmss(s) { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2); }
  var LETTERS = ["A", "B", "C", "D", "E", "F"];

  // Per-topic totals across every saved attempt at one exam (attempts saved before topics were recorded are skipped).
  // Returns [{ key, name, right, total, pct, links }], weakest first.
  function topicStats(examId, bank) {
    var sum = {};
    (load(HIST(examId)) || []).forEach(function (r) {
      if (!r.t) return;
      Object.keys(r.t).forEach(function (k) { sum[k] = sum[k] || [0, 0]; sum[k][0] += r.t[k][0]; sum[k][1] += r.t[k][1]; });
    });
    return Object.keys(sum).filter(function (k) { return bank.topics[k]; }).map(function (k) {
      return { key: k, name: bank.topics[k], right: sum[k][0], total: sum[k][1], pct: Math.round(100 * sum[k][0] / sum[k][1]), links: (bank.links && bank.links[k]) || [] };
    }).sort(function (a, b) { return a.pct - b.pct || b.total - a.total; });
  }
  // Lesson links, as HTML. root is the path from the current page to the course root.
  function linkList(links, root) { return links.map(function (l) { return '<a href="' + root + l[0] + '">' + l[1] + "</a>"; }).join(", "); }

  // Pick n questions spread across the topics in proportion to the bank (largest remainder), in random order.
  function draw(bank, n) {
    var byTopic = {}, Q = bank.questions;
    Q.forEach(function (q) { (byTopic[q.topic] = byTopic[q.topic] || []).push(q.id); });
    var keys = Object.keys(byTopic), total = Q.length, quota = {}, used = 0;
    n = Math.min(n, total);
    var rem = keys.map(function (k) { var exact = n * byTopic[k].length / total; quota[k] = Math.floor(exact); used += quota[k]; return [k, exact - quota[k]]; });
    shuffle(rem).sort(function (a, b) { return b[1] - a[1]; });
    for (var i = 0; used < n; i = (i + 1) % rem.length) { var k = rem[i][0]; if (quota[k] < byTopic[k].length) { quota[k]++; used++; } }
    var picked = [];
    keys.forEach(function (k) { picked = picked.concat(shuffle(byTopic[k].slice()).slice(0, quota[k])); });
    return shuffle(picked);
  }
  // Keep a natural order (all options numeric) unchanged; otherwise shuffle.
  function perm(q) {
    var numeric = q.options.every(function (o) { return /^[−\-+]?[\d.,]/.test(String(o).replace(/<[^>]+>/g, "")); });
    return numeric || q.fixed ? range(q.options.length) : shuffle(range(q.options.length));
  }

  function mount(root, exam) {
    if (typeof root === "string") root = document.querySelector(root);
    var bank = window[exam.bank];
    if (!bank) { root.innerHTML = '<p class="muted">The question bank for this exam is still being written.</p>'; return; }
    var byId = {}; bank.questions.forEach(function (q) { byId[q.id] = q; });
    var st = null, timer = null, mode = "timed", reviewWrongOnly = false;

    function hist() { return load(HIST(exam.id)) || []; }
    function liveValid(l) { return l && l.ids && l.ids.every(function (id) { return byId[id]; }); }

    // ---------- Start screen ----------
    function startView() {
      stopTimer();
      var live = load(LIVE(exam.id)); if (!liveValid(live)) { live = null; save(LIVE(exam.id), null); }
      var h = hist(), best = h.reduce(function (b, r) { return r.mode === "timed" && (!b || r.score / r.total > b.score / b.total) ? r : b; }, null);
      var html = '<div class="mock-start">';
      if (live) {
        var answered = Object.keys(live.ans).length, left = live.deadline ? (live.deadline - Date.now()) / 1000 : null;
        html += '<div class="callout info"><h3>You have a mock in progress</h3><p>' + (live.mode === "timed" ? "Timed exam" : "Practice") + ": " + answered + " of " + live.ids.length + " answered" +
          (left !== null ? (left > 0 ? ", " + mmss(left) + " left on the clock." : ". Time ran out, so it will be marked now.") : ".") + "</p>" +
          '<div class="mock-row"><button type="button" class="btn primary" data-act="resume">' + (left !== null && left <= 0 ? "See the results" : "Resume") + '</button><button type="button" class="btn" data-act="abandon">Abandon it</button></div></div>';
      }
      html += '<div class="controls"><div class="ctl"><span class="label" id="mmL">Mode</span><div class="seg" role="group" aria-labelledby="mmL" id="mockMode">' +
        '<button type="button" data-m="timed" aria-pressed="' + (mode === "timed") + '">Timed exam</button>' +
        '<button type="button" data-m="practice" aria-pressed="' + (mode === "practice") + '">Practice</button></div></div></div>' +
        '<p class="muted" id="modeNote"></p>' +
        '<div class="mock-row"><button type="button" class="btn primary" data-act="start">Start a new mock</button></div>';
      var ts = topicStats(exam.id, bank);
      if (ts.length) {
        html += '<h3 style="margin-top:6px">Your topics so far</h3><p class="muted">All your mocks for this exam added together, weakest first.</p>' +
          '<div class="table-wrap"><table><thead><tr><th>Topic</th><th>Right</th><th>Revise</th></tr></thead><tbody>' +
          ts.map(function (x) { return "<tr><td>" + x.name + '</td><td class="mono">' + x.pct + "% (" + x.right + "/" + x.total + ")</td><td>" + (x.pct < 70 ? linkList(x.links, "../") : '<span class="muted">—</span>') + "</td></tr>"; }).join("") +
          "</tbody></table></div>";
      }
      if (h.length) {
        html += '<h3 style="margin-top:6px">Your results</h3>' + (best ? '<p>Best timed score: <strong>' + best.score + " out of " + best.total + "</strong> (" + Math.round(100 * best.score / best.total) + "%).</p>" : "") +
          '<div class="table-wrap"><table><thead><tr><th>Date</th><th>Mode</th><th>Score</th><th>Time</th></tr></thead><tbody>' +
          h.slice(0, 8).map(function (r) {
            return "<tr><td>" + new Date(r.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) + "</td><td>" + (r.mode === "timed" ? "Timed" : "Practice") + '</td><td class="mono">' + r.score + "/" + r.total + " (" + Math.round(100 * r.score / r.total) + '%)</td><td class="mono">' + mmss(r.secs) + "</td></tr>";
          }).join("") + "</tbody></table></div>";
      }
      root.innerHTML = html + "</div>";
      note();
    }
    function note() {
      var n = root.querySelector("#modeNote"); if (!n) return;
      n.textContent = mode === "timed"
        ? exam.questions + " questions drawn at random from " + bank.questions.length + ", " + exam.minutes + " minutes on the clock. Flag questions to come back to, and see your marks at the end, like the real exam."
        : exam.questions + " random questions, no clock. Each answer is marked straight away, with an explanation and where to find it in the book.";
    }

    // ---------- Running a mock ----------
    function begin() {
      var ids = draw(bank, exam.questions), order = {};
      ids.forEach(function (id) { order[id] = perm(byId[id]); });
      st = { mode: mode, ids: ids, order: order, ans: {}, flags: {}, cur: 0, started: Date.now(), deadline: mode === "timed" ? Date.now() + exam.minutes * 60000 : null };
      persist(); examView(true);
    }
    function persist() { save(LIVE(exam.id), st); }
    function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }
    function tick() {
      var el = root.querySelector("#mockClock"); if (!el || !st || !st.deadline) return;
      var left = (st.deadline - Date.now()) / 1000;
      el.textContent = mmss(left);
      el.classList.toggle("low", left <= 300);
      var said = root.querySelector("#mockSay");
      if (said && Math.ceil(left) === 300) said.textContent = "Five minutes left.";
      if (said && Math.ceil(left) === 60) said.textContent = "One minute left.";
      if (left <= 0) finish(true);
    }

    function examView(scrollTop) {
      stopTimer();
      var timed = st.mode === "timed";
      root.innerHTML =
        '<div class="mock-bar"><span class="mock-pos" id="mockPos"></span>' +
        (timed ? '<span class="mock-clock mono" id="mockClock" role="timer" aria-label="Time left"></span>' : '<span class="muted">Practice: no clock</span>') +
        '<button type="button" class="btn" data-act="finish">' + (timed ? "Finish and mark" : "Finish") + "</button></div>" +
        '<p class="sr-only" id="mockSay" aria-live="polite"></p>' +
        '<div class="mock-q" id="mockQ"></div>' +
        '<div class="mock-row mock-nav"><button type="button" class="btn" data-act="prev">← Previous</button><button type="button" class="btn" data-act="flag" id="flagBtn"></button><button type="button" class="btn primary" data-act="next">Next →</button></div>' +
        '<div class="mock-grid" id="mockGrid" aria-label="Questions"></div>' +
        '<div id="mockConfirm"></div>';
      if (timed) { tick(); timer = setInterval(tick, 1000); }
      showQ(scrollTop);
    }
    function showQ(scroll) {
      var id = st.ids[st.cur], q = byId[id], p = st.order[id], chosen = st.ans[st.cur], timed = st.mode === "timed", done = !timed && chosen !== undefined;
      root.querySelector("#mockPos").textContent = "Question " + (st.cur + 1) + " of " + st.ids.length;
      var html = '<p class="mock-text">' + q.q + '</p><div class="mock-opts" role="group" aria-label="Answers">';
      p.forEach(function (oi, k) {
        var cls = "opt";
        if (chosen === oi) cls += " chosen";
        if (done && oi === q.answer) cls += " right";
        else if (done && chosen === oi) cls += " wrong";
        html += '<button type="button" class="' + cls + '" data-o="' + oi + '" aria-pressed="' + (chosen === oi) + '"' + (done ? " disabled" : "") + '><span class="ltr">' + LETTERS[k] + "</span><span>" + q.options[oi] + "</span></button>";
      });
      html += "</div>";
      if (done) html += '<div class="mock-why ' + (chosen === q.answer ? "ok" : "bad") + '"><strong>' + (chosen === q.answer ? "Correct." : "Not quite.") + "</strong> " + q.why + '<span class="ref">Where to look: ' + q.ref + "</span></div>";
      root.querySelector("#mockQ").innerHTML = html;
      var fb = root.querySelector("#flagBtn");
      fb.textContent = st.flags[st.cur] ? "⚑ Flagged" : "⚐ Flag";
      fb.setAttribute("aria-pressed", String(!!st.flags[st.cur]));
      root.querySelector('[data-act="prev"]').disabled = st.cur === 0;
      root.querySelector('[data-act="next"]').textContent = st.cur === st.ids.length - 1 ? "Review →" : "Next →";
      grid();
      if (scroll) { var top = root.getBoundingClientRect().top; if (top < 0 || top > window.innerHeight * 0.5) root.scrollIntoView({ block: "start" }); }
    }
    function grid() {
      var timed = st.mode === "timed", h = "";
      st.ids.forEach(function (id, i) {
        var a = st.ans[i], cls = "g";
        if (a !== undefined) cls += timed ? " answered" : (a === byId[id].answer ? " right" : " wrong");
        if (st.flags[i]) cls += " flagged";
        if (i === st.cur) cls += " current";
        h += '<button type="button" class="' + cls + '" data-g="' + i + '" aria-label="Question ' + (i + 1) + (a !== undefined ? ", answered" : "") + (st.flags[i] ? ", flagged" : "") + '"' + (i === st.cur ? ' aria-current="true"' : "") + ">" + (i + 1) + "</button>";
      });
      root.querySelector("#mockGrid").innerHTML = h;
    }
    function choose(oi) {
      var timed = st.mode === "timed";
      if (!timed && st.ans[st.cur] !== undefined) return;
      st.ans[st.cur] = oi; persist(); showQ(false);
    }
    function go(i) { if (i < 0 || i >= st.ids.length) return; st.cur = i; persist(); showQ(true); root.querySelector("#mockConfirm").innerHTML = ""; }

    function askFinish() {
      var unans = st.ids.length - Object.keys(st.ans).length, flagged = Object.keys(st.flags).filter(function (k) { return st.flags[k]; }).length;
      if (!unans && !flagged) { finish(false); return; }
      var msg = [];
      if (unans) msg.push(unans + " unanswered");
      if (flagged) msg.push(flagged + " flagged");
      root.querySelector("#mockConfirm").innerHTML = '<div class="callout info"><p>You have ' + msg.join(" and ") + " question" + (unans + flagged === 1 ? "" : "s") + ". " +
        (unans ? "An unanswered question scores nothing, so it's always worth a guess." : "") + '</p><div class="mock-row"><button type="button" class="btn" data-act="back">Go back</button><button type="button" class="btn primary" data-act="mark">Finish and mark</button></div></div>';
      root.querySelector("#mockConfirm").scrollIntoView({ block: "nearest" });
    }

    // ---------- Results ----------
    function finish(timeUp) {
      stopTimer();
      var score = 0, secs = Math.min((Date.now() - st.started) / 1000, st.deadline ? exam.minutes * 60 : Infinity);
      st.ids.forEach(function (id, i) { if (st.ans[i] === byId[id].answer) score++; });
      var t = {};
      st.ids.forEach(function (id, i) { var k = byId[id].topic; t[k] = t[k] || [0, 0]; t[k][1]++; if (st.ans[i] === byId[id].answer) t[k][0]++; });
      var h = hist(); h.unshift({ date: Date.now(), mode: st.mode, score: score, total: st.ids.length, secs: Math.round(secs), t: t }); save(HIST(exam.id), h.slice(0, 30));
      save(LIVE(exam.id), null);
      resultsView(st, score, secs, timeUp);
      st = null;
    }
    function resultsView(s, score, secs, timeUp) {
      var pct = Math.round(100 * score / s.ids.length), topics = {};
      s.ids.forEach(function (id, i) { var t = byId[id].topic; topics[t] = topics[t] || [0, 0]; topics[t][1]++; if (s.ans[i] === byId[id].answer) topics[t][0]++; });
      var html = '<div class="mock-result">' + (timeUp ? '<p class="mock-timeup">Time\'s up. Your answers so far have been marked.</p>' : "") +
        '<p class="mock-score"><span class="big mono">' + score + "/" + s.ids.length + '</span><span>' + pct + "% · " + mmss(secs) + " taken" + (s.mode === "timed" ? " of " + exam.minutes + ":00" : "") + "</span></p>" +
        '<div class="table-wrap"><table><thead><tr><th>Topic</th><th>Score</th><th>Revise</th></tr></thead><tbody>' +
        Object.keys(bank.topics).filter(function (k) { return topics[k]; }).map(function (k) {
          var weak = topics[k][0] / topics[k][1] < 0.7;
          return "<tr><td>" + bank.topics[k] + '</td><td class="mono">' + topics[k][0] + "/" + topics[k][1] + "</td><td>" + (weak && bank.links && bank.links[k] ? linkList(bank.links[k], "../") : '<span class="muted">—</span>') + "</td></tr>";
        }).join("") +
        '</tbody></table></div><div class="mock-row"><button type="button" class="btn primary" data-act="again">Start another mock</button><button type="button" class="btn" data-act="home">Back to the start</button></div>' +
        '<h3>Check your answers</h3><label class="check" for="wrongOnly"><input type="checkbox" id="wrongOnly"' + (reviewWrongOnly ? " checked" : "") + "> Only show the ones I got wrong</label>" +
        '<ol class="mock-review" id="mockReview"></ol></div>';
      root.innerHTML = html;
      function list() {
        root.querySelector("#mockReview").innerHTML = s.ids.map(function (id, i) {
          var q = byId[id], a = s.ans[i], ok = a === q.answer;
          if (reviewWrongOnly && ok) return "";
          return '<li value="' + (i + 1) + '" class="' + (ok ? "ok" : "bad") + '"><p class="mock-text">' + q.q + "</p>" +
            '<p><span class="mock-tag ' + (ok ? "ok" : "bad") + '">' + (ok ? "Correct" : a === undefined ? "Not answered" : "Wrong") + "</span> " +
            (a !== undefined && !ok ? "You said: " + q.options[a] + ". " : "") + "Answer: <strong>" + q.options[q.answer] + "</strong></p>" +
            '<p class="muted">' + q.why + '</p><p class="ref">Where to look: ' + q.ref + "</p></li>";
        }).join("") || '<li class="ok"><p>Nothing wrong. Well done.</p></li>';
      }
      list();
      root.querySelector("#wrongOnly").addEventListener("change", function () { reviewWrongOnly = this.checked; list(); });
      root.scrollIntoView({ block: "start" });
    }

    // ---------- Events ----------
    root.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b || !root.contains(b)) return;
      var act = b.getAttribute("data-act");
      if (b.closest("#mockMode")) { mode = b.getAttribute("data-m"); root.querySelectorAll("#mockMode button").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); note(); return; }
      if (b.hasAttribute("data-o")) { choose(+b.getAttribute("data-o")); return; }
      if (b.hasAttribute("data-g")) { go(+b.getAttribute("data-g")); return; }
      if (act === "start" || act === "again") begin();
      else if (act === "resume") { st = load(LIVE(exam.id)); if (st.deadline && st.deadline <= Date.now()) finish(true); else examView(true); }
      else if (act === "abandon") { save(LIVE(exam.id), null); startView(); }
      else if (act === "prev") go(st.cur - 1);
      else if (act === "next") { if (st.cur === st.ids.length - 1) askFinish(); else go(st.cur + 1); }
      else if (act === "flag") { st.flags[st.cur] = !st.flags[st.cur]; if (!st.flags[st.cur]) delete st.flags[st.cur]; persist(); showQ(false); }
      else if (act === "finish") askFinish();
      else if (act === "back") root.querySelector("#mockConfirm").innerHTML = "";
      else if (act === "mark") finish(false);
      else if (act === "home") startView();
    });
    // Keyboard: A–D choose, ← → move, F flag (only while a mock is running and you're not typing in a field).
    document.addEventListener("keydown", function (e) {
      if (!st || !root.querySelector("#mockQ") || e.ctrlKey || e.metaKey || e.altKey) return;
      if (/^(INPUT|SELECT|TEXTAREA)$/.test((e.target.tagName || ""))) return;
      var k = e.key.toUpperCase(), li = LETTERS.indexOf(k), p = st.order[st.ids[st.cur]];
      if (li >= 0 && li < p.length) { choose(p[li]); e.preventDefault(); }
      else if (e.key === "ArrowRight") { if (st.cur < st.ids.length - 1) go(st.cur + 1); e.preventDefault(); }
      else if (e.key === "ArrowLeft") { go(st.cur - 1); e.preventDefault(); }
      else if (k === "F") { st.flags[st.cur] = !st.flags[st.cur]; if (!st.flags[st.cur]) delete st.flags[st.cur]; persist(); showQ(false); }
    });
    startView();
  }
  window.Mock = { mount: mount, draw: draw, topicStats: topicStats, linkList: linkList };
})();
