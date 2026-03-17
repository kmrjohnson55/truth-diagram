import type { CellValues } from "../../utils/statistics";
import { toSvg } from "../../utils/geometry";

interface DiagonalOverlaysProps {
  values: CellValues;
  centerX: number;
  centerY: number;
  scale: number;
}

/**
 * Draws three diagonal lines on the truth diagram:
 * 1. Box diagonal (dashed gray): upper-left → lower-right corner = pretest odds
 *    This is the same diagonal the posttest lines lie on, split at the origin.
 * 2. UL quadrant diagonal (orange): origin → upper-left corner = posttest odds (+)
 * 3. LR quadrant diagonal (teal): origin → lower-right corner = posttest odds (−)
 *
 * The SLOPE of each diagonal encodes the corresponding odds value.
 */
export function DiagonalOverlays({
  values,
  centerX,
  centerY,
  scale,
}: DiagonalOverlaysProps) {
  const { tp, fp, fn, tn } = values;

  const ul = toSvg(-fp, tp, centerX, centerY, scale);
  const lr = toSvg(tn, -fn, centerX, centerY, scale);
  const origin = toSvg(0, 0, centerX, centerY, scale);

  // Compute slope magnitudes for labeling
  const diseased = tp + fn;
  const healthy = fp + tn;
  const pretestSlope = healthy > 0 ? diseased / healthy : Infinity;
  const postPosSlope = fp > 0 ? tp / fp : Infinity;
  const postNegSlope = tn > 0 ? fn / tn : 0;

  // Midpoint helpers for label positioning
  const midUL = { x: (origin.x + ul.x) / 2, y: (origin.y + ul.y) / 2 };
  const midLR = { x: (origin.x + lr.x) / 2, y: (origin.y + lr.y) / 2 };
  const midBox = { x: (ul.x + lr.x) / 2, y: (ul.y + lr.y) / 2 };

  const fmtSlope = (v: number) =>
    !isFinite(v) ? "\u221E" : v.toFixed(2);

  return (
    <g className="diagonal-overlays">
      {/* Box diagonal: upper-left → lower-right (pretest odds = height/width) */}
      <line
        x1={ul.x} y1={ul.y} x2={lr.x} y2={lr.y}
        stroke="#64748b" strokeWidth={2.5} strokeDasharray="6 4"
        opacity={0.7}
      />
      {/* Pretest odds label */}
      <text
        x={midBox.x + 8} y={midBox.y - 8}
        fontSize={10} fontWeight={600} fill="#64748b"
        opacity={0.85}
      >
        slope = {fmtSlope(pretestSlope)}
      </text>

      {/* UL quadrant diagonal: origin → upper-left corner (posttest odds+) */}
      {fp > 0 && tp > 0 && (
        <>
          <line
            x1={origin.x} y1={origin.y} x2={ul.x} y2={ul.y}
            stroke="#ea580c" strokeWidth={2.5}
            opacity={0.85}
          />
          {/* Posttest odds (+) label — steeper is better */}
          <text
            x={midUL.x - 8} y={midUL.y - 8}
            fontSize={10} fontWeight={600} fill="#ea580c"
            textAnchor="end"
            opacity={0.9}
          >
            slope = {fmtSlope(postPosSlope)}
          </text>
        </>
      )}

      {/* LR quadrant diagonal: origin → lower-right corner (posttest odds−) */}
      {fn > 0 && tn > 0 && (
        <>
          <line
            x1={origin.x} y1={origin.y} x2={lr.x} y2={lr.y}
            stroke="#0d9488" strokeWidth={2.5}
            opacity={0.85}
          />
          {/* Posttest odds (−) label — flatter is better */}
          <text
            x={midLR.x + 8} y={midLR.y + 14}
            fontSize={10} fontWeight={600} fill="#0d9488"
            opacity={0.9}
          >
            slope = {fmtSlope(postNegSlope)}
          </text>
        </>
      )}
    </g>
  );
}
