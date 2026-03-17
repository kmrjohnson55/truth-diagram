import type { CellValues } from "./statistics";

export interface Preset {
  name: string;
  description: string;
  values: CellValues;
  reference?: string;
  category: "general" | "clinical";
}

/* ── General examples ── */

const generalPresets: Preset[] = [
  {
    name: "Balanced Example",
    description: "A moderate test with 50% prevalence",
    values: { tp: 80, fp: 20, fn: 20, tn: 80 },
    category: "general",
  },
  {
    name: "Perfect Test",
    description: "100% sensitivity and specificity — box in upper-right quadrant",
    values: { tp: 100, fp: 0, fn: 0, tn: 100 },
    category: "general",
  },
  {
    name: "Worthless Test (All Positive)",
    description: "Test calls everyone positive — no discriminatory value",
    values: { tp: 50, fp: 50, fn: 0, tn: 0 },
    category: "general",
  },
  {
    name: "High Sensitivity, Low Specificity",
    description: "Good at detecting disease, many false alarms",
    values: { tp: 95, fp: 60, fn: 5, tn: 40 },
    category: "general",
  },
  {
    name: "Low Sensitivity, High Specificity",
    description: "Misses many cases, but rarely raises false alarms",
    values: { tp: 30, fp: 5, fn: 70, tn: 95 },
    category: "general",
  },
  {
    name: "High Sensitivity, High Specificity",
    description: "A strong test: 95% sensitivity, 95% specificity, 50% prevalence",
    values: { tp: 95, fp: 5, fn: 5, tn: 95 },
    category: "general",
  },
];

/* ── Clinical examples ── */

const clinicalPresets: Preset[] = [
  {
    name: "Prostate-Specific Antigen (PSA) — Case-Control",
    description:
      "PSA for prostate cancer, men 60–69 y, cutoff < 4 ng/mL: 85% sensitivity, 87% specificity, 37% prevalence",
    values: { tp: 301, fp: 79, fn: 53, tn: 531 },
    reference:
      "Jacobsen SJ et al. Predictive properties of serum-PSA testing in a community-based setting. Arch Intern Med 1996;156:2462–2468. As presented in Johnson & Johnson, AJR 2014;203:W14–W20.",
    category: "clinical",
  },
  {
    name: "PSA — General Screening (Low Prevalence)",
    description:
      "Same PSA test accuracy applied to a broader population with ~5% prevalence — watch PPV drop",
    values: { tp: 43, fp: 124, fn: 7, tn: 826 },
    reference:
      "Derived from Jacobsen SJ et al. 1996 (see above), with healthy subjects multiplied to simulate screening prevalence. Johnson & Johnson, AJR 2014;203:W14–W20.",
    category: "clinical",
  },
  {
    name: "Screening Mammography (Breast Cancer)",
    description:
      "Screening mammography: ~87% sensitivity, ~90% specificity, ~0.7% prevalence per 1,000 women",
    values: { tp: 6, fp: 99, fn: 1, tn: 894 },
    reference:
      "Based on published screening mammography performance data. See also Rose SL et al. AJR 2013;200:1401–1408; Johnson & Johnson, AJR 2014;203:W14–W20.",
    category: "clinical",
  },
  {
    name: "Lung Cancer Screening — Low-Dose CT (NLST)",
    description:
      "NLST first screening round, low-dose CT: 67% sensitivity, 73% specificity, 1.5% prevalence",
    values: { tp: 270, fp: 6911, fn: 136, tn: 18925 },
    reference:
      "National Lung Screening Trial Research Team. N Engl J Med 2013;368:1980–1991. As presented in Johnson & Johnson, AJR 2014;203:W14–W20.",
    category: "clinical",
  },
];

export const presets: Preset[] = [...generalPresets, ...clinicalPresets];
export { generalPresets, clinicalPresets };
