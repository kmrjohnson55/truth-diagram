import type { CellValues } from "../../utils/statistics";
import { toSvg } from "../../utils/geometry";

interface DiagonalOverlaysProps {
  values: CellValues;
  centerX: number;
  centerY: number;
  scale: number;
}

/**
 * Three diagonal lines, all positive visual slope (per Johnson AJR 2014 Fig. 4):
 * 1. Box diagonal (dashed brown): LL→UR = odds before the test
 * 2. UL quadrant diagonal (green): (-FP,0)→(0,TP) = odds after a positive test
 * 3. LR quadrant diagonal (red): (0,-FN)→(TN,0) = odds after a negative test
 */
export function DiagonalOverlays({
  values,
  centerX,
  centerY,
  scale,
}: DiagonalOverlaysProps) {
  const { tp, fp, fn, tn } = values;

  const ll = toSvg(-fp, -fn, centerX, centerY, scale);
  const ur = toSvg(tn, tp, centerX, centerY, scale);
  const posStart = toSvg(-fp, 0, centerX, centerY, scale);
  const posEnd = toSvg(0, tp, centerX, centerY, scale);
  const negStart = toSvg(0, -fn, centerX, centerY, scale);
  const negEnd = toSvg(tn, 0, centerX, centerY, scale);

  const diseased = tp + fn;
  const healthy = fp + tn;
  const pretestSlope = healthy > 0 ? diseased / healthy : Infinity;
  const postPosSlope = fp > 0 ? tp / fp : Infinity;
  const postNegSlope = tn > 0 ? fn / tn : 0;

  const midBox = { x: (ll.x + ur.x) / 2, y: (ll.y + ur.y) / 2 };
  const midPos = { x: (posStart.x + posEnd.x) / 2, y: (posStart.y + posEnd.y) / 2 };
  const midNeg = { x: (negStart.x + negEnd.x) / 2, y: (negStart.y + negEnd.y) / 2 };

  const fmt = (v: number) => (!isFinite(v) ? "\u221E" : v.toFixed(2));

  return (
    <g className="diagonal-overlays">
      {/* Box diagonal (brown dashed) — odds before the test */}
      <line x1={ll.x} y1={ll.y} x2={ur.x} y2={ur.y}
        stroke="#92400e" strokeWidth={2.5} strokeDasharray="6 4" opacity={0.7} />
      <text fontSize={13} fontWeight={600} fill="#92400e" opacity={0.85}
        style={{ userSelect: "none" }}>
        <tspan x={midBox.x + 8} y={midBox.y + 14}>slope = odds</tspan>
        <tspan x={midBox.x + 8} y={midBox.y + 30}>before the test = {fmt(pretestSlope)}</tspan>
      </text>

      {/* UL quadrant diagonal (green) — odds after a positive test */}
      {(fp > 0 || tp > 0) && (
        <>
          <line x1={posStart.x} y1={posStart.y} x2={posEnd.x} y2={posEnd.y}
            stroke="#16a34a" strokeWidth={3} opacity={0.85} />
          <text fontSize={13} fontWeight={600} fill="#16a34a" textAnchor="end" opacity={0.9}
            style={{ userSelect: "none" }}>
            <tspan x={midPos.x - 16} y={midPos.y + 14}>slope = odds after</tspan>
            <tspan x={midPos.x - 16} y={midPos.y + 30}>a positive test = {fmt(postPosSlope)}</tspan>
          </text>
        </>
      )}

      {/* LR quadrant diagonal (red) — odds after a negative test */}
      {(fn > 0 || tn > 0) && (
        <>
          <line x1={negStart.x} y1={negStart.y} x2={negEnd.x} y2={negEnd.y}
            stroke="#dc2626" strokeWidth={3} opacity={0.85} />
          <text fontSize={13} fontWeight={600} fill="#dc2626" opacity={0.9}
            style={{ userSelect: "none" }}>
            <tspan x={midNeg.x + 8} y={midNeg.y + 34}>slope = odds after</tspan>
            <tspan x={midNeg.x + 8} y={midNeg.y + 50}>a negative test = {fmt(postNegSlope)}</tspan>
          </text>
        </>
      )}
    </g>
  );
}
