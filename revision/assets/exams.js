/* The course's six theory exams: one list, used by the exams overview, each exam page and the mock engine.
   Formats from the EAL qualification guide and the course's exam week schedule. All exams are open book,
   multiple choice and taken online. bank: the global holding the mock question bank, once one exists. */
(function () {
  "use strict";
  var EXAMS = [
    {
      id: "building-regs", file: "building-regulations.html", title: "Building Regulations", day: "Monday",
      qual: "EAL Level 3 Award in the Building Regulations for Electrical Installations in Dwellings", code: "BR3/01",
      questions: 20, minutes: 40, book: "Electrician's Guide to the Building Regulations (7th edition, 2026)", bank: "BANK_BUILDING_REGS",
      covers: ["What the Building Regulations are, and what counts as building work", "Where Part P applies, and where it doesn't",
        "Notifiable and non-notifiable work, in England and in Wales", "Special locations, including the space around a bath or shower",
        "The three ways to certify notifiable work, and the deadlines", "The other Parts that affect electricians: A, B, C, E, F, L, M and more"],
      lessons: [["../regulations/laws-and-guidance.html", "Laws and guidance"], ["../regulations/part-p-and-notification.html", "Part P and notification"], ["../regulations/bathrooms.html", "Bathrooms and special locations"]],
      tips: ["It's the shortest exam: 2 minutes a question. Most answers are in the Part P chapter, so tab it before the day.",
        "Read whether a question is about England or Wales. The notifiable work is different.",
        "Watch for \"not\" in the question: which is <em>not</em> notifiable, which is <em>not</em> a special location."]
    },
    {
      id: "bs7671", file: "bs-7671.html", title: "18th Edition (BS 7671)", day: "Monday",
      qual: "EAL Level 3 Award in the Requirements for Electrical Installations BS 7671:2018", code: "",
      questions: 60, minutes: 120, book: "BS 7671:2018+A4:2026 (the orange book)", bank: "BANK_BS7671",
      covers: ["Part 1 scope and fundamental principles, and Part 2 definitions", "Part 3 assessment of general characteristics",
        "Part 4 protection for safety: shock, thermal effects, overcurrent, voltage disturbances", "Part 5 selection and erection: wiring systems, devices, earthing and bonding",
        "Part 6 inspection and testing, Part 7 special locations, Part 8 functional requirements", "The appendices: tables, time/current curves, model forms"],
      lessons: [["../regulations/bs-7671.html", "BS 7671 and its definitions"], ["../earthing/automatic-disconnection.html", "Automatic disconnection"], ["../design/cable-sizing.html", "Cable sizing and voltage drop"]],
      tips: ["Two minutes a question, but some take seconds. Move on from anything slow and come back.",
        "Learn the book's layout: the Part comes from the first digit of a regulation number.",
        "Since 16 October 2026 the exam is fully aligned with Amendment 4, so use the orange book."]
    },
    {
      id: "fundamental", file: "fundamental-inspection-and-testing.html", title: "Fundamental Inspection and Testing", day: "Tuesday",
      qual: "EAL Level 2 Award in Fundamental Inspection, Testing and Initial Verification", code: "IT2/01",
      questions: 30, minutes: 60, book: "IET Guidance Note 3: Inspection & Testing", bank: "BANK_FUNDAMENTAL",
      covers: ["Safe isolation and test equipment (GS38)", "Initial verification and its certificates", "What to inspect before testing",
        "Dead tests: continuity, ring finals, insulation resistance, polarity", "Live tests: Z<sub>e</sub>, Z<sub>s</sub>, fault current and RCDs", "Completing an Electrical Installation Certificate"],
      lessons: [["../testing/safe-isolation.html", "Safe isolation"], ["../testing/dead-tests.html", "Dead tests"], ["../testing/live-tests.html", "Live tests"]],
      tips: ["There's also a practical: inspecting and testing a simulated installation, then completing an EIC.",
        "Many questions are about the order of tests and why. Know the sequence cold.",
        "Know where Guidance Note 3 keeps its tables of maximum Z<sub>s</sub> and minimum insulation resistance."]
    },
    {
      id: "pat", file: "in-service-inspection-and-testing.html", title: "In-service Inspection and Testing (PAT)", day: "Tuesday",
      qual: "EAL Level 3 Award in the In-Service Inspection and Testing of Electrical Equipment", code: "",
      questions: 40, minutes: 80, book: "IET Code of Practice for In-service Inspection and Testing of Electrical Equipment (5th edition)", bank: "BANK_PAT",
      covers: ["The law: EAWR, PUWER, the Management Regulations", "Equipment types and classes", "User checks, formal visual inspection and combined inspection and test",
        "Test methods and limits", "Test instruments", "Records and labels"],
      lessons: [["../pat/in-service-testing.html", "In-service inspection and testing"]],
      tips: ["There's also a practical test. The Code of Practice is allowed in both.",
        "The 5th edition changed some terms (energy source classes instead of SELV). Use its wording.",
        "Questions on frequency usually want \"risk assessment\", not a fixed number of months."]
    },
    {
      id: "periodic", file: "periodic-inspection-and-testing.html", title: "Periodic Inspection and Testing", day: "Wednesday",
      qual: "EAL Level 3 Award in the Periodic Inspection, Testing and Certification of Electrical Installations", code: "QCR3001",
      questions: 35, minutes: 60, book: "IET Guidance Note 3: Inspection & Testing", bank: "BANK_PERIODIC",
      covers: ["The purpose of periodic inspection, and agreeing the extent and limitations", "Sampling and frequency of inspection",
        "Coding observations: C1, C2, C3 and FI", "Completing an Electrical Installation Condition Report", "Testing an existing installation safely"],
      lessons: [["../testing/inspection-and-certification.html", "Inspection and certification"], ["../testing/live-tests.html", "Live tests"]],
      tips: ["The practical also allows BS 7671, the On-Site Guide and Electrical Safety First's Best Practice Guide 4.",
        "Learners who haven't passed the Level 3 Initial Verification award take an extra exam (QCRB3001) as well.",
        "Under Amendment 4 an FI code alone doesn't make a report unsatisfactory."]
    },
    {
      id: "initial", file: "initial-verification.html", title: "Initial Verification", day: "Wednesday",
      qual: "EAL Level 3 Award in the Initial Verification and Certification of Electrical Installations", code: "QIT3001",
      questions: 50, minutes: 90, book: "IET Guidance Note 3: Inspection & Testing", bank: "BANK_INITIAL",
      covers: ["Responsibilities, competence and safety", "Inspection before energising", "The full sequence of tests, including three-phase and TT systems",
        "Interpreting results against BS 7671 limits", "Electrical Installation Certificates and their schedules"],
      lessons: [["../testing/inspection-and-certification.html", "Inspection and certification"], ["../testing/dead-tests.html", "Dead tests"], ["../testing/live-tests.html", "Live tests"]],
      tips: ["There's also a practical, where BS 7671 and the On-Site Guide are allowed alongside Guidance Note 3.",
        "Expect calculations: ring final readings, insulation resistance in parallel, Z<sub>s</sub> and fault current.",
        "Check the units in every answer: Ω, MΩ, mA and kA all appear."]
    }
  ];
  function dateKey(id) { return "rev:examdate:" + id; }
  function getDate(id) { try { return localStorage.getItem(dateKey(id)) || ""; } catch (e) { return ""; } }
  function setDate(id, v) { try { if (v) localStorage.setItem(dateKey(id), v); else localStorage.removeItem(dateKey(id)); } catch (e) { /* ignore */ } }
  // Whole days from today to an ISO date (yyyy-mm-dd), counted in local time.
  function daysUntil(iso) {
    if (!iso) return null;
    var p = iso.split("-"), d = new Date(+p[0], +p[1] - 1, +p[2]), t = new Date(); t.setHours(0, 0, 0, 0);
    return Math.round((d - t) / 86400000);
  }
  function countdown(iso) {
    var n = daysUntil(iso);
    if (n === null) return "";
    if (n > 1) return "in " + n + " days";
    if (n === 1) return "tomorrow";
    if (n === 0) return "today";
    return "passed";
  }
  window.EXAMS = { list: EXAMS, find: function (id) { return EXAMS.filter(function (e) { return e.id === id; })[0]; }, getDate: getDate, setDate: setDate, countdown: countdown };
})();
