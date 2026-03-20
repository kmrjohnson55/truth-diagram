import { useState } from "react";
import { TruthDiagram } from "../Diagram/TruthDiagram";
import { TwoByTwoTable } from "../UI/TwoByTwoTable";
import { LessonLayout } from "./LessonLayout";
import { CELL_COLORS } from "../../utils/colors";
import { formatStat, computeStats } from "../../utils/statistics";
import type { CellValues, DiagnosticStats } from "../../utils/statistics";
import type { LessonNavProps } from "./lessonTypes";

interface Lesson4Props extends LessonNavProps {
  values: CellValues;
  stats: DiagnosticStats;
  setValue: (key: keyof CellValues, val: number) => void;
  setValues: (v: CellValues) => void;
}

export function Lesson4_PredValues({ values, stats, setValue, setValues, totalLessons, onPrev, onNext, onHome, onGoTo, lessonTitles, costState }: Lesson4Props) {
  const [showComparison, setShowComparison] = useState(false);
  const [activeView, setActiveView] = useState<"ppv" | "npv">("ppv");

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

  const displayValues = showComparison ? lowPrevValues : values;
  const displayStats = showComparison ? lowPrevStats : stats;

  const sub = costState.costMode ? <sub className="text-[9px] text-orange-500">cost</sub> : null;
  const dTp = displayValues.tp;
  const dFp = displayValues.fp;
  const dFn = displayValues.fn;
  const dTn = displayValues.tn;

  return (
    <LessonLayout
      meta={{ number: 3, title: "Predictive Values", subtitle: "What a test result means for the patient" }}
      totalLessons={totalLessons}
      onPrev={onPrev}
      onNext={onNext}
      onHome={onHome}
      onGoTo={onGoTo}
      lessonTitles={lessonTitles}
      costState={costState}
      keyInsight={
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-amber-800">
            <strong>Key insight:</strong> Unlike sensitivity and specificity, PPV and NPV <strong>depend heavily on prevalence</strong>. The same test accuracy produces very different predictive values depending on how common the disease is.
          </p>
        </div>
      }
      values={values}
      diagramFooter={
        <div className="space-y-3">
          {!showComparison && <TwoByTwoTable values={values} setValue={setValue} setValues={setValues} costState={costState} />}
          <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer select-none">
            <input type="checkbox" checked={showComparison} onChange={(e) => setShowComparison(e.target.checked)}
              className="accent-amber-600" />
            <span className="text-xs font-medium text-slate-700">
              Show same test at <strong>5% prevalence</strong> (sens &amp; spec unchanged)
            </span>
          </label>
        </div>
      }
      diagram={
        <TruthDiagram
          values={displayValues}
          onDrag={showComparison || costState.costMode ? undefined : setValues}
          overlays={[activeView]}
          belowDiagramText={
            <span className="text-xs">
              PPV and NPV change as you drag &mdash; try different presets to see the prevalence effect.
            </span>
          }
        />
      }
    >
      <div className="space-y-4">
        {/* Toggle buttons with live values */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveView("ppv")}
            className={`flex-1 px-3 py-2 rounded-lg transition-colors text-center ${
              activeView === "ppv"
                ? "bg-green-500 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <div className="text-xs font-semibold">PPV{sub}</div>
            <div className="text-sm font-bold tabular-nums">{formatStat(displayStats.ppv)}</div>
          </button>
          <button
            onClick={() => setActiveView("npv")}
            className={`flex-1 px-3 py-2 rounded-lg transition-colors text-center ${
              activeView === "npv"
                ? "bg-blue-500 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <div className="text-xs font-semibold">NPV{sub}</div>
            <div className="text-sm font-bold tabular-nums">{formatStat(displayStats.npv)}</div>
          </button>
        </div>

        {/* Prevalence hint */}
        <p className="text-xs text-slate-400 text-center -mt-2">
          &uarr; Prevalence &rarr; &uarr; PPV, &darr; NPV
        </p>

        {/* PPV section — always visible */}
        <div className={activeView !== "ppv" ? "opacity-40 transition-opacity" : "transition-opacity"}>
          <h3 className="text-sm font-bold text-green-700 uppercase tracking-wide mb-1">PPV{sub}</h3>
          <p className="text-xs text-slate-600 leading-relaxed italic">
            &ldquo;My test was positive &mdash; do I really have the disease?&rdquo;
          </p>
          <p className="text-xs text-slate-600 leading-relaxed mt-1">
            The proportion of positive results that are true positives. On the diagram, PPV is the fraction of the upper + left edges (test-positive group) that is <span style={{ color: CELL_COLORS.tp }} className="font-semibold">green (TP)</span> vs <span style={{ color: CELL_COLORS.fp }} className="font-semibold">yellow (FP)</span>.
          </p>
          <div className="mt-2 bg-green-50 rounded-lg p-3 space-y-1">
            <div className="text-sm font-mono text-green-800">
              PPV{sub} = <span style={{ color: CELL_COLORS.tp }}>TP{sub}</span> / (<span style={{ color: CELL_COLORS.tp }}>TP{sub}</span> + <span style={{ color: CELL_COLORS.fp }}>FP{sub}</span>)
            </div>
            <div className="text-sm font-mono text-green-800">
              = <span style={{ color: CELL_COLORS.tp }}>{dTp}</span> / (<span style={{ color: CELL_COLORS.tp }}>{dTp}</span> + <span style={{ color: CELL_COLORS.fp }}>{dFp}</span>) = {dTp} / {dTp + dFp}
            </div>
            <div className="text-lg font-bold text-green-700">= {formatStat(displayStats.ppv)}</div>
          </div>
        </div>

        {/* NPV section — always visible */}
        <div className={activeView !== "npv" ? "opacity-40 transition-opacity" : "transition-opacity"}>
          <h3 className="text-sm font-bold text-blue-700 uppercase tracking-wide mb-1">NPV{sub}</h3>
          <p className="text-xs text-slate-600 leading-relaxed italic">
            &ldquo;My test was negative &mdash; can I be sure I&rsquo;m healthy?&rdquo;
          </p>
          <p className="text-xs text-slate-600 leading-relaxed mt-1">
            The proportion of negative results that are true negatives. On the diagram, NPV is the fraction of the lower + right edges (test-negative group) that is <span style={{ color: CELL_COLORS.tn }} className="font-semibold">blue (TN)</span> vs <span style={{ color: CELL_COLORS.fn }} className="font-semibold">red (FN)</span>.
          </p>
          <div className="mt-2 bg-blue-50 rounded-lg p-3 space-y-1">
            <div className="text-sm font-mono text-blue-800">
              NPV{sub} = <span style={{ color: CELL_COLORS.tn }}>TN{sub}</span> / (<span style={{ color: CELL_COLORS.tn }}>TN{sub}</span> + <span style={{ color: CELL_COLORS.fn }}>FN{sub}</span>)
            </div>
            <div className="text-sm font-mono text-blue-800">
              = <span style={{ color: CELL_COLORS.tn }}>{dTn}</span> / (<span style={{ color: CELL_COLORS.tn }}>{dTn}</span> + <span style={{ color: CELL_COLORS.fn }}>{dFn}</span>) = {dTn} / {dTn + dFn}
            </div>
            <div className="text-lg font-bold text-blue-700">= {formatStat(displayStats.npv)}</div>
          </div>
        </div>

        {/* Prevalence comparison table */}
        {showComparison && (
          <div className="bg-slate-50 rounded-lg p-3 space-y-2">
            <h4 className="text-xs font-bold text-slate-600 uppercase">Prevalence Comparison</h4>
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left p-1 text-slate-600"></th>
                  <th className="text-center p-1 text-slate-600">Original ({formatStat(stats.prevalence)})</th>
                  <th className="text-center p-1 text-slate-600">Low prev (5%)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-1 text-slate-600">Sensitivity</td>
                  <td className="p-1 text-center font-medium">{formatStat(stats.sensitivity)}</td>
                  <td className="p-1 text-center font-medium">{formatStat(lowPrevStats.sensitivity)}</td>
                </tr>
                <tr>
                  <td className="p-1 text-slate-600">Specificity</td>
                  <td className="p-1 text-center font-medium">{formatStat(stats.specificity)}</td>
                  <td className="p-1 text-center font-medium">{formatStat(lowPrevStats.specificity)}</td>
                </tr>
                <tr className="bg-amber-50">
                  <td className="p-1 text-green-700 font-semibold">PPV</td>
                  <td className="p-1 text-center font-bold text-green-700">{formatStat(stats.ppv)}</td>
                  <td className="p-1 text-center font-bold" style={{ color: lowPrevStats.ppv < stats.ppv * 0.8 ? "#dc2626" : CELL_COLORS.tp }}>
                    {formatStat(lowPrevStats.ppv)}
                    {lowPrevStats.ppv < stats.ppv * 0.8 && <span className="ml-1 text-red-500">&darr;</span>}
                  </td>
                </tr>
                <tr className="bg-amber-50">
                  <td className="p-1 text-blue-700 font-semibold">NPV</td>
                  <td className="p-1 text-center font-bold text-blue-700">{formatStat(stats.npv)}</td>
                  <td className="p-1 text-center font-bold" style={{ color: lowPrevStats.npv > stats.npv * 1.05 ? "#16a34a" : CELL_COLORS.tn }}>
                    {formatStat(lowPrevStats.npv)}
                    {lowPrevStats.npv > stats.npv * 1.05 && <span className="ml-1 text-green-500">&uarr;</span>}
                  </td>
                </tr>
              </tbody>
            </table>
            <p className="text-xs text-slate-600 mt-1">
              Sensitivity and specificity stay the same, but PPV drops dramatically at low prevalence. This is why screening healthy populations produces many false alarms.
            </p>
          </div>
        )}

      </div>
    </LessonLayout>
  );
}
