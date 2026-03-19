import { useState, useMemo } from "react";
import { LessonLayout } from "./LessonLayout";
import { TruthDiagram } from "../Diagram/TruthDiagram";
import { DiagonalOverlays } from "../Diagram/DiagonalOverlays";
import { toSvg } from "../../utils/geometry";
import { TwoByTwoTable } from "../UI/TwoByTwoTable";
import {
  formatStat,
  formatRatio,
  computeExpectedValues,
  computeChiSquare,
  chiSquarePValue,
} from "../../utils/statistics";
import { CELL_COLORS } from "../../utils/colors";
import type { CellValues, DiagnosticStats } from "../../utils/statistics";
import type { OverlayType } from "../Diagram/StatOverlays";
import type { LessonNavProps } from "./lessonTypes";

interface Lesson8Props extends LessonNavProps {
  values: CellValues;
  stats: DiagnosticStats;
  setValue: (key: keyof CellValues, val: number) => void;
  setValues: (v: CellValues) => void;
}

/* ─── Overlay toggle button ─── */

function OverlayToggle({
  label,
  active,
  color,
  onClick,
}: {
  label: string;
  active: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
        active
          ? "text-white border-transparent"
          : "text-slate-600 border-slate-200 bg-white hover:bg-slate-50"
      }`}
      style={active ? { backgroundColor: color, borderColor: color } : {}}
    >
      {label}
    </button>
  );
}

/* ─── Main lesson component ─── */

export function Lesson8_Sandbox({
  values,
  stats,
  setValue,
  setValues,
  totalLessons,
  onPrev,
  onNext,
  onHome,
  onGoTo,
  lessonTitles,
}: Lesson8Props) {
  // Overlay toggle state
  const [activeOverlays, setActiveOverlays] = useState<OverlayType[]>([]);
  const [showDiagonals, setShowDiagonals] = useState(false);
  const [showChiSquare] = useState(false);

  const toggleOverlay = (ov: OverlayType) => {
    setActiveOverlays((prev) =>
      prev.includes(ov) ? prev.filter((o) => o !== ov) : [...prev, ov]
    );
  };

  // Chi-square computation
  const expected = useMemo(() => computeExpectedValues(values), [values]);
  const chi2 = useMemo(() => computeChiSquare(values, expected), [values, expected]);
  const pValue = useMemo(() => chiSquarePValue(chi2), [chi2]);

  return (
    <LessonLayout
      meta={{
        number: 8,
        title: "Sandbox",
        subtitle: "Explore freely — all overlays, stats, and the 2×2 table",
      }}
      totalLessons={totalLessons}
      onPrev={onPrev}
      onNext={onNext}
      onHome={onHome}
      onGoTo={onGoTo}
      lessonTitles={lessonTitles}
      keyInsight={
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
          <p className="text-sm text-indigo-800">
            Free exploration &mdash; toggle any overlay, drag the box, change values, and see
            every statistic update in real time. Use presets below the diagram to load examples.
          </p>
        </div>
      }
      values={values}
      diagramFooter={<TwoByTwoTable values={values} setValue={setValue} setValues={setValues} />}
      diagram={
        <TruthDiagram
          values={values}
          onDrag={setValues}
          overlays={activeOverlays}
          renderExtraSvg={(showDiagonals || showChiSquare) ? (layout) => {
            const { centerX: cx, centerY: cy, scale: s } = layout;
            return (
              <g>
                {showDiagonals && (
                  <DiagonalOverlays values={values} centerX={cx} centerY={cy} scale={s} />
                )}
                {showChiSquare && (() => {
                  const e = expected;
                  const ul = toSvg(-e.fp, e.tp, cx, cy, s);
                  const ur = toSvg(e.tn, e.tp, cx, cy, s);
                  const ll = toSvg(-e.fp, -e.fn, cx, cy, s);
                  const lr = toSvg(e.tn, -e.fn, cx, cy, s);
                  const pathD = `M${ul.x},${ul.y} L${ur.x},${ur.y} L${lr.x},${lr.y} L${ll.x},${ll.y} Z`;
                  return (
                    <g>
                      <path d={pathD} fill="none" stroke="#94a3b8" strokeWidth={2} strokeDasharray="8 4" opacity={0.6} />
                      <text x={ll.x - 4} y={lr.y + 14} fontSize={10} fill="#94a3b8" fontWeight={500}>Expected</text>
                    </g>
                  );
                })()}
              </g>
            );
          } : undefined}
        />
      }
    >
      <div className="space-y-4">
        {/* Overlay toggles */}
        <div>
          <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
            Overlays
          </h3>
          <div className="flex flex-wrap gap-2">
            <OverlayToggle
              label="Sensitivity"
              active={activeOverlays.includes("sensitivity")}
              color={CELL_COLORS.tp}
              onClick={() => toggleOverlay("sensitivity")}
            />
            <OverlayToggle
              label="Specificity"
              active={activeOverlays.includes("specificity")}
              color={CELL_COLORS.tn}
              onClick={() => toggleOverlay("specificity")}
            />
            <OverlayToggle
              label="PPV"
              active={activeOverlays.includes("ppv")}
              color={CELL_COLORS.tp}
              onClick={() => toggleOverlay("ppv")}
            />
            <OverlayToggle
              label="NPV"
              active={activeOverlays.includes("npv")}
              color={CELL_COLORS.tn}
              onClick={() => toggleOverlay("npv")}
            />
            <OverlayToggle
              label="Odds / LR"
              active={showDiagonals}
              color="#64748b"
              onClick={() => setShowDiagonals(!showDiagonals)}
            />
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* All statistics */}
        <div>
          <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
            All Statistics
          </h3>
          <div className="space-y-1">
            <StatRow label="Sensitivity" value={formatStat(stats.sensitivity)} color={CELL_COLORS.tp} />
            <StatRow label="Specificity" value={formatStat(stats.specificity)} color={CELL_COLORS.tn} />
            <StatRow label="PPV" value={formatStat(stats.ppv)} color={CELL_COLORS.tp} />
            <StatRow label="NPV" value={formatStat(stats.npv)} color={CELL_COLORS.tn} />
            <StatRow label="Accuracy" value={formatStat(stats.accuracy)} color="#64748b" />
            <StatRow label="Prevalence" value={formatStat(stats.prevalence)} color="#94a3b8" />
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
            Advanced
          </h3>
          <div className="space-y-1">
            <StatRow label="Positive LR" value={formatRatio(stats.positiveLR)} color="#16a34a" />
            <StatRow label="Negative LR" value={formatRatio(stats.negativeLR)} color="#dc2626" />
            <StatRow label="Odds Ratio" value={formatRatio(stats.oddsRatio)} color="#64748b" />
            <StatRow label="Pretest Odds" value={formatRatio(stats.pretestOdds)} color="#64748b" />
            <StatRow
              label="χ²"
              value={formatRatio(chi2)}
              color="#4f46e5"
            />
            <StatRow
              label="p-value"
              value={pValue < 0.001 ? "< 0.001" : pValue.toFixed(4)}
              color={pValue < 0.05 ? "#16a34a" : "#ca8a04"}
            />
          </div>
        </div>

        <div className="pt-1 flex items-center justify-between text-xs text-slate-600 bg-slate-50 rounded-md px-2 py-1.5">
          <span>Total subjects</span>
          <span className="font-bold text-slate-800 tabular-nums">{stats.total}</span>
        </div>
      </div>
    </LessonLayout>
  );
}

/* ─── Helper row component ─── */

function StatRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-slate-50">
      <div className="flex items-center gap-2">
        <span
          className="w-1.5 h-3.5 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs font-medium text-slate-700">{label}</span>
      </div>
      <span className="text-xs font-semibold text-slate-800 tabular-nums">
        {value}
      </span>
    </div>
  );
}
