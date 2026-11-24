/* Flashcards for spaced repetition (review/index.html).
   Each card:
     id      stable and unique: never reuse or renumber, progress is stored against it
     lesson  lesson id from MODULES in course.js
     q       question (HTML allowed: fractions, sub/superscripts, abbr, inline SVG)
     a       the answer as shown after checking (HTML)
     accept  typed answers that count as correct (case, spacing and punctuation are ignored)
     num     for numeric answers instead of accept: the value, with optional tol (fraction, default 0.02)
     alsoNum with accept: also accept any typed expression worth this value (e.g. 2^0.5 for √2), within alsoTol (default 0.005)
     unit    optional hint shown after the input box
     why     optional explanation shown after checking */
(function () {
  "use strict";
  var F = function (n, d) { return '<span class="frac"><span>' + n + "</span><span>" + d + "</span></span>"; };

  // Circuit symbols, drawn as on the "Voltage, current and resistance" page.
  var S = 'stroke="var(--fg)" stroke-width="2.5" fill="none" stroke-linecap="round"';
  var wires = function (a, b) { return '<line x1="8" y1="40" x2="' + a + '" y2="40" ' + S + '/><line x1="' + b + '" y1="40" x2="152" y2="40" ' + S + "/>"; };
  var meter = function (L) {
    return wires(56, 104) + '<circle cx="80" cy="40" r="24" fill="var(--surface)" stroke="var(--fg)" stroke-width="2.5"/>' +
      '<text x="80" y="47" text-anchor="middle" style="font-family:var(--font-display);font-weight:800;font-size:20px;fill:var(--fg)">' + L + "</text>";
  };
  var box = function (inner) { return '<svg class="card-sym" viewBox="0 0 160 80" role="img" aria-label="Circuit symbol">' + inner + "</svg>"; };
  var SYM = {
    cell: wires(74, 88) + '<line x1="74" y1="18" x2="74" y2="62" ' + S + '/><line x1="88" y1="28" x2="88" y2="52" stroke="var(--fg)" stroke-width="6"/>',
    battery: wires(46, 114) + '<line x1="46" y1="18" x2="46" y2="62" ' + S + '/><line x1="58" y1="28" x2="58" y2="52" stroke="var(--fg)" stroke-width="6"/><line x1="62" y1="40" x2="98" y2="40" stroke="var(--fg)" stroke-width="2" stroke-dasharray="4 4"/><line x1="102" y1="18" x2="102" y2="62" ' + S + '/><line x1="114" y1="28" x2="114" y2="52" stroke="var(--fg)" stroke-width="6"/>',
    ac: wires(56, 104) + '<circle cx="80" cy="40" r="24" fill="var(--surface)" stroke="var(--fg)" stroke-width="2.5"/><path d="M66,40 C70,28 76,28 80,40 S90,52 94,40" fill="none" stroke="var(--fg)" stroke-width="2.5"/>',
    sw: wires(58, 102) + '<line x1="62" y1="40" x2="96" y2="20" ' + S + '/><circle cx="62" cy="40" r="4" fill="var(--surface)" stroke="var(--fg)" stroke-width="2"/><circle cx="98" cy="40" r="4" fill="var(--surface)" stroke="var(--fg)" stroke-width="2"/>',
    res: wires(50, 110) + '<rect x="50" y="28" width="60" height="24" rx="2" fill="var(--surface)" stroke="var(--fg)" stroke-width="2.5"/>',
    vres: wires(50, 110) + '<rect x="50" y="28" width="60" height="24" rx="2" fill="var(--surface)" stroke="var(--fg)" stroke-width="2.5"/><line x1="46" y1="66" x2="112" y2="12" stroke="var(--fg)" stroke-width="2"/><path d="M112,12 L100,14 L106,22 Z" fill="var(--fg)"/>',
    lamp: wires(58, 102) + '<circle cx="80" cy="40" r="22" fill="var(--surface)" stroke="var(--fg)" stroke-width="2.5"/><path d="M64.5,24.5 L95.5,55.5 M95.5,24.5 L64.5,55.5" stroke="var(--fg)" stroke-width="2"/>',
    fuse: wires(50, 110) + '<rect x="50" y="30" width="60" height="20" rx="2" fill="var(--surface)" stroke="var(--fg)" stroke-width="2.5"/><line x1="40" y1="40" x2="120" y2="40" stroke="var(--fg)" stroke-width="2"/>',
    motor: meter("M"), volt: meter("V"), amp: meter("A"), ohm: meter("Ω"),
    tx: wires(52, 108) + '<circle cx="70" cy="40" r="18" fill="none" stroke="var(--fg)" stroke-width="2.5"/><circle cx="90" cy="40" r="18" fill="none" stroke="var(--fg)" stroke-width="2.5"/>',
    earth: '<line x1="80" y1="6" x2="80" y2="44" ' + S + '/><line x1="58" y1="44" x2="102" y2="44" ' + S + '/><line x1="66" y1="54" x2="94" y2="54" ' + S + '/><line x1="74" y1="64" x2="86" y2="64" ' + S + "/>",
    junction: '<line x1="8" y1="40" x2="152" y2="40" ' + S + '/><line x1="80" y1="40" x2="80" y2="74" ' + S + '/><circle cx="80" cy="40" r="5.5" fill="var(--fg)"/>',
    cross: '<line x1="8" y1="40" x2="152" y2="40" ' + S + '/><line x1="80" y1="6" x2="80" y2="74" ' + S + "/>"
  };
  var sym = function (id, key, name, accept, why) {
    return { id: id, lesson: "vir", q: "What does this circuit symbol represent?" + box(SYM[key]), a: name, accept: accept, why: why };
  };


  // ---- Diagram builders for picture cards (drawn like the lesson diagrams) ----
  var fig = function (w, h, inner, label) { return '<svg class="card-fig" viewBox="0 0 ' + w + " " + h + '" role="img" aria-label="' + label + '">' + inner + "</svg>"; };
  var T = function (x, y, t, fill, anchor, extra) { return '<text x="' + x + '" y="' + y + '" text-anchor="' + (anchor || "middle") + '" style="font-family:var(--font-mono);font-size:13px;font-weight:600;fill:' + (fill || "var(--fg)") + '"' + (extra || "") + ">" + t + "</text>"; };
  // Voltage-time graph: kind "dc" or "ac"; mark = angle in degrees to mark with "?"; rms = show dashed RMS lines; cycles = 1 or 2
  function graph(kind, opts) {
    opts = opts || {};
    var X0 = 40, X1 = 340, YC = 85, A = 60, cyc = opts.cycles || 2;
    var sx = function (deg) { return X0 + (X1 - X0) * deg / (360 * cyc); }, sy = function (v) { return YC - v * A; };
    var g = '<line x1="' + X0 + '" y1="' + YC + '" x2="' + X1 + '" y2="' + YC + '" stroke="var(--rule)" stroke-width="1.5"/>' +
      '<line x1="' + X0 + '" y1="18" x2="' + X0 + '" y2="152" stroke="var(--muted)" stroke-width="1.5"/>' +
      T(X0 - 8, 22, "V", "var(--muted)", "end") + T(X1, 108, "time", "var(--muted)", "end");
    if (kind === "dc") g += '<line x1="' + X0 + '" y1="' + sy(0.7) + '" x2="' + X1 + '" y2="' + sy(0.7) + '" stroke="var(--flow)" stroke-width="3.5"/>';
    else {
      var d = "";
      for (var a = 0; a <= 360 * cyc; a += 4) d += (d ? "L" : "M") + sx(a).toFixed(1) + "," + sy(Math.sin(a * Math.PI / 180)).toFixed(1);
      g += '<path d="' + d + '" fill="none" stroke="var(--l1)" stroke-width="3.5"/>';
    }
    if (opts.rms) [1, -1].forEach(function (k) { g += '<line x1="' + X0 + '" y1="' + sy(k * 0.707) + '" x2="' + X1 + '" y2="' + sy(k * 0.707) + '" stroke="var(--flow)" stroke-width="2" stroke-dasharray="6 5"/>'; });
    if (opts.rms) g += T(X1 + 4, sy(0.707) + 4, "?", "var(--flow)", "start");
    if (opts.mark != null) {
      var mx = sx(opts.mark), my = sy(Math.sin(opts.mark * Math.PI / 180));
      g += '<line x1="' + mx + '" y1="' + YC + '" x2="' + mx + '" y2="' + my + '" stroke="var(--fg)" stroke-dasharray="3 3"/><circle cx="' + mx + '" cy="' + my + '" r="6" fill="var(--flow)" stroke="var(--surface)" stroke-width="2"/>' +
        T(mx + 12, my + (opts.mark > 180 ? 18 : -8), "?", "var(--flow)", "start");
    }
    if (opts.period) g += '<line x1="' + sx(0) + '" y1="162" x2="' + sx(360) + '" y2="162" stroke="var(--fg)" stroke-width="1.5"/><line x1="' + sx(0) + '" y1="156" x2="' + sx(0) + '" y2="168" stroke="var(--fg)" stroke-width="1.5"/><line x1="' + sx(360) + '" y1="156" x2="' + sx(360) + '" y2="168" stroke="var(--fg)" stroke-width="1.5"/>' + T(sx(180), 180, "? ms", "var(--fg)");
    return fig(360, opts.period ? 188 : 160, g, "Voltage against time graph");
  }
  // Triangle: base (horizontal), side (vertical, up if inductive), hyp; labels; down = points downward; phi = mark the angle
  function triangle(base, side, labels, opts) {
    opts = opts || {};
    var k = Math.min(200 / base, 110 / side), ox = 40, oy = opts.down ? 30 : 140;
    var rx = ox + base * k, ty = opts.down ? oy + side * k : oy - side * k;
    var g = '<line x1="' + ox + '" y1="' + oy + '" x2="' + rx + '" y2="' + oy + '" stroke="var(--fg)" stroke-width="4" stroke-linecap="round"/>' +
      '<line x1="' + rx + '" y1="' + oy + '" x2="' + rx + '" y2="' + ty + '" stroke="var(--neutral)" stroke-width="4" stroke-linecap="round"/>' +
      '<line x1="' + ox + '" y1="' + oy + '" x2="' + rx + '" y2="' + ty + '" stroke="var(--flow)" stroke-width="4" stroke-linecap="round"/>';
    g += T((ox + rx) / 2, oy + (opts.down ? -10 : 22), labels[0]);
    g += T(rx + 10, (oy + ty) / 2 + 5, labels[1], "var(--neutral)", "start");
    g += T((ox + rx) / 2 - 12, (oy + ty) / 2 + (opts.down ? 18 : -6), labels[2], "var(--flow)", "end");
    if (opts.phi) {
      var ar = 30, ang = Math.atan2(side, base), ex = ox + ar * Math.cos(ang), ey = opts.down ? oy + ar * Math.sin(ang) : oy - ar * Math.sin(ang);
      g += '<path d="M' + (ox + ar) + "," + oy + " A" + ar + "," + ar + " 0 0," + (opts.down ? 1 : 0) + " " + ex.toFixed(1) + "," + ey.toFixed(1) + '" fill="none" stroke="var(--muted)" stroke-width="1.5"/>' +
        '<text x="' + (ox + ar + 5) + '" y="' + (oy + (opts.down ? 16 : -6)) + '" style="font-family:var(--font-body);font-size:13px;font-weight:600;fill:var(--muted)">φ</text>';
    }
    return fig(360, 170, g, "Right-angled triangle");
  }
  // Voltage (solid) and current (dashed) waveforms, current shifted by phi degrees (positive = lagging)
  function waves(phi) {
    var X0 = 20, X1 = 340, YC = 80, A = 55;
    var sx = function (deg) { return X0 + (X1 - X0) * deg / 720; };
    var pv = "", pi = "";
    for (var a = 0; a <= 720; a += 4) {
      var r = a * Math.PI / 180;
      pv += (pv ? "L" : "M") + sx(a).toFixed(1) + "," + (YC - A * Math.sin(r)).toFixed(1);
      pi += (pi ? "L" : "M") + sx(a).toFixed(1) + "," + (YC - A * 0.7 * Math.sin(r - phi * Math.PI / 180)).toFixed(1);
    }
    var g = '<line x1="' + X0 + '" y1="' + YC + '" x2="' + X1 + '" y2="' + YC + '" stroke="var(--rule)" stroke-width="1.5"/>' +
      '<path d="' + pv + '" fill="none" stroke="var(--l1)" stroke-width="3.5"/><path d="' + pi + '" fill="none" stroke="var(--flow)" stroke-width="3.5" stroke-dasharray="8 5"/>' +
      T(X1, 155, "voltage (solid) · current (dashed)", "var(--muted)", "end");
    return fig(360, 165, g, "Voltage and current waveforms");
  }

  window.CARDS = [
    // ---------------- Atoms and free electrons ----------------
    { id: "atoms-01", lesson: "atoms", q: "What charge does an electron carry?", a: "Negative", accept: ["negative", "-", "minus", "negative charge"] },
    { id: "atoms-02", lesson: "atoms", q: "What charge does a proton carry?", a: "Positive", accept: ["positive", "+", "plus", "positive charge"] },
    { id: "atoms-03", lesson: "atoms", q: "Opposite charges (+ and −) ___ each other.", a: "Attract", accept: ["attract", "attract each other"] },
    { id: "atoms-04", lesson: "atoms", q: "Like charges (− and −, or + and +) ___ each other.", a: "Repel", accept: ["repel", "repel each other"] },
    { id: "atoms-05", lesson: "atoms", q: "In a metal, the outer electrons that leave their atoms and wander through the whole metal are called ___ electrons.", a: "Free (also called delocalised or valence) electrons", accept: ["free", "free electrons", "delocalised", "delocalized", "delocalised electrons", "delocalized electrons", "valence", "valence electrons"] },
    { id: "atoms-06", lesson: "atoms", q: "After giving up an electron, each metal atom in the lattice is left as a positive ___.", a: "Ion", accept: ["ion", "ions", "positive ion", "cation", "cations"] },
    { id: "atoms-07", lesson: "atoms", q: "The neat, repeating grid that metal atoms pack into is called a crystal ___.", a: "Lattice", accept: ["lattice", "crystal lattice"] },
    { id: "atoms-08", lesson: "atoms", q: "A material with free charges, so current can flow through it, is called a ___.", a: "Conductor", accept: ["conductor", "a conductor"] },
    { id: "atoms-09", lesson: "atoms", q: "A material with no free charges, such as PVC or rubber, is called an ___.", a: "Insulator", accept: ["insulator", "an insulator"] },
    { id: "atoms-10", lesson: "atoms", q: "A copper conductor heats up. Does its resistance rise or fall?", a: "It rises: the ions vibrate harder and get in the electrons' way", accept: ["rise", "rises", "it rises", "increase", "increases", "goes up", "up", "higher"] },
    { id: "atoms-11", lesson: "atoms", q: "Roughly how much higher (in %) is a copper cable's resistance at its working temperature of 70 °C than at 20 °C?", a: "About 20%", num: 20, tol: 0.1, unit: "%" },
    { id: "atoms-12", lesson: "atoms", q: "With a battery connected, do the free electrons in a wire drift towards the + terminal or the − terminal?", a: "Towards the + terminal (opposite charges attract)", accept: ["+", "positive", "the positive terminal", "positive terminal", "+ terminal", "the + terminal", "towards +", "towards positive"] },

    // ---------------- Voltage, current and resistance ----------------
    { id: "vir-01", lesson: "vir", q: "What is the unit of voltage?", a: "The volt (V)", accept: ["volt", "volts", "v"] },
    { id: "vir-02", lesson: "vir", q: "What is the unit of current?", a: "The ampere, or amp (A)", accept: ["ampere", "amperes", "amp", "amps", "a"] },
    { id: "vir-03", lesson: "vir", q: "What is the unit of resistance?", a: "The ohm (Ω)", accept: ["ohm", "ohms", "Ω"] },
    { id: "vir-04", lesson: "vir", q: "What letter is the symbol for current?", a: "I (from the French <em>intensité</em>)", accept: ["i"] },
    { id: "vir-05", lesson: "vir", q: "What letter does <abbr title=\"British Standard 7671: the IET Wiring Regulations\">BS 7671</abbr> use as the symbol for voltage?", a: "U (as in U<sub>0</sub> = 230 V)", accept: ["u"] },
    { id: "vir-06", lesson: "vir", q: "What letter is the symbol for resistance?", a: "R", accept: ["r"] },
    { id: "vir-07", lesson: "vir", q: "What letter is the symbol for impedance, the AC version of resistance?", a: "Z", accept: ["z"] },
    { id: "vir-08", lesson: "vir", q: "Voltage is properly called potential ___.", a: "Difference (p.d.)", accept: ["difference", "potential difference", "pd", "p d"] },
    { id: "vir-09", lesson: "vir", q: "The voltage that a source (such as a battery) produces is called its ___ force.", a: "Electromotive force (e.m.f.)", accept: ["electromotive", "electromotive force", "electro-motive", "electro motive force", "emf", "e m f"] },
    { id: "vir-10", lesson: "vir", q: "1 amp means one ___ of charge passing a point every second.", a: "Coulomb", accept: ["coulomb", "coulombs"] },
    { id: "vir-21", lesson: "vir", q: "What is the unit of electric charge?", a: "The coulomb (C): the charge of about 6.24 × 10<sup>18</sup> electrons", accept: ["coulomb", "coulombs", "the coulomb", "c"] },
    { id: "vir-22", lesson: "vir", q: "Roughly how many electrons' worth of charge is one coulomb?", a: "About 6.24 × 10<sup>18</sup>", num: 6.24e18, tol: 0.02, why: "Type it as 6.24 x 10^18 or 6.24e18." },
    { id: "vir-11", lesson: "vir", q: "1 volt means each coulomb of charge gets (or gives up) one ___ of energy.", a: "Joule", accept: ["joule", "joules"] },
    { id: "vir-12", lesson: "vir", q: "How is a voltmeter connected to measure the voltage across a component: in series, or across it (in parallel)?", a: "Across it, in parallel", accept: ["across", "across it", "parallel", "in parallel", "across the component"] },
    { id: "vir-13", lesson: "vir", q: "How is an ammeter connected: in series, or across the component?", a: "In series, so the current flows through it", accept: ["series", "in series"] },
    { id: "vir-14", lesson: "vir", q: "What kind of meter measures current without breaking into the circuit?", a: "A clamp meter", accept: ["clamp", "clamp meter", "clamp-meter", "clampmeter"] },
    { id: "vir-15", lesson: "vir", q: "Which way does <strong>conventional</strong> current flow round a circuit?", a: "From + to −", accept: ["+ to -", "from + to -", "positive to negative", "from positive to negative", "+ -"] },
    { id: "vir-16", lesson: "vir", q: "Which way do <strong>electrons</strong> actually flow round a circuit?", a: "From − to +", accept: ["- to +", "from - to +", "negative to positive", "from negative to positive", "- +"] },
    { id: "vir-17", lesson: "vir", q: "A conductor's length is doubled. What happens to its resistance?", a: "It doubles", accept: ["doubles", "it doubles", "double", "x2", "2x", "twice"] },
    { id: "vir-18", lesson: "vir", q: "A conductor's cross-sectional area is doubled. What happens to its resistance?", a: "It halves", accept: ["halves", "it halves", "half", "halved", "/2"] },
    { id: "vir-19", lesson: "vir", q: "What is U<sub>0</sub>, the nominal voltage between line and earth in the UK?", a: "230 V", num: 230, tol: 0, unit: "V" },
    { id: "vir-20", lesson: "vir", q: "Two identical lamps are in series across 230 V. What voltage does each get?", a: "115 V", num: 115, tol: 0.01, unit: "V" },
    sym("vir-s01", "lamp", "Lamp", ["lamp", "light", "bulb", "lamp bulb", "light bulb"]),
    sym("vir-s02", "res", "Resistor (or any general load)", ["resistor", "resistance", "load", "a resistor", "fixed resistor", "general load"]),
    sym("vir-s03", "vres", "Variable resistor", ["variable resistor", "variable resistance", "rheostat", "potentiometer"]),
    sym("vir-s04", "cell", "Cell (long line +, short line −)", ["cell", "a cell", "single cell"]),
    sym("vir-s05", "battery", "Battery (several cells in series)", ["battery", "batteries"]),
    sym("vir-s06", "ac", "AC supply", ["ac supply", "ac", "ac source", "alternating current supply", "supply", "mains", "ac power supply"]),
    sym("vir-s07", "sw", "Switch (shown open)", ["switch", "open switch", "a switch", "spst switch"]),
    sym("vir-s08", "fuse", "Fuse", ["fuse"]),
    sym("vir-s09", "motor", "Motor", ["motor"]),
    sym("vir-s10", "volt", "Voltmeter", ["voltmeter", "volt meter"]),
    sym("vir-s11", "amp", "Ammeter", ["ammeter", "amp meter", "ampmeter", "ampere meter"]),
    sym("vir-s12", "ohm", "Ohmmeter (only on dead circuits)", ["ohmmeter", "ohm meter", "ohmeter"]),
    sym("vir-s13", "tx", "Transformer", ["transformer"]),
    sym("vir-s14", "earth", "Earth", ["earth", "earth connection", "ground", "earthing"]),
    sym("vir-s15", "junction", "Junction: conductors joined (the dot)", ["junction", "joined", "connected", "connection", "joint", "t junction", "t-junction", "junction joined"]),
    sym("vir-s16", "cross", "Conductors crossing, not joined (no dot)", ["crossing", "not joined", "not connected", "crossing not joined", "crossing not connected", "crossover", "wires crossing", "unjoined"]),

    // ---------------- Ohm's law ----------------
    { id: "ohm-01", lesson: "ohms-law", q: "Ohm's law: V = ?", a: "I × R", accept: ["i x r", "ir", "i r", "ixr", "r x i", "ri"] },
    { id: "ohm-02", lesson: "ohms-law", q: "Rearrange Ohm's law: I = ?", a: F("V", "R"), accept: ["v/r", "v over r", "v divided by r"] },
    { id: "ohm-03", lesson: "ohms-law", q: "Rearrange Ohm's law: R = ?", a: F("V", "I"), accept: ["v/i", "v over i", "v divided by i"] },
    { id: "ohm-04", lesson: "ohms-law", q: "230 V is connected across a 46 Ω heater. What current flows?", a: "I = " + F("230", "46") + " = 5 A", num: 5, unit: "A" },
    { id: "ohm-05", lesson: "ohms-law", q: "A 12 V supply drives 2 A through a load. What is its resistance?", a: "R = " + F("12", "2") + " = 6 Ω", num: 6, unit: "Ω" },
    { id: "ohm-06", lesson: "ohms-law", q: "0.4 A flows through a 30 Ω resistor. What is the voltage across it?", a: "V = 0.4 × 30 = 12 V", num: 12, unit: "V" },
    { id: "ohm-07", lesson: "ohms-law", q: "A kettle element is 17.6 Ω. Roughly what current does it draw on 230 V?", a: "I = " + F("230", "17.6") + " ≈ 13 A", num: 13.07, tol: 0.03, unit: "A" },
    { id: "ohm-08", lesson: "ohms-law", q: "The resistance doubles but the voltage stays the same. What happens to the current?", a: "It halves", accept: ["halves", "it halves", "half", "halved"] },
    { id: "ohm-09", lesson: "ohms-law", q: "The prefix M (mega) means × what?", a: "× 1,000,000 (10<sup>6</sup>)", num: 1e6, tol: 0, why: "Insulation resistance is measured in MΩ." },
    { id: "ohm-10", lesson: "ohms-law", q: "The prefix k (kilo) means × what?", a: "× 1,000 (10<sup>3</sup>)", num: 1000, tol: 0 },
    { id: "ohm-11", lesson: "ohms-law", q: "The prefix m (milli) means × what?", a: "× " + F("1", "1,000") + " (10<sup>−3</sup>)", num: 0.001, tol: 0, why: "Type it as 0.001, 1/1000 or 10^-3." },
    { id: "ohm-12", lesson: "ohms-law", q: "Convert 30 mA into amps.", a: "0.03 A", num: 0.03, tol: 0, unit: "A" },
    { id: "ohm-13", lesson: "ohms-law", q: "An insulation test reads 200 MΩ. How many ohms is that?", a: "200,000,000 Ω", num: 2e8, tol: 0, unit: "Ω" },
    { id: "ohm-14", lesson: "ohms-law", q: "True or false: current only ever takes the path of least resistance.", a: "False. It flows through every available path, split by resistance; the easy path just gets the most", accept: ["false", "f", "no"], why: "This is why a person in parallel with a CPC still gets a share of the current." },
    { id: "ohm-15", lesson: "ohms-law", q: "Line touches neutral, leaving 0.5 Ω in the loop on a 230 V supply. What current flows?", a: "460 A: a short circuit", num: 460, unit: "A" },
    { id: "ohm-16", lesson: "ohms-law", q: "What current flows through an open circuit?", a: "None (0 A): the gap's resistance is effectively infinite", num: 0, tol: 0, unit: "A" },
    { id: "ohm-17", lesson: "ohms-law", q: "A 6 Ω load is connected between a point at 24 V and a point at 12 V. What current flows?", a: "2 A: it only sees the 12 V difference", num: 2, unit: "A" },

    // ---------------- Series and parallel ----------------
    { id: "sp-01", lesson: "series-parallel", q: "Resistances in <strong>series</strong>: how do you combine them?", a: "Add them: R<sub>T</sub> = R<sub>1</sub> + R<sub>2</sub> + R<sub>3</sub>", accept: ["add", "add them", "add them up", "added", "sum", "sum them", "r1+r2+r3", "rt=r1+r2+r3"] },
    { id: "sp-02", lesson: "series-parallel", q: "4 Ω, 6 Ω and 10 Ω are connected in series. Total resistance?", a: "20 Ω", num: 20, unit: "Ω" },
    { id: "sp-03", lesson: "series-parallel", q: "6 Ω and 3 Ω are connected in parallel. Total resistance?", a: F("6 × 3", "6 + 3") + " = 2 Ω", num: 2, unit: "Ω" },
    { id: "sp-04", lesson: "series-parallel", q: "Two 10 Ω resistors are connected in parallel. Total resistance?", a: F("10", "2") + " = 5 Ω", num: 5, unit: "Ω" },
    { id: "sp-05", lesson: "series-parallel", q: "Four 100 Ω resistors are connected in parallel. Total resistance?", a: F("100", "4") + " = 25 Ω", num: 25, unit: "Ω" },
    { id: "sp-06", lesson: "series-parallel", q: "10 Ω, 20 Ω and 20 Ω are connected in parallel. Total resistance?", a: F("1", "R<sub>T</sub>") + " = " + F("1", "10") + " + " + F("1", "20") + " + " + F("1", "20") + " = " + F("4", "20") + ", so R<sub>T</sub> = 5 Ω", num: 5, unit: "Ω" },
    { id: "sp-07", lesson: "series-parallel", q: "The total resistance of a parallel circuit is always lower than ___.", a: "The smallest branch resistance", accept: ["the smallest", "smallest", "the lowest", "lowest", "the smallest resistance", "smallest resistance", "the smallest branch", "smallest branch", "the lowest resistance", "lowest resistance", "the smallest branch resistance"] },
    { id: "sp-08", lesson: "series-parallel", q: "In a series circuit, how does the current compare at different points round the loop?", a: "It's the same everywhere", accept: ["same", "the same", "same everywhere", "it's the same", "its the same", "equal", "identical", "the same everywhere"] },
    { id: "sp-09", lesson: "series-parallel", q: "In a parallel circuit, what voltage does each branch get?", a: "The full supply voltage", accept: ["full supply voltage", "the full supply voltage", "supply voltage", "the supply voltage", "full voltage", "the full voltage", "the same", "same", "all of it"] },
    { id: "sp-10", lesson: "series-parallel", q: "Kirchhoff's <strong>current</strong> law: the current flowing into a junction equals ___.", a: "The current flowing out of it", accept: ["current out", "the current out", "the current flowing out", "current flowing out", "out", "what flows out", "the current leaving", "current leaving"] },
    { id: "sp-11", lesson: "series-parallel", q: "Kirchhoff's <strong>voltage</strong> law: the voltage drops round a closed loop add up to ___.", a: "The supply voltage (e.m.f.)", accept: ["supply voltage", "the supply voltage", "supply", "the supply", "emf", "the emf", "source voltage", "the source voltage"] },
    { id: "sp-12", lesson: "series-parallel", q: "Currents of 2 A and 3 A flow into a junction. One wire leaves it. What current does it carry?", a: "5 A", num: 5, unit: "A" },
    { id: "sp-13", lesson: "series-parallel", q: "Three identical lamps are in series across 230 V. Roughly what voltage does each get?", a: F("230", "3") + " ≈ 77 V", num: 76.67, tol: 0.02, unit: "V" },
    { id: "sp-14", lesson: "series-parallel", q: "A switch is connected in series or in parallel with the load it controls?", a: "In series", accept: ["series", "in series"] },
    { id: "sp-15", lesson: "series-parallel", q: "Which conductor should a switch break: line or neutral?", a: "Line", accept: ["line", "the line", "line conductor", "live", "l"] },
    { id: "sp-16", lesson: "series-parallel", q: "Are the sockets and lights in a house wired in series or in parallel?", a: "Parallel: each gets 230 V and can be switched on its own", accept: ["parallel", "in parallel"] },
    { id: "sp-17", lesson: "series-parallel", q: "In which arrangement does one open switch or failed load turn everything off: series or parallel?", a: "Series", accept: ["series", "in series"] },
    { id: "sp-18", lesson: "series-parallel", q: "12 V battery, switch and lamp in series. Switch <strong>open</strong>. What does a voltmeter across the switch read?", a: "12 V: the whole supply appears across the gap", num: 12, tol: 0, unit: "V" },
    { id: "sp-19", lesson: "series-parallel", q: "12 V battery, switch and lamp in series. Switch <strong>open</strong>. What does a voltmeter across the lamp read?", a: "0 V: no current, so the lamp drops nothing", num: 0, tol: 0, unit: "V" },
    { id: "sp-20", lesson: "series-parallel", q: "What does a voltmeter read between two points on the same piece of conductor?", a: "0 V (or almost): there's no potential difference", num: 0, tol: 0, unit: "V" },

    // ---------------- Power ----------------
    { id: "pow-01", lesson: "power", q: "What is the unit of power?", a: "The watt (W)", accept: ["watt", "watts", "w"] },
    { id: "pow-02", lesson: "power", q: "What letter is the symbol for power?", a: "P", accept: ["p"] },
    { id: "pow-03", lesson: "power", q: "1 watt means one ___ of energy converted every second.", a: "Joule", accept: ["joule", "joules"] },
    { id: "pow-04", lesson: "power", q: "Power is the ___ at which energy is converted.", a: "Rate", accept: ["rate", "speed"] },
    { id: "pow-05", lesson: "power", q: "P = V × ?", a: "I", accept: ["i", "current"] },
    { id: "pow-06", lesson: "power", q: "Combine with Ohm's law: P = I² × ?", a: "R", accept: ["r", "resistance"] },
    { id: "pow-07", lesson: "power", q: "Combine with Ohm's law: P = ?" + " (in terms of V and R)", a: F("V²", "R"), accept: ["v^2/r", "v2/r", "vsquared/r", "v squared over r", "v squared/r", "vxv/r"] },
    { id: "pow-08", lesson: "power", q: "The formula for the current an appliance draws from its power rating: I = ?", a: F("P", "V"), accept: ["p/v", "p over v", "p divided by v"] },
    { id: "pow-09", lesson: "power", q: "Roughly what current does a 3 kW kettle draw on 230 V?", a: F("3,000", "230") + " ≈ 13 A", num: 13.04, tol: 0.03, unit: "A" },
    { id: "pow-10", lesson: "power", q: "Roughly what current does a 9.5 kW electric shower draw on 230 V?", a: F("9,500", "230") + " ≈ 41 A, so it needs its own circuit", num: 41.3, tol: 0.03, unit: "A" },
    { id: "pow-11", lesson: "power", q: "Roughly what current does a 7.4 kW car charger draw on 230 V?", a: F("7,400", "230") + " ≈ 32 A", num: 32.17, tol: 0.03, unit: "A" },
    { id: "pow-12", lesson: "power", q: "The current through a cable doubles. How many times more heat is produced in it?", a: "4 times (P = I²R)", num: 4, tol: 0, unit: "times" },
    { id: "pow-13", lesson: "power", q: "In what unit do electricity bills charge for energy?", a: "The kilowatt-hour (kWh)", accept: ["kwh", "kilowatt hour", "kilowatt hours", "kilowatt-hour", "kilowatt-hours", "kw h", "units"] },
    { id: "pow-14", lesson: "power", q: "A 2 kW heater runs for 3 hours. How much energy does it use?", a: "2 × 3 = 6 kWh", num: 6, unit: "kWh" },
    { id: "pow-15", lesson: "power", q: "What's the largest current a standard 13 A plug can supply?", a: "13 A (its fuse rating)", num: 13, tol: 0, unit: "A" },
    { id: "pow-16", lesson: "power", q: "Roughly how many amps does 1 kW draw at 230 V?", a: "About 4.35 A", num: 4.35, unit: "A" },
    { id: "pow-17", lesson: "power", q: "How many 100 W lamps can a 6 A lighting circuit carry at 230 V?", a: "13: " + F("1,380 W", "100 W") + " = 13.8, rounded down", num: 13, tol: 0 },
    { id: "pow-18", lesson: "power", q: "What current does a 10 kW cooker draw at 230 V, before diversity?", a: "≈ 43.5 A", num: 43.5, unit: "A" },
    // ---------------- Conductors and cables ----------------
    { id: "cab-01", lesson: "conductors", q: "Every cable has three layers: conductors, insulation and the outer ___.", a: "Sheath", accept: ["sheath", "outer sheath", "the sheath", "sheathing"] },
    { id: "cab-02", lesson: "conductors", q: "A cable size such as \"2.5 mm²\" describes each conductor's cross-sectional ___.", a: "Area (CSA)", accept: ["area", "cross-sectional area", "cross sectional area", "csa"] },
    { id: "cab-03", lesson: "conductors", q: "Is \"6 mm²\" a diameter or an area?", a: "An area. A solid 6 mm² conductor is only about 2.8 mm across", accept: ["area", "an area", "cross-sectional area", "csa"] },
    { id: "cab-04", lesson: "conductors", q: "Roughly how many millimetres across is a solid 2.5 mm² conductor?", a: "About 1.8 mm (d = 2 × √" + F("A", "π") + ")", num: 1.78, tol: 0.06, unit: "mm" },
    { id: "cab-05", lesson: "conductors", q: "What is the smallest copper conductor size (in mm²) that BS 7671 allows for the fixed wiring of power and lighting circuits?", a: "1.0 mm²", num: 1, tol: 0, unit: "mm²" },
    { id: "cab-06", lesson: "conductors", q: "Which metal is the best conductor of all?", a: "Silver", accept: ["silver"] },
    { id: "cab-07", lesson: "conductors", q: "Put silver, copper, gold and aluminium in order, best conductor first.", a: "Silver, copper, gold, aluminium", accept: ["silver copper gold aluminium", "silver copper gold aluminum", "silver > copper > gold > aluminium", "silver > copper > gold > aluminum", "silver copper gold and aluminium"] },
    { id: "cab-08", lesson: "conductors", q: "Which metal is used for almost all building wiring?", a: "Copper: nearly as good as silver, at a fraction of the price", accept: ["copper"] },
    { id: "cab-09", lesson: "conductors", q: "Which metal is used for overhead lines and large supply cables, because it's light and cheap?", a: "Aluminium", accept: ["aluminium", "aluminum"] },
    { id: "cab-10", lesson: "conductors", q: "Why are connector contacts often gold-plated?", a: "Gold doesn't corrode, so the contact surface stays low-resistance. (It's actually a worse conductor than copper.)", accept: ["it doesn't corrode", "doesn't corrode", "does not corrode", "doesnt corrode", "it does not corrode", "won't corrode", "no corrosion", "corrosion", "corrosion resistance", "corrosion resistant", "doesn't tarnish", "doesnt tarnish", "doesn't oxidise", "doesn't oxidize", "it doesn't tarnish"] },
    { id: "cab-11", lesson: "conductors", q: "The formula for a conductor's resistance from its material, length and area: R = ?", a: F("ρ × L", "A"), accept: ["ρl/a", "ρxl/a", "pl/a", "pxl/a", "rho l/a", "rhol/a", "rho x l/a", "rhoxl/a", "ρ l/a"] },
    { id: "cab-12", lesson: "conductors", q: "In R = " + F("ρ × L", "A") + ", what property of the material is ρ (rho)?", a: "Its resistivity", accept: ["resistivity", "its resistivity", "the resistivity"] },
    { id: "cab-13", lesson: "conductors", q: "In flat twin and earth, what colour is the line core's insulation?", a: "Brown", accept: ["brown"] },
    { id: "cab-14", lesson: "conductors", q: "In flat twin and earth, what colour is the neutral core's insulation?", a: "Blue", accept: ["blue"] },
    { id: "cab-15", lesson: "conductors", q: "What's different about the circuit protective conductor (CPC) inside flat twin and earth?", a: "It's bare: no insulation inside the cable", accept: ["bare", "it's bare", "its bare", "it is bare", "uninsulated", "it's uninsulated", "not insulated", "no insulation", "bare copper", "it has no insulation"] },
    { id: "cab-16", lesson: "conductors", q: "What must be fitted over the bare CPC of twin and earth wherever it's exposed?", a: "Green-and-yellow sleeving", accept: ["green and yellow sleeving", "green/yellow sleeving", "green yellow sleeving", "green-and-yellow sleeving", "green and yellow sleeve", "g/y sleeving", "sleeving", "earth sleeving", "green and yellow"] },
    { id: "cab-17", lesson: "conductors", q: "What size (mm²) is the CPC in 2.5 mm² twin and earth?", a: "1.5 mm²", num: 1.5, tol: 0, unit: "mm²" },
    { id: "cab-18", lesson: "conductors", q: "What is the maximum conductor temperature for general-purpose PVC-insulated cable?", a: "70 °C", num: 70, tol: 0, unit: "°C" },
    { id: "cab-19", lesson: "conductors", q: "What is the maximum conductor temperature for thermosetting (XLPE) insulated cable?", a: "90 °C", num: 90, tol: 0, unit: "°C" },
    { id: "cab-20", lesson: "conductors", q: "A cable is buried in loft insulation instead of clipped in open air. Does the current it can safely carry go up or down?", a: "Down: the heat can't escape as easily", accept: ["down", "goes down", "it goes down", "lower", "less", "decreases", "reduces", "falls"] },

    // ---------------- AC and three-phase ----------------
    { id: "ac-01", lesson: "dc-ac", q: "What is the frequency of the UK mains supply?", a: "50 Hz", num: 50, tol: 0, unit: "Hz" },
    { id: "ac-02", lesson: "dc-ac", q: "At 50 Hz, how many milliseconds does one complete cycle take?", a: "T = " + F("1", "50") + " = 0.02 s = 20 ms", num: 20, tol: 0, unit: "ms" },
    { id: "ac-03", lesson: "dc-ac", q: "The time for one cycle (the period): T = ?", a: F("1", "f"), accept: ["1/f", "1 over f", "1/frequency", "one over f"] },
    { id: "ac-04", lesson: "dc-ac", q: "How many degrees are there in one full AC cycle?", a: "360°", num: 360, tol: 0, unit: "°" },
    { id: "ac-05", lesson: "dc-ac", q: "How many radians are there in one full AC cycle?", a: "2π", accept: ["2π", "2pi", "2 pi", "2xπ", "2xpi", "two pi"], alsoNum: 2 * Math.PI },
    { id: "ac-06", lesson: "dc-ac", q: "At what angle does a sine wave reach its positive peak?", a: "90° (" + F("π", "2") + " radians)", num: 90, tol: 0, unit: "°" },
    { id: "ac-07", lesson: "dc-ac", q: "What is the voltage doing at 270° in the cycle?", a: "It's at its negative peak, about −325 V", accept: ["negative peak", "at its negative peak", "the negative peak", "-325", "-325 v", "-325v", "minimum", "its minimum", "lowest", "trough"] },
    { id: "ac-08", lesson: "dc-ac", q: "UK mains is 230 V RMS. What is its peak voltage?", a: "230 × √2 ≈ 325 V", num: 325, tol: 0.01, unit: "V" },
    { id: "ac-09", lesson: "dc-ac", q: "V<sub>peak</sub> = V<sub>RMS</sub> × ?", a: "√2 (about 1.414)", accept: ["√2", "sqrt2", "sqrt 2", "root 2", "root2", "square root of 2", "1.414", "1.41"], alsoNum: Math.SQRT2 },
    { id: "ac-10", lesson: "dc-ac", q: "What does RMS stand for?", a: "Root mean square", accept: ["root mean square", "root-mean-square"] },
    { id: "ac-11", lesson: "dc-ac", q: "The RMS value of an AC voltage is the DC voltage that would give the same ___ effect in a resistor.", a: "Heating", accept: ["heating", "heat", "heating effect", "power"] },
    { id: "ac-12", lesson: "three-phase", q: "In a three-phase supply, how many degrees apart are the phases?", a: "120° (a third of a cycle)", num: 120, tol: 0, unit: "°" },
    { id: "ac-13", lesson: "three-phase", q: "What colour is the L1 line conductor (current UK colours)?", a: "Brown", accept: ["brown"] },
    { id: "ac-14", lesson: "three-phase", q: "What colour is the L2 line conductor (current UK colours)?", a: "Black", accept: ["black"] },
    { id: "ac-15", lesson: "three-phase", q: "What colour is the L3 line conductor (current UK colours)?", a: "Grey", accept: ["grey", "gray"] },
    { id: "ac-16", lesson: "three-phase", q: "Before the 2004 colour change, what were the three-phase colours for L1, L2 and L3?", a: "Red, yellow, blue", accept: ["red yellow blue", "red yellow and blue", "red, yellow, blue"] },
    { id: "ac-17", lesson: "three-phase", q: "On a 400/230 V three-phase supply, what is the voltage between any two line conductors?", a: "400 V", num: 400, tol: 0, unit: "V" },
    { id: "ac-18", lesson: "three-phase", q: "Line-to-line voltage = 230 × ?", a: "√3 (about 1.732): 230 × √3 ≈ 400 V", accept: ["√3", "sqrt3", "sqrt 3", "root 3", "root3", "square root of 3", "1.732", "1.73"], alsoNum: Math.sqrt(3) },
    { id: "ac-19", lesson: "three-phase", q: "At any instant, what do the voltages of L1, L2 and L3 add up to?", a: "Zero. So a balanced load puts almost no current in the neutral", accept: ["0", "zero", "0 v", "0v", "nothing", "they cancel", "they cancel out"] },
    { id: "ac-20", lesson: "three-phase", q: "What is the point called where a transformer's three secondary windings are joined, and the neutral comes from?", a: "The star point", accept: ["star point", "the star point", "star", "neutral point", "star-point"] },
    { id: "ac-21", lesson: "three-phase", q: "A generator coil's voltage peaks when the magnetic field through it is changing ___.", a: "Fastest: as a pole sweeps across it, not when it points straight at it", accept: ["fastest", "the fastest", "most quickly", "quickest", "most rapidly", "fast", "quickly"] },
    { id: "ac-22", lesson: "three-phase", q: "How many revolutions per minute must a two-pole generator turn to make 50 Hz?", a: "3,000 rpm (50 turns a second)", num: 3000, tol: 0, unit: "rpm" },
    { id: "ac-23", lesson: "three-phase", q: "Two line conductors feeding a three-phase motor are swapped. What does the motor do?", a: "It runs backwards", accept: ["runs backwards", "it runs backwards", "backwards", "reverses", "it reverses", "reverse", "runs in reverse", "opposite direction", "the wrong way", "turns backwards", "spins backwards"] },
    { id: "ac-24", lesson: "three-phase", q: "Most homes have one line and a neutral. What is this kind of supply called?", a: "Single-phase", accept: ["single phase", "single-phase", "single phase supply", "1 phase", "one phase"] },

    // ---------------- The grid and transformers ----------------
    { id: "grid-01", lesson: "grid", q: "What is the highest UK transmission voltage, in kV?", a: "400 kV (275 kV is also used)", num: 400, tol: 0, unit: "kV" },
    { id: "grid-02", lesson: "grid", q: "From what voltage (in kV) does a local substation step down to 400/230 V?", a: "11 kV", num: 11, tol: 0, unit: "kV" },
    { id: "grid-03", lesson: "grid", q: "Roughly what voltage (in kV) does a power station generator produce?", a: "Around 20 kV", num: 20, tol: 0.25, unit: "kV" },
    { id: "grid-04", lesson: "grid", q: "The grid transmits at very high voltage so that, for the same power, the ___ is low.", a: "Current", accept: ["current", "the current"] },
    { id: "grid-05", lesson: "grid", q: "Power wasted as heat in a line = I² × ?", a: "R, the line's resistance", accept: ["r", "resistance", "the resistance"] },
    { id: "grid-06", lesson: "grid", q: "The transmission voltage is raised 10 times. What fraction of the original line losses remains?", a: F("1", "100") + ", because losses depend on I²", num: 0.01, tol: 0, why: "Type it as 1/100 or 0.01." },
    { id: "grid-07", lesson: "grid", q: "Complete the transformer turns ratio: " + F("V<sub>s</sub>", "V<sub>p</sub>") + " = ?", a: F("N<sub>s</sub>", "N<sub>p</sub>"), accept: ["ns/np", "n2/n1", "ns over np"] },
    { id: "grid-08", lesson: "grid", q: "A transformer has 1,000 primary turns and 50 secondary turns. 4,000 V goes in. What comes out?", a: "4,000 × " + F("50", "1,000") + " = 200 V", num: 200, unit: "V" },
    { id: "grid-09", lesson: "grid", q: "A transformer steps the voltage down. Does the current go up or down?", a: "Up, by the same factor (power in ≈ power out)", accept: ["up", "goes up", "it goes up", "increases", "rises", "higher", "more"] },
    { id: "grid-10", lesson: "grid", q: "Transformers only work on which kind of supply?", a: "AC", accept: ["ac", "alternating current", "alternating"] },
    { id: "grid-11", lesson: "grid", q: "To induce a voltage in a transformer's secondary, the magnetic field in the core must be ___.", a: "Changing (which is why DC doesn't work)", accept: ["changing", "change", "varying", "alternating", "moving", "constantly changing"] },
    { id: "grid-12", lesson: "grid", q: "Roughly how efficient is a real transformer, in %?", a: "About 98–99%", num: 98.5, tol: 0.011, unit: "%" },
    { id: "grid-13", lesson: "grid", q: "Who owns and runs the transmission network in England and Wales?", a: "National Grid", accept: ["national grid", "the national grid", "ng", "national grid plc"] },

    // ---------------- Your supply ----------------
    { id: "sup-01", lesson: "your-supply", q: "Who owns the service cable, and the cut-out with its main fuse?", a: "The DNO (distribution network operator)", accept: ["dno", "the dno", "distribution network operator", "the distribution network operator"] },
    { id: "sup-02", lesson: "your-supply", q: "Who owns the electricity meter?", a: "The energy supplier (through a meter operator)", accept: ["energy supplier", "the energy supplier", "supplier", "the supplier", "electricity supplier", "the electricity supplier", "meter operator", "the meter operator"] },
    { id: "sup-03", lesson: "your-supply", q: "Where does the consumer's installation start?", a: "At the meter tails (the meter's outgoing terminals)", accept: ["meter tails", "the meter tails", "at the meter tails", "tails", "the tails", "meter outgoing terminals", "the meter's outgoing terminals", "outgoing terminals of the meter", "after the meter"] },
    { id: "sup-04", lesson: "your-supply", q: "What does DNO stand for?", a: "Distribution network operator", accept: ["distribution network operator"] },
    { id: "sup-05", lesson: "your-supply", q: "What does CPC stand for?", a: "Circuit protective conductor", accept: ["circuit protective conductor", "circuit protection conductor"] },
    { id: "sup-06", lesson: "your-supply", q: "What does MET stand for?", a: "Main earthing terminal", accept: ["main earthing terminal", "main earth terminal"] },
    { id: "sup-07", lesson: "your-supply", q: "Main fuses in a domestic cut-out are usually 60, 80 or how many amps?", a: "100 A", num: 100, tol: 0, unit: "A" },
    { id: "sup-08", lesson: "your-supply", q: "What colour was the line conductor before 2004?", a: "Red", accept: ["red"] },
    { id: "sup-09", lesson: "your-supply", q: "What colour was the neutral conductor before 2004?", a: "Black", accept: ["black"] },
    { id: "sup-10", lesson: "your-supply", q: "What colour is the circuit protective conductor (CPC)?", a: "Green and yellow", accept: ["green and yellow", "green/yellow", "green yellow", "green-and-yellow", "yellow and green", "g/y"] },
    { id: "sup-11", lesson: "your-supply", q: "When does the CPC carry current?", a: "Only during a fault, long enough to trip the protective device", accept: ["during a fault", "only during a fault", "in a fault", "fault", "during an earth fault", "earth fault", "only in a fault", "when there's a fault", "when there is a fault", "only when there's a fault"] },
    { id: "sup-12", lesson: "your-supply", q: "Should you treat the neutral conductor as live or as dead?", a: "Live: BS 7671 counts it as a live conductor", accept: ["live", "as live", "treat it as live"] },
    { id: "sup-13", lesson: "your-supply", q: "The neutral is broken somewhere. What voltage could the load side of the break sit at?", a: "The full 230 V, through the load", num: 230, tol: 0, unit: "V" },
    { id: "sup-14", lesson: "your-supply", q: "Current doesn't vanish into the ground. Where is it always trying to get back to?", a: "Its source: the transformer's star point", accept: ["source", "its source", "the source", "star point", "the star point", "transformer", "the transformer", "transformer star point", "the transformer star point", "the transformer's star point"] },
    { id: "sup-15", lesson: "your-supply", q: "What is the rated tripping current of an RCD used for additional protection, in mA?", a: "30 mA", num: 30, tol: 0, unit: "mA" },
    { id: "sup-16", lesson: "your-supply", q: "From roughly how many mA through the body is there a risk of the heart going into fibrillation?", a: "About 50 mA", num: 50, tol: 0, unit: "mA" },
    { id: "sup-17", lesson: "your-supply", q: "Someone touches line and neutral at the same time. Why won't an RCD trip?", a: "There's no imbalance: the current still goes out on line and back on neutral", accept: ["no imbalance", "there's no imbalance", "theres no imbalance", "there is no imbalance", "currents balance", "the currents balance", "balanced", "it's balanced", "still balanced", "no difference", "no residual current", "line and neutral still balance"] },
    { id: "sup-18", lesson: "your-supply", q: "What device, fitted after the meter, lets an electrician switch off the whole installation without touching the DNO's equipment?", a: "An isolator (isolator switch)", accept: ["isolator", "an isolator", "isolator switch", "isolating switch", "main isolator", "double pole isolator", "double-pole isolator"] },
    { id: "sup-19", lesson: "your-supply", q: "Who owns the electricity meter?", a: "The energy supplier (not the DNO)", accept: ["the supplier", "supplier", "energy supplier", "the energy supplier", "electricity supplier", "meter operator"] },
    { id: "sup-20", lesson: "your-supply", q: "What is the usual maximum rating of the main fuse in a home's cut-out?", a: "100 A (often 60 or 80 A)", num: 100, tol: 0, unit: "A" },
    { id: "sup-21", lesson: "your-supply", q: "When the DNO withdraws its cut-out fuse, is the neutral isolated too?", a: "No: the neutral passes through on a solid link, so only the line is isolated", accept: ["no", "n"] },
    { id: "sup-22", lesson: "your-supply", q: "Which device, fitted in the tails after the meter, lets you safely switch off the whole installation?", a: "A double-pole isolator", accept: ["isolator", "double pole isolator", "double-pole isolator", "an isolator", "a double pole isolator", "isolator switch", "double pole isolator switch"] },
    { id: "sup-23", lesson: "your-supply", q: "What are used to split the meter tails to feed a second consumer unit?", a: "Henley blocks", accept: ["henley blocks", "henley block", "henleys", "a henley block"] },
    { id: "sup-24", lesson: "your-supply", q: "Minimum clearance between the gas meter and the consumer unit?", a: "150 mm", num: 150, tol: 0, unit: "mm" },
    { id: "sup-25", lesson: "your-supply", q: "Minimum clearance between gas pipework (up to 35 mm) and electrical cables, switches or sockets?", a: "25 mm", num: 25, tol: 0, unit: "mm" },
    { id: "sup-26", lesson: "your-supply", q: "Which regulations require the DNO to put its cut-out and meter position somewhere safe?", a: "The ESQCR", accept: ["esqcr", "the esqcr", "electricity safety quality and continuity regulations", "electricity safety, quality and continuity regulations"] },
    // ---------------- Laws and guidance ----------------
    { id: "law-01", lesson: "laws", q: "Documents that are law, such as Acts of Parliament and Regulations, are called ___.", a: "Statutory", accept: ["statutory", "statutory documents"] },
    { id: "law-02", lesson: "laws", q: "Guidance and standards that aren't law themselves, such as BS 7671 and the Approved Documents, are called ___.", a: "Non-statutory", accept: ["non-statutory", "non statutory", "nonstatutory"] },
    { id: "law-03", lesson: "laws", q: "Is BS 7671 statutory or non-statutory?", a: "Non-statutory: a British Standard. Following it is the normal way to meet the law", accept: ["non-statutory", "non statutory", "nonstatutory", "guidance", "not law"] },
    { id: "law-04", lesson: "laws", q: "Are the Electricity at Work Regulations 1989 statutory or non-statutory?", a: "Statutory: they're law, made under the Health and Safety at Work Act", accept: ["statutory", "law", "legal requirement"] },
    { id: "law-05", lesson: "laws", q: "What year is the Health and Safety at Work etc. Act?", a: "1974", num: 1974, tol: 0 },
    { id: "law-06", lesson: "laws", q: "What year are the Electricity at Work Regulations?", a: "1989", num: 1989, tol: 0 },
    { id: "law-07", lesson: "laws", q: "Each Part of the Building Regulations is explained by an official guidance document called an ___ Document.", a: "Approved Document", accept: ["approved", "approved document"] },
    { id: "law-08", lesson: "laws", q: "Which Part of the Building Regulations covers electrical safety in dwellings?", a: "Part P", accept: ["p", "part p"] },
    { id: "law-09", lesson: "laws", q: "Which Part of the Building Regulations sets the heights of switches and sockets in new homes?", a: "Part M (access to and use of buildings)", accept: ["m", "part m"] },
    { id: "law-10", lesson: "laws", q: "Part M: what is the <strong>lowest</strong> height (in mm) for switches and sockets above finished floor level?", a: "450 mm", num: 450, tol: 0, unit: "mm" },
    { id: "law-11", lesson: "laws", q: "Part M: what is the <strong>highest</strong> height (in mm) for switches and sockets above finished floor level?", a: "1,200 mm", num: 1200, tol: 0, unit: "mm" },
    { id: "law-15", lesson: "laws", q: "Does the Part M height band apply to a socket mounted behind a wall-hung TV?", a: "No. The band is for everyday switches and sockets; outlets not meant for regular use can go where the equipment needs them", accept: ["no", "n", "it doesn't", "not required", "no it doesn't"] },
    { id: "law-16", lesson: "laws", q: "Which Part of the Building Regulations covers infrastructure for high-speed broadband in new homes?", a: "Part R", accept: ["r", "part r"] },
    { id: "law-17", lesson: "laws", q: "Which Part of the Building Regulations, added in 2024, covers toilet accommodation in new non-domestic buildings?", a: "Part T", accept: ["t", "part t"] },
    { id: "law-18", lesson: "laws", q: "Which Part of the Building Regulations covers infrastructure for charging electric vehicles?", a: "Part S", accept: ["s", "part s"] },
    { id: "law-19", lesson: "laws", q: "Which statutory regulations require a way to cut off the supply and isolate equipment, and work to be done dead where possible?", a: "The Electricity at Work Regulations 1989", accept: ["electricity at work regulations", "the electricity at work regulations", "electricity at work regulations 1989", "eawr", "eawr 1989", "electricity at work act"] },
    { id: "law-20", lesson: "laws", q: "What do the letters ESQCR stand for? (They're mostly about the DNO's duties.)", a: "Electricity Safety, Quality and Continuity Regulations (2002)", accept: ["electricity safety quality and continuity regulations", "electricity safety quality and continuity regulations 2002", "the electricity safety quality and continuity regulations"] },
    { id: "law-12", lesson: "laws", q: "Which Part of the Building Regulations covers fire safety, such as keeping fire barriers intact where cables pass through?", a: "Part B", accept: ["b", "part b"] },
    { id: "law-13", lesson: "laws", q: "Which Part of the Building Regulations covers structure, such as notching and drilling joists?", a: "Part A", accept: ["a", "part a"] },
    { id: "law-14", lesson: "laws", q: "Under the Electricity at Work Regulations, should work normally be done live or dead?", a: "Dead. Live working only when it's unreasonable to be dead, reasonable to work live, and with suitable precautions", accept: ["dead", "isolated", "dead and isolated"] },

    // ---------------- BS 7671 and its definitions ----------------
    { id: "bs-01", lesson: "bs7671", q: "What is the full current designation of the 18th Edition Wiring Regulations, including the latest amendment?", a: "BS 7671:2018+A4:2026", accept: ["bs 7671:2018+a4:2026", "bs7671:2018+a4:2026", "bs 7671 2018+a4 2026", "bs7671 2018 a4 2026", "bs 7671 2018 + a4 2026", "bs 7671:2018 + a4:2026"] },
    { id: "bs-02", lesson: "bs7671", q: "Which Part of BS 7671 contains the definitions?", a: "Part 2", num: 2, tol: 0 },
    { id: "bs-03", lesson: "bs7671", q: "Which Part of BS 7671 covers special installations or locations, such as bathrooms?", a: "Part 7", num: 7, tol: 0 },
    { id: "bs-04", lesson: "bs7671", q: "Which Part of BS 7671 covers inspection and testing?", a: "Part 6", num: 6, tol: 0 },
    { id: "bs-05", lesson: "bs7671", q: "Which Part of BS 7671 covers protection for safety (shock, fire, overcurrent)?", a: "Part 4", num: 4, tol: 0 },
    { id: "bs-06", lesson: "bs7671", q: "Which Part of BS 7671 covers the selection and erection of equipment?", a: "Part 5", num: 5, tol: 0 },
    { id: "bs-07", lesson: "bs7671", q: "Which section of BS 7671 covers locations containing a bath or shower?", a: "Section 701", num: 701, tol: 0 },
    { id: "bs-08", lesson: "bs7671", q: "Which section of BS 7671 covers electric vehicle charging installations?", a: "Section 722", num: 722, tol: 0 },
    { id: "bs-09", lesson: "bs7671", q: "In regulation 411.3.3, which digits give the <strong>Chapter</strong>?", a: "41 (the first two digits)", num: 41, tol: 0 },
    { id: "bs-10", lesson: "bs7671", q: "Protection against electric shock under <strong>fault-free</strong> conditions (e.g. insulation) is called ___ protection.", a: "Basic protection", accept: ["basic", "basic protection"] },
    { id: "bs-11", lesson: "bs7671", q: "Protection against electric shock when a <strong>single fault</strong> occurs (e.g. earthing plus automatic disconnection) is called ___ protection.", a: "Fault protection", accept: ["fault", "fault protection"] },
    { id: "bs-12", lesson: "bs7671", q: "A 30 mA RCD provides what kind of protection?", a: "Additional protection", accept: ["additional", "additional protection"] },
    { id: "bs-13", lesson: "bs7671", q: "What does BS 7671 call a \"fused spur\"?", a: "A fused connection unit (FCU)", accept: ["fused connection unit", "fcu", "a fused connection unit", "switched fused connection unit"] },
    { id: "bs-14", lesson: "bs7671", q: "What does BS 7671 call a \"light fitting\"?", a: "A luminaire", accept: ["luminaire", "a luminaire"] },
    { id: "bs-15", lesson: "bs7671", q: "What does BS 7671 call a socket?", a: "A socket-outlet", accept: ["socket-outlet", "socket outlet", "a socket-outlet", "a socket outlet"] },
    { id: "bs-16", lesson: "bs7671", q: "A metal water pipe entering a building can introduce earth potential. What kind of conductive part is it?", a: "An extraneous-conductive-part", accept: ["extraneous", "extraneous-conductive-part", "extraneous conductive part", "an extraneous conductive part", "extraneous-conductive part"] },
    { id: "bs-17", lesson: "bs7671", q: "The metal case of a washing machine could become live in a fault. What kind of conductive part is it?", a: "An exposed-conductive-part", accept: ["exposed", "exposed-conductive-part", "exposed conductive part", "an exposed conductive part", "exposed-conductive part"] },
    { id: "bs-18", lesson: "bs7671", q: "Does BS 7671's definition of a \"live part\" include the neutral?", a: "Yes", accept: ["yes", "y", "it does"] },
    { id: "bs-19", lesson: "bs7671", q: "A device that can make, carry and break current in normal conditions, and also break it in abnormal conditions such as a short circuit, is a ___.", a: "Circuit breaker", accept: ["circuit breaker", "circuit-breaker", "breaker", "a circuit breaker", "mcb"] },
    { id: "bs-20", lesson: "bs7671", q: "An overcurrent in a circuit with no fault, caused by too much load, is called an ___ current.", a: "Overload current", accept: ["overload", "overload current"] },
    { id: "bs-21", lesson: "bs7671", q: "Conductors connecting incoming water and gas pipes to the main earthing terminal are called main protective ___ conductors.", a: "Bonding (main protective bonding conductors)", accept: ["bonding", "main protective bonding", "bonding conductors"] },
    { id: "bs-22", lesson: "bs7671", q: "A circuit connected directly to current-using equipment, or to socket-outlets, is called a ___ circuit.", a: "Final circuit", accept: ["final", "final circuit"] },
    { id: "bs-23", lesson: "bs7671", q: "A circuit that feeds a distribution board, rather than equipment directly, is called a ___ circuit.", a: "Distribution circuit (often called a sub-main)", accept: ["distribution", "distribution circuit", "sub-main", "sub main", "submain"] },
    { id: "bs-24", lesson: "bs7671", q: "The protective conductor connecting the main earthing terminal to the means of earthing is the ___ conductor.", a: "Earthing conductor", accept: ["earthing", "earthing conductor"] },
    { id: "bs-25", lesson: "bs7671", q: "Where do the earthing conductor, circuit protective conductors and main protective bonding conductors all connect?", a: "The main earthing terminal (MET)", accept: ["main earthing terminal", "the main earthing terminal", "met", "the met", "main earth terminal"] },
    { id: "bs-26", lesson: "bs7671", q: "Any current greater than the rated value, whether an overload or a fault current, is called an ___.", a: "Overcurrent", accept: ["overcurrent", "over current", "over-current"] },
    { id: "bs-27", lesson: "bs7671", q: "An overcurrent caused by a fault of negligible impedance between live conductors, such as line touching neutral, is a ___ current.", a: "Short-circuit current", accept: ["short-circuit", "short circuit", "short-circuit current", "short circuit current"] },
    { id: "bs-28", lesson: "bs7671", q: "BS 7671's term for someone with the education and experience to recognise electrical risks and avoid the dangers:", a: "Skilled person (electrically)", accept: ["skilled person", "skilled", "skilled person electrically", "a skilled person"] },
    { id: "bs-29", lesson: "bs7671", q: "How far upwards from where a person stands does arm's reach extend?", a: "2.5 m (and 1.25 m sideways or downwards)", num: 2.5, tol: 0, unit: "m" },
    { id: "bs-30", lesson: "bs7671", q: "Which regulation says you must check the existing installation, including earthing and bonding, before an addition or alteration?", a: "Regulation 132.16", accept: ["132.16", "regulation 132.16", "reg 132.16"] },
    { id: "bs-31", lesson: "bs7671", q: "Which appendix of BS 7671 lists the British Standards that equipment should meet?", a: "Appendix 1", accept: ["1", "appendix 1", "app 1"] },

    // ---------------- Part P and notification ----------------
    { id: "pp-01", lesson: "part-p", q: "Which two countries does Part P apply in?", a: "England and Wales", accept: ["england and wales", "wales and england", "england wales", "england & wales"] },
    { id: "pp-02", lesson: "part-p", q: "Does Part P apply to the lift in a block of flats?", a: "No: lifts are specifically excluded", accept: ["no", "n", "it doesn't", "excluded"] },
    { id: "pp-03", lesson: "part-p", q: "Does Part P apply to the residents' gym in a block of flats?", a: "Yes: shared amenities and common areas are covered", accept: ["yes", "y"] },
    { id: "pp-04", lesson: "part-p", q: "A shop shares one supply with the flat above it. Does Part P apply to the shop?", a: "Yes, because it shares a supply with a dwelling", accept: ["yes", "y"] },
    { id: "pp-05", lesson: "part-p", q: "In England, is replacing a consumer unit notifiable?", a: "Yes, always", accept: ["yes", "y"] },
    { id: "pp-06", lesson: "part-p", q: "In England, is adding a socket to an existing circuit in a kitchen notifiable?", a: "No: it's minor work in England (but notifiable in Wales)", accept: ["no", "n"] },
    { id: "pp-07", lesson: "part-p", q: "In England, is installing a new circuit notifiable?", a: "Yes: any new circuit is notifiable", accept: ["yes", "y"] },
    { id: "pp-08", lesson: "part-p", q: "In England, is adding a light point to an existing circuit 0.4 m from the edge of a bath notifiable?", a: "Yes: it's within the special location (0.6 m from the bath, up to 2.25 m)", accept: ["yes", "y"] },
    { id: "pp-09", lesson: "part-p", q: "Non-notifiable electrical work is often called ___ works.", a: "Minor works", accept: ["minor", "minor works", "minor work"] },
    { id: "pp-10", lesson: "part-p", q: "Using a building notice, at least how many working days before starting must building control be told?", a: "2 working days", num: 2, tol: 0, unit: "days" },
    { id: "pp-11", lesson: "part-p", q: "What kind of scheme lets a registered electrician self-certify notifiable work?", a: "A Competent Person Scheme (CPS)", accept: ["competent person scheme", "competent persons scheme", "cps", "a competent person scheme"] },
    { id: "pp-12", lesson: "part-p", q: "Name one Competent Person Scheme for electricians.", a: "NICEIC or NAPIT (others include ELECSA and Stroma)", accept: ["niceic", "napit", "elecsa", "stroma"] },
    { id: "pp-13", lesson: "part-p", q: "Someone not in a Competent Person Scheme can have notifiable work inspected and certified by a registered ___ certifier.", a: "Third-party certifier", accept: ["third-party", "third party", "3rd party", "third-party certifier", "third party certifier"] },
    { id: "pp-14", lesson: "part-p", q: "Which certificate is issued for a new circuit or a consumer unit replacement?", a: "An Electrical Installation Certificate (EIC)", accept: ["eic", "electrical installation certificate", "an electrical installation certificate"] },
    { id: "pp-15", lesson: "part-p", q: "Which certificate is issued for minor works, such as an extra socket on an existing circuit?", a: "A Minor Electrical Installation Works Certificate (MEIWC)", accept: ["meiwc", "minor works certificate", "minor electrical installation works certificate", "minor works", "mwc"] },
    { id: "pp-16", lesson: "part-p", q: "Which report records the condition of an existing installation?", a: "An Electrical Installation Condition Report (EICR)", accept: ["eicr", "electrical installation condition report", "condition report", "an eicr"] },
    { id: "pp-17", lesson: "part-p", q: "On an EICR, what does code C1 mean?", a: "Danger present: immediate action needed", accept: ["danger present", "danger", "dangerous", "immediate danger", "danger present immediate action required"] },
    { id: "pp-18", lesson: "part-p", q: "On an EICR, what does code C2 mean?", a: "Potentially dangerous: urgent remedial action needed", accept: ["potentially dangerous", "potential danger", "potentially dangerous urgent remedial action required"] },
    { id: "pp-19", lesson: "part-p", q: "On an EICR, what does code C3 mean?", a: "Improvement recommended", accept: ["improvement recommended", "improvement", "recommended improvement", "improvement recommended not dangerous"] },
    { id: "pp-20", lesson: "part-p", q: "On an EICR, what does code FI mean?", a: "Further investigation required", accept: ["further investigation", "further investigation required", "further investigation needed"] },
    { id: "pp-21", lesson: "part-p", q: "In <strong>Wales</strong>, is adding a socket to an existing circuit in a kitchen notifiable?", a: "Yes. Wales treats kitchen work as notifiable (England doesn't)", accept: ["yes", "y"] },
    { id: "pp-22", lesson: "part-p", q: "In <strong>Wales</strong>, is adding an outdoor socket to an existing circuit notifiable?", a: "Yes. Wales treats outdoor work as notifiable (England doesn't)", accept: ["yes", "y"] },
    { id: "pp-23", lesson: "part-p", q: "In England, is adding a light point on the far side of a bathroom, 2 m from the bath, notifiable?", a: "No: in England only the space within 0.6 m of the bath or shower tray is a special location", accept: ["no", "n"] },
    { id: "pp-24", lesson: "part-p", q: "For notification in England, how far out from the edge of a bath or shower tray does the special location reach?", a: "0.6 m", num: 0.6, tol: 0, unit: "m" },
    { id: "pp-25", lesson: "part-p", q: "For notification in England, how high does the special location around a bath reach (with a shower head no higher)?", a: "2.25 m above the finished floor", num: 2.25, tol: 0, unit: "m" },
    { id: "pp-26", lesson: "part-p", q: "For notification in England, with no shower tray, how far from the fixed shower head does the special location reach?", a: "1.2 m", num: 1.2, tol: 0, unit: "m" },
    { id: "pp-27", lesson: "part-p", q: "In <strong>Wales</strong>, what two things make a room (or part of one) a kitchen?", a: "A sink and food preparation facilities", accept: ["sink and food preparation", "a sink and food preparation", "sink and food prep", "sink and food preparation facilities", "food preparation and sink", "sink food preparation"] },
    { id: "pp-28", lesson: "part-p", q: "In <strong>Wales</strong>, in an open-plan room, how far from the sink does the kitchen reach (if no wall is nearer)?", a: "3 m from the edge of the sink", num: 3, tol: 0, unit: "m" },
    { id: "pp-29", lesson: "part-p", q: "In <strong>Wales</strong>, is installing solar PV notifiable?", a: "Yes: solar PV is on the Welsh list of notifiable installations", accept: ["yes", "y"] },

    // ---------------- Bathrooms and special locations ----------------
    { id: "bath-01", lesson: "bathrooms", q: "Which zone is the inside of the bath or shower tray?", a: "Zone 0", num: 0, tol: 0 },
    { id: "bath-02", lesson: "bathrooms", q: "Zone 1 goes up to how many metres above the finished floor (unless a fixed shower head is higher)?", a: "2.25 m", num: 2.25, tol: 0, unit: "m" },
    { id: "bath-03", lesson: "bathrooms", q: "How far (in m) does zone 2 extend horizontally beyond zone 1?", a: "0.6 m", num: 0.6, tol: 0, unit: "m" },
    { id: "bath-04", lesson: "bathrooms", q: "For a walk-in shower with no tray, how far (in m) does zone 1 extend from the fixed water outlet?", a: "1.2 m", num: 1.2, tol: 0, unit: "m" },
    { id: "bath-05", lesson: "bathrooms", q: "The space under a bath is reachable without a tool. Which zone is it?", a: "Zone 1", num: 1, tol: 0 },
    { id: "bath-06", lesson: "bathrooms", q: "What minimum IP rating is needed for equipment in zone 0?", a: "IPX7", accept: ["ipx7", "ip x7", "ip67", "x7"] },
    { id: "bath-07", lesson: "bathrooms", q: "What minimum IP rating is needed for equipment in zones 1 and 2?", a: "IPX4", accept: ["ipx4", "ip x4", "ip44", "x4"] },
    { id: "bath-08", lesson: "bathrooms", q: "What IP rating is needed in the zones where water jets are used for cleaning?", a: "IPX5", accept: ["ipx5", "ip x5", "ip65", "x5"] },
    { id: "bath-09", lesson: "bathrooms", q: "At least how many metres horizontally must socket-outlets be from the boundary of zone 1?", a: "3 m", num: 3, tol: 0, unit: "m" },
    { id: "bath-10", lesson: "bathrooms", q: "What RCD rating must protect every circuit in a room containing a bath or shower (in mA)?", a: "30 mA", num: 30, tol: 0, unit: "mA" },
    { id: "bath-11", lesson: "bathrooms", q: "In an IP code, what does the first digit describe?", a: "Protection against solid objects (fingers, tools, dust)", accept: ["solids", "solid objects", "solid", "protection against solids", "solid objects and dust", "dust", "objects", "protection against solid objects"] },
    { id: "bath-12", lesson: "bathrooms", q: "In an IP code, what does the second digit describe?", a: "Protection against water", accept: ["water", "protection against water", "liquids", "moisture", "water ingress"] },
    { id: "bath-13", lesson: "bathrooms", q: "In an IP code such as IPX4, what does the X mean?", a: "Not tested or not specified for that category", accept: ["not tested", "not specified", "not tested or specified", "not rated", "untested", "unspecified", "no rating"] },
    { id: "bath-14", lesson: "bathrooms", q: "Which IP water digit means protected against splashing from any direction?", a: "4", num: 4, tol: 0 },
    { id: "bath-15", lesson: "bathrooms", q: "Which IP solids digit means dust-tight?", a: "6", num: 6, tol: 0 },
    { id: "bath-16", lesson: "bathrooms", q: "What is the maximum SELV voltage (AC) for equipment in zone 0?", a: "12 V AC", num: 12, tol: 0, unit: "V" },
    { id: "bath-17", lesson: "bathrooms", q: "In a room with a shower tray, where does zone 1 end horizontally?", a: "At the edge of the shower tray", accept: ["edge of the tray", "the edge of the tray", "at the edge of the tray", "tray edge", "the tray edge", "edge of tray", "at the tray edge", "the edge of the shower tray", "edge of the shower tray", "at the edge of the shower tray"] },
    { id: "bath-18", lesson: "bathrooms", q: "Does a walk-in shower with no tray have a zone 2?", a: "No", accept: ["no", "no zone 2", "none", "it doesn't", "no it doesn't", "no, it doesn't"] },
    // ---------------- DC and AC (DC-specific) ----------------
    { id: "dc-01", lesson: "dc-ac", q: "Current that always flows the same way, at a steady voltage, is called ___ current.", a: "Direct current (DC)", accept: ["direct", "direct current", "dc"] },
    { id: "dc-02", lesson: "dc-ac", q: "Do solar PV panels generate AC or DC?", a: "DC", accept: ["dc", "direct current", "direct"] },
    { id: "dc-03", lesson: "dc-ac", q: "What converts AC into DC?", a: "A rectifier", accept: ["rectifier", "a rectifier", "rectifiers", "diodes", "a diode bridge", "bridge rectifier"] },
    { id: "dc-04", lesson: "dc-ac", q: "What converts DC into AC, for example in a solar PV system?", a: "An inverter", accept: ["inverter", "an inverter", "inverters"] },
    { id: "dc-05", lesson: "dc-ac", q: "Why is a DC arc harder to put out than an AC one?", a: "DC never crosses zero, so the arc doesn't get a chance to go out by itself", accept: ["no zero crossing", "no zero crossings", "it never crosses zero", "doesn't cross zero", "doesnt cross zero", "never crosses zero", "no zero point", "it doesn't pass through zero", "no zero"] },
    { id: "dc-06", lesson: "dc-ac", q: "How many times a second does 50 Hz AC cross zero?", a: "100 times (twice per cycle)", num: 100, tol: 0 },
    { id: "dc-07", lesson: "dc-ac", q: "Which RCD type also detects smooth DC residual current?", a: "Type B", accept: ["b", "type b"] },
    { id: "dc-08", lesson: "dc-ac", q: "Which RCD type detects AC and pulsating DC, and is the usual type for general circuits in homes?", a: "Type A", accept: ["a", "type a"] },
    { id: "dc-09", lesson: "dc-ac", q: "What is the upper limit (in V) of extra-low voltage for ripple-free DC in BS 7671?", a: "120 V", num: 120, tol: 0, unit: "V" },
    { id: "dc-10", lesson: "dc-ac", q: "What is the upper limit (in V) of extra-low voltage for AC in BS 7671?", a: "50 V", num: 50, tol: 0, unit: "V" },
    { id: "dc-11", lesson: "dc-ac", q: "How much DC leakage (in mA) does the detection built into many home car chargers respond to?", a: "6 mA", num: 6, tol: 0, unit: "mA" },

    // ---------------- Impedance and power factor ----------------
    { id: "imp-01", lesson: "impedance", q: "The opposition to AC from coils and capacitors, which stores energy rather than turning it into heat, is called ___.", a: "Reactance (X)", accept: ["reactance", "x"] },
    { id: "imp-02", lesson: "impedance", q: "Resistance and reactance combined make ___.", a: "Impedance (Z)", accept: ["impedance", "z"] },
    { id: "imp-03", lesson: "impedance", q: "Impedance: Z = ?", a: "√(R² + X²)", accept: ["sqrt(r^2+x^2)", "√(r^2+x^2)", "sqrt r^2+x^2", "√r^2+x^2", "root r^2+x^2", "sqrt(r2+x2)", "√(r²+x²)", "square root of r^2+x^2"] },
    { id: "imp-04", lesson: "impedance", q: "Inductive reactance: X<sub>L</sub> = ?", a: "2πfL", accept: ["2πfl", "2pifl", "2 pi f l", "2xπxfxl", "2πf l", "2 π f l"] },
    { id: "imp-05", lesson: "impedance", q: "Capacitive reactance: X<sub>C</sub> = ?", a: "" + F("1", "2πfC") + "", accept: ["1/2πfc", "1/(2πfc)", "1/2pifc", "1/(2pifc)", "1/(2 pi f c)", "1 over 2πfc"] },
    { id: "imp-06", lesson: "impedance", q: "The frequency rises. Does an inductor's reactance go up or down?", a: "Up (X<sub>L</sub> = 2πfL)", accept: ["up", "goes up", "it goes up", "increases", "rises", "higher"] },
    { id: "imp-07", lesson: "impedance", q: "The frequency rises. Does a capacitor's reactance go up or down?", a: "Down (X<sub>C</sub> = " + F("1", "2πfC") + ")", accept: ["down", "goes down", "it goes down", "decreases", "falls", "lower"] },
    { id: "imp-08", lesson: "impedance", q: "6 Ω resistance and 8 Ω reactance. What is the impedance?", a: "√(6² + 8²) = 10 Ω", num: 10, unit: "Ω" },
    { id: "imp-09", lesson: "impedance", q: "In an inductive circuit such as a motor, does the current lead or lag the voltage?", a: "Lag (CIVIL: V leads I in an inductor)", accept: ["lag", "lags", "it lags", "lagging", "lags the voltage"] },
    { id: "imp-10", lesson: "impedance", q: "In a capacitive circuit, does the current lead or lag the voltage?", a: "Lead (CIVIL: in a capacitor, I leads V)", accept: ["lead", "leads", "it leads", "leading", "leads the voltage"] },
    { id: "imp-11", lesson: "impedance", q: "What unit is apparent power (S = V × I) measured in?", a: "Volt-amperes (VA)", accept: ["va", "volt-amperes", "volt amperes", "volt-amps", "volt amps", "kva"] },
    { id: "imp-12", lesson: "impedance", q: "What unit is reactive power (Q) measured in?", a: "var (volt-ampere reactive)", accept: ["var", "vars", "volt-ampere reactive", "volt amperes reactive", "volt-amperes reactive", "kvar"] },
    { id: "imp-13", lesson: "impedance", q: "Power factor = cos φ = P over ?", a: "S, the apparent power (also R over Z)", accept: ["s", "apparent power", "va", "the apparent power"] },
    { id: "imp-14", lesson: "impedance", q: "A motor draws 10 A at 230 V with a power factor of 0.8. What real power does it use (in W)?", a: "230 × 10 × 0.8 = 1,840 W", num: 1840, unit: "W" },
    { id: "imp-15", lesson: "impedance", q: "What's fitted to correct a poor lagging power factor?", a: "Capacitors", accept: ["capacitor", "capacitors", "a capacitor", "capacitance", "power factor correction capacitors"] },
    { id: "imp-16", lesson: "impedance", q: "What is the power factor of a pure resistance, such as a heater?", a: "1 (unity)", accept: ["1", "one", "unity", "1.0"] },
    // ---------------- Picture cards: DC and AC graphs ----------------
    { id: "dcg-01", lesson: "dc-ac", q: "This graph shows voltage against time. What kind of supply is it?" + graph("dc"), a: "DC: a steady voltage that never changes direction", accept: ["dc", "direct current", "direct", "a dc supply"] },
    { id: "dcg-02", lesson: "dc-ac", q: "This graph shows voltage against time. What kind of supply is it?" + graph("ac"), a: "AC: a sine wave that keeps reversing", accept: ["ac", "alternating current", "alternating", "an ac supply", "sine wave"] },
    { id: "dcg-03", lesson: "dc-ac", q: "UK mains, 230 V RMS. What is the voltage at the marked point?" + graph("ac", { mark: 90, cycles: 1 }), a: "+325 V, the positive peak (90°)", num: 325, tol: 0.01, unit: "V" },
    { id: "dcg-04", lesson: "dc-ac", q: "UK mains, 230 V RMS. What is the voltage at the marked point?" + graph("ac", { mark: 270, cycles: 1 }), a: "−325 V, the negative peak (270°)", num: -325, tol: 0.01, unit: "V" },
    { id: "dcg-05", lesson: "dc-ac", q: "UK mains, 230 V RMS. What is the voltage at the marked point?" + graph("ac", { mark: 180, cycles: 1 }), a: "0 V (180°, crossing zero on the way down)", num: 0, tol: 0, unit: "V" },
    { id: "dcg-06", lesson: "dc-ac", q: "How many degrees through the cycle is the marked point?" + graph("ac", { mark: 90, cycles: 1 }), a: "90° (" + F("π", "2") + " radians)", num: 90, tol: 0, unit: "°" },
    { id: "dcg-07", lesson: "dc-ac", q: "On UK mains, what do the dashed lines mark?" + graph("ac", { rms: true }), a: "The RMS value, ±230 V. The wave itself peaks at ±325 V", accept: ["rms", "the rms value", "rms value", "230", "230 v", "230v", "230 v rms", "rms 230 v", "rms voltage", "the rms voltage"] },
    { id: "dcg-08", lesson: "dc-ac", q: "At 50 Hz, how many milliseconds does the marked cycle take?" + graph("ac", { cycles: 2, period: true }), a: "20 ms (T = " + F("1", "50") + " s)", num: 20, tol: 0, unit: "ms" },

    // ---------------- Picture cards: impedance ----------------
    { id: "ig-01", lesson: "impedance", q: "In this impedance triangle, what does the side marked ? represent?" + triangle(4, 3, ["?", "X", "Z"]), a: "Resistance (R)", accept: ["resistance", "r", "the resistance"] },
    { id: "ig-02", lesson: "impedance", q: "In this impedance triangle, what does the side marked ? represent?" + triangle(4, 3, ["R", "?", "Z"]), a: "Reactance (X)", accept: ["reactance", "x", "the reactance"] },
    { id: "ig-03", lesson: "impedance", q: "In this impedance triangle, what does the side marked ? represent?" + triangle(4, 3, ["R", "X", "?"]), a: "Impedance (Z)", accept: ["impedance", "z", "the impedance"] },
    { id: "ig-04", lesson: "impedance", q: "What is the impedance, in Ω?" + triangle(4, 3, ["4 Ω", "3 Ω", "?"]), a: "√(4² + 3²) = 5 Ω", num: 5, unit: "Ω" },
    { id: "ig-05", lesson: "impedance", q: "What is the impedance, in Ω?" + triangle(6, 8, ["6 Ω", "8 Ω", "?"]), a: "√(6² + 8²) = 10 Ω", num: 10, unit: "Ω" },
    { id: "ig-06", lesson: "impedance", q: "The reactance points downwards in this impedance triangle. Is the load inductive or capacitive?" + triangle(4, 3, ["R", "X", "Z"], { down: true }), a: "Capacitive", accept: ["capacitive", "capacitor", "capacitance"] },
    { id: "ig-07", lesson: "impedance", q: "The reactance points upwards in this impedance triangle. Is the load inductive or capacitive?" + triangle(4, 3, ["R", "X", "Z"]), a: "Inductive, as in a motor", accept: ["inductive", "inductor", "inductance"] },
    { id: "ig-08", lesson: "impedance", q: "Does the current lead or lag the voltage?" + waves(45), a: "It lags: it peaks after the voltage (an inductive load)", accept: ["lag", "lags", "it lags", "lagging"] },
    { id: "ig-09", lesson: "impedance", q: "Does the current lead or lag the voltage?" + waves(-45), a: "It leads: it peaks before the voltage (a capacitive load)", accept: ["lead", "leads", "it leads", "leading"] },
    { id: "ig-10", lesson: "impedance", q: "Current and voltage peak together. What is the power factor?" + waves(0), a: "1 (unity), as in a pure resistance", accept: ["1", "one", "unity", "1.0"] },
    { id: "ig-11", lesson: "impedance", q: "In this power triangle, what is the side marked ?" + triangle(4, 3, ["P (W)", "Q (var)", "?"]), a: "Apparent power, S, in VA", accept: ["apparent power", "apparent", "s", "va", "apparent power s", "volt-amperes", "volt amperes"] },
    { id: "ig-12", lesson: "impedance", q: "In this triangle, what is cos φ called?" + triangle(4, 3, ["R", "X", "Z"], { phi: true }), a: "The power factor (" + F("R", "Z") + ")", accept: ["power factor", "the power factor", "pf"] },
    { id: "ig-13", lesson: "impedance", q: "What is the power factor of this load?" + triangle(8, 6, ["8 Ω", "6 Ω", "10 Ω"], { phi: true }), a: "cos φ = " + F("R", "Z") + " = " + F("8", "10") + " = 0.8", num: 0.8, tol: 0.01 },
    // ---------------- Consumer units and protective devices ----------------
    { id: "cu-01", lesson: "consumer-units", q: "Is the main switch in a consumer unit a protective device?", a: "No. It's a double-pole isolator for switching the installation off; it doesn't trip", accept: ["no", "n", "it isn't", "it's an isolator", "isolator"] },
    { id: "cu-02", lesson: "consumer-units", q: "The main switch breaks both line and neutral. What is that kind of switch called?", a: "Double-pole", accept: ["double-pole", "double pole", "dp", "2 pole", "two pole", "double pole switch", "double-pole isolator"] },
    { id: "cu-03", lesson: "consumer-units", q: "What must the enclosure of a consumer unit in a home be made of (or be housed in)?", a: "Non-combustible material, usually steel", accept: ["non-combustible", "non combustible", "noncombustible", "steel", "metal", "non-combustible material", "a non-combustible material"] },
    { id: "cu-04", lesson: "consumer-units", q: "What does MCB stand for?", a: "Miniature circuit breaker", accept: ["miniature circuit breaker", "miniature circuit-breaker"] },
    { id: "cu-05", lesson: "consumer-units", q: "Which part of an MCB responds to a slow overload?", a: "The thermal trip (a bimetallic strip)", accept: ["thermal", "thermal trip", "bimetal", "bimetallic strip", "bi-metallic strip", "bimetallic", "the bimetallic strip", "the thermal trip", "bimetal strip"] },
    { id: "cu-06", lesson: "consumer-units", q: "Which part of an MCB trips almost instantly on a short circuit?", a: "The magnetic trip (a coil and plunger)", accept: ["magnetic", "magnetic trip", "the magnetic trip", "coil", "solenoid", "the coil", "electromagnetic"] },
    { id: "cu-07", lesson: "consumer-units", q: "A Type B MCB trips instantly at between 3 and how many times its rating?", a: "5 × I<sub>n</sub>", num: 5, tol: 0 },
    { id: "cu-08", lesson: "consumer-units", q: "A Type C MCB trips instantly at between 5 and how many times its rating?", a: "10 × I<sub>n</sub>", num: 10, tol: 0 },
    { id: "cu-09", lesson: "consumer-units", q: "A Type D MCB trips instantly at between 10 and how many times its rating?", a: "20 × I<sub>n</sub>", num: 20, tol: 0 },
    { id: "cu-10", lesson: "consumer-units", q: "Which MCB type is the usual choice for home circuits?", a: "Type B", accept: ["b", "type b"] },
    { id: "cu-11", lesson: "consumer-units", q: "What does RCCB stand for?", a: "Residual current circuit breaker: an RCD with no overcurrent protection", accept: ["residual current circuit breaker", "residual current circuit-breaker"] },
    { id: "cu-12", lesson: "consumer-units", q: "An RCD compares the current in which two conductors?", a: "Line and neutral", accept: ["line and neutral", "neutral and line", "l and n", "line neutral", "live and neutral"] },
    { id: "cu-13", lesson: "consumer-units", q: "What is the ring-shaped core inside an RCD called?", a: "A toroid", accept: ["toroid", "a toroid", "toroidal core", "toroidal transformer", "toroidal coil", "toroidal"] },
    { id: "cu-14", lesson: "consumer-units", q: "Does an RCD on its own protect against overload?", a: "No: an overload is balanced, so it needs MCBs or fuses too", accept: ["no", "n"] },
    { id: "cu-15", lesson: "consumer-units", q: "Within how many ms must a 30 mA general-type RCD trip at 30 mA?", a: "300 ms", num: 300, tol: 0, unit: "ms" },
    { id: "cu-16", lesson: "consumer-units", q: "Within how many ms must a 30 mA general-type RCD trip at five times its rating (150 mA)?", a: "40 ms", num: 40, tol: 0, unit: "ms" },
    { id: "cu-17", lesson: "consumer-units", q: "Below what residual current (mA) must a 30 mA RCD <strong>not</strong> trip?", a: "15 mA (half its rating)", num: 15, tol: 0, unit: "mA" },
    { id: "cu-18", lesson: "consumer-units", q: "How often should an RCD's test button be pressed?", a: "Every six months", accept: ["every six months", "six months", "6 months", "every 6 months", "six monthly", "6 monthly", "twice a year"] },
    { id: "cu-19", lesson: "consumer-units", q: "Which single device gives both overcurrent and 30 mA earth leakage protection to one circuit?", a: "An RCBO", accept: ["rcbo", "an rcbo", "rcbos"] },
    { id: "cu-20", lesson: "consumer-units", q: "On a split-load board, an earth fault on one circuit trips its RCD. What else goes off?", a: "Every other circuit on that RCD", accept: ["every circuit on that rcd", "all the circuits on that rcd", "all circuits on the rcd", "the other circuits on that rcd", "the rest of that side", "half the house", "all circuits on that side", "everything on that rcd", "the other circuits on the same rcd"] },
    { id: "cu-21", lesson: "consumer-units", q: "What does an SPD protect against?", a: "Voltage surges and spikes, e.g. from lightning or switching", accept: ["surges", "voltage surges", "surge", "spikes", "voltage spikes", "transient overvoltages", "overvoltage", "lightning", "surges and spikes"] },
    { id: "cu-22", lesson: "consumer-units", q: "What kind of fault does an AFDD detect?", a: "Dangerous arcing, e.g. from a loose connection or damaged cable", accept: ["arc", "arcs", "arcing", "arc faults", "arc fault", "arcing faults", "dangerous arcing"] },
    { id: "cu-23", lesson: "consumer-units", q: "What device and rating usually protects a domestic lighting circuit?", a: "A 6 A Type B MCB (or RCBO)", accept: ["6a", "6 a", "6a type b", "6 a type b", "b6", "6a mcb", "6 a mcb", "6a type b mcb", "6 a type b mcb", "6a rcbo", "6 amp"] },
    { id: "cu-24", lesson: "consumer-units", q: "What rating of device usually protects a 2.5 mm² ring final socket circuit?", a: "32 A", num: 32, tol: 0, unit: "A" },
    { id: "cu-25", lesson: "consumer-units", q: "What colour dot marks a 30 A rewirable fuse carrier?", a: "Red", accept: ["red"] },
    { id: "cu-26", lesson: "consumer-units", q: "What colour dot marks a 5 A rewirable fuse carrier (lighting)?", a: "White", accept: ["white"] },
    { id: "cu-27", lesson: "consumer-units", q: "Which British Standard covers rewirable (semi-enclosed) fuses?", a: "BS 3036", accept: ["bs 3036", "bs3036", "3036"] },
    { id: "cu-28", lesson: "consumer-units", q: "What fills an HBC cartridge fuse to quench the arc?", a: "Silica sand", accept: ["sand", "silica sand", "silica", "quartz sand"] },
    { id: "cu-29", lesson: "consumer-units", q: "A short circuit is a fault between which conductors?", a: "Live conductors, such as line and neutral", accept: ["line and neutral", "live conductors", "between live conductors", "neutral and line", "l and n", "line to neutral"] },
    { id: "cu-30", lesson: "consumer-units", q: "Can a circuit breaker detect a neutral-to-earth fault?", a: "No: it draws no extra current. Only an RCD sees the imbalance", accept: ["no", "n"] },
    { id: "cu-31", lesson: "consumer-units", q: "On a split-load board, what happens if a circuit's neutral goes to the wrong RCD's neutral bar?", a: "Nuisance tripping: the RCDs see currents that don't balance", accept: ["nuisance tripping", "the rcd trips", "rcds trip", "it trips", "tripping", "the rcds trip"] },
    { id: "cu-32", lesson: "consumer-units", q: "An SPD's indicator window has turned red. What does it mean?", a: "It has absorbed a surge and needs replacing", accept: ["replace it", "needs replacing", "it has failed", "faulty", "it needs replacing", "it has absorbed a surge", "replace"] },
    { id: "cu-33", lesson: "consumer-units", q: "Swapping a Type B breaker for a Type C of the same rating does what to the circuit's maximum Z<sub>s</sub>?", a: "Halves it (Type C needs 10 × I<sub>n</sub> to trip instantly, not 5 ×)", accept: ["halves", "halves it", "halved", "it halves", "half"] },
    // ---------------- Three-phase: why ----------------
    { id: "tp-01", lesson: "three-phase", q: "Single-phase power pulses up and down 100 times a second. What is the total power like with a balanced three-phase load?", a: "Constant: one phase is always near its peak, so the total stays steady", accept: ["constant", "steady", "smooth", "it's constant", "its constant", "constant power", "steady power", "it stays constant", "even", "level"] },
    { id: "tp-02", lesson: "three-phase", q: "Three single-phase circuits need six conductors. Roughly how many does a three-phase supply need to do the same job?", a: "Three or four: three lines, plus a shared neutral that carries almost nothing when balanced", num: 4, tol: 0.25 },
    { id: "tp-03", lesson: "three-phase", q: "Three phases fed to three sets of motor windings make a magnetic field that does what?", a: "Rotates on its own, so the motor starts itself", accept: ["rotates", "it rotates", "spins", "turns", "rotating", "a rotating field", "rotates by itself", "goes round", "rotate"] },

    // ---------------- Earthing systems ----------------
    { id: "es-01", lesson: "earthing-systems", q: "In an earthing system code, what does the first letter describe?", a: "The supply: how its star point is connected to earth", accept: ["the supply", "supply", "the source", "source", "the supply's connection to earth", "how the supply is earthed", "the transformer"] },
    { id: "es-02", lesson: "earthing-systems", q: "In an earthing system code, what does the second letter describe?", a: "How the installation's exposed metalwork is earthed", accept: ["the installation", "installation", "how the installation is earthed", "the installation's earth", "the consumer's installation"] },
    { id: "es-03", lesson: "earthing-systems", q: "What does the S in TN-S stand for?", a: "Separate: neutral and protective conductors are separate", accept: ["separate", "separated", "separate conductors"] },
    { id: "es-04", lesson: "earthing-systems", q: "What is a TN-C-S supply also commonly called?", a: "PME (protective multiple earthing)", accept: ["pme", "protective multiple earthing"] },
    { id: "es-05", lesson: "earthing-systems", q: "What's the name of the conductor that combines neutral and earth in a TN-C-S supply cable?", a: "The PEN conductor (protective earth and neutral)", accept: ["pen", "pen conductor", "the pen conductor", "protective earth and neutral", "cne", "combined neutral and earth"] },
    { id: "es-06", lesson: "earthing-systems", q: "Typical maximum Z<sub>e</sub> quoted for a TN-C-S (PME) supply?", a: "0.35 Ω", num: 0.35, tol: 0, unit: "Ω" },
    { id: "es-07", lesson: "earthing-systems", q: "Typical maximum Z<sub>e</sub> quoted for a TN-S supply?", a: "0.8 Ω", num: 0.8, tol: 0, unit: "Ω" },
    { id: "es-08", lesson: "earthing-systems", q: "Which earthing system gets no earth from the supply and uses its own earth rod?", a: "TT", accept: ["tt", "a tt system", "tt system"] },
    { id: "es-09", lesson: "earthing-systems", q: "On a TT system, which device normally provides fault protection?", a: "An RCD", accept: ["rcd", "an rcd", "rcds", "residual current device", "rcbo"] },
    { id: "es-10", lesson: "earthing-systems", q: "Above what electrode resistance might an earth electrode not be stable, according to the guidance?", a: "About 200 Ω", num: 200, tol: 0, unit: "Ω" },
    { id: "es-11", lesson: "earthing-systems", q: "What's the danger if the PEN conductor breaks on a PME supply?", a: "Earthed and bonded metalwork can rise towards 230 V", accept: ["metalwork becomes live", "earthed metalwork becomes live", "exposed metalwork can become live", "metal parts become live", "earthed metal rises to 230v", "bonded metalwork becomes live", "shock", "electric shock"] },
    { id: "es-12", lesson: "earthing-systems", q: "Amendment 4 added an arrangement where neutral and earth are joined at one point only, near the installation. What is it called?", a: "Protective neutral bonding (PNB)", accept: ["pnb", "protective neutral bonding"] },
    { id: "es-13", lesson: "earthing-systems", q: "May a PME earth be provided to a caravan or boat?", a: "No: the ESQCR doesn't allow it", accept: ["no", "n"] },
    { id: "es-14", lesson: "earthing-systems", q: "What kind of supply cable usually feeds a TN-C-S (PME) supply?", a: "Concentric cable: a central line with an outer ring of PEN strands", accept: ["concentric", "concentric cable", "a concentric cable"] },
    { id: "es-15", lesson: "earthing-systems", q: "On a TN-S supply, what part of the old supply cable provides the earth?", a: "Its lead sheath", accept: ["lead sheath", "the sheath", "sheath", "the lead sheath", "metal sheath", "armour", "the armour"] },
    { id: "es-16", lesson: "earthing-systems", q: "How many main earthing terminals does an installation have?", a: "One (in the consumer unit or a separate block)", num: 1, tol: 0 },

    // ---------------- Protective bonding ----------------
    { id: "bond-01", lesson: "bonding", q: "Metal that's part of the electrical equipment and could become live in a fault is called an ___-conductive-part.", a: "Exposed-conductive-part", accept: ["exposed", "exposed-conductive-part", "exposed conductive part"] },
    { id: "bond-02", lesson: "bonding", q: "Metal that isn't part of the installation but can bring in a potential, like a water pipe, is called an ___-conductive-part.", a: "Extraneous-conductive-part", accept: ["extraneous", "extraneous-conductive-part", "extraneous conductive part"] },
    { id: "bond-03", lesson: "bonding", q: "Within what distance of the gas meter's outlet union should main bonding be connected?", a: "600 mm (on the consumer's side, before any branch)", num: 600, tol: 0, unit: "mm" },
    { id: "bond-04", lesson: "bonding", q: "Typical main protective bonding size in a house with 25 mm² tails?", a: "10 mm²", num: 10, tol: 0, unit: "mm²" },
    { id: "bond-05", lesson: "bonding", q: "Typical earthing conductor size in a house with 25 mm² tails?", a: "16 mm²", num: 16, tol: 0, unit: "mm²" },
    { id: "bond-06", lesson: "bonding", q: "On a TN-S or TT supply, main bonding must be at least half the earthing conductor's size, and never less than what?", a: "6 mm²", num: 6, tol: 0, unit: "mm²" },
    { id: "bond-07", lesson: "bonding", q: "What size is supplementary bonding if it isn't mechanically protected?", a: "4 mm²", num: 4, tol: 0, unit: "mm²" },
    { id: "bond-08", lesson: "bonding", q: "What size is supplementary bonding if it is mechanically protected?", a: "2.5 mm²", num: 2.5, tol: 0, unit: "mm²" },
    { id: "bond-09", lesson: "bonding", q: "Does a metal sink fed only by plastic pipes need bonding?", a: "No: it can't introduce a potential, so it isn't extraneous", accept: ["no", "n"] },
    { id: "bond-10", lesson: "bonding", q: "What's the main purpose of protective equipotential bonding?", a: "Keeping parts that can be touched together at about the same voltage during a fault", accept: ["equal potential", "same potential", "same voltage", "keep metal at the same voltage", "equipotential", "reduce touch voltage", "limit touch voltage", "keep parts at the same potential"] },
    { id: "bond-11", lesson: "bonding", q: "Which conductor connects the supply's earth terminal to the main earthing terminal?", a: "The earthing conductor", accept: ["earthing conductor", "the earthing conductor", "main earthing conductor"] },
    { id: "bond-12", lesson: "bonding", q: "When supplementary bonding is left out of a bathroom, what's the maximum resistance from its pipework to the MET (30 mA RCDs)?", a: "1667 Ω (50 V ÷ 0.03 A)", num: 1667, tol: 0.01, unit: "Ω" },
    { id: "bond-13", lesson: "bonding", q: "Below what AC touch voltage does BS 7671 treat contact as safe to sustain in normal dry conditions?", a: "50 V", num: 50, tol: 0, unit: "V" },
    { id: "bond-14", lesson: "bonding", q: "One bonding conductor serves two pipes. Should it be cut at the first clamp?", a: "No: keep it continuous and loop it under the clamp, so the second pipe stays bonded if the first clamp fails", accept: ["no", "n", "keep it continuous", "continuous"] },
    { id: "bond-15", lesson: "bonding", q: "Water comes in through a plastic pipe, then changes to copper inside. Does the copper need main bonding?", a: "No: it isn't connected to the ground outside, so it isn't extraneous", accept: ["no", "n"] },
    { id: "bond-16", lesson: "bonding", q: "In On-Site Guide Figure 4.1, conductors 1, 2, 3 and 4 are the CPC, main bonding, earthing conductor and what?", a: "Supplementary protective bonding conductors", accept: ["supplementary bonding", "supplementary protective bonding", "supplementary", "supplementary bonding conductor", "supplementary bonding conductors"] },

    // ---------------- Automatic disconnection ----------------
    { id: "ads-01", lesson: "ads", q: "Complete the formula: Z<sub>s</sub> = Z<sub>e</sub> + ___", a: "(R<sub>1</sub> + R<sub>2</sub>)", accept: ["r1+r2", "r1 + r2", "(r1+r2)", "(r1 + r2)", "r1r2"] },
    { id: "ads-02", lesson: "ads", q: "On a TN system, maximum disconnection time for a final circuit up to 63 A with sockets?", a: "0.4 s", num: 0.4, tol: 0, unit: "s" },
    { id: "ads-03", lesson: "ads", q: "On a TN system, maximum disconnection time for a distribution circuit?", a: "5 s", num: 5, tol: 0, unit: "s" },
    { id: "ads-04", lesson: "ads", q: "On a TT system, maximum disconnection time for a final circuit up to 63 A with sockets?", a: "0.2 s", num: 0.2, tol: 0, unit: "s" },
    { id: "ads-05", lesson: "ads", q: "On a TT system, maximum disconnection time for a distribution circuit?", a: "1 s", num: 1, tol: 0, unit: "s" },
    { id: "ads-06", lesson: "ads", q: "Z<sub>e</sub> = 0.35 Ω and R<sub>1</sub> + R<sub>2</sub> = 0.65 Ω. What fault current flows at 230 V?", a: "230 A (Z<sub>s</sub> = 1.0 Ω)", num: 230, unit: "A" },
    { id: "ads-07", lesson: "ads", q: "A measured Z<sub>s</sub> is compared with roughly what percentage of the BS 7671 table maximum?", a: "80%, because conductors are cold when tested", num: 80, tol: 0, unit: "%" },
    { id: "ads-08", lesson: "ads", q: "Maximum Z<sub>s</sub> for a 32 A Type B circuit breaker at 0.4 s?", a: "1.37 Ω", num: 1.37, tol: 0.01, unit: "Ω" },
    { id: "ads-09", lesson: "ads", q: "Which BS 7671 tables give maximum Z<sub>s</sub> for fuses and circuit breakers?", a: "Tables 41.2 to 41.4", accept: ["41.2 to 41.4", "tables 41.2 to 41.4", "41.2-41.4", "41.2 41.3 41.4", "41.2, 41.3 and 41.4", "table 41.3", "41.3"] },
    { id: "ads-10", lesson: "ads", q: "On a TT system with an RCD, R<sub>A</sub> × I<sub>Δn</sub> must not exceed what voltage?", a: "50 V", num: 50, tol: 0, unit: "V" },
    { id: "ads-11", lesson: "ads", q: "What does C<sub>min</sub> = 0.95 allow for in the maximum Z<sub>s</sub> calculation?", a: "The supply voltage being lower than 230 V", accept: ["low voltage", "lower supply voltage", "voltage variation", "supply voltage tolerance", "the voltage being low", "minimum voltage", "voltage drop"] },
    { id: "ads-12", lesson: "ads", q: "BS 7671 doesn't say a breaker trips or a fuse blows. What word does it use?", a: "Operates", accept: ["operate", "operates", "operated"] },

    // ---------------- The earth fault loop explorer ----------------
    { id: "efl-01", lesson: "efl", q: "Name the parts of the earth fault loop inside the installation.", a: "The circuit's line conductor (R<sub>1</sub>) and circuit protective conductor (R<sub>2</sub>)", accept: ["r1 and r2", "r1 r2", "r1+r2", "line and cpc", "line conductor and cpc", "line and protective conductor", "the line and the cpc"] },
    { id: "efl-02", lesson: "efl", q: "Is the neutral conductor part of the earth fault loop in a TN-S installation?", a: "No: the fault current returns through the CPC and the earthing system", accept: ["no", "n"] },
    { id: "efl-03", lesson: "efl", q: "A circuit's Z<sub>s</sub> doubles. What happens to the earth fault current?", a: "It halves: I = " + F("U<sub>0</sub>", "Z<sub>s</sub>"), accept: ["halves", "it halves", "half", "halved", "goes down by half", "it is halved"] },
    { id: "efl-04", lesson: "efl", q: "What multiplier is used on R<sub>1</sub> + R<sub>2</sub> to allow for 70 °C thermoplastic cable at working temperature?", a: "1.20", num: 1.2, tol: 0 },
    { id: "efl-05", lesson: "efl", q: "A B32 needs what earth fault current to be sure of tripping instantly?", a: "160 A (5 × 32 A)", num: 160, tol: 0, unit: "A" },
    { id: "efl-06", lesson: "efl", q: "On a TT system, which device clears an earth fault in time?", a: "An RCD", accept: ["rcd", "an rcd", "residual current device", "rcbo", "an rcbo"] },

    // ---------------- Installing cables ----------------
    { id: "ic-01", lesson: "installing-cables", q: "A cable buried less than 50 mm in a wall runs vertically from a socket. Is it in a safe zone?", a: "Yes: in line with an accessory", accept: ["yes", "y"] },
    { id: "ic-02", lesson: "installing-cables", q: "How far below the ceiling does the top safe zone in a wall extend?", a: "150 mm", num: 150, tol: 0, unit: "mm" },
    { id: "ic-03", lesson: "installing-cables", q: "Maximum depth of a vertical chase, as a fraction of the wall's thickness?", a: "One third", accept: ["1/3", "a third", "one third", "third", "0.33"] },
    { id: "ic-04", lesson: "installing-cables", q: "Maximum depth of a horizontal chase, as a fraction of the wall's thickness?", a: "One sixth", accept: ["1/6", "a sixth", "one sixth", "sixth", "0.17"] },
    { id: "ic-05", lesson: "installing-cables", q: "A cable through a joist must be at least how far from the top and bottom edges?", a: "50 mm", num: 50, tol: 0, unit: "mm" },
    { id: "ic-06", lesson: "installing-cables", q: "Minimum burial depth for a garden cable (no double digging)?", a: "500 mm", num: 500, tol: 0, unit: "mm" },
    { id: "ic-07", lesson: "installing-cables", q: "How far below the surface should cable marker tape be laid?", a: "About 150 mm", num: 150, tol: 0.1, unit: "mm" },
    { id: "ic-08", lesson: "installing-cables", q: "What is the type number of standard PVC flat twin and earth cable?", a: "6242Y", accept: ["6242y", "6242 y"] },
    { id: "ic-09", lesson: "installing-cables", q: "From what date were the harmonised cable colours required?", a: "1 April 2006 (allowed from 31 March 2004)", accept: ["2006", "april 2006", "1 april 2006", "1st april 2006"] },
    { id: "ic-10", lesson: "installing-cables", q: "In old three-phase wiring, what were the line colours?", a: "Red, yellow and blue (neutral black)", accept: ["red yellow blue", "red, yellow, blue", "red yellow and blue", "red, yellow and blue"] },
    { id: "ic-11", lesson: "installing-cables", q: "Which mark of conformity is specific to cables?", a: "BASEC", accept: ["basec"] },
    { id: "ic-12", lesson: "installing-cables", q: "A cable in a partition with metal studs is buried at any depth. Is RCD or earthed-metal protection needed?", a: "Yes, regardless of depth", accept: ["yes", "y"] },
    { id: "ic-13", lesson: "installing-cables", q: "Which regulation requires wiring to be supported so it can't collapse prematurely in a fire?", a: "Regulation 521.10.202", accept: ["521.10.202", "regulation 521.10.202", "reg 521.10.202"] },
    { id: "ic-14", lesson: "installing-cables", q: "A cable less than 50 mm deep in a brick wall runs in a safe zone. Without earthed metal or nail-proof protection, what else does it need?", a: "30 mA RCD protection (additional protection)", accept: ["rcd", "30 ma rcd", "30ma rcd", "an rcd", "a 30 ma rcd", "rcd protection", "30 ma rcd protection", "additional protection", "rcbo"] },
    { id: "ic-15", lesson: "installing-cables", q: "Which regulation lists the alternatives to an RCD for buried cables: earthed metal covering, earthed conduit or trunking, nail-proof protection, or SELV/PELV?", a: "Regulation 522.6.204", accept: ["522.6.204", "regulation 522.6.204", "reg 522.6.204"] },
    { id: "ic-16", lesson: "installing-cables", q: "Which regulation covers cables under floors and above ceilings passing through joists?", a: "Regulation 522.6.201", accept: ["522.6.201", "regulation 522.6.201", "reg 522.6.201"] },
    { id: "ic-17", lesson: "installing-cables", q: "When you see the words \"additional protection\", what device and rating should you think of?", a: "A 30 mA RCD", accept: ["30 ma rcd", "30ma rcd", "rcd", "a 30 ma rcd", "30 ma", "30ma"] },
    { id: "ic-18", lesson: "installing-cables", q: "Since 2022, is a warning notice about mixed old and new wiring colours required?", a: "No: Amendment 2 removed the requirement (you can still fit one)", accept: ["no", "n"] },
    { id: "ic-19", lesson: "installing-cables", q: "Green goo oozing from old PVC wiring at accessories suggests what?", a: "The cable is breaking down (plasticiser reacting with the copper) and the wiring probably needs replacing", accept: ["rewire", "needs replacing", "replace", "replace the wiring", "cable breaking down", "degraded cable", "rewiring"] },

    // ---------------- Lighting circuits ----------------
    { id: "lc-01", lesson: "lighting", q: "Which terminal of a loop-in ceiling rose is always live?", a: "The loop (permanent line) terminal", accept: ["loop", "the loop", "loop terminal", "permanent line", "line loop", "the loop terminal", "live loop"] },
    { id: "lc-02", lesson: "lighting", q: "What are the conductors between two two-way switches called?", a: "Strappers", accept: ["strappers", "strapper", "straps"] },
    { id: "lc-03", lesson: "lighting", q: "Which cable runs between two two-way switches?", a: "Three-core and earth", accept: ["3 core and earth", "three core and earth", "3 core", "three core", "6243y", "3 core & earth"] },
    { id: "lc-04", lesson: "lighting", q: "Which switch is added between two two-way switches to control a light from a third place?", a: "An intermediate switch", accept: ["intermediate", "an intermediate", "intermediate switch", "an intermediate switch"] },
    { id: "lc-05", lesson: "lighting", q: "A light is switched from five places. How many intermediate switches?", a: "3", num: 3, tol: 0 },
    { id: "lc-06", lesson: "lighting", q: "Which regulation requires 30 mA RCD protection for domestic lighting circuits?", a: "411.3.4", accept: ["411.3.4", "regulation 411.3.4"] },
    { id: "lc-07", lesson: "lighting", q: "What device feeds 12 V downlights from the mains?", a: "A safety isolating transformer (or LED driver)", accept: ["transformer", "safety isolating transformer", "a transformer", "driver", "led driver", "isolating transformer"] },
    { id: "lc-08", lesson: "lighting", q: "Does switching a light off make its loop-in ceiling rose safe to work on?", a: "No: the loop terminal stays live. Isolate the circuit", accept: ["no", "n"] },

    // ---------------- Socket circuits ----------------
    { id: "sk-01", lesson: "sockets", q: "Maximum floor area for a 2.5 mm² ring final on a 32 A device?", a: "100 m²", num: 100, tol: 0, unit: "m²" },
    { id: "sk-02", lesson: "sockets", q: "Maximum floor area for a 4 mm² radial on a 32 A device?", a: "75 m²", num: 75, tol: 0, unit: "m²" },
    { id: "sk-03", lesson: "sockets", q: "Maximum floor area for a 2.5 mm² radial on a 20 A device?", a: "50 m²", num: 50, tol: 0, unit: "m²" },
    { id: "sk-04", lesson: "sockets", q: "How many sockets may one non-fused spur from a ring feed?", a: "One single or one double socket", num: 1, tol: 0 },
    { id: "sk-05", lesson: "sockets", q: "Maximum fuse rating in a fused connection unit?", a: "13 A", num: 13, tol: 0, unit: "A" },
    { id: "sk-06", lesson: "sockets", q: "Regulation 433.1.204: a ring final's cable must have a current-carrying capacity (I<sub>z</sub>) of at least how many amps?", a: "20 A", num: 20, tol: 0, unit: "A" },
    { id: "sk-07", lesson: "sockets", q: "Can a spur be taken from another spur?", a: "No", accept: ["no", "n"] },
    { id: "sk-08", lesson: "sockets", q: "Guidance: minimum horizontal distance from a kitchen sink to a socket?", a: "300 mm", num: 300, tol: 0, unit: "mm" },
    { id: "sk-09", lesson: "sockets", q: "In a ring final voltage drop calculation, what do you divide mV/A/m × I<sub>b</sub> × L by?", a: "4,000 (the load is shared by two paths, each half the length)", num: 4000, tol: 0 },
    { id: "sk-10", lesson: "sockets", q: "What assumed design current does the On-Site Guide give for a 32 A ring final circuit?", a: "26 A", num: 26, tol: 0, unit: "A" },
    { id: "sk-11", lesson: "sockets", q: "Should a 3 kW oven go on the ring final?", a: "No: cookers, ovens and hobs over 2 kW get their own radial circuit", accept: ["no", "n"] },
    { id: "sk-12", lesson: "sockets", q: "What's it called when the protective device nearest a fault operates first, leaving the rest of the installation on?", a: "Selectivity", accept: ["selectivity", "discrimination"] },

    // ---------------- Design current and diversity ----------------
    { id: "dsg-01", lesson: "design-current", q: "Put these in order of size, smallest first: I<sub>z</sub>, I<sub>b</sub>, I<sub>n</sub>", a: "I<sub>b</sub> ≤ I<sub>n</sub> ≤ I<sub>z</sub>", accept: ["ib in iz", "ib, in, iz", "ib<in<iz", "ib <= in <= iz", "ib ≤ in ≤ iz", "ib in and iz"] },
    { id: "dsg-02", lesson: "design-current", q: "What does I<sub>b</sub> stand for?", a: "The design current", accept: ["design current", "the design current"] },
    { id: "dsg-03", lesson: "design-current", q: "What does I<sub>n</sub> stand for?", a: "The rated (nominal) current of the protective device", accept: ["device rating", "rating of the device", "nominal current", "rated current", "protective device rating", "the rating of the protective device", "breaker rating", "rating"] },
    { id: "dsg-04", lesson: "design-current", q: "What does I<sub>z</sub> stand for?", a: "The current-carrying capacity of the cable in its installed conditions", accept: ["current carrying capacity", "current-carrying capacity", "cable capacity", "cable rating", "the cable's current carrying capacity", "capacity of the cable"] },
    { id: "dsg-05", lesson: "design-current", q: "Design current of an 8.5 kW shower at 230 V?", a: "≈ 37 A (so a 40 A device)", num: 36.96, unit: "A" },
    { id: "dsg-06", lesson: "design-current", q: "Household cooker diversity: 10 A, plus what percentage of the rest?", a: "30% (plus 5 A if there's a socket on the control unit)", num: 30, tol: 0, unit: "%" },
    { id: "dsg-07", lesson: "design-current", q: "Cooker diversity: how much is added if the cooker control unit has a socket-outlet?", a: "5 A", num: 5, tol: 0, unit: "A" },
    { id: "dsg-08", lesson: "design-current", q: "A 9.6 kW cooker with a socket on its control unit. What's I<sub>b</sub> after diversity?", a: "24.5 A", num: 24.5, unit: "A" },
    { id: "dsg-09", lesson: "design-current", q: "Is diversity applied to a single electric shower circuit?", a: "No: instantaneous water heaters are taken at 100%", accept: ["no", "n"] },
    { id: "dsg-10", lesson: "design-current", q: "Which protective device needs the cable oversized using a factor of 0.725?", a: "A rewirable fuse (BS 3036)", accept: ["rewirable fuse", "rewireable fuse", "bs 3036", "bs3036", "semi-enclosed fuse", "a rewirable fuse", "fuse wire"] },
    { id: "dsg-11", lesson: "design-current", q: "Does a lighting circuit in a home need 30 mA RCD protection?", a: "Yes: final circuits supplying luminaires in homes need it", accept: ["yes", "y"] },
    { id: "dsg-12", lesson: "design-current", q: "An immersion heater circuit runs in surface trunking, not in a bathroom. Does it need RCD protection?", a: "No: none of the cases apply, so a circuit breaker is enough (an RCBO is still allowed)", accept: ["no", "n"] },
    { id: "dsg-13", lesson: "design-current", q: "Which BS EN number covers RCBOs?", a: "BS EN 61009", accept: ["61009", "bs en 61009", "en 61009", "bs en61009"] },
    { id: "dsg-14", lesson: "design-current", q: "Which BS EN number covers circuit breakers (MCBs)?", a: "BS EN 60898", accept: ["60898", "bs en 60898", "en 60898", "bs en60898"] },

    // ---------------- Cable sizing and voltage drop ----------------
    { id: "csz-01", lesson: "cable-sizing", q: "Which correction factor allows for ambient temperature?", a: "C<sub>a</sub>", accept: ["ca", "c a"] },
    { id: "csz-02", lesson: "cable-sizing", q: "Which correction factor allows for cables grouped together?", a: "C<sub>g</sub>", accept: ["cg", "c g"] },
    { id: "csz-03", lesson: "cable-sizing", q: "Which correction factor allows for thermal insulation?", a: "C<sub>i</sub>", accept: ["ci", "c i"] },
    { id: "csz-04", lesson: "cable-sizing", q: "C<sub>i</sub> for a cable totally surrounded by thermal insulation for more than 0.5 m?", a: "0.5", num: 0.5, tol: 0 },
    { id: "csz-05", lesson: "cable-sizing", q: "At what ambient temperature is C<sub>a</sub> equal to 1?", a: "30 °C", num: 30, tol: 0, unit: "°C" },
    { id: "csz-06", lesson: "cable-sizing", q: "32 A device, C<sub>a</sub> 0.94, C<sub>g</sub> 0.70. What I<sub>t</sub> does the cable need?", a: "48.6 A", num: 48.6, unit: "A" },
    { id: "csz-07", lesson: "cable-sizing", q: "Voltage drop limit for lighting on a 230 V public supply, in volts?", a: "6.9 V (3%)", num: 6.9, tol: 0, unit: "V" },
    { id: "csz-08", lesson: "cable-sizing", q: "Voltage drop limit for power circuits on a 230 V public supply, in volts?", a: "11.5 V (5%)", num: 11.5, tol: 0, unit: "V" },
    { id: "csz-09", lesson: "cable-sizing", q: "18 mV/A/m, 20 A design current, 25 m run. Voltage drop?", a: "9 V", num: 9, unit: "V" },
    { id: "csz-10", lesson: "cable-sizing", q: "Which current is used in the voltage drop calculation: I<sub>b</sub>, I<sub>n</sub> or I<sub>t</sub>?", a: "I<sub>b</sub>, the design current", accept: ["ib", "i b", "design current", "the design current"] },
    { id: "csz-11", lesson: "cable-sizing", q: "Which installation reference method is clipped direct?", a: "Method C", accept: ["c", "method c", "reference method c"] },
    { id: "csz-12", lesson: "cable-sizing", q: "Which BS 7671 regulation gives the adiabatic equation for checking CPC size?", a: "543.1.3", accept: ["543.1.3", "regulation 543.1.3", "543"] },
    { id: "csz-13", lesson: "cable-sizing", q: "Which reference method covers cables in conduit or trunking on a wall, or in conduit buried in masonry?", a: "Method B", accept: ["b", "method b", "reference method b"] },
    { id: "csz-14", lesson: "cable-sizing", q: "C<sub>g</sub> for two circuits bunched or enclosed together?", a: "0.80", num: 0.8, tol: 0 },
    { id: "csz-15", lesson: "cable-sizing", q: "C<sub>a</sub> for 70 °C thermoplastic cable at an ambient temperature of 35 °C?", a: "0.94", num: 0.94, tol: 0 },
    { id: "csz-16", lesson: "cable-sizing", q: "C<sub>i</sub> for a cable passing through 50 mm of thermal insulation (Table 52.2)?", a: "0.88", num: 0.88, tol: 0 },
    { id: "csz-17", lesson: "cable-sizing", q: "A route is partly method 100 and partly method 101. Which do you size the cable for?", a: "The worse one (method 101): check every method on the route", accept: ["101", "method 101", "the worst", "worst", "the worse one", "worse"] },
    { id: "csz-18", lesson: "cable-sizing", q: "What's the largest size of flat twin and earth cable?", a: "16 mm²", num: 16, tol: 0, unit: "mm²" },
    { id: "csz-19", lesson: "cable-sizing", q: "40 A device, C<sub>a</sub> 0.94, C<sub>g</sub> 0.80, C<sub>i</sub> 0.88. What I<sub>t</sub> does the cable need?", a: "60.4 A (more than 16 mm² twin and earth can carry in method 100)", num: 60.44, unit: "A" },

    // ---------------- Safe isolation ----------------
    { id: "iso-01", lesson: "safe-isolation", q: "After testing a circuit dead, what must you do with the voltage indicator?", a: "Prove it again on a known live source", accept: ["prove it", "re-prove it", "reprove it", "prove it again", "re-prove", "reprove", "test it on a known source", "prove it on a proving unit", "prove it works"] },
    { id: "iso-02", lesson: "safe-isolation", q: "Maximum exposed metal at a test probe tip, according to GS38?", a: "4 mm (2 mm or less recommended)", num: 4, tol: 0, unit: "mm" },
    { id: "iso-03", lesson: "safe-isolation", q: "How many tests prove a three-phase and neutral supply dead?", a: "10", num: 10, tol: 0 },
    { id: "iso-04", lesson: "safe-isolation", q: "Which three tests prove a single-phase circuit dead?", a: "Line–neutral, line–earth and neutral–earth", accept: ["l-n l-e n-e", "ln le ne", "line neutral line earth neutral earth", "l-n, l-e, n-e", "line to neutral line to earth neutral to earth"] },
    { id: "iso-05", lesson: "safe-isolation", q: "Which HSE guidance note covers test leads, probes and voltage indicators?", a: "GS38", accept: ["gs38", "gs 38", "gs-38"] },
    { id: "iso-06", lesson: "safe-isolation", q: "Can a non-contact voltage detector prove a circuit dead?", a: "No: use a two-pole voltage indicator", accept: ["no", "n"] },
    { id: "iso-07", lesson: "safe-isolation", q: "Which regulation of the EAWR covers work on or near live conductors?", a: "Regulation 14", num: 14, tol: 0 },
    { id: "iso-08", lesson: "safe-isolation", q: "After locking off an isolator, who keeps the key?", a: "You, the person working on the circuit", accept: ["me", "you", "i do", "the electrician", "the person working on it", "myself", "the person doing the work"] },

    // ---------------- Inspection and certification ----------------
    { id: "insp-01", lesson: "inspection", q: "Which certificate is issued for a new circuit?", a: "An Electrical Installation Certificate (EIC)", accept: ["eic", "electrical installation certificate", "an eic"] },
    { id: "insp-02", lesson: "inspection", q: "Which certificate covers an addition to an existing circuit without a new circuit?", a: "A Minor Electrical Installation Works Certificate (MEIWC)", accept: ["meiwc", "minor works", "minor works certificate", "minor electrical installation works certificate"] },
    { id: "insp-03", lesson: "inspection", q: "Which BS 7671 chapter covers initial verification?", a: "Chapter 64", num: 64, tol: 0 },
    { id: "insp-04", lesson: "inspection", q: "Which BS 7671 chapter covers periodic inspection and testing?", a: "Chapter 65", num: 65, tol: 0 },
    { id: "insp-05", lesson: "inspection", q: "On an EICR, what does C1 mean?", a: "Danger present: immediate remedial action required", accept: ["danger present", "danger", "immediate danger", "danger present immediate remedial action required"] },
    { id: "insp-06", lesson: "inspection", q: "An EICR has only C3 observations. Can it be satisfactory?", a: "Yes: only C1 or C2 make it unsatisfactory", accept: ["yes", "y"] },
    { id: "insp-07", lesson: "inspection", q: "Under Amendment 4, does an FI code alone make an EICR unsatisfactory?", a: "No: not any more", accept: ["no", "n"] },
    { id: "insp-08", lesson: "inspection", q: "An EIC can carry three signatures. For which three roles?", a: "Design, construction (installation), and inspection and testing", accept: ["design construction inspection", "designer installer inspector", "design installation inspection", "design construction inspection and testing", "designer, installer, inspector"] },
    { id: "insp-09", lesson: "inspection", q: "Recommended maximum interval between inspections of a rented home?", a: "5 years (and on change of occupancy)", num: 5, tol: 0, unit: "years" },
    { id: "insp-10", lesson: "inspection", q: "Recommended maximum interval between inspections of an owner-occupied home?", a: "10 years (and on change of occupancy)", num: 10, tol: 0, unit: "years" },
    { id: "insp-11", lesson: "inspection", q: "What code would line and neutral reversed at a socket usually get?", a: "C2: potentially dangerous", accept: ["c2", "code 2", "code c2"] },
    { id: "insp-12", lesson: "inspection", q: "Which Electrical Safety First guide gives typical EICR codes?", a: "Best Practice Guide 4", num: 4, tol: 0 },

    // ---------------- Dead tests ----------------
    { id: "dt-01", lesson: "dead-tests", q: "Which test comes first in the sequence of tests?", a: "Continuity of protective conductors (including bonding)", accept: ["continuity", "continuity of protective conductors", "cpc continuity", "continuity of cpc", "r1+r2", "continuity of protective conductors including bonding"] },
    { id: "dt-02", lesson: "dead-tests", q: "Which instrument measures continuity?", a: "A low-resistance ohmmeter", accept: ["low resistance ohmmeter", "low-resistance ohmmeter", "ohmmeter", "continuity tester", "low reading ohmmeter", "multifunction tester"] },
    { id: "dt-03", lesson: "dead-tests", q: "In continuity test method 2, what is measured?", a: "R<sub>2</sub> only, using a long wander lead", accept: ["r2", "r2 only", "the cpc", "cpc resistance"] },
    { id: "dt-04", lesson: "dead-tests", q: "In a ring final, r<sub>1</sub> and r<sub>n</sub> should be within how many ohms of each other?", a: "0.05 Ω", num: 0.05, tol: 0, unit: "Ω" },
    { id: "dt-05", lesson: "dead-tests", q: "In 2.5/1.5 mm² twin and earth, r<sub>2</sub> is about how many times r<sub>1</sub>?", a: "About 1.67", num: 1.67, tol: 0.02 },
    { id: "dt-06", lesson: "dead-tests", q: "Ring final: r<sub>1</sub> = 0.4 Ω, r<sub>2</sub> = 0.67 Ω. Expected R<sub>1</sub> + R<sub>2</sub> at each socket?", a: "≈ 0.27 Ω", num: 0.2675, tol: 0.03, unit: "Ω" },
    { id: "dt-07", lesson: "dead-tests", q: "Ring step 3 readings rise to the middle of the ring then fall. What's wrong?", a: "The legs are cross-connected wrongly (same ends joined): swap them", accept: ["wrong legs", "legs connected wrong", "legs the wrong way round", "swap the legs", "wrong cross connection", "not cross connected", "legs reversed", "incorrect cross connection"] },
    { id: "dt-08", lesson: "dead-tests", q: "Insulation test voltage for a 230 V circuit?", a: "500 V DC", num: 500, tol: 0, unit: "V" },
    { id: "dt-09", lesson: "dead-tests", q: "Minimum insulation resistance for a 230 V circuit?", a: "1.0 MΩ", num: 1, tol: 0, unit: "MΩ" },
    { id: "dt-10", lesson: "dead-tests", q: "Insulation test voltage and minimum for SELV and PELV circuits?", a: "250 V DC, 0.5 MΩ", accept: ["250v 0.5mohm", "250 v 0.5 mω", "250v 0.5mω", "250 0.5", "250v and 0.5mω", "250 v and 0.5 mω"] },
    { id: "dt-11", lesson: "dead-tests", q: "Eight circuits each read 10 MΩ. What does the whole installation read?", a: "1.25 MΩ", num: 1.25, unit: "MΩ" },
    { id: "dt-12", lesson: "dead-tests", q: "The centre contact of an Edison screw lampholder should be connected to which conductor?", a: "Line", accept: ["line", "the line", "l", "line conductor", "live"] },

    // ---------------- Live tests ----------------
    { id: "lt-01", lesson: "live-tests", q: "When measuring Z<sub>e</sub>, what is disconnected from the MET?", a: "The earthing conductor (reconnect it straight after)", accept: ["earthing conductor", "the earthing conductor", "main earth", "the main earth", "main earthing conductor"] },
    { id: "lt-02", lesson: "live-tests", q: "Prospective fault current measured between line and neutral is called what?", a: "PSCC (prospective short-circuit current)", accept: ["pscc", "prospective short circuit current", "prospective short-circuit current"] },
    { id: "lt-03", lesson: "live-tests", q: "Prospective fault current measured between line and earth is called what?", a: "PEFC (prospective earth fault current)", accept: ["pefc", "prospective earth fault current"] },
    { id: "lt-04", lesson: "live-tests", q: "Which PFC reading is recorded: PSCC or PEFC?", a: "The larger of the two", accept: ["the larger", "larger", "the highest", "highest", "the bigger", "the greater", "greater", "biggest"] },
    { id: "lt-05", lesson: "live-tests", q: "Z<sub>e</sub> is 0.05 Ω. Roughly what's the prospective fault current, in kA?", a: "4.6 kA", num: 4.6, unit: "kA" },
    { id: "lt-06", lesson: "live-tests", q: "A general-type RCD tested at 1 × I<sub>Δn</sub> must trip within how many ms?", a: "300 ms", num: 300, tol: 0, unit: "ms" },
    { id: "lt-07", lesson: "live-tests", q: "On which two half-cycles is an RCD tested?", a: "0° and 180°: record the longer time", accept: ["0 and 180", "0° and 180°", "positive and negative", "0 180", "0 degrees and 180 degrees"] },
    { id: "lt-08", lesson: "live-tests", q: "How do you measure Z<sub>s</sub> on an RCD-protected circuit without tripping it?", a: "Use the tester's no-trip (low-current) loop test", accept: ["no trip", "no-trip", "no trip loop test", "low current", "no-trip setting", "low current loop test", "no trip test"] },
    { id: "lt-09", lesson: "live-tests", q: "Earth electrode method E1: how far is the current spike from the electrode?", a: "At least 10 times the electrode's length", num: 10, tol: 0, unit: "× length" },
    { id: "lt-10", lesson: "live-tests", q: "A time-delayed type S RCD must trip within what range at I<sub>Δn</sub>?", a: "130 to 500 ms", accept: ["130 to 500", "130-500", "130 500", "130 to 500 ms", "130-500ms", "130ms to 500ms"] },
    { id: "lt-11", lesson: "live-tests", q: "On a three-phase installation, which live test checks motors will turn the right way?", a: "Phase sequence (rotation)", accept: ["phase sequence", "phase rotation", "rotation", "phase sequence test"] },

    // ---------------- In-service inspection and testing ----------------
    { id: "pat-01", lesson: "pat", q: "Which edition of the IET Code of Practice for in-service inspection and testing is used in the exam?", a: "5th edition", num: 5, tol: 0 },
    { id: "pat-02", lesson: "pat", q: "Does the law set a fixed interval for testing equipment?", a: "No: the duty holder decides by risk assessment", accept: ["no", "n"] },
    { id: "pat-03", lesson: "pat", q: "What are the three levels of check, from simplest to most thorough?", a: "User check, formal visual inspection, combined inspection and test", accept: ["user check fvi cit", "user check, fvi, cit", "user check formal visual inspection combined inspection and test", "user fvi cit"] },
    { id: "pat-04", lesson: "pat", q: "What does the double-square symbol on equipment mean?", a: "Class II: double or reinforced insulation, no earth", accept: ["class 2", "class ii", "double insulated", "double insulation", "class two"] },
    { id: "pat-05", lesson: "pat", q: "Which equipment class relies on earthed accessible metal parts?", a: "Class I", accept: ["class 1", "class i", "class one", "1", "i"] },
    { id: "pat-06", lesson: "pat", q: "What's the protective conductor continuity limit for an appliance with a cord?", a: "(0.1 + R) Ω, where R is the cord's protective conductor resistance", accept: ["0.1 + r", "0.1+r", "0.1 plus r", "0.1 ohm plus r", "0.1 + the resistance of the cord"] },
    { id: "pat-07", lesson: "pat", q: "Insulation resistance test voltage for in-service testing of 230 V equipment?", a: "500 V DC", num: 500, tol: 0, unit: "V" },
    { id: "pat-08", lesson: "pat", q: "Minimum insulation resistance for Class I equipment?", a: "1.0 MΩ", num: 1, tol: 0, unit: "MΩ" },
    { id: "pat-09", lesson: "pat", q: "Minimum insulation resistance for Class II equipment?", a: "2.0 MΩ", num: 2, tol: 0, unit: "MΩ" },
    { id: "pat-10", lesson: "pat", q: "Maximum length of a 1.25 mm² extension lead without a 30 mA RCD?", a: "12 m", num: 12, tol: 0, unit: "m" },
    { id: "pat-11", lesson: "pat", q: "Maximum length of a 1.5 mm² extension lead without a 30 mA RCD?", a: "15 m", num: 15, tol: 0, unit: "m" },
    { id: "pat-12", lesson: "pat", q: "As a guide, what plug fuse suits equipment up to about 700 W?", a: "3 A", num: 3, tol: 0, unit: "A" },
    { id: "pat-13", lesson: "pat", q: "Resistance per metre of 1.25 mm² flex protective conductor, in mΩ?", a: "15.6 mΩ/m", num: 15.6, unit: "mΩ/m" },
    { id: "pat-14", lesson: "pat", q: "Which regulations require work equipment to be kept in efficient working order and good repair?", a: "PUWER (Provision and Use of Work Equipment Regulations 1998)", accept: ["puwer", "provision and use of work equipment regulations", "puwer 1998"] }

  ];
})();
