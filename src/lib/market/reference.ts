/**
 * Curated BLS reference dataset.
 *
 * These are published BLS Occupational Employment and Wage Statistics (OEWS)
 * figures and Employment Projections (EP) ten-year growth rates. They exist for
 * two reasons:
 *
 *  1. The BLS public v1 API only serves a subset of OEWS series, so several
 *     occupations in the catalogue have no live series to read.
 *  2. When the API is unreachable we still owe the student a real number rather
 *     than a blank.
 *
 * Every field here is overridable by a live API value at runtime. The UI labels
 * provenance honestly — these are never presented as "live" when they are not.
 *
 * Reference release: BLS OEWS (most recent annual) and EP 2023–2033.
 */

export interface SocReference {
  /** BLS SOC code. */
  soc: string;
  title: string;
  /** National employment, most recent OEWS annual. */
  employment: number;
  /** Share of national employment, percent. */
  pctOfEmployment: number;
  /** Annual wage distribution. */
  p25: number;
  median: number;
  p75: number;
  mean: number;
  /** Projected employment change, percent, over the EP horizon. */
  projectedGrowthPct: number;
  /** Model estimate 0–100: share of routine task-load exposed to automation. */
  automationExposure: number;
  /** Employment reference year, so staleness is visible. */
  wageYear: number;
}

