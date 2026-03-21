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
  const [activeView, setActiveView] = useState<"ppv" | "npv">("ppv");
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
  // PPV uses TP and FP (test-positive row); NPV uses TN and FN (test-negative row)
  const dimCells: (keyof CellValues)[] = activeView === "ppv"
    ? ["fn", "tn"]
    : ["tp", "fp"];

  return (
    <LessonLayout
      meta={{ number: 2, title: "Predictive Values", subtitle: "What a test result means for the patient" }}
      totalLessons={totalLessons}
      onPrev={onPrev}
      onNext={onNext}
      onHome={onHome}
      onGoTo={onGoTo}
      lessonTitles={lessonTitles}
      costState={costState}
      values={values}
      diagramFooter={
        !showLowPrev ? <TwoByTwoTable values={values} setValue={setValue} setValues={setValues} costState={costState} dimCells={dimCells} /> : undefined
      }
      diagram={
        <TruthDiagram
          values={displayValues}
          onDrag={showLowPrev || costState.costMode ? undefined : setValues}
          overlays={[activeView]}
          belowDiagramText={
            <label className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer select-none">
              <input type="checkbox" checked={showLowPrev} onChange={(e) => setShowLowPrev(e.target.checked)}
                className="accent-amber-600" />
              <span className="text-sm font-medium text-black">
                Show same test at <strong>5% prevalence</strong> (sens &amp; spec unchanged)
              </span>
            </label>
          }
        />
      }
      keyInsight={
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-amber-800">
            <strong>Key insight:</strong> Unlike sensitivity and specificity, predictive values depend heavily on disease prevalence. The same test with the same sensitivity and specificity will have very different PPV and NPV when applied to populations with different disease rates. A positive result from even an excellent test may mean little if the disease is rare. Toggle the 5% prevalence checkbox to see this dramatically.
          </p>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Bold heading */}
        <h2 className="text-xl font-bold text-black">Positive and Negative Predictive Values</h2>

        {/* Toggle buttons with live values */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveView("ppv")}
            className={`flex-1 px-3 py-2 rounded-lg transition-colors text-center ${
              activeView === "ppv"
                ? "bg-green-200 text-green-900"
                : "bg-slate-100 text-black hover:bg-slate-200"
            }`}
          >
            <div className="text-sm font-semibold">PPV{sub}</div>
            <div className="text-base font-bold tabular-nums">{formatStat(displayStats.ppv)}</div>
          </button>
          <button
            onClick={() => setActiveView("npv")}
            className={`flex-1 px-3 py-2 rounded-lg transition-colors text-center ${
              activeView === "npv"
                ? "bg-blue-200 text-blue-900"
                : "bg-slate-100 text-black hover:bg-slate-200"
            }`}
          >
            <div className="text-sm font-semibold">NPV{sub}</div>
            <div className="text-base font-bold tabular-nums">{formatStat(displayStats.npv)}</div>
          </button>
        </div>

        {/* PPV section — always visible */}
        <div className={activeView !== "ppv" ? "opacity-40 transition-opacity" : "transition-opacity"}>
          <h3 className="text-sm font-bold text-green-700 uppercase tracking-wide mb-1">PPV{sub}</h3>
          <p className="text-base text-black leading-relaxed italic">
            &ldquo;My test was positive &mdash; what is the probability I have the disease?&rdquo;
          </p>
          <p className="text-base text-black leading-relaxed mt-1">
            The proportion of positive test results that are true positives. On the diagram, PPV is the fraction of the test-positive group (upper row) that is <span style={{ color: CELL_COLORS.tp }} className="font-semibold">TP</span> vs <span style={{ color: CELL_COLORS.fp }} className="font-semibold">FP</span>.
          </p>
          <div className="mt-2 bg-green-50 rounded-lg p-3 space-y-1">
            <div className="text-sm font-mono text-green-800">
              PPV{sub} = <span style={{ color: CELL_COLORS.tp }}>TP{sub}</span> / (<span style={{ color: CELL_COLORS.tp }}>TP{sub}</span> + <span style={{ color: CELL_COLORS.fp }}>FP{sub}</span>)
            </div>
            <div className="text-sm font-mono text-green-800">
              = <span style={{ color: CELL_COLORS.tp }}>{displayValues.tp}</span> / (<span style={{ color: CELL_COLORS.tp }}>{displayValues.tp}</span> + <span style={{ color: CELL_COLORS.fp }}>{displayValues.fp}</span>) = {displayValues.tp} / {displayValues.tp + displayValues.fp}
            </div>
            <div className="text-lg font-bold text-green-700">= {formatStat(displayStats.ppv)}</div>
          </div>
        </div>

        {/* NPV section — always visible */}
        <div className={activeView !== "npv" ? "opacity-40 transition-opacity" : "transition-opacity"}>
          <h3 className="text-sm font-bold text-blue-700 uppercase tracking-wide mb-1">NPV{sub}</h3>
          <p className="text-base text-black leading-relaxed italic">
            &ldquo;My test was negative &mdash; what is the probability I am disease-free?&rdquo;
          </p>
          <p className="text-base text-black leading-relaxed mt-1">
            The proportion of negative test results that are true negatives. On the diagram, NPV is the fraction of the test-negative group (lower row) that is <span style={{ color: CELL_COLORS.tn }} className="font-semibold">TN</span> vs <span style={{ color: CELL_COLORS.fn }} className="font-semibold">FN</span>.
          </p>
          <div className="mt-2 bg-blue-50 rounded-lg p-3 space-y-1">
            <div className="text-sm font-mono text-blue-800">
              NPV{sub} = <span style={{ color: CELL_COLORS.tn }}>TN{sub}</span> / (<span style={{ color: CELL_COLORS.tn }}>TN{sub}</span> + <span style={{ color: CELL_COLORS.fn }}>FN{sub}</span>)
            </div>
            <div className="text-sm font-mono text-blue-800">
              = <span style={{ color: CELL_COLORS.tn }}>{displayValues.tn}</span> / (<span style={{ color: CELL_COLORS.tn }}>{displayValues.tn}</span> + <span style={{ color: CELL_COLORS.fn }}>{displayValues.fn}</span>) = {displayValues.tn} / {displayValues.tn + displayValues.fp}
            </div>
            <div className="text-lg font-bold text-blue-700">= {formatStat(displayStats.npv)}</div>
          </div>
        </div>

        {/* Prevalence comparison */}
        {showLowPrev && (
          <div className="bg-slate-50 rounded-lg p-3 space-y-2">
            <h4 className="text-sm font-bold text-black uppercase">Prevalence Comparison</h4>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left p-1 text-black"></th>
                  <th className="text-center p-1 text-black">Original ({formatStat(stats.prevalence)})</th>
                  <th className="text-center p-1 text-black">Low prev (5%)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-1 text-black">Sensitivity</td>
                  <td className="p-1 text-center font-medium">{formatStat(stats.sensitivity)}</td>
                  <td className="p-1 text-center font-medium">{formatStat(lowPrevStats.sensitivity)}</td>
                </tr>
                <tr>
                  <td className="p-1 text-black">Specificity</td>
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
            <p className="text-sm text-black mt-1">
              Sensitivity and specificity stay the same, but PPV drops dramatically at low prevalence. This is why screening healthy populations produces many false alarms.
            </p>
          </div>
        )}

      </div>
    </LessonLayout>
  );
}
