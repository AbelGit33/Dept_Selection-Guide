/**
 * English dictionary — the source of truth for the `Dictionary` type.
 *
 * Every other locale file is typed as `Dictionary`, so adding a key here and
 * forgetting to translate it is a compile error rather than a runtime fallback
 * to English in front of a user who asked for another language.
 *
 * Scope: application chrome, shared labels, and the questionnaire. Department
 * blurbs, career descriptions and the scoring engine's generated prose are
 * intentionally not here — see `README` note in `src/lib/i18n/index.ts`.
 */

export const en = {
  /* -------------------------------------------------------------- chrome */

  meta: {
    siteName: "Dept Selection Guide",
    title: "Dept Selection Guide — data-driven department selection",
    titleTemplate: "%s · Dept Selection Guide",
    description:
      "A five-phase advisory engine that maps your transcript, interests and career goals against department prerequisites and live labour-market data, and returns a justified top-three shortlist with risk analysis.",
    ogDescription: "Data-driven department selection with prerequisite audits and live job-market intelligence.",
    keywords: [
      "major selection",
      "department selection",
      "university advising",
      "degree planning",
      "career pathway",
      "BLS data",
      "prerequisite audit",
    ],
  },

  lang: {
    switcherLabel: "Language",
    currentLabel: "Current language",
  },

  common: {
    skipToContent: "Skip to content",
    unknown: "unknown",
    emDash: "—",
    loading: "Loading…",
    back: "Back",
    continue: "Continue",
    tryAgain: "Try again",
    refresh: "Refresh",
    clearAll: "Clear all",
    min: "min",
    notAvailable: "Not available",
    optional: "optional",
    required: "required",
    of: "of",
    selected: "selected",
    answered: "answered",
    inProgress: "In progress",
    notStarted: "Not started",
    nationalJobs: "national jobs",
    perYearNational: "per year, national",
    nextDecade: "next decade",
    nationalAnnual: "national, annual",
    credits: "credits",
    keyCourses: "key courses",
    rangeLabel: "Middle 50% of pay",
    p25: "p25",
    median: "median",
    p75: "p75",
    seriesPrefix: "series",
    weightSuffix: "weight",
  },

  nav: {
    overview: "Overview",
    method: "Method",
    departments: "Departments",
    tagline: "Academic advising engine",
    startAdvising: "Start advising",
    resumeSession: "Resume session",
    privacyBadge: "FERPA-aware · stays on device",
    toggleNavigation: "Toggle navigation",
  },

  footer: {
    about:
      "A decision-support tool for university students. It ranks departments against your recorded work and published labour-market data. It does not replace an academic adviser, and it makes no promises about admission, graduation, licensure or employment.",
    explore: "Explore",
    data: "Data",
    privacy: "Privacy",
    exploreLinks: { advisor: "Advisory process", departments: "Department catalogue", method: "Scoring method" },
    dataSources: {
      oews: "US BLS Occupational Employment and Wage Statistics",
      projections: "BLS Employment Projections",
      curriculum: "Curriculum prerequisite reference dataset",
    },
    privacyPoints: {
      grades: "Grades never leave your browser",
      noTracking: "No account, no tracking, no analytics",
      clearSession: "Clear your session at any time",
    },
    disclaimer: "Figures are probabilistic estimates from published data, not guarantees. Verify every load-bearing claim with a person.",
    builtFor: "Built for students, not institutions.",
  },

  /* -------------------------------------------------------------- phases */

  phases: {
    1: { label: "Profile", title: "Academic Profile", blurb: "Grades, credits and where your marks actually cluster." },
    2: { label: "Aspiration", title: "Aspiration Mapping", blurb: "The work you want, the environment, your appetite for training." },
    3: { label: "Feasibility", title: "Feasibility & Gap Analysis", blurb: "Every prerequisite, checked against the curriculum database." },
    4: { label: "Market", title: "Market Viability", blurb: "Live demand, salary distribution and automation exposure." },
    5: { label: "Report", title: "Recommendation Report", blurb: "Your ranked shortlist with roadmaps and risk analysis." },
  },

  phaseProgress: { template: "Phase {phase} of 5" },

  /* -------------------------------------------------- shared label tables */

  subjects: {
    math: "Mathematics",
    computing: "Computing",
    science: "Natural Science",
    engineering: "Engineering",
    business: "Business",
    "social-science": "Social Science",
    humanities: "Humanities",
    health: "Health & Medicine",
    arts: "Arts & Design",
    other: "Other",
  },

  axes: {
    computation: {
      label: "Computing & Logic",
      short: "Computing",
      blurb: "Abstract systems, algorithms, automation, and the craft of breaking problems into rules a machine can follow.",
    },
    quantitative: {
      label: "Quantitative & Modelling",
      short: "Quantitative",
      blurb: "Numbers as a language for describing reality — statistics, optimisation, simulation, forecasting.",
    },
    lifeScience: {
      label: "Life Science & Health",
      short: "Life Science",
      blurb: "Living systems: molecules, cells, organisms, patients, populations.",
    },
    physicalSystem: {
      label: "Physical Systems & Machines",
      short: "Physical Systems",
      blurb: "Matter, energy, force and fabrication — how the physical world is built and controlled.",
    },
    humanBehavior: {
      label: "Human Behaviour & Mind",
      short: "Human Behaviour",
      blurb: "Cognition, persuasion, development, and the evidence base of why people do what they do.",
    },
    creativeExpression: {
      label: "Creative Expression & Design",
      short: "Creative",
      blurb: "Making things that communicate: form, narrative, visual and spatial design, written voice.",
    },
    societalImpact: {
      label: "Society, Policy & Impact",
      short: "Societal",
      blurb: "Institutions, justice, policy, sustainability, and the systems that shape collective outcomes.",
    },
    leadership: {
      label: "Coordination & Leadership",
      short: "Leadership",
      blurb: "Organising people toward outcomes — operations, strategy, negotiation, teaching.",
    },
  },

  priorities: {
    pay: "Compensation",
    stability: "Job stability",
    impact: "Social impact",
    flexibility: "Work flexibility",
    interest: "Pure intellectual interest",
    advancement: "Promotion & growth ceiling",
    location: "Location & lifestyle",
  },

  priorityHints: { low: "not important", high: "decisive" },

  weights: {
    interest: "Interest alignment — cosine similarity between your eight-axis interest profile and the axes the department actually trains.",
    career: "Career alignment — how closely the department's destination roles overlap the roles you named in Phase 2.",
    academic: "Academic fit — credit-weighted performance in the subject areas the department leans on hardest.",
    market: "Market viability — median pay band, projected growth, demand index and automation exposure for its occupations.",
    feasibility: "Prerequisite readiness — how many required courses you have cleared, at or above their minimum grade, and whether you clear the GPA gate.",
    workload: "Workload fit — credits per term and course intensity measured against the workload appetite your answers implied.",
    style: "Work-style fit — whether the environments this field typically offers match the ones you selected.",
  },

  /* ------------------------------------------------------------- quiz */

  quiz: [
    {
      id: "q1-problem",
      prompt: "A problem lands in front of you with no obvious solution. What do you reach for first?",
      helper: "Pick the instinct, not the subject you think sounds impressive.",
      options: {
        q1a: "Break it into steps until a machine could follow them",
        q1b: "Model it with numbers and look at what the numbers say",
        q1c: "Study the system as it is — how the parts actually interact",
        q1d: "Talk to the people involved and find out what is really going on",
        q1e: "Sketch several radically different futures before judging any",
      },
    },
    {
      id: "q2-environment",
      prompt: "Which work environment sounds like your actual preference on a Tuesday?",
      helper: "Be honest about pacing and visibility rather than prestige.",
      options: {
        q2a: "A lab or institute where I can spend weeks on one question",
        q2b: "A structured engineering team shipping a defined product",
        q2c: "A fast-moving startup where I own a whole problem",
        q2d: "An agency or studio working on varied client problems",
        q2e: "A classroom, clinic, or public-facing practice",
      },
    },
    {
      id: "q3-curiosity",
      prompt: "Which of these have you gone down on your own time, without being graded?",
      helper: "Multi-select. Self-directed curiosity is the single best predictor of major fit.",
      options: {
        q3a: "Writing or extending a piece of software",
        q3b: "Analysis in a spreadsheet, notebook or statistics package",
        q3c: "Dissecting how a living thing works",
        q3d: "Taking something apart or building a mechanism",
        q3e: "Reading research on how people think or behave",
        q3f: "Making something visual or designed",
        q3g: "Following policy, debate or a civic issue closely",
        q3h: "Organising people, running events or leading a project",
      },
    },
    {
      id: "q4-strength",
      prompt: "Which subjects have historically come easiest to you?",
      helper: "Multi-select. Used to weight the academic-fit component.",
      options: {
        q4a: "Algebra, calculus, or anything with a proof",
        q4b: "Physics or engineering mechanics",
        q4c: "Biology, chemistry, or the life sciences",
        q4d: "Computer science or programming",
        q4e: "Psychology, sociology, or the social sciences",
        q4f: "Writing, language, history, or philosophy",
        q4g: "Economics, statistics, or data analysis",
        q4h: "Studio art, design, or music",
      },
    },
    {
      id: "q5-tolerances",
      prompt: "Which statements describe you honestly?",
      helper: "Multi-select. This calibrates workload tolerance and required-discipline tolerance.",
      options: {
        q5a: "Three 4-hour lab sessions in one week is fine",
        q5b: "I can handle courses that are hard on their own terms",
        q5d: "I prefer most of my work to be written rather than spoken",
        q5e: "Team projects drain me more than individual work",
        q5f: "I would rather start earning sooner than add another degree",
        q5g: "I'm genuinely interested in a five-year research path",
      },
    },
    {
      id: "q6-signal",
      prompt: "What has historically pulled you away from a subject?",
      helper: "Multi-select. Frustration patterns are diagnostic.",
      options: {
        q6a: "Not enough room to build something",
        q6b: "Everything is memorisation with no underlying structure",
        q6c: "Not enough contact with real systems or people",
        q6d: "Lab time is tedious and repetitive",
        q6e: "Too much writing and too little building",
        q6f: "Constantly staring at a screen with no human outcome",
      },
    },
    {
      id: "q7-horizon",
      prompt: "Five years out, which outcome would feel like success?",
      helper: "Single choice. Calibrates the pay / stability / impact weighting.",
      options: {
        q7a: "Deep expertise and a reputation in a specialist field",
        q7b: "A senior role with real decision authority",
        q7c: "A well-paid, stable, low-surprise career",
        q7d: "Work that measurably improves other people's lives",
        q7e: "Enough optionality to change direction later if I want",
      },
    },
  ],

  contradictions: {
    title: "Tension in your answers",
    labProofResearch:
      "You selected heavy lab load, proof-heavy difficulty, and a genuine five-year research path together. That is a coherent but demanding combination — the reports below weight research intensity heavily, so check whether the ranked list still reflects what you want.",
    earnSoonResearch:
      "You want to start earning sooner and also want a five-year research path. These pull in opposite directions; rankings will treat this as a genuine trade-off rather than resolving it for you.",
    labButBuilders:
      "You find lab work tedious but are pulled toward majors defined by building physical things. Several results below are laboratory-intensive — read the workload section before you commit.",
  },

  /* ------------------------------------------------------- classifications */

  workStyles: {
    research: { label: "Research", blurb: "Open-ended investigation, publication, grants." },
    corporate: { label: "Corporate", blurb: "Defined teams inside an established organisation." },
    startup: { label: "Startup", blurb: "Small teams, ambiguity, fast iteration." },
    remote: { label: "Remote-first", blurb: "Location independence as a requirement." },
    clinical: { label: "Clinical", blurb: "Patient-facing, protocol-driven practice." },
    fieldwork: { label: "Field work", blurb: "On-site, site-based or instrumented work." },
    "creative-studio": { label: "Studio", blurb: "Self-directed creative practice and critique." },
    "public-service": { label: "Public service", blurb: "Institutional or civic mission roles." },
  },

  workStyleLabels: {
    research: "Research & publishing",
    corporate: "Corporate",
    startup: "Startup / small team",
    remote: "Remote-first",
    clinical: "Clinical / patient-facing",
    fieldwork: "Field & site work",
    "creative-studio": "Studio / creative practice",
    "public-service": "Public service",
    government: "Government / public sector",
    nonprofit: "Nonprofit",
    "self-employed": "Independent practice",
  },

  environments: {
    "large-corporate": "Large corporate",
    "small-team": "Small team",
    startup: "Startup",
    nonprofit: "Nonprofit",
    government: "Government",
    "self-employed": "Independent",
    undecided: "Genuinely undecided",
  },

  admissionModes: {
    open: "Open admission",
    selective: "Selective",
    "capacity-capped": "Capacity-capped",
    audition: "Audition",
  },

  selectivity: { low: "Low", moderate: "Moderate", high: "High", "very-high": "Very high" },

  /* --------------------------------------------------------- market tiles */

  market: {
    sourceLabels: {
      live: "Live",
      cached: "Partially live",
      seed: "Last published release",
    },
    sourceBlurbs: {
      live: "Wage and employment figures read directly from the BLS API just now.",
      cached: "BLS responded but does not publish a series for every occupation here, so some fields use the last published release.",
      seed: "The BLS API was unreachable. Figures come from the last published release and are clearly stale.",
    },
    fetchedAgo: "fetched {time}",
    provenance: "Data provenance",
    seriesLabel: "series: {ids}",
    medianPay: "Median pay",
    projectedGrowth: "Projected growth",
    growthTenYear: "10-yr growth",
    demandIndex: "Demand index",
    demandIndexSub: "modelled, not published",
    automationRisk: "Automation risk",
    placementEstimate: "placement est. {value}",
    blsProjection: "BLS projection",
    stability: "Stability",
    automation: "Automation",
    skillsDemand: "Skills demand",
    salRangeSub: "national, annual",
  },

  /* ------------------------------------------------------------- landing */

  landing: {
    badge: "Five-phase advisory engine · {departments} departments · {courses} prerequisites mapped",
    heroLead: "Choosing a major is",
    heroAccent: "an engineering problem.",
    heroBody:
      "Feed it your transcript and what you actually want from a career. It audits every prerequisite against a real curriculum database, pulls live wage and employment data, and returns a ranked top three with the risks nobody mentions in the prospectus.",
    heroPrimary: "Start the five-phase assessment",
    heroSecondary: "Browse the catalogue",
    noAccount: "No account. Grades are parsed and scored in your browser and never sent anywhere.",
    tickerTitle: "Labour-market feed",
    tickerLive: "{live}/{total} departments reading live BLS series",
    tickerUnavailable: "Live feed unavailable — showing last published release",
    tickerFooterSource: "US Bureau of Labor Statistics · OEWS and Employment Projections",
    tickerFooterMedian: "median across catalogue {salary} · mean demand index {index}/100",
    workflowLabel: "Workflow",
    workflowTitle: "Five phases, and you can see the reasoning at every step",
    workflowBody:
      "Each phase produces an artefact you can inspect, disagree with, and correct. Nothing is a black box: every score carries the sentence that produced it.",
    features: {
      prereq: {
        title: "Real prerequisite auditing",
        body: "Every required course in the curriculum database is matched against your actual record, with minimum grades, hard gates and cumulative-GPA thresholds evaluated separately. You get a per-course verdict, not a vibe.",
      },
      market: {
        title: "Live market intelligence",
        body: "Wage distributions and employment levels are read from the BLS OEWS API with a 12-hour server cache. When BLS has no series for an occupation, the report says so instead of pretending it is fresh.",
      },
      scoring: {
        title: "Seven-factor weighted scoring",
        body: "Interest alignment, career alignment, academic fit, market viability, prerequisite readiness, workload fit and work-style fit — each with an adaptive weight derived from the priorities you actually set.",
      },
      privacy: {
        title: "FERPA-aware by architecture",
        body: "Grades are parsed and scored entirely in your browser. No API request contains your transcript, because the endpoints have no field for one. The session lives in localStorage and can be wiped in one click.",
      },
      blindSpots: {
        title: "Blind-spot analysis",
        body: "The report names what it did not measure — cost, commute, your weak subject, personality under deadline — instead of implying an exhaustive judgement it cannot make.",
      },
      nextSteps: {
        title: "Actionable next steps",
        body: "Not a listicle. Each step names the person to contact, the timing, and the reason it matters, with your specific grades and thresholds woven into the explanation.",
      },
    },
    ctaTitle: "The most consequential choice of your degree, made with better inputs",
    ctaBody:
      "Takes about six minutes. Ends with a ranked shortlist, a prerequisite gap list, a market read, and an honest account of where the model is uncertain.",
    ctaPrimary: "Begin assessment",
    ctaSecondary: "Read the method",
    statRoles: "{count} career roles mapped",
    statCourses: "{count} prerequisites tracked",
    statPrivate: "Nothing leaves your device",
  },

  /* -------------------------------------------------------------- method */

  method: {
    title: "Method",
    description: "How the scoring works, what it cannot see, and where the data comes from.",
    badge: "Transparency",
    heading: "How this is calculated",
    intro:
      "Every number this tool shows is derived from data you entered plus published statistics you can go and read yourself. Nothing is generated, nothing is inferred about you, and no model is guessing what you should do with your life.",
    phasesHeading: "The five phases",
    compositeHeading: "The composite score",
    compositeBody:
      "Each department gets seven component scores on a 0–100 scale. They are combined using weights derived from the priorities you set in Phase 2 — a student who cares most about stability gets a stability-heavy weighting, and one who cares most about pay gets a different one.",
    orderingHeading: "Deliberate ordering",
    orderingBody:
      "Prerequisites are checked in Phase 3 before any market data is consulted. Pay and demand figures are the last input added and can only re-rank departments that already survived the academic audit. A lucrative field you cannot get into is not a recommendation.",
    axesHeading: "Interest axes",
    axesBody:
      "Questionnaire answers map onto eight axes. Axes are not independent — some pull against each other, and the tool reports those tensions rather than averaging them into a falsely tidy number.",
    sourcesHeading: "Where the numbers come from",
    marketSourceHeading: "Labour market",
    marketSourceBody:
      "US Bureau of Labor Statistics Occupational Employment and Wage Statistics, plus the Employment Projections programme for growth rates. At the time this page was generated, {live} of {total} department snapshots came from a live upstream fetch and the rest from a curated copy of published figures held in this repository.",
    marketSourceNote:
      "Each snapshot reports its own source. If a card says “reference data”, that is a real published number that was not freshly retrieved — the tool does not dress cached figures up as live ones.",
    curriculumHeading: "Curriculum and prerequisites",
    curriculumBody:
      "A bundled curriculum database covering {count} departments. Course codes, minimum grades, GPA gates and hard requirements are matched against the courses you entered. Matching is deliberately strict: a shared course number across unrelated subjects is not treated as a match, because that would let one course satisfy two different departments’ requirements.",
    privacyHeading: "Your privacy",
    privacyPoints: {
      transcript: "Your transcript never leaves your device.",
      transcriptBody:
        "Parsing, GPA calculation, prerequisite matching and scoring all run in your browser. There is no API route in this application that accepts a grade, a course or any student identifier.",
      storage: "Session data lives in localStorage.",
      storageBody: "It is stored under {key} on your own device. Clearing your browser data removes it. It is never sent anywhere.",
      market: "Market requests contain no student data.",
      marketBody:
        "The only thing that crosses the network to our own API is a list of department IDs used to look up occupation codes — the same request any visitor would make.",
      accounts: "No accounts, no analytics on your answers, no third-party trackers.",
      accountsBody: "The export button produces a file directly in your browser.",
    },
    blindHeading: "What this cannot see",
    blindSpots: [
      "Financial circumstances, tuition burden, and whether you can work while studying.",
      "Family obligations, caregiving responsibilities, or who you have to support.",
      "Health, disability, accommodations, or anything an adviser would need to know privately.",
      "Campus politics, cohort dynamics, specific professors, and whether a department is currently well-run.",
      "Undeclared majors, dual degrees, study-abroad feasibility, or transfer-credit equivalences.",
      "Labour market conditions in the specific geography you plan to work in.",
      "Whether you actually like the work, only what the occupational statistics say about it.",
    ],
    fairnessHeading: "A note on fairness",
    fairnessBody:
      "Occupational statistics are averages over entire populations. Applied to one person they are a weak signal, and they encode the pay gaps that already exist. This tool does not use gender, race, disability, age, nationality, religion, first-generation status, or income in any calculation, and it is not capable of doing so — those fields are not collected. If a result seems to be steering you away from something because of who you are, that is a limitation of the underlying data, not a finding about you.",
    closing:
      "This tool offers probabilistic suggestions to support a conversation with a real academic adviser. It is not an admissions decision, a guarantee of employment or salary, or a substitute for the people at your university who are paid to know you.",
  },

  /* --------------------------------------------------------- departments */

  departments: {
    title: "Departments",
    description: "All {count} departments with curriculum, careers and labour market context side by side.",
    badge: "{count} departments",
    heading: "Department directory",
    intro:
      "Every department in the database with the courses it requires, the roles it feeds, and the published statistics for those roles — so you can compare them on equal terms before you commit to anything.",
    gpaBadge: "GPA {value}",
    trainsAxes: "Trains these axes",
    feedsRoles: "Feeds these roles",
    cta: "Check your prerequisites against this",
  },

  /* -------------------------------------------------------------- advisor */

  advisor: {
    storedLocally: "Stored on this device only",
    buildingReport: "Building report…",
    generate: "Generate recommendation",
    startOver: "Start over",
    distress: {
      ariaLabel: "Support resources",
      title: "Pause here — you deserve real support",
      body:
        "What you wrote suggests you may be carrying more than a course decision. This tool cannot help with that, and choosing a department is not the answer to how you are feeling. These are free and confidential.",
      acknowledge: "I’m okay, continue",
      notSaved: "Nothing you typed was saved to any server, and no one at this institution is notified.",
    },
    profile: {
      recordTitle: "Academic record",
      recordSubtitle: "Paste from your student portal, upload a file, or add courses by hand.",
      tabPaste: "Paste",
      tabManual: "Courses",
      placeholder: "One course per line. Separators like commas, pipes or dashes all work.",
      parse: "Parse {count} courses",
      parseBare: "Parse",
      loadExample: "Load example",
      uploadFile: "Upload file",
      parsedPreview: "Parsed preview",
      gradedCredits: "{graded} graded · {credits} credits",
      creditsAbbrev: "cr",
      codePlaceholder: "CS 201",
      titlePlaceholder: "Course title",
      addCourse: "Add course",
      clearAll: "Clear all",
      tableCode: "Code",
      tableTitle: "Title",
      tableCredits: "Cr",
      tableGrade: "Grade",
      removeCourse: "Remove {code}",
      untitledCourse: "Untitled course",
      summaryTitle: "Record summary",
      summarySubtitle: "Credits-weighted, normalised to a 4.0 scale.",
      statGpa: "GPA",
      statCreditsEarned: "Credits earned",
      statAttempted: "Attempted",
      statAtC: "At C or better",
      statInProgress: "In progress",
      clusterTitle: "Where your marks cluster",
      clusterSubtitle: "Credit-weighted average by subject group.",
      emptyTitle: "No courses parsed yet. Add your record above, or load the example to see how the pipeline works end to end.",
      interestTitle: "Interest profile",
      interestBadge: "from Phase 2",
      interestNote: "Computed from your questionnaire answers. Complete Phase 2 to populate it properly.",
      sampleOf: "n={count}",
      privacyTitle: "Your record stays on this device.",
      privacyBody:
        "Parsing, GPA maths and every prerequisite check run in your browser. No API request in this application has a field that could carry a grade, so there is nothing to transmit even accidentally.",
    },
    aspiration: {
      quizTitle: "Working style and instincts",
      quizSubtitle:
        "Six questions. There are no wrong answers and no perfect profile — contradictions are surfaced, not averaged away.",
      quizProgress: "{answered}/{total} answered",
      questionPrefix: "Q",
      prioritiesTitle: "What you are optimising for",
      prioritiesSubtitle: "These directly reweight the score. Drag anything you care about upward.",
      sliderWorkload: "Workload appetite",
      sliderWorkloadLeft: "spare capacity",
      sliderWorkloadRight: "want it hard",
      sliderOptionality: "Keep options open",
      sliderOptionalityLeft: "commit now",
      sliderOptionalityRight: "keep bridges open",
      sliderGradSchool: "Graduate study appetite",
      sliderGradSchoolLeft: "stop at bachelor's",
      sliderGradSchoolRight: "want a doctorate",
      rolesTitle: "Target roles",
      rolesSubtitle: "Strongly recommended. Career alignment is the component this changes most.",
      rolesSelected: "{count} selected",
      rolesSearch: "Search occupations…",
      rolesNoMatch: "No occupations match that search.",
      degreeProfessional: "professional",
      envTitle: "Environment and day-to-day",
      envSubtitle: "Used to test whether the work fits, not just the subject.",
      envPickerLabel: "Working environments you would choose",
      orgTypeLabel: "Organisation type",
      dayLabel: "Describe an ideal working day",
      dayPlaceholder:
        "A sentence or two about what your Tuesday actually looks like. If you are overwhelmed or want to talk to someone, this box will point you to campus support immediately — it does not judge.",
      dayNote: "Read for fit, not for writing quality. Nothing here is sent anywhere.",
      liveProfileTitle: "Live profile",
      liveProfileSubtitle: "Recomputed on every answer.",
      miniWorkload: "Workload",
      miniOptionality: "Optionality",
      miniGradStudy: "Grad study",
      selectedEnvironments: "Selected environments",
      axesLegendTitle: "How the eight axes are read",
      axesLegendNote:
        "Axes that tend to oppose each other are listed in the method page. Scoring does not average contradictions away — it reports them.",
    },
    feasibility: {
      title: "Prerequisite audit",
      body:
        "These departments are ranked on academic fit, interest and prerequisites only. No pay figures or market data have been consulted yet, so you can see how your record stands before any financial signal enters the picture.",
      shownCount: "{shown} of {total} departments shown",
      noCourses:
        "You have not entered any courses, so every prerequisite below reads as “not started”. Go back to Phase 1 to add your record — the audit is far more useful with real grades in it.",
      status: { clear: "Clear to enter", workable: "Workable", "at-risk": "At risk", blocked: "Blocked" },
      gpaUnmet: "GPA gate unmet",
      reqCount: "{done}/{total} req",
      readiness: "Readiness",
      gpaGate: "GPA gate",
      entry: "Entry",
      inProgressCount: "{count} in progress",
      belowMinCount: "{count} below minimum",
      prelimLabel: "prelim",
      miniInterest: "Interest",
      miniAcademic: "Academic",
      miniCareer: "Career",
      courseStatusHeading: "Required course status",
      entryConditions: "Entry conditions",
      rowCumulativeGpa: "Cumulative GPA",
      rowYourGpa: "Your GPA",
      rowSelectivity: "Selectivity",
      rowLateDeclaration: "Late declaration",
      lateAccepted: "Accepted",
      lateRestricted: "Restricted",
      rowTotalCredits: "Total credits to degree",
      rowStillNeeded: "Still needed",
      rowRequired: "{value} required",
      rowCredits: "{value} credits",
      hardGatesHeading: "Unresolved hard gates",
      notesHeading: "Notes",
      hardGateBadge: "hard gate",
      minLabel: "min {value}",
      running: "Running prerequisite audit…",
      statusLabels: {
        completed: "Cleared",
        "in-progress": "In progress",
        "below-min": "Below minimum",
        "not-started": "Not started",
        waived: "Waived",
      },
    },
    marketPhase: {
      title: "Labour market context",
      body:
        "Pay and outlook for the occupations these departments actually feed, from the Bureau of Labor Statistics Occupational Employment and Wage Statistics. This is context, not a verdict — it is the last input added, and it can only re-rank departments that already survived the prerequisite audit.",
      fetching: "Fetching BLS series for {count} departments…",
      fetchingNote: "First load can take several seconds while the upstream request is made.",
      errorTitle: "Market data could not be loaded",
      fallbackTitle: "Showing published reference figures",
      fallbackBody:
        "The live BLS endpoint declined to answer right now, so every figure below is from the curated reference set rather than a fresh pull. The numbers are real published values — they are simply not freshly retrieved. The phase still works; the report will say which it used.",
      errorUnavailable: "Market data unavailable",
    },
  },

  /* -------------------------------------------------------------- report */

  report: {
    title: "Report",
    description: "A five-phase, private, in-browser guide to choosing a department.",
    loading: "Generating report…",
    regenerate: "Regenerate report",
    exportMarkdown: "Export Markdown",
    print: "Print",
    sections: {
      profile: "Profile",
      shortlist: "Ranked shortlist",
      runnersUp: "Runners-up",
      risks: "Risks",
      blindSpots: "Blind spots",
      nextSteps: "Next steps",
    },
    emptyTitle: "No report yet",
    emptyBody: "Complete the earlier phases to generate a recommendation report.",
    alsoConsider: "Also consider",
    strengths: "Strengths",
    tradeoffs: "Trade-offs",
    roadmap: "Roadmap",
    scoreBreakdown: "Score breakdown",
    prereqGaps: "Prerequisite gaps",
    confidence: { high: "High confidence", moderate: "Moderate confidence", emerging: "Emerging confidence", insufficient: "Not enough data" },
    band: { exceptional: "Exceptional fit", strong: "Strong fit", viable: "Viable", speculative: "Speculative" },
    export: {
      heading: "Department Selection Report",
      generated: "Generated {date}",
      disclaimer:
        "Generated by the Dept Selection Guide. Figures are probabilistic estimates from published data, not guarantees. Verify every load-bearing claim with a person.",
    },
  },

  wellness: {
    "campus-counselling": {
      label: "Campus counselling centre",
      detail: "Free, confidential, and typically staffed by licensed clinicians. Most campuses offer same-week urgent appointments and a 24/7 crisis line.",
    },
    "academic-advising": {
      label: "Academic advising & retention",
      detail:
        "A separate office from counselling. They can discuss leave of absence, reduced course load, and what will happen to your transcript — which is often the concrete worry underneath the distress.",
    },
    "988-lifeline": {
      label: "988 Suicide & Crisis Lifeline",
      detail: "Free, confidential support in the US, 24/7, by call, text or chat. Available even if you have no insurance and are not a student.",
    },
    "emergency-line": {
      label: "Student emergency & wellbeing line",
      detail: "Most universities run a 24-hour line staffed by student peer supporters or counsellors specifically for moments like this.",
    },
  },
} as const;

/**
 * Recursively widens literal types so translations can use their own strings
 * while still being checked for structural completeness.
 */
type Localize<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T extends readonly (infer U)[]
        ? Localize<U>[]
        : T extends object
          ? { -readonly [K in keyof T]: Localize<T[K]> }
          : T;

export type Dictionary = Localize<typeof en>;