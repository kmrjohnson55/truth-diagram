import type { CellValues } from "./statistics";

export interface BoxCorners {
  upperLeft: { x: number; y: number };
  upperRight: { x: number; y: number };
  lowerLeft: { x: number; y: number };
  lowerRight: { x: number; y: number };
}

/**
 * Compute the box corners in diagram coordinate space.
 * Origin is at (0,0). Axes: up=+y, down=-y, left=-x, right=+x.
 *
 * Upper-left corner: (-FP, +TP)
 * Upper-right corner: (+TN, +TP)
 * Lower-left corner: (-FP, -FN)
 * Lower-right corner: (+TN, -FN)
 */
export function computeBoxCorners(v: CellValues): BoxCorners {
  return {
    upperLeft: { x: -v.fp, y: v.tp },
    upperRight: { x: v.tn, y: v.tp },
    lowerLeft: { x: -v.fp, y: -v.fn },
    lowerRight: { x: v.tn, y: -v.fn },
  };
}

/**
 * Compute the origin position and scale so the entire box fits within the
 * SVG viewport. The origin shifts proportionally so asymmetric data is
 * centered within the available area.
 */
export function computeLayout(
  v: CellValues,
  viewWidth: number,
  viewHeight: number,
  margin = 65
): { centerX: number; centerY: number; scale: number } {
  const extentRight = Math.max(v.tn, 1);
  const extentLeft = Math.max(v.fp, 1);
  const extentUp = Math.max(v.tp, 1);
  const extentDown = Math.max(v.fn, 1);

  const usableW = viewWidth - margin * 2;
  const usableH = viewHeight - margin * 2;

  const totalH = extentRight + extentLeft;
  const totalV = extentUp + extentDown;

  const scale = Math.min(usableW / totalH, usableH / totalV);

  const centerX = margin + extentLeft * scale + (usableW - totalH * scale) / 2;
  const centerY = margin + extentUp * scale + (usableH - totalV * scale) / 2;

  return { centerX, centerY, scale };
}

/**
 * Convert diagram coordinates to SVG coordinates.
 * In SVG, y increases downward, so we flip the y axis.
 * Optional yMag multiplies the vertical axis for low-prevalence magnification.
 */
export function toSvg(
  diagramX: number,
  diagramY: number,
  centerX: number,
  centerY: number,
  scale: number,
  yMag = 1
): { x: number; y: number } {
  return {
    x: centerX + diagramX * scale,
    y: centerY - diagramY * scale * yMag,
  };
}

/**
 * Compute auto-magnification factor for the vertical axis.
 * When prevalence is very low, the box is too flat to read.
 * Returns a factor that makes the vertical dimension visually comparable
 * to the horizontal dimension (capped at 50×).
 */
export function computeAutoMagnification(v: CellValues): number {
  const diseased = v.tp + v.fn;
  const healthy = v.fp + v.tn;
  if (diseased <= 0 || healthy <= 0) return 1;
  const ratio = healthy / diseased;
  if (ratio <= 10) return 1; // no magnification needed
  // Magnify so the vertical dimension is at least 1/3 of horizontal
  return Math.min(Math.round(ratio / 3), 50);
}

/**
 * Compute auto-magnification factor for the horizontal axis.
 * When cost mode inflates FN costs, the box becomes very tall and narrow.
 * Returns a factor that makes the horizontal dimension visually comparable
 * to the vertical dimension (capped at 50×).
 */
export function computeAutoMagnificationX(v: CellValues): number {
  const diseased = v.tp + v.fn;
  const healthy = v.fp + v.tn;
  if (diseased <= 0 || healthy <= 0) return 1;
  const ratio = diseased / healthy;
  if (ratio <= 10) return 1; // no magnification needed
  // Magnify so the horizontal dimension is at least 1/3 of vertical
  return Math.min(Math.round(ratio / 3), 50);
}
