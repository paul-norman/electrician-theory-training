/* Builds an exam page from EXAMS (assets/exams.js): the format, your exam date, what it covers, tips,
   related lessons and the mock exam. The page's <body data-exam="id"> says which exam. */
(function () {
  "use strict";
  var id = document.body.getAttribute("data-exam"), ex = EXAMS.find(id), host = document.getElementById("exam");
  if (!ex || !host) return;
  var perQ = Math.round(ex.minutes * 60 / ex.questions / 6) / 10; // minutes per question, 1 decimal place
  var html =
    '<div class="facts readouts">' +
    '<div class="ro"><span class="k">Questions</span><span class="v">' + ex.questions + '</span><span class="s">multiple choice, online</span></div>' +
    '<div class="ro"><span class="k">Time</span><span class="v">' + ex.minutes + ' min</span><span class="s">about ' + perQ + " min a question</span></div>" +
    '<div class="ro"><span class="k">Book allowed</span><span class="v" style="font-size:1rem">Open book</span><span class="s">' + ex.book + "</span></div>" +
    "</div>" +
    '<section class="widget" aria-labelledby="dateH"><div class="widget-title"><span class="eyebrow">Your exam</span><h3 id="dateH">When are you sitting it?</h3></div>' +
    '<div class="exam-date"><label for="exDate" class="label" style="font-size:0.85rem;font-weight:600">Exam date</label><input type="date" id="exDate"><span class="when" id="exWhen" aria-live="polite"></span>' +
    '<button type="button" class="btn ghost" id="exClear">Clear</button></div>' +
    '<p class="caption">Saved in this browser only. On the course, this exam is normally on the ' + ex.day + " of exam week.</p></section>" +
    '<section class="prose"><h2>What it covers</h2><ul>' + ex.covers.map(function (c) { return "<li>" + c + "</li>"; }).join("") + "</ul>" +
    "<p>Revise with: " + ex.lessons.map(function (l) { return '<a href="' + l[0] + '">' + l[1] + "</a>"; }).join(", ") + ".</p></section>" +
    '<section class="prose"><h2>Tips for this exam</h2><ul>' + ex.tips.map(function (t) { return "<li>" + t + "</li>"; }).join("") + "</ul>" +
    '<p>For general exam technique, see <a href="index.html">Exams</a>.</p></section>' +
    '<section class="widget" aria-labelledby="mockH"><div class="widget-title"><span class="eyebrow">Mock exam</span><h3 id="mockH">' + ex.title + " mock</h3></div>" +
    '<div id="mock"></div></section>' +
    (ex.code ? '<p class="caption">Qualification: ' + ex.qual + " (exam " + ex.code + ").</p>" : '<p class="caption">Qualification: ' + ex.qual + ".</p>");
  host.innerHTML = html;

  var input = document.getElementById("exDate");
  function when() { var v = EXAMS.getDate(id); input.value = v; document.getElementById("exWhen").textContent = v ? EXAMS.countdown(v) : "No date set"; document.getElementById("exClear").hidden = !v; }
  input.addEventListener("change", function () { EXAMS.setDate(id, input.value); when(); });
  document.getElementById("exClear").addEventListener("click", function () { EXAMS.setDate(id, ""); when(); });
  when();
  Mock.mount("#mock", ex);
})();
