import type { CellValues } from "../../utils/statistics";
import { toSvg } from "../../utils/geometry";

interface DiagonalOverlaysProps {
  values: CellValues;
  centerX: number;
  centerY: number;
  scale: number;
}

/**
 * Draws three diagonal lines, all with positive visual slope (lower-left → upper-right):
 *
 * 1. Box diagonal (dashed, dark gold): lower-left (-FP,-FN) → upper-right (TN,TP) = pretest odds
 * 2. UL quadrant diagonal (green): (-FP, 0) → (0, TP) = odds after positive test
 *    slope = TP/FP — steeper is better
 * 3. LR quadrant diagonal (red): (0, -FN) → (TN, 0) = odds after negative test
 *    slope = FN/TN — flatter is better
 *
 * Per Johnson & Johnson AJR 2014 Fig. 4 and Diagnosis 2017 Fig. 7.
 */
export function DiagonalOverlays({
  values,
  centerX,
  centerY,
  scale,
}: DiagonalOverlaysProps) {
  const { tp, fp, fn, tn } = values;

  // All points in diagram coordinates → SVG
  const ll = toSvg(-fp, -fn, centerX, centerY, scale); // lower-left of box
  const ur = toSvg(tn, tp, centerX, centerY, scale);   // upper-right of box

  // UL quadrant diagonal endpoints (positive odds)
  const posStart = toSvg(-fp, 0, centerX, centerY, scale);
  const posEnd = toSvg(0, tp, centerX, centerY, scale);

  // LR quadrant diagonal endpoints (negative odds)
  const negStart = toSvg(0, -fn, centerX, centerY, scale);
  const negEnd = toSvg(tn, 0, centerX, centerY, scale);

  // Slope values
  const diseased = tp + fn;
  const healthy = fp + tn;
  const pretestSlope = healthy > 0 ? diseased / healthy : Infinity;
  const postPosSlope = fp > 0 ? tp / fp : Infinity;
  const postNegSlope = tn > 0 ? fn / tn : 0;

  // Midpoints for labels
  const midBox = { x: (ll.x + ur.x) / 2, y: (ll.y + ur.y) / 2 };
  const midPos = { x: (posStart.x + posEnd.x) / 2, y: (posStart.y + posEnd.y) / 2 };
  const midNeg = { x: (negStart.x + negEnd.x) / 2, y: (negStart.y + negEnd.y) / 2 };

  const fmtSlope = (v: number) =>
    !isFinite(v) ? "\u221E" : v.toFixed(2);

  return (
    <g className="diagonal-overlays">
      {/* Box diagonal: lower-left → upper-right (pretest odds, dark gold/brown dashed) */}
      <line
        x1={ll.x} y1={ll.y} x2={ur.x} y2={ur.y}
        stroke="#92400e" strokeWidth={2.5} strokeDasharray="6 4"
        opacity={0.7}
      />
      <text
        x={midBox.x + 8} y={midBox.y - 8}
        fontSize={10} fontWeight={600} fill="#92400e"
        opacity={0.85}
      >
        pretest odds = {fmtSlope(pretestSlope)}
      </text>

      {/* UL quadrant diagonal: (-FP,0) → (0,TP) — green, steep = good */}
      {fp > 0 && tp > 0 && (
        <>
          <line
            x1={posStart.x} y1={posStart.y} x2={posEnd.x} y2={posEnd.y}
            stroke="#16a34a" strokeWidth={3}
            opacity={0.85}
          />
          <text
            x={midPos.x - 8} y={midPos.y - 8}
            fontSize={10} fontWeight={600} fill="#16a34a"
            textAnchor="end"
            opacity={0.9}
          >
            odds after + test = {fmtSlope(postPosSlope)}
          </text>
        </>
      )}

      {/* LR quadrant diagonal: (0,-FN) → (TN,0) — red, shallow = good */}
      {fn > 0 && tn > 0 && (
        <>
          <line
            x1={negStart.x} y1={negStart.y} x2={negEnd.x} y2={negEnd.y}
            stroke="#dc2626" strokeWidth={3}
            opacity={0.85}
          />
          <text
            x={midNeg.x + 8} y={midNeg.y + 14}
            fontSize={10} fontWeight={600} fill="#dc2626"
            opacity={0.9}
          >
            odds after − test = {fmtSlope(postNegSlope)}
          </text>
        </>
      )}
    </g>
  );
}
