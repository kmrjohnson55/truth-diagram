import { TruthDiagram } from "../Diagram/TruthDiagram";
import { InputPanel } from "../UI/InputPanel";
import { LessonLayout } from "./LessonLayout";
import { formatStat } from "../../utils/statistics";
import type { CellValues, DiagnosticStats } from "../../utils/statistics";
import type { LessonNavProps } from "./lessonTypes";

interface Lesson2Props extends LessonNavProps {
  values: CellValues;
  stats: DiagnosticStats;
  setValue: (key: keyof CellValues, val: number) => void;
  setValues: (v: CellValues) => void;
}

export function Lesson2_BoxAxes({ values, stats, setValue, setValues, totalLessons, onPrev, onNext, onHome, onGoTo, lessonTitles }: Lesson2Props) {
  const { tp, fp, fn, tn } = values;
  const diseased = tp + fn;
  const healthy = fp + tn;

  const ratio = diseased > 0 && healthy > 0 ? diseased / healthy : 1;
  let shapeDesc: string;
  if (ratio > 1.3) shapeDesc = "tall and narrow (high prevalence)";
  else if (ratio < 0.77) shapeDesc = "short and wide (low prevalence)";
  else shapeDesc = "roughly square (50% prevalence)";

  return (
    <LessonLayout
      meta={{ number: 1, title: "The Box and Axes", subtitle: "How the 2\u00d72 table becomes a diagram" }}
      totalLessons={totalLessons}
      onPrev={onPrev}
      onNext={onNext}
      onHome={onHome}
      onGoTo={onGoTo}
      lessonTitles={lessonTitles}
      diagram={<TruthDiagram values={values} onDrag={setValues} />}
    >
      <div className="space-y-5">
        <div>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">The Coordinate System</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            The truth diagram uses four half-axes radiating from a shared origin, like a + sign. Each axis represents one cell of the 2&times;2 table:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            <li className="flex items-center gap-2"><span className="font-bold text-green-600">&uarr; Up</span> = True Positives (TP)</li>
            <li className="flex items-center gap-2"><span className="font-bold text-red-600">&darr; Down</span> = False Negatives (FN)</li>
            <li className="flex items-center gap-2"><span className="font-bold text-yellow-600">&larr; Left</span> = False Positives (FP)</li>
            <li className="flex items-center gap-2"><span className="font-bold text-blue-600">&rarr; Right</span> = True Negatives (TN)</li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">The Subject Box</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            A rectangle is placed on this coordinate system so that the origin always lies inside the box. The axes divide the box into four quadrants &mdash; one for each cell.
          </p>
          <div className="mt-3 bg-slate-50 rounded-lg p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Vertical side (diseased):</span>
              <span className="font-semibold text-slate-700">TP + FN = {tp} + {fn} = {diseased}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Horizontal side (healthy):</span>
              <span className="font-semibold text-slate-700">FP + TN = {fp} + {tn} = {healthy}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">Box Shape = Prevalence</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            The shape of the box reflects how common the disease is in the study population. A square box means 50% prevalence. A tall, narrow box means high prevalence. A short, wide box means low prevalence.
          </p>
          <div className="mt-3 bg-indigo-50 rounded-lg p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-indigo-600">Current prevalence:</span>
              <span className="font-bold text-indigo-700">{formatStat(stats.prevalence)}</span>
            </div>
            <p className="mt-1 text-xs text-indigo-600">The box is currently {shapeDesc}.</p>
          </div>
        </div>

        <hr className="border-slate-100" />
        <InputPanel values={values} setValue={setValue} setValues={setValues} />

        <div className="text-xs text-slate-600 bg-slate-50 rounded-lg p-3">
          <strong>Try it:</strong> Drag the box to move it around and watch how the four quadrant values change. Drag a corner to resize it and see how the box shape (prevalence) changes. The origin always stays inside.
        </div>
      </div>
    </LessonLayout>
  );
}
