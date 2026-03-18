import { useState } from "react";
import { TruthDiagram } from "../Diagram/TruthDiagram";
import { TwoByTwoTable } from "../UI/TwoByTwoTable";
import { LessonLayout } from "./LessonLayout";
import { formatStat, computeStats } from "../../utils/statistics";
import type { CellValues, DiagnosticStats } from "../../utils/statistics";
import type { LessonNavProps } from "./lessonTypes";

interface Lesson3Props extends LessonNavProps {
  values: CellValues;
  stats: DiagnosticStats;
  setValue: (key: keyof CellValues, val: number) => void;
  setValues: (v: CellValues) => void;
}

export function Lesson3_SensSpec({ values, stats, setValue, setValues, totalLessons, onPrev, onNext, onHome, onGoTo, lessonTitles }: Lesson3Props) {
  const { tp: _tp, fp: _fp, fn: _fn, tn: _tn } = values;

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

  return (
    <LessonLayout
      meta={{ number: 2, title: "Sensitivity & Specificity", subtitle: "How well does the test detect disease and health?" }}
      totalLessons={totalLessons}
      onPrev={onPrev}
      onNext={onNext}
      onHome={onHome}
      onGoTo={onGoTo}
      lessonTitles={lessonTitles}
      values={values}
      diagramFooter={!showLowPrev ? <TwoByTwoTable values={values} setValue={setValue} setValues={setValues} /> : undefined}
      diagram={
        <TruthDiagram
          values={displayValues}
          onDrag={showLowPrev ? undefined : setValues}
          overlays={[activeView]}
          belowDiagramText={
            <>
              <strong>Try it:</strong> Drag the box up to increase sensitivity (more TP, fewer FN).
              Drag it right to increase specificity (more TN, fewer FP).
              Notice how improving one tends to worsen the other.
            </>
          }
        />
      }
      keyInsight={
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
          <p className="text-sm text-amber-800">
            <strong>Key insight:</strong> Sensitivity and specificity are properties of the <em>test itself</em>. They describe how the test performs in diseased and healthy patients respectively. They do <strong>not</strong> depend on how common the disease is (prevalence).
          </p>
          <button
            onClick={() => setShowLowPrev(!showLowPrev)}
            className="mt-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-200 text-amber-800 hover:bg-amber-300 transition-colors"
          >
            {showLowPrev ? "Show original values" : "Show same test at 5% prevalence"}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Toggle buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveView("sensitivity")}
            className={`flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeView === "sensitivity"
                ? "bg-green-500 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Sensitivity
          </button>
          <button
            onClick={() => setActiveView("specificity")}
            className={`flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeView === "specificity"
                ? "bg-blue-500 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Specificity
          </button>
        </div>

        {/* Sensitivity section */}
        <div className={activeView !== "sensitivity" ? "opacity-30 transition-opacity" : "transition-opacity"}>
          <h3 className="text-sm font-bold text-green-700 uppercase tracking-wide mb-2">Sensitivity</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Sensitivity measures how well the test detects disease. It is the proportion of diseased patients who test positive.
          </p>
          <div className="mt-3 bg-green-50 rounded-lg p-3 space-y-2">
            <div className="text-sm font-mono text-green-800">Sensitivity = TP / (TP + FN)</div>
            <div className="text-sm font-mono text-green-800">= {displayValues.tp} / ({displayValues.tp} + {displayValues.fn}) = {displayValues.tp} / {displayValues.tp + displayValues.fn}</div>
            <div className="text-lg font-bold text-green-700">= {formatStat(displayStats.sensitivity)}</div>
          </div>
        </div>

        {/* Specificity section */}
        <div className={activeView !== "specificity" ? "opacity-30 transition-opacity" : "transition-opacity"}>
          <h3 className="text-sm font-bold text-blue-700 uppercase tracking-wide mb-2">Specificity</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Specificity measures how well the test identifies healthy patients. It is the proportion of healthy patients who test negative.
          </p>
          <div className="mt-3 bg-blue-50 rounded-lg p-3 space-y-2">
            <div className="text-sm font-mono text-blue-800">Specificity = TN / (TN + FP)</div>
            <div className="text-sm font-mono text-blue-800">= {displayValues.tn} / ({displayValues.tn} + {displayValues.fp}) = {displayValues.tn} / {displayValues.tn + displayValues.fp}</div>
            <div className="text-lg font-bold text-blue-700">= {formatStat(displayStats.specificity)}</div>
          </div>
        </div>

        {showLowPrev && (
          <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600">
            <strong>Notice:</strong> Sensitivity and specificity remain unchanged at 5% prevalence &mdash; only the box shape changes. The predictive values (see next lesson) change dramatically.
          </div>
        )}

      </div>
    </LessonLayout>
  );
}
