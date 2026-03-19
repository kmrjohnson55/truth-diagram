export interface CellValues {
  tp: number;
  fp: number;
  fn: number;
  tn: number;
}

export interface DiagnosticStats {
  sensitivity: number;
  specificity: number;
  ppv: number;
  npv: number;
  accuracy: number;
  prevalence: number;
  positiveLR: number;
  negativeLR: number;
  oddsRatio: number;
  pretestOdds: number;
  posttestOddsPositive: number;
  posttestOddsNegative: number;
  total: number;
}

export function computeStats(v: CellValues): DiagnosticStats {
  const { tp, fp, fn, tn } = v;
  const total = tp + fp + fn + tn;
  const diseased = tp + fn;
  const healthy = fp + tn;
  const testPos = tp + fp;
  const testNeg = fn + tn;

  const sensitivity = diseased > 0 ? tp / diseased : NaN;
  const specificity = healthy > 0 ? tn / healthy : NaN;
  const ppv = testPos > 0 ? tp / testPos : NaN;
  const npv = testNeg > 0 ? tn / testNeg : NaN;
  const accuracy = total > 0 ? (tp + tn) / total : NaN;
  const prevalence = total > 0 ? diseased / total : 0;

  const positiveLR =
    specificity < 1 ? sensitivity / (1 - specificity) : Infinity;
  const negativeLR =
    specificity > 0 ? (1 - sensitivity) / specificity : Infinity;
  const oddsRatio = fp * fn > 0 ? (tp * tn) / (fp * fn) : Infinity;

  const pretestOdds = prevalence < 1 ? prevalence / (1 - prevalence) : Infinity;
  const posttestOddsPositive = fp > 0 ? tp / fp : Infinity;
  const posttestOddsNegative = tn > 0 ? fn / tn : 0;

  return {
    sensitivity,
    specificity,
    ppv,
    npv,
    accuracy,
    prevalence,
    positiveLR,
    negativeLR,
    oddsRatio,
    pretestOdds,
    posttestOddsPositive,
    posttestOddsNegative,
    total,
  };
}

export function formatStat(value: number, decimals = 1): string {
  if (isNaN(value)) return "N/A";
  if (!isFinite(value)) return "\u221E";
  return (value * 100).toFixed(decimals) + "%";
}

export function formatRatio(value: number, decimals = 2): string {
  if (isNaN(value)) return "N/A";
  if (!isFinite(value)) return "\u221E";
  return value.toFixed(decimals);
}

/* ── Expected values & chi-square ── */

/** Expected cell values under H₀ of independence: E = (row total × col total) / grand total */
export interface ExpectedValues {
  tp: number;
  fp: number;
  fn: number;
  tn: number;
}

export function computeExpectedValues(v: CellValues): ExpectedValues {
  const total = v.tp + v.fp + v.fn + v.tn;
  if (total === 0) return { tp: 0, fp: 0, fn: 0, tn: 0 };
  const diseased = v.tp + v.fn;
  const healthy = v.fp + v.tn;
  const testPos = v.tp + v.fp;
  const testNeg = v.fn + v.tn;
  return {
    tp: (diseased * testPos) / total,
    fp: (healthy * testPos) / total,
    fn: (diseased * testNeg) / total,
    tn: (healthy * testNeg) / total,
  };
}

/** Pearson chi-square statistic: Σ (O − E)² / E */
export function computeChiSquare(observed: CellValues, expected: ExpectedValues): number {
  let chi2 = 0;
  for (const key of ["tp", "fp", "fn", "tn"] as (keyof CellValues)[]) {
    const e = expected[key];
    if (e > 0) {
      chi2 += (observed[key] - e) ** 2 / e;
    }
  }
  return chi2;
}

/**
 * p-value for chi-square distribution with df=1.
 * Uses the complementary error function approximation:
 *   P(χ²₁ > x) = 1 - erf(√(x/2))
 * which is exact for df=1 (since χ²₁ is the square of a standard normal).
 */
export function chiSquarePValue(chi2: number): number {
  if (chi2 <= 0) return 1;
  // For df=1: p = 2(1 - Φ(√chi2)) = erfc(√(chi2/2))
  return erfc(Math.sqrt(chi2 / 2));
}

/** Complementary error function — Abramowitz & Stegun approximation */
function erfc(x: number): number {
  if (x < 0) return 2 - erfc(-x);
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const t = 1.0 / (1.0 + p * x);
  return ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
}
