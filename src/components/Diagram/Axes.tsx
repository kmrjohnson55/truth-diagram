import type { CellValues } from "../../utils/statistics";

const AXIS_LABEL: Record<string, string> = {
  tp: "True positive",
  fn: "False negative",
  fp: "False positive",
  tn: "True negative",
};

interface AxesProps {
  centerX: number;
  centerY: number;
  scale: number;
  values: CellValues;
}

const TICK_INTERVAL = 10;
const TICK_HALF = 4; // px each side of the axis

export function Axes({ centerX, centerY, scale, values }: AxesProps) {
  const arrowSize = 7;
  const axisOvershoot = 20;

  const upLen = values.tp * scale + axisOvershoot;
  const downLen = values.fn * scale + axisOvershoot;
  const rightLen = values.tn * scale + axisOvershoot;
  const leftLen = values.fp * scale + axisOvershoot;

  const dim = "#94a3b8";
  const tickColor = "#cbd5e1";
  const labelColor = "#374151";

  // Generate tick marks for a given axis direction
  const ticks: React.ReactElement[] = [];

  // Up (TP) — ticks are horizontal dashes along the vertical axis
  for (let n = TICK_INTERVAL; n <= values.tp; n += TICK_INTERVAL) {
    const y = centerY - n * scale;
    ticks.push(
      <line key={`tp-${n}`} x1={centerX - TICK_HALF} y1={y} x2={centerX + TICK_HALF} y2={y}
        stroke={tickColor} strokeWidth={1} />
    );
  }

  // Down (FN) — ticks are horizontal dashes
  for (let n = TICK_INTERVAL; n <= values.fn; n += TICK_INTERVAL) {
    const y = centerY + n * scale;
    ticks.push(
      <line key={`fn-${n}`} x1={centerX - TICK_HALF} y1={y} x2={centerX + TICK_HALF} y2={y}
        stroke={tickColor} strokeWidth={1} />
    );
  }

  // Right (TN) — ticks are vertical dashes along the horizontal axis
  for (let n = TICK_INTERVAL; n <= values.tn; n += TICK_INTERVAL) {
    const x = centerX + n * scale;
    ticks.push(
      <line key={`tn-${n}`} x1={x} y1={centerY - TICK_HALF} x2={x} y2={centerY + TICK_HALF}
        stroke={tickColor} strokeWidth={1} />
    );
  }

  // Left (FP) — ticks are vertical dashes
  for (let n = TICK_INTERVAL; n <= values.fp; n += TICK_INTERVAL) {
    const x = centerX - n * scale;
    ticks.push(
      <line key={`fp-${n}`} x1={x} y1={centerY - TICK_HALF} x2={x} y2={centerY + TICK_HALF}
        stroke={tickColor} strokeWidth={1} />
    );
  }

  return (
    <g className="axes">
      {/* Tick marks */}
      {ticks}

      {/* Up (TP) */}
      <line x1={centerX} y1={centerY} x2={centerX} y2={centerY - upLen}
        stroke={dim} strokeWidth={1.5} />
      <polygon
        points={`${centerX},${centerY - upLen - arrowSize} ${centerX - arrowSize / 2},${centerY - upLen} ${centerX + arrowSize / 2},${centerY - upLen}`}
        fill={dim}
      />

      {/* Down (FN) */}
      <line x1={centerX} y1={centerY} x2={centerX} y2={centerY + downLen}
        stroke={dim} strokeWidth={1.5} />
      <polygon
        points={`${centerX},${centerY + downLen + arrowSize} ${centerX - arrowSize / 2},${centerY + downLen} ${centerX + arrowSize / 2},${centerY + downLen}`}
        fill={dim}
      />

      {/* Right (TN) */}
      <line x1={centerX} y1={centerY} x2={centerX + rightLen} y2={centerY}
        stroke={dim} strokeWidth={1.5} />
      <polygon
        points={`${centerX + rightLen + arrowSize},${centerY} ${centerX + rightLen},${centerY - arrowSize / 2} ${centerX + rightLen},${centerY + arrowSize / 2}`}
        fill={dim}
      />

      {/* Left (FP) */}
      <line x1={centerX} y1={centerY} x2={centerX - leftLen} y2={centerY}
        stroke={dim} strokeWidth={1.5} />
      <polygon
        points={`${centerX - leftLen - arrowSize},${centerY} ${centerX - leftLen},${centerY - arrowSize / 2} ${centerX - leftLen},${centerY + arrowSize / 2}`}
        fill={dim}
      />

      {/* ── Labels ── */}
      <text x={centerX} y={centerY - upLen - arrowSize - 6}
        textAnchor="middle" fontSize={13} fontWeight={500} fill={labelColor}
        style={{ userSelect: "none" }}>{AXIS_LABEL.tp}</text>

      <text x={centerX} y={centerY + downLen + arrowSize + 16}
        textAnchor="middle" fontSize={13} fontWeight={500} fill={labelColor}
        style={{ userSelect: "none" }}>{AXIS_LABEL.fn}</text>

      <text textAnchor="end" fontSize={13} fontWeight={500} fill={labelColor}
        style={{ userSelect: "none" }}>
        <tspan x={centerX - leftLen - arrowSize - 6} y={centerY - 4}>False</tspan>
        <tspan x={centerX - leftLen - arrowSize - 6} y={centerY + 12}>positive</tspan>
      </text>

      <text textAnchor="start" fontSize={13} fontWeight={500} fill={labelColor}
        style={{ userSelect: "none" }}>
        <tspan x={centerX + rightLen + arrowSize + 6} y={centerY - 4}>True</tspan>
        <tspan x={centerX + rightLen + arrowSize + 6} y={centerY + 12}>negative</tspan>
      </text>
    </g>
  );
}
