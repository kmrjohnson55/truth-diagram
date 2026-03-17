import { useState, useMemo } from "react";
import { LessonLayout } from "./LessonLayout";
import { TruthDiagram } from "../Diagram/TruthDiagram";
import { DiagonalOverlays } from "../Diagram/DiagonalOverlays";
import { InputPanel } from "../UI/InputPanel";
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
          : "text-slate-500 border-slate-200 bg-white hover:bg-slate-50"
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
  const { tp, fp, fn, tn } = values;
  const diseased = tp + fn;
  const healthy = fp + tn;
  const testPos = tp + fp;
  const testNeg = fn + tn;
  const total = tp + fp + fn + tn;

  // Overlay toggle state
  const [activeOverlays, setActiveOverlays] = useState<OverlayType[]>([]);
  const [showDiagonals, setShowDiagonals] = useState(false);
  const [showTable, setShowTable] = useState(false);

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
        number: 7,
        title: "Sandbox",
        subtitle: "Explore freely — all overlays, stats, and the 2×2 table",
      }}
      totalLessons={totalLessons}
      onPrev={onPrev}
      onNext={onNext}
      onHome={onHome}
      onGoTo={onGoTo}
      lessonTitles={lessonTitles}
      diagram={
        <TruthDiagram
          values={values}
          onDrag={setValues}
          overlays={activeOverlays}
          renderExtraSvg={
            showDiagonals
              ? (layout) => (
                  <DiagonalOverlays
                    values={values}
                    centerX={layout.centerX}
                    centerY={layout.centerY}
                    scale={layout.scale}
                  />
                )
              : undefined
          }
        />
      }
    >
      <div className="space-y-4">
        {/* Overlay toggles */}
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
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
            <OverlayToggle
              label="2×2 Table"
              active={showTable}
              color="#6366f1"
              onClick={() => setShowTable(!showTable)}
            />
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Contingency table (from former Lesson 1) */}
        {showTable && (
          <>
            <div className="space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr>
                      <th className="p-2"></th>
                      <th className="p-2 text-center font-semibold text-slate-600 border-b-2 border-slate-200">Disease +</th>
                      <th className="p-2 text-center font-semibold text-slate-600 border-b-2 border-slate-200">Disease &minus;</th>
                      <th className="p-2 text-center font-semibold text-slate-400 border-b-2 border-slate-100">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2 font-semibold text-slate-600 border-r-2 border-slate-200">Test +</td>
                      <td className="p-2 text-center">
                        <span className="inline-block px-3 py-1 rounded-md bg-green-50 text-green-700 font-bold border border-green-200">TP = {tp}</span>
                      </td>
                      <td className="p-2 text-center">
                        <span className="inline-block px-3 py-1 rounded-md bg-yellow-50 text-yellow-700 font-bold border border-yellow-200">FP = {fp}</span>
                      </td>
                      <td className="p-2 text-center text-slate-400 font-medium">{testPos}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold text-slate-600 border-r-2 border-slate-200">Test &minus;</td>
                      <td className="p-2 text-center">
                        <span className="inline-block px-3 py-1 rounded-md bg-red-50 text-red-700 font-bold border border-red-200">FN = {fn}</span>
                      </td>
                      <td className="p-2 text-center">
                        <span className="inline-block px-3 py-1 rounded-md bg-blue-50 text-blue-700 font-bold border border-blue-200">TN = {tn}</span>
                      </td>
                      <td className="p-2 text-center text-slate-400 font-medium">{testNeg}</td>
                    </tr>
                    <tr className="border-t-2 border-slate-200">
                      <td className="p-2 font-semibold text-slate-400">Total</td>
                      <td className="p-2 text-center text-slate-400 font-medium">{diseased}</td>
                      <td className="p-2 text-center text-slate-400 font-medium">{healthy}</td>
                      <td className="p-2 text-center text-slate-500 font-bold">{total}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="grid grid-cols-1 gap-1.5 text-xs">
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 mt-0.5 shrink-0" />
                  <span className="text-slate-600"><strong className="text-green-700">TP:</strong> Disease + and Test +</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-500 mt-0.5 shrink-0" />
                  <span className="text-slate-600"><strong className="text-yellow-700">FP:</strong> Disease &minus; but Test +</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 mt-0.5 shrink-0" />
                  <span className="text-slate-600"><strong className="text-red-700">FN:</strong> Disease + but Test &minus;</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 mt-0.5 shrink-0" />
                  <span className="text-slate-600"><strong className="text-blue-700">TN:</strong> Disease &minus; and Test &minus;</span>
                </div>
              </div>
            </div>
            <hr className="border-slate-100" />
          </>
        )}

        {/* Input panel */}
        <InputPanel values={values} setValue={setValue} setValues={setValues} />

        <hr className="border-slate-100" />

        {/* All statistics */}
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
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
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Advanced
          </h3>
          <div className="space-y-1">
            <StatRow label="+LR" value={formatRatio(stats.positiveLR)} color="#ea580c" />
            <StatRow label="−LR" value={formatRatio(stats.negativeLR)} color="#0d9488" />
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

        <div className="pt-1 text-xs text-slate-400">
          Total subjects: {stats.total}
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
