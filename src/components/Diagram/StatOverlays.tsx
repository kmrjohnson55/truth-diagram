import type { CellValues } from "../../utils/statistics";
import { CELL_COLORS } from "../../utils/colors";
import { toSvg } from "../../utils/geometry";

export type OverlayType = "sensitivity" | "specificity" | "ppv" | "npv";

interface StatOverlaysProps {
  values: CellValues;
  centerX: number;
  centerY: number;
  scale: number;
  activeOverlays: OverlayType[];
}

const STROKE_W = 7;

/**
 * Each overlay involves two hemiaxes (one "true" cell and one "false" cell).
 *   sensitivity = TP / (TP + FN)  →  UP (tp) + DOWN (fn)
 *   specificity = TN / (TN + FP)  →  RIGHT (tn) + LEFT (fp)
 *   ppv         = TP / (TP + FP)  →  UP (tp) + LEFT (fp)
 *   npv         = TN / (TN + FN)  →  RIGHT (tn) + DOWN (fn)
 */
const OVERLAY_AXES: Record<OverlayType, [keyof CellValues, keyof CellValues]> = {
  sensitivity: ["tp", "fn"],
  specificity: ["tn", "fp"],
  ppv: ["tp", "fp"],
  npv: ["tn", "fn"],
};

/** Direction each hemiaxis points from the origin (in diagram coords). */
const AXIS_DIR: Record<keyof CellValues, { dx: number; dy: number }> = {
  tp: { dx: 0, dy: 1 },   // up
  fn: { dx: 0, dy: -1 },  // down
  fp: { dx: -1, dy: 0 },  // left
  tn: { dx: 1, dy: 0 },   // right
};

export function StatOverlays({
  values,
  centerX,
  centerY,
  scale,
  activeOverlays,
}: StatOverlaysProps) {
  // Collect which hemiaxes need coloring
  const activeAxes = new Set<keyof CellValues>();
  for (const ov of activeOverlays) {
    const [a, b] = OVERLAY_AXES[ov];
    activeAxes.add(a);
    activeAxes.add(b);
  }

  const origin = toSvg(0, 0, centerX, centerY, scale);

  return (
    <g className="stat-overlays">
      {(["tp", "fn", "fp", "tn"] as (keyof CellValues)[]).map((cell) => {
        if (!activeAxes.has(cell)) return null;
        const len = values[cell];
        if (len <= 0) return null;
        const dir = AXIS_DIR[cell];
        const end = toSvg(dir.dx * len, dir.dy * len, centerX, centerY, scale);
        return (
          <line
            key={cell}
            x1={origin.x}
            y1={origin.y}
            x2={end.x}
            y2={end.y}
            stroke={CELL_COLORS[cell]}
            strokeWidth={STROKE_W}
            strokeLinecap="round"
          />
        );
      })}
    </g>
  );
}
