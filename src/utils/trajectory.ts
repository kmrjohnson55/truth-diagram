import type { CellValues } from "./statistics";

/**
 * Standard normal CDF — Abramowitz & Stegun approximation (|error| < 7.5e-8).
 */
export function normalCDF(x: number): number {
  if (x < -8) return 0;
  if (x > 8) return 1;
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const t = 1.0 / (1.0 + p * Math.abs(x));
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x / 2);
  return 0.5 * (1 + sign * y);
}

/**
 * Inverse normal CDF (probit) — rational approximation (Beasley-Springer-Moro).
 */
export function normalQuantile(p: number): number {
  if (p <= 0) return -8;
  if (p >= 1) return 8;
  if (p === 0.5) return 0;

  const a = [
    -3.969683028665376e1, 2.209460984245205e2,
    -2.759285104469687e2, 1.383577518672690e2,
    -3.066479806614716e1, 2.506628277459239e0,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2,
    -1.556989798598866e2, 6.680131188771972e1,
    -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1,
    -2.400758277161838e0, -2.549732539343734e0,
    4.374664141464968e0, 2.938163982698783e0,
  ];
  const d = [
    7.784695709041462e-3, 3.224671290700398e-1,
    2.445134137142996e0, 3.754408661907416e0,
  ];

  const pLow = 0.02425;
  const pHigh = 1 - pLow;
  let q: number, r: number;

  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
           ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  } else if (p <= pHigh) {
    q = p - 0.5;
    r = q * q;
    return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5]) * q /
           (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
            ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  }
}

/**
 * Compute d-prime (discriminability index) from sensitivity and specificity.
 * d' = Φ⁻¹(sensitivity) + Φ⁻¹(specificity)
 */
export function computeDPrime(sensitivity: number, specificity: number): number {
  const s = Math.max(0.001, Math.min(0.999, sensitivity));
  const sp = Math.max(0.001, Math.min(0.999, specificity));
  return normalQuantile(s) + normalQuantile(sp);
}

/**
 * Given d', a threshold parameter, and population counts,
 * compute the 2×2 table values.
 *
 * Threshold `t` ranges from roughly -4 to +4.
 *   sensitivity(t) = Φ(d'/2 - t)
 *   specificity(t) = Φ(d'/2 + t)
 */
export function trajectoryPoint(
  dPrime: number,
  threshold: number,
  diseased: number,
  healthy: number
): CellValues {
  const half = dPrime / 2;
  const sens = normalCDF(half - threshold);
  const spec = normalCDF(half + threshold);
  const tp = Math.round(sens * diseased);
  const fn = diseased - tp;
  const tn = Math.round(spec * healthy);
  const fp = healthy - tn;
  return { tp, fp, fn, tn };
}

/**
 * Generate a trajectory curve as an array of {sens, spec} points.
 */
export function generateTrajectory(
  dPrime: number,
  steps = 100
): { sensitivity: number; specificity: number }[] {
  const half = dPrime / 2;
  const points: { sensitivity: number; specificity: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = -4 + (8 * i) / steps;
    points.push({
      sensitivity: normalCDF(half - t),
      specificity: normalCDF(half + t),
    });
  }
  return points;
}

/**
 * Compute AUC (area under the ROC curve) using the trapezoidal rule.
 */
export function computeAUC(
  trajectory: { sensitivity: number; specificity: number }[]
): number {
  let auc = 0;
  for (let i = 1; i < trajectory.length; i++) {
    const fpr0 = 1 - trajectory[i - 1].specificity;
    const fpr1 = 1 - trajectory[i].specificity;
    const tpr0 = trajectory[i - 1].sensitivity;
    const tpr1 = trajectory[i].sensitivity;
    // Trapezoidal integration
    auc += 0.5 * (tpr0 + tpr1) * (fpr1 - fpr0);
  }
  return Math.abs(auc);
}

/**
 * Compute the threshold that best reproduces the given sensitivity.
 * t = d'/2 - Φ⁻¹(sensitivity)
 */
export function thresholdFromSensitivity(
  dPrime: number,
  sensitivity: number
): number {
  const s = Math.max(0.001, Math.min(0.999, sensitivity));
  return dPrime / 2 - normalQuantile(s);
}
