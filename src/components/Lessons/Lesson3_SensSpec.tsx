import { useState } from "react";
import { TruthDiagram } from "../Diagram/TruthDiagram";
import { InputPanel } from "../UI/InputPanel";
import { LessonLayout } from "./LessonLayout";
import { formatStat } from "../../utils/statistics";
import type { CellValues, DiagnosticStats } from "../../utils/statistics";
import type { LessonNavProps } from "./lessonTypes";

interface Lesson3Props extends LessonNavProps {
  values: CellValues;
  stats: DiagnosticStats;
  setValue: (key: keyof CellValues, val: number) => void;
  setValues: (v: CellValues) => void;
}

export function Lesson3_SensSpec({ values, stats, setValue, setValues, totalLessons, onPrev, onNext, onHome, onGoTo, lessonTitles }: Lesson3Props) {
  const { tp, fp, fn, tn } = values;
  const diseased = tp + fn;
  const healthy = fp + tn;

  const [activeView, setActiveView] = useState<"sensitivity" | "specificity">("sensitivity");

  return (
    <LessonLayout
      meta={{ number: 2, title: "Sensitivity & Specificity", subtitle: "How well does the test detect disease and health?" }}
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
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-amber-800">
            <strong>Key insight:</strong> Sensitivity and specificity are properties of the <em>test itself</em>. They describe what the test does to diseased and healthy patients respectively. They do <strong>not</strong> depend on how common the disease is (prevalence).
          </p>
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
            <div className="text-sm font-mono text-green-800">= {tp} / ({tp} + {fn}) = {tp} / {diseased}</div>
            <div className="text-lg font-bold text-green-700">= {formatStat(stats.sensitivity)}</div>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            On the diagram, the <span style={{color:"#22c55e"}} className="font-semibold">green TP hemiaxis</span> (up) and the <span style={{color:"#ef4444"}} className="font-semibold">red FN hemiaxis</span> (down) are highlighted. Sensitivity is the green fraction of their combined length.
          </p>
        </div>

        {/* Specificity section */}
        <div className={activeView !== "specificity" ? "opacity-30 transition-opacity" : "transition-opacity"}>
          <h3 className="text-sm font-bold text-blue-700 uppercase tracking-wide mb-2">Specificity</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Specificity measures how well the test identifies healthy patients. It is the proportion of healthy patients who test negative.
          </p>
          <div className="mt-3 bg-blue-50 rounded-lg p-3 space-y-2">
            <div className="text-sm font-mono text-blue-800">Specificity = TN / (TN + FP)</div>
            <div className="text-sm font-mono text-blue-800">= {tn} / ({tn} + {fp}) = {tn} / {healthy}</div>
            <div className="text-lg font-bold text-blue-700">= {formatStat(stats.specificity)}</div>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            On the diagram, the <span style={{color:"#3b82f6"}} className="font-semibold">blue TN hemiaxis</span> (right) and the <span style={{color:"#eab308"}} className="font-semibold">yellow FP hemiaxis</span> (left) are highlighted. Specificity is the blue fraction of their combined length.
          </p>
        </div>

        <hr className="border-slate-100" />
        <InputPanel values={values} setValue={setValue} setValues={setValues} />
      </div>
    </LessonLayout>
  );
}
