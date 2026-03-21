import { useState } from "react";
import { TruthDiagram } from "../Diagram/TruthDiagram";
import { TwoByTwoTable } from "../UI/TwoByTwoTable";
import { LessonLayout } from "./LessonLayout";
import { CELL_COLORS } from "../../utils/colors";
import { formatStat, computeStats } from "../../utils/statistics";
import type { CellValues, DiagnosticStats } from "../../utils/statistics";
import type { LessonNavProps } from "./lessonTypes";

interface Lesson3Props extends LessonNavProps {
  values: CellValues;
  stats: DiagnosticStats;
  setValue: (key: keyof CellValues, val: number) => void;
  setValues: (v: CellValues) => void;
}

export function Lesson3_SensSpec({ values, stats, setValue, setValues, totalLessons, onPrev, onNext, onHome, onGoTo, lessonTitles, costState, testToggle }: Lesson3Props) {
  const [activeView, setActiveView] = useState<"sensitivity" | "specificity">("sensitivity");
  const [showLowPrev, setShowLowPrev] = useState(false);

  // Build a low-prevalence version keeping same sens/spec
  const lowPrevTotal = 1000;
  const lowPrevDiseased = 50; // 5% prevalence
  const lowPrevHealthy = lowPrevTotal - lowPrevDiseased;
  const lowPrevTp = Math.round(stats.sensitivity * lowPrevDiseased);
  const lowPrevFn = lowPrevDiseased - lowPrevTp;
  const lowPrevTn = Math.round(stats.specificity * lowPrevHealthy);
  const lowPrevFp = lowPrevHealthy - lowPrevTn;
  const lowPrevValues: CellValues = { tp: lowPrevTp, fp: lowPrevFp, fn: lowPrevFn, tn: lowPrevTn };
  const lowPrevStats = computeStats(lowPrevValues);

  const displayValues = showLowPrev ? lowPrevValues : values;
  const displayStats = showLowPrev ? lowPrevStats : stats;

  const sub = costState.costMode ? <sub className="text-[9px] text-orange-500">cost</sub> : null;

  // Determine which cells to dim based on active view
  const dimCells: (keyof CellValues)[] = activeView === "sensitivity"
    ? ["fp", "tn"]  // sensitivity uses TP and FN only
    : ["tp", "fn"]; // specificity uses FP and TN only

  return (
    <LessonLayout
      meta={{ number: 1, title: "Sensitivity & Specificity", subtitle: "How well does the test detect disease and health?" }}
      totalLessons={totalLessons}
      onPrev={onPrev}
      onNext={onNext}
      onHome={onHome}
      onGoTo={onGoTo}
      lessonTitles={lessonTitles}
      costState={costState}
      testToggle={testToggle}
      values={values}
      diagramFooter={
        <div className="space-y-3">
          {!showLowPrev && <TwoByTwoTable values={values} setValue={setValue} setValues={setValues} costState={costState} dimCells={dimCells} />}
          {/* Prevalence toggle */}
          <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer select-none">
            <input type="checkbox" checked={showLowPrev} onChange={(e) => setShowLowPrev(e.target.checked)}
              className="accent-amber-600" />
            <span className="text-sm font-medium text-black">
              Show same test at <strong>5% prevalence</strong> (sens &amp; spec unchanged)
            </span>
          </label>
        </div>
      }
      diagram={
        <TruthDiagram
          values={displayValues}
          onDrag={showLowPrev || costState.costMode ? undefined : setValues}
          overlays={[activeView]}
        />
      }
      keyInsight={
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-amber-800">
            <strong>Key insight:</strong> Sensitivity and specificity are properties of the test itself. They do not depend on disease prevalence. Sensitivity depends only on the vertical length and position of the box. Specificity depends only on the horizontal width and position of the box. For example, making the box wider has no effect at all on the sensitivity. You can drag and resize the box to illustrate this.
          </p>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Bold heading */}
        <h2 className="text-xl font-bold text-black">Sensitivity and Specificity</h2>

        {/* Toggle buttons with live values */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveView("sensitivity")}
            className={`flex-1 px-3 py-2 rounded-lg transition-colors text-center ${
              activeView === "sensitivity"
                ? "bg-green-200 text-green-900"
                : "bg-slate-100 text-black hover:bg-slate-200"
            }`}
          >
            <div className="text-sm font-semibold">Sensitivity{sub}</div>
            <div className="text-base font-bold tabular-nums">{formatStat(displayStats.sensitivity)}</div>
          </button>
          <button
            onClick={() => setActiveView("specificity")}
            className={`flex-1 px-3 py-2 rounded-lg transition-colors text-center ${
              activeView === "specificity"
                ? "bg-blue-200 text-blue-900"
                : "bg-slate-100 text-black hover:bg-slate-200"
            }`}
          >
            <div className="text-sm font-semibold">Specificity{sub}</div>
            <div className="text-base font-bold tabular-nums">{formatStat(displayStats.specificity)}</div>
          </button>
        </div>

        {/* Sensitivity section — always visible */}
        <div className={activeView !== "sensitivity" ? "opacity-40 transition-opacity" : "transition-opacity"}>
          <h3 className="text-sm font-bold text-green-700 uppercase tracking-wide mb-1">Sensitivity{sub}</h3>
          <p className="text-base text-black leading-relaxed">
            The proportion of diseased patients who test positive. On the diagram, this is the fraction of the vertical axis (left side of the box) that lies above the origin.
          </p>
          <div className="mt-2 bg-green-50 rounded-lg p-3 space-y-1">
            <div className="text-sm font-mono text-green-800">
              Sensitivity{sub} = <span style={{ color: CELL_COLORS.tp }}>TP{sub}</span> / (<span style={{ color: CELL_COLORS.tp }}>TP{sub}</span> + <span style={{ color: CELL_COLORS.fn }}>FN{sub}</span>)
            </div>
            <div className="text-sm font-mono text-green-800">
              = <span style={{ color: CELL_COLORS.tp }}>{displayValues.tp}</span> / (<span style={{ color: CELL_COLORS.tp }}>{displayValues.tp}</span> + <span style={{ color: CELL_COLORS.fn }}>{displayValues.fn}</span>) = {displayValues.tp} / {displayValues.tp + displayValues.fn}
            </div>
            <div className="text-lg font-bold text-green-700">= {formatStat(displayStats.sensitivity)}</div>
          </div>
        </div>

        {/* Specificity section — always visible */}
        <div className={activeView !== "specificity" ? "opacity-40 transition-opacity" : "transition-opacity"}>
          <h3 className="text-sm font-bold text-blue-700 uppercase tracking-wide mb-1">Specificity{sub}</h3>
          <p className="text-base text-black leading-relaxed">
            The proportion of healthy patients who test negative. On the diagram, this is the fraction of the horizontal axis (bottom of the box) that lies to the right of the origin.
          </p>
          <div className="mt-2 bg-blue-50 rounded-lg p-3 space-y-1">
            <div className="text-sm font-mono text-blue-800">
              Specificity{sub} = <span style={{ color: CELL_COLORS.tn }}>TN{sub}</span> / (<span style={{ color: CELL_COLORS.tn }}>TN{sub}</span> + <span style={{ color: CELL_COLORS.fp }}>FP{sub}</span>)
            </div>
            <div className="text-sm font-mono text-blue-800">
              = <span style={{ color: CELL_COLORS.tn }}>{displayValues.tn}</span> / (<span style={{ color: CELL_COLORS.tn }}>{displayValues.tn}</span> + <span style={{ color: CELL_COLORS.fp }}>{displayValues.fp}</span>) = {displayValues.tn} / {displayValues.tn + displayValues.fp}
            </div>
            <div className="text-lg font-bold text-blue-700">= {formatStat(displayStats.specificity)}</div>
          </div>
        </div>

        {showLowPrev && (
          <div className="bg-slate-50 rounded-lg p-3 text-sm text-black">
            <strong>Notice:</strong> Sensitivity and specificity remain unchanged at 5% prevalence &mdash; only the box shape changes. The predictive values (next lesson) change dramatically.
          </div>
        )}

      </div>
    </LessonLayout>
  );
}