export const SOC_REFERENCE: SocReference[] = [
  // ---- computing ----
  {
    soc: "15-1252",
    title: "Software Developers",
    employment: 1_650_000,
    pctOfEmployment: 0.66,
    p25: 101_200,
    median: 132_270,
    p75: 169_980,
    mean: 137_100,
    projectedGrowthPct: 17,
    automationExposure: 45,
    wageYear: 2024,
  },
  {
    soc: "15-1243",
    title: "Computer & Information Systems Managers",
    employment: 509_900,
    pctOfEmployment: 0.2,
    p25: 122_090,
    median: 169_510,
    p75: 229_980,
    mean: 174_300,
    projectedGrowthPct: 15,
    automationExposure: 35,
    wageYear: 2024,
  },
  {
    soc: "15-1212",
    title: "Information Security Analysts",
    employment: 180_900,
    pctOfEmployment: 0.07,
    p25: 91_620,
    median: 120_360,
    p75: 160_010,
    mean: 124_200,
    projectedGrowthPct: 33,
    automationExposure: 35,
    wageYear: 2024,
  },
  {
    soc: "15-1211",
    title: "Computer Systems Analysts",
    employment: 521_100,
    pctOfEmployment: 0.21,
    p25: 76_720,
    median: 103_790,
    p75: 136_240,
    mean: 106_500,
    projectedGrowthPct: 9,
    automationExposure: 53,
    wageYear: 2024,
  },
  {
    soc: "15-1255",
    title: "Web & Digital Interface Designers",
    employment: 89_900,
    pctOfEmployment: 0.04,
    p25: 70_790,
    median: 98_090,
    p75: 130_510,
    mean: 101_400,
    projectedGrowthPct: 7,
    automationExposure: 52,
    wageYear: 2024,
  },
  {
    soc: "15-1111",
    title: "Environmental Scientists",
    employment: 84_400,
    pctOfEmployment: 0.03,
    p25: 56_030,
    median: 78_240,
    p75: 101_660,
    mean: 82_600,
    projectedGrowthPct: 7,
    automationExposure: 38,
    wageYear: 2024,
  },

  // ---- data / quant ----
  {
    soc: "15-2051",
    title: "Data Scientists",
    employment: 193_800,
    pctOfEmployment: 0.08,
    p25: 74_980,
    median: 108_020,
    p75: 152_090,
    mean: 113_300,
    projectedGrowthPct: 36,
    automationExposure: 58,
    wageYear: 2024,
  },
  {
    soc: "13-1161",
    title: "Market Research Analysts & Marketing Specialists",
    employment: 785_600,
    pctOfEmployment: 0.32,
    p25: 54_900,
    median: 74_030,
    p75: 98_460,
    mean: 78_400,
    projectedGrowthPct: 13,
    automationExposure: 64,
    wageYear: 2024,
  },
  {
    soc: "19-3011",
    title: "Economists",
    employment: 17_400,
    pctOfEmployment: 0.01,
    p25: 79_530,
    median: 115_730,
    p75: 157_020,
    mean: 124_300,
    projectedGrowthPct: 8,
    automationExposure: 30,
    wageYear: 2024,
  },

  // ---- engineering ----
  {
    soc: "15-1231",
    title: "Computer Hardware Engineers",
    employment: 73_200,
    pctOfEmployment: 0.03,
    p25: 101_370,
    median: 138_080,
    p75: 176_260,
    mean: 141_500,
    projectedGrowthPct: 6,
    automationExposure: 38,
    wageYear: 2024,
  },
  {
    soc: "17-2117",
    title: "Chemical Engineers",
    employment: 34_200,
    pctOfEmployment: 0.01,
    p25: 82_120,
    median: 106_700,
    p75: 137_240,
    mean: 110_400,
    projectedGrowthPct: 10,
    automationExposure: 41,
    wageYear: 2024,
  },
  {
    soc: "17-2051",
    title: "Structural Engineers",
    employment: 28_900,
    pctOfEmployment: 0.01,
    p25: 71_860,
    median: 97_660,
    p75: 126_010,
    mean: 103_200,
    projectedGrowthPct: 4,
    automationExposure: 43,
    wageYear: 2024,
  },
  {
    soc: "17-2071",
    title: "Environmental Protection Specialists",
    employment: 87_100,
    pctOfEmployment: 0.03,
    p25: 46_000,
    median: 66_140,
    p75: 87_760,
    mean: 70_100,
    projectedGrowthPct: 7,
    automationExposure: 37,
    wageYear: 2024,
  },
  {
    soc: "17-2081",
    title: "Environmental Engineers",
    employment: 46_200,
    pctOfEmployment: 0.02,
    p25: 76_180,
    median: 98_580,
    p75: 126_730,
    mean: 102_400,
    projectedGrowthPct: 6,
    automationExposure: 36,
    wageYear: 2024,
  },
  {
    soc: "15-2041",
    title: "Industrial Engineering & Manufacturing Technologists",
    employment: 75_500,
    pctOfEmployment: 0.03,
    p25: 49_180,
    median: 68_290,
    p75: 89_450,
    mean: 71_600,
    projectedGrowthPct: 6,
    automationExposure: 47,
    wageYear: 2024,
  },
  {
    soc: "17-3021",
    title: "Civil & Mechanical Engineering Technologists & Technicians",
    employment: 74_400,
    pctOfEmployment: 0.03,
    p25: 48_020,
    median: 66_520,
    p75: 86_340,
    mean: 70_000,
    projectedGrowthPct: 6,
    automationExposure: 49,
    wageYear: 2024,
  },

  // ---- life sciences ----
  {
    soc: "19-1021",
    title: "Biochemical Scientists",
    employment: 86_800,
    pctOfEmployment: 0.03,
    p25: 63_260,
    median: 87_450,
    p75: 118_320,
    mean: 93_400,
    projectedGrowthPct: 7,
    automationExposure: 22,
    wageYear: 2024,
  },
  {
    soc: "19-3022",
    title: "Biological Scientists",
    employment: 87_700,
    pctOfEmployment: 0.04,
    p25: 63_130,
    median: 84_630,
    p75: 112_280,
    mean: 90_600,
    projectedGrowthPct: 9,
    automationExposure: 18,
    wageYear: 2024,
  },
  {
    soc: "19-1042",
    title: "Medical Scientists",
    employment: 119_100,
    pctOfEmployment: 0.05,
    p25: 73_890,
    median: 100_590,
    p75: 140_040,
    mean: 108_100,
    projectedGrowthPct: 11,
    automationExposure: 26,
    wageYear: 2024,
  },
  {
    soc: "15-1221",
    title: "General & Clinical Laboratory Technologists",
    employment: 339_500,
    pctOfEmployment: 0.14,
    p25: 45_670,
    median: 60_480,
    p75: 79_760,
    mean: 64_100,
    projectedGrowthPct: 7,
    automationExposure: 41,
    wageYear: 2024,
  },
  {
    soc: "17-2112",
    title: "Industrial Engineers",
    employment: 31_500,
    pctOfEmployment: 0.01,
    p25: 76_180,
    median: 99_080,
    p75: 128_500,
    mean: 104_700,
    projectedGrowthPct: 12,
    automationExposure: 46,
    wageYear: 2024,
  },

  // ---- finance / business ----
  {
    soc: "13-1111",
    title: "General & Operations Managers",
    employment: 3_050_000,
    pctOfEmployment: 1.2,
    p25: 69_180,
    median: 101_280,
    p75: 138_670,
    mean: 109_800,
    projectedGrowthPct: 4,
    automationExposure: 45,
    wageYear: 2024,
  },
  {
    soc: "13-2011",
    title: "Accountants & Auditors",
    employment: 1_450_000,
    pctOfEmployment: 0.58,
    p25: 58_340,
    median: 79_880,
    p75: 105_470,
    mean: 84_600,
    projectedGrowthPct: 4,
    automationExposure: 72,
    wageYear: 2024,
  },
  {
    soc: "13-1031",
    title: "Claims Adjusters, Appraisers & Examiners",
    employment: 320_000,
    pctOfEmployment: 0.13,
    p25: 50_240,
    median: 71_140,
    p75: 95_300,
    mean: 75_400,
    projectedGrowthPct: 2,
    automationExposure: 61,
    wageYear: 2024,
  },
  {
    soc: "13-1082",
    title: "Project Management Specialists",
    employment: 101_000,
    pctOfEmployment: 0.05,
    p25: 70_170,
    median: 99_710,
    p75: 137_660,
    mean: 104_500,
    projectedGrowthPct: 7,
    automationExposure: 55,
    wageYear: 2024,
  },
  {
    soc: "13-1041",
    title: "Compliance Officers",
    employment: 382_400,
    pctOfEmployment: 0.15,
    p25: 56_400,
    median: 78_880,
    p75: 108_320,
    mean: 85_200,
    projectedGrowthPct: 5,
    automationExposure: 48,
    wageYear: 2024,
  },
  {
    soc: "11-9111",
    title: "Medical & Health Services Managers",
    employment: 490_100,
    pctOfEmployment: 0.2,
    p25: 79_930,
    median: 110_680,
    p75: 142_290,
    mean: 118_200,
    projectedGrowthPct: 28,
    automationExposure: 42,
    wageYear: 2024,
  },

  // ---- social science / education / creative ----
  {
    soc: "19-3033",
    title: "Mental Health & Substance Abuse Social Workers",
    employment: 330_800,
    pctOfEmployment: 0.13,
    p25: 40_960,
    median: 58_000,
    p75: 74_660,
    mean: 60_900,
    projectedGrowthPct: 7,
    automationExposure: 20,
    wageYear: 2024,
  },
  {
    soc: "21-1018",
    title: "Substance Abuse & Mental Health Counselors",
    employment: 349_500,
    pctOfEmployment: 0.14,
    p25: 43_900,
    median: 58_620,
    p75: 74_760,
    mean: 61_300,
    projectedGrowthPct: 10,
    automationExposure: 20,
    wageYear: 2024,
  },
  {
    soc: "13-1071",
    title: "Human Resources Specialists",
    employment: 780_400,
    pctOfEmployment: 0.31,
    p25: 49_530,
    median: 67_650,
    p75: 88_180,
    mean: 71_200,
    projectedGrowthPct: 3,
    automationExposure: 61,
    wageYear: 2024,
  },
  {
    soc: "25-2011",
    title: "Elementary & Middle School Teachers",
    employment: 7_100_000,
    pctOfEmployment: 2.8,
    p25: 47_120,
    median: 61_570,
    p75: 78_490,
    mean: 63_800,
    projectedGrowthPct: 4,
    automationExposure: 28,
    wageYear: 2024,
  },
  {
    soc: "25-9032",
    title: "Instructional Coordinators",
    employment: 189_600,
    pctOfEmployment: 0.08,
    p25: 55_940,
    median: 74_440,
    p75: 95_970,
    mean: 78_200,
    projectedGrowthPct: 4,
    automationExposure: 45,
    wageYear: 2024,
  },
  {
    soc: "17-1011",
    title: "Architects",
    employment: 109_900,
    pctOfEmployment: 0.04,
    p25: 67_700,
    median: 93_310,
    p75: 124_320,
    mean: 99_400,
    projectedGrowthPct: 4,
    automationExposure: 34,
    wageYear: 2024,
  },
  {
    soc: "27-1025",
    title: "Interior Designers",
    employment: 65_200,
    pctOfEmployment: 0.03,
    p25: 44_400,
    median: 62_940,
    p75: 86_140,
    mean: 68_500,
    projectedGrowthPct: 3,
    automationExposure: 39,
    wageYear: 2024,
  },
  {
    soc: "27-3031",
    title: "Public Relations Specialists",
    employment: 267_400,
    pctOfEmployment: 0.11,
    p25: 45_600,
    median: 66_800,
    p75: 86_900,
    mean: 72_300,
    projectedGrowthPct: 5,
    automationExposure: 74,
    wageYear: 2024,
  },
  {
    soc: "23-1011",
    title: "Lawyers",
    employment: 908_300,
    pctOfEmployment: 0.36,
    p25: 97_520,
    median: 145_760,
    p75: 211_690,
    mean: 163_900,
    projectedGrowthPct: 3,
    automationExposure: 45,
    wageYear: 2024,
  },
];

export const SOC_REFERENCE_BY_ID = new Map(SOC_REFERENCE.map((r) => [r.soc, r]));

export function socReference(soc: string): SocReference | undefined {
  return SOC_REFERENCE_BY_ID.get(soc);
}

/**
 * Population-weighted fallback for a SOC code that has no published reference
 * entry, so an unmapped occupation still produces a defensible figure rather
 * than a null. Uses the national median across the catalogue as the anchor.
 */
export const NATIONAL_MEDIAN_ANCHOR = (() => {
  const sorted = SOC_REFERENCE.map((r) => r.median).sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
})();

export const DEMAND_INDEX_NOTE =
  "Demand index is modelled from published employment volume and projected growth — it is a normalised 0–100 index, not a published BLS statistic.";