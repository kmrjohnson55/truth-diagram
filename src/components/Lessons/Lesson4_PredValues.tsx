import { useState } from "react";
import { TruthDiagram } from "../Diagram/TruthDiagram";
import { TwoByTwoTable } from "../UI/TwoByTwoTable";
import { LessonLayout } from "./LessonLayout";
import { formatStat, computeStats } from "../../utils/statistics";
import type { CellValues, DiagnosticStats } from "../../utils/statistics";
import type { LessonNavProps } from "./lessonTypes";

interface Lesson4Props extends LessonNavProps {
  values: CellValues;
  stats: DiagnosticStats;
  setValue: (key: keyof CellValues, val: number) => void;
  setValues: (v: CellValues) => void;
}

export function Lesson4_PredValues({ values, stats, setValue, setValues, totalLessons, onPrev, onNext, onHome, onGoTo, lessonTitles }: Lesson4Props) {
  const { tp, fp, fn, tn } = values;
  const testPos = tp + fp;
  const testNeg = fn + tn;

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

  return (
    <LessonLayout
      meta={{ number: 3, title: "Predictive Values", subtitle: "What a test result means for the patient" }}
      totalLessons={totalLessons}
      onPrev={onPrev}
      onNext={onNext}
      onHome={onHome}
      onGoTo={onGoTo}
      lessonTitles={lessonTitles}
      keyInsight={
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
          <p className="text-sm text-amber-800">
            <strong>Key insight:</strong> Unlike sensitivity and specificity, PPV and NPV <strong>depend on prevalence</strong>. The same test with the same accuracy will have very different predictive values depending on how common the disease is.
          </p>
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="mt-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-200 text-amber-800 hover:bg-amber-300 transition-colors"
          >
            {showComparison ? "Show original values" : "Show same test at 5% prevalence"}
          </button>
        </div>
      }
      values={values}
      diagramFooter={!showComparison ? <TwoByTwoTable values={values} setValue={setValue} setValues={setValues} /> : undefined}
      diagram={
        <TruthDiagram
          values={showComparison ? lowPrevValues : values}
          onDrag={showComparison ? undefined : setValues}
          overlays={[activeView]}
          belowDiagramText={
            <>
              <strong>Try it:</strong> Use the &quot;Low Prevalence Screening&quot; preset to see how PPV drops
              even with a good test. Compare with &quot;PSA (Case-Control)&quot; for higher prevalence.
            </>
          }
        />
      }
    >
      <div className="space-y-5">
        {/* Toggle buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveView("ppv")}
            className={`flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeView === "ppv"
                ? "bg-green-500 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            PPV
          </button>
          <button
            onClick={() => setActiveView("npv")}
            className={`flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeView === "npv"
                ? "bg-blue-500 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            NPV
          </button>
        </div>

        <div className={activeView !== "ppv" ? "opacity-30 transition-opacity" : "transition-opacity"}>
          <h3 className="text-sm font-bold text-green-700 uppercase tracking-wide mb-2">Positive Predictive Value (PPV)</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            If a patient tests positive, what is the probability they actually have the disease? PPV answers this question.
          </p>
          <div className="mt-3 bg-green-50 rounded-lg p-3 space-y-2">
            <div className="text-sm font-mono text-green-800">PPV = TP / (TP + FP)</div>
            <div className="text-sm font-mono text-green-800">= {tp} / ({tp} + {fp}) = {tp} / {testPos}</div>
            <div className="text-lg font-bold text-green-700">= {formatStat(stats.ppv)}</div>
          </div>
          <p className="mt-2 text-xs text-slate-600">
            On the diagram, the <span style={{color:"#22c55e"}} className="font-semibold">green TP hemiaxis</span> (up) and the <span style={{color:"#eab308"}} className="font-semibold">yellow FP hemiaxis</span> (left) are highlighted. PPV is the green fraction of their combined length.
          </p>
        </div>

        <div className={activeView !== "npv" ? "opacity-30 transition-opacity" : "transition-opacity"}>
          <h3 className="text-sm font-bold text-blue-700 uppercase tracking-wide mb-2">Negative Predictive Value (NPV)</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            If a patient tests negative, what is the probability they are truly healthy? NPV answers this question.
          </p>
          <div className="mt-3 bg-blue-50 rounded-lg p-3 space-y-2">
            <div className="text-sm font-mono text-blue-800">NPV = TN / (TN + FN)</div>
            <div className="text-sm font-mono text-blue-800">= {tn} / ({tn} + {fn}) = {tn} / {testNeg}</div>
            <div className="text-lg font-bold text-blue-700">= {formatStat(stats.npv)}</div>
          </div>
          <p className="mt-2 text-xs text-slate-600">
            On the diagram, the <span style={{color:"#3b82f6"}} className="font-semibold">blue TN hemiaxis</span> (right) and the <span style={{color:"#ef4444"}} className="font-semibold">red FN hemiaxis</span> (down) are highlighted. NPV is the blue fraction of their combined length.
          </p>
        </div>

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
                  <td className="p-1 text-center font-bold text-green-700">{formatStat(lowPrevStats.ppv)}</td>
                </tr>
                <tr className="bg-amber-50">
                  <td className="p-1 text-blue-700 font-semibold">NPV</td>
                  <td className="p-1 text-center font-bold text-blue-700">{formatStat(stats.npv)}</td>
                  <td className="p-1 text-center font-bold text-blue-700">{formatStat(lowPrevStats.npv)}</td>
                </tr>
              </tbody>
            </table>
            <p className="text-xs text-slate-600 mt-1">
              Notice: sensitivity and specificity stay the same, but PPV drops dramatically at low prevalence. This is why screening healthy populations produces many false alarms.
            </p>
          </div>
        )}


      </div>
    </LessonLayout>
  );
}
