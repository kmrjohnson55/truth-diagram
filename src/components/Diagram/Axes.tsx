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
  /** Original (unmagnified) values for tick mark computation */
  tickValues?: CellValues;
}

const TICK_HALF = 4; // px each side of the axis
const MIN_TICK_PX = 15; // minimum pixels between ticks

const NICE_NUMBERS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000];

function niceInterval(rawInterval: number): number {
  return NICE_NUMBERS.find(n => n >= rawInterval) || Math.ceil(rawInterval / 1000) * 1000;
}

export function Axes({ centerX, centerY, scale, values, tickValues }: AxesProps) {
  // Use tickValues for tick computation (unmagnified), values for axis length
  const tv = tickValues || values;

  // Vertical magnification ratio (TP/FN are magnified on screen)
  const magRatioV = tv.tp > 0 ? values.tp / tv.tp : (tv.fn > 0 ? values.fn / tv.fn : 1);

  // Separate tick intervals for horizontal and vertical axes
  const TICK_INTERVAL_H = niceInterval(MIN_TICK_PX / scale);
  const TICK_INTERVAL_V = niceInterval(MIN_TICK_PX / (scale * Math.max(magRatioV, 1)));

  const arrowSize = 7;
  const axisOvershoot = Math.max(20, scale * 5);

  const upLen = values.tp * scale + axisOvershoot;
  const downLen = values.fn * scale + axisOvershoot;
  const rightLen = values.tn * scale + axisOvershoot;
  const leftLen = values.fp * scale + axisOvershoot;

  const dim = "#94a3b8";
  const tickColor = "#cbd5e1";
  const labelColor = "#374151";

  // Generate tick marks for each axis direction
  const ticks: React.ReactElement[] = [];

  // Up (TP) — vertical axis ticks (use TICK_INTERVAL_V)
  for (let n = TICK_INTERVAL_V; n <= tv.tp; n += TICK_INTERVAL_V) {
    const magRatio = tv.tp > 0 ? values.tp / tv.tp : 1;
    const y = centerY - n * magRatio * scale;
    ticks.push(
      <line key={`tp-${n}`} x1={centerX - TICK_HALF} y1={y} x2={centerX + TICK_HALF} y2={y}
        stroke={tickColor} strokeWidth={1} />
    );
  }

  // Down (FN) — vertical axis ticks (use TICK_INTERVAL_V)
  for (let n = TICK_INTERVAL_V; n <= tv.fn; n += TICK_INTERVAL_V) {
    const magRatio = tv.fn > 0 ? values.fn / tv.fn : 1;
    const y = centerY + n * magRatio * scale;
    ticks.push(
      <line key={`fn-${n}`} x1={centerX - TICK_HALF} y1={y} x2={centerX + TICK_HALF} y2={y}
        stroke={tickColor} strokeWidth={1} />
    );
  }

  // Right (TN) — horizontal axis ticks (use TICK_INTERVAL_H)
  for (let n = TICK_INTERVAL_H; n <= tv.tn; n += TICK_INTERVAL_H) {
    const x = centerX + n * scale;
    ticks.push(
      <line key={`tn-${n}`} x1={x} y1={centerY - TICK_HALF} x2={x} y2={centerY + TICK_HALF}
        stroke={tickColor} strokeWidth={1} />
    );
  }

  // Left (FP) — horizontal axis ticks (use TICK_INTERVAL_H)
  for (let n = TICK_INTERVAL_H; n <= tv.fp; n += TICK_INTERVAL_H) {
    const x = centerX - n * scale;
    ticks.push(
      <line key={`fp-${n}`} x1={x} y1={centerY - TICK_HALF} x2={x} y2={centerY + TICK_HALF}
        stroke={tickColor} strokeWidth={1} />
    );
  }

  // Tick annotation logic
  const showH = TICK_INTERVAL_H > 1;
  const showV = TICK_INTERVAL_V > 1;
  const sameInterval = TICK_INTERVAL_H === TICK_INTERVAL_V;

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

      {/* Tick interval annotations */}
      {(showH || showV) && sameInterval ? (
        <text x={centerX + 8} y={centerY + 16} fontSize={10} fill="#64748b" style={{ userSelect: "none" }}>
          1 tick = {TICK_INTERVAL_H}
        </text>
      ) : (
        <>
          {showH && (
            <text x={centerX + 8} y={centerY + 16} fontSize={10} fill="#64748b" style={{ userSelect: "none" }}>
              {"↔"} 1 tick = {TICK_INTERVAL_H}
            </text>
          )}
          {showV && (
            <text x={centerX + 8} y={centerY - 8} fontSize={10} fill="#64748b" style={{ userSelect: "none" }}>
              {"↕"} 1 tick = {TICK_INTERVAL_V}
            </text>
          )}
        </>
      )}
    </g>
  );
}
