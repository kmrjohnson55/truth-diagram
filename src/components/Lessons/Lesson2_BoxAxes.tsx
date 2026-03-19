import { TruthDiagram } from "../Diagram/TruthDiagram";
import { TwoByTwoTable } from "../UI/TwoByTwoTable";
import { LessonLayout } from "./LessonLayout";
import { CELL_COLORS } from "../../utils/colors";
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
  let shapeIcon: string;
  let shapeDesc: string;
  if (ratio > 1.3) { shapeIcon = "▮"; shapeDesc = "tall and narrow — high prevalence"; }
  else if (ratio < 0.77) { shapeIcon = "▬"; shapeDesc = "short and wide — low prevalence"; }
  else { shapeIcon = "■"; shapeDesc = "roughly square — ~50% prevalence"; }

  return (
    <LessonLayout
      meta={{ number: 1, title: "The Box and Axes", subtitle: "How the 2\u00d72 table becomes a diagram" }}
      totalLessons={totalLessons}
      onPrev={onPrev}
      onNext={onNext}
      onHome={onHome}
      onGoTo={onGoTo}
      lessonTitles={lessonTitles}
      values={values}
      diagramFooter={<TwoByTwoTable values={values} setValue={setValue} setValues={setValues} />}
      keyInsight={
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-amber-800">
            <strong>Key insight:</strong> The origin is the key &mdash; its position
            inside the box determines all four cell values at once. Moving the box
            changes every cell simultaneously.
          </p>
        </div>
      }
      diagram={
        <TruthDiagram
          values={values}
          onDrag={setValues}
          belowDiagramText={
            <>
              <strong>Try it:</strong> Drag the box to move it and watch the four values change.
              Drag a corner to resize and see how prevalence changes.
            </>
          }
        />
      }
    >
      <div className="space-y-5">
        {/* ── Live 2×2 mini-table with current values ── */}
        <div>
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
            Axes &harr; 2&times;2 Table
          </h3>
          <div className="rounded-lg border border-slate-200 overflow-hidden text-xs">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  <th className="p-2 text-slate-500 font-medium"></th>
                  <th className="p-2 text-center font-semibold text-amber-700 border-l border-slate-200">With disease</th>
                  <th className="p-2 text-center font-semibold text-amber-700 border-l border-slate-200">Without disease</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-slate-200">
                  <td className="p-2 font-semibold text-slate-500">Test +</td>
                  <td className="p-2 text-center border-l border-slate-200">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-green-700 bg-green-50">
                      &uarr; TP = {tp}
                    </span>
                  </td>
                  <td className="p-2 text-center border-l border-slate-200">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-yellow-700 bg-yellow-50">
                      &larr; FP = {fp}
                    </span>
                  </td>
                </tr>
                <tr className="border-t border-slate-200">
                  <td className="p-2 font-semibold text-slate-500">Test &minus;</td>
                  <td className="p-2 text-center border-l border-slate-200">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-red-700 bg-red-50">
                      &darr; FN = {fn}
                    </span>
                  </td>
                  <td className="p-2 text-center border-l border-slate-200">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-blue-700 bg-blue-50">
                      &rarr; TN = {tn}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            Drag the box and watch these values update live.
          </p>
        </div>

        {/* ── The Subject Box ── */}
        <div>
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">The Subject Box</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            The rectangle sits on the coordinate system with the origin always inside it.
            Because the origin is always inside, every cell value is always &ge; 0.
          </p>
          <div className="mt-3 bg-slate-50 rounded-lg p-3 space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Vertical side:</span>
              <span className="font-semibold">
                <span style={{ color: CELL_COLORS.tp }}>TP</span>
                {" + "}
                <span style={{ color: CELL_COLORS.fn }}>FN</span>
                {" = "}
                <span style={{ color: CELL_COLORS.tp }}>{tp}</span>
                {" + "}
                <span style={{ color: CELL_COLORS.fn }}>{fn}</span>
                {" = "}
                <span className="text-slate-700">{diseased}</span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Horizontal side:</span>
              <span className="font-semibold">
                <span style={{ color: CELL_COLORS.fp }}>FP</span>
                {" + "}
                <span style={{ color: CELL_COLORS.tn }}>TN</span>
                {" = "}
                <span style={{ color: CELL_COLORS.fp }}>{fp}</span>
                {" + "}
                <span style={{ color: CELL_COLORS.tn }}>{tn}</span>
                {" = "}
                <span className="text-slate-700">{healthy}</span>
              </span>
            </div>
          </div>
        </div>

        {/* ── Box Shape = Prevalence ── */}
        <div>
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Box Shape = Prevalence</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            The ratio of vertical to horizontal side reflects how common
            the disease is. Drag a corner to change the box shape.
          </p>
          {/* Shape icons */}
          <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <span className="text-base leading-none">▮</span> High prev.
            </div>
            <div className="flex items-center gap-1">
              <span className="text-base leading-none">■</span> ~50%
            </div>
            <div className="flex items-center gap-1">
              <span className="text-base leading-none">▬</span> Low prev.
            </div>
          </div>
          <div className="mt-3 bg-indigo-50 rounded-lg p-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-indigo-600">Current prevalence:</span>
              <span className="font-bold text-indigo-700">{formatStat(stats.prevalence)}</span>
            </div>
            <p className="mt-1 text-xs text-indigo-600 font-medium">
              <span className="text-base leading-none mr-1">{shapeIcon}</span>
              {shapeDesc}
            </p>
          </div>
        </div>

      </div>
    </LessonLayout>
  );
}
