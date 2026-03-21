import { TruthDiagram } from "../Diagram/TruthDiagram";
import { TwoByTwoTable } from "../UI/TwoByTwoTable";
import { LessonLayout } from "./LessonLayout";
import { CELL_COLORS } from "../../utils/colors";
import type { CellValues, DiagnosticStats } from "../../utils/statistics";
import type { LessonNavProps } from "./lessonTypes";

interface LessonORProps extends LessonNavProps {
  values: CellValues;
  stats: DiagnosticStats;
  setValue: (key: keyof CellValues, val: number) => void;
  setValues: (v: CellValues) => void;
}

export function LessonOddsRatio({ values, stats, setValue, setValues, totalLessons, onPrev, onNext, onHome, onGoTo, lessonTitles, costState, testToggle }: LessonORProps) {
  const sub = costState.costMode ? <sub className="text-[9px] text-orange-500">cost</sub> : null;

  const { tp, fp, fn, tn } = values;
  const orValue = fp * fn > 0 ? (tp * tn) / (fp * fn) : Infinity;
  const areaUpper = tp * tn;
  const areaLower = fp * fn;

  return (
    <LessonLayout
      meta={{ number: 3, title: "Diagnostic Odds Ratio", subtitle: "A single number summarizing overall test discrimination" }}
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
        <TwoByTwoTable values={values} setValue={setValue} setValues={setValues} costState={costState} />
      }
      diagram={
        <TruthDiagram
          values={values}
          onDrag={costState.costMode ? undefined : setValues}
          renderExtraSvg={(layout) => {
            const { centerX: cx, centerY: cy, scale: s } = layout;
            // Highlight the two area rectangles: upper-right (TP×TN) and lower-left (FP×FN)
            const tpH = tp * s;
            const fpW = fp * s;
            const fnH = fn * s;
            const tnW = tn * s;

            return (
              <g>
                {/* Upper-right area: TP × TN (correct results) */}
                <rect
                  x={cx} y={cy - tpH}
                  width={tnW} height={tpH}
                  fill="#16a34a" fillOpacity={0.12}
                  stroke="#16a34a" strokeWidth={1.5} strokeDasharray="4,3"
                />
                {tpH > 10 && tnW > 30 && (
                  <text x={cx + tnW / 2} y={cy - tpH / 2} textAnchor="middle" dominantBaseline="middle"
                    fontSize={11} fontWeight={600} fill="#16a34a" style={{ userSelect: "none" }}>
                    TP&times;TN
                  </text>
                )}
                {/* Lower-left area: FP × FN (incorrect results) */}
                <rect
                  x={cx - fpW} y={cy}
                  width={fpW} height={fnH}
                  fill="#dc2626" fillOpacity={0.12}
                  stroke="#dc2626" strokeWidth={1.5} strokeDasharray="4,3"
                />
                {fnH > 10 && fpW > 30 && (
                  <text x={cx - fpW / 2} y={cy + fnH / 2} textAnchor="middle" dominantBaseline="middle"
                    fontSize={11} fontWeight={600} fill="#dc2626" style={{ userSelect: "none" }}>
                    FP&times;FN
                  </text>
                )}
              </g>
            );
          }}
        />
      }
      keyInsight={
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-amber-800">
            <strong>Key insight:</strong> The diagnostic odds ratio is a single number that summarizes overall test discrimination, but it has an important limitation: a given odds ratio does not define a unique truth diagram. Two tests with very different sensitivity and specificity can yield the same odds ratio. Therefore, odds ratios should be used with caution and always in conjunction with other measures.
          </p>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Bold heading */}
        <h2 className="text-xl font-bold text-black">Diagnostic Odds Ratio</h2>

        <p className="text-base text-black leading-relaxed">
          The diagnostic odds ratio (DOR) is the ratio of the odds of a correct test result to the odds of an incorrect test result. On the truth diagram, it equals the ratio of two rectangular areas: the <span className="font-semibold" style={{ color: "#16a34a" }}>upper-right area</span> (TP &times; TN) divided by the <span className="font-semibold" style={{ color: "#dc2626" }}>lower-left area</span> (FP &times; FN).
        </p>

        <p className="text-base text-black leading-relaxed">
          As the box moves into the upper-right quadrant (a better test), the green area grows and the red area shrinks, so the odds ratio increases. A perfect test has an infinite odds ratio. The odds ratio also equals the positive likelihood ratio divided by the negative likelihood ratio (+LR / &minus;LR).
        </p>

        {/* Area interpretation */}
        <div className="bg-slate-50 rounded-lg p-3 space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-black">
              <span className="inline-block w-3 h-3 rounded mr-1.5" style={{ backgroundColor: "#16a34a", opacity: 0.3 }}></span>
              Upper-right area (TP &times; TN):
            </span>
            <span className="font-bold" style={{ color: "#16a34a" }}>{areaUpper.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-black">
              <span className="inline-block w-3 h-3 rounded mr-1.5" style={{ backgroundColor: "#dc2626", opacity: 0.3 }}></span>
              Lower-left area (FP &times; FN):
            </span>
            <span className="font-bold" style={{ color: "#dc2626" }}>{areaLower.toLocaleString()}</span>
          </div>
        </div>

        {/* Formula */}
        <div className="bg-purple-50 rounded-lg p-4 space-y-2">
          <div className="text-sm font-mono text-purple-800">
            DOR{sub} = (<span style={{ color: CELL_COLORS.tp }}>TP{sub}</span> &times; <span style={{ color: CELL_COLORS.tn }}>TN{sub}</span>) / (<span style={{ color: CELL_COLORS.fp }}>FP{sub}</span> &times; <span style={{ color: CELL_COLORS.fn }}>FN{sub}</span>)
          </div>
          <div className="text-sm font-mono text-purple-800">
            = (<span style={{ color: CELL_COLORS.tp }}>{tp}</span> &times; <span style={{ color: CELL_COLORS.tn }}>{tn}</span>) / (<span style={{ color: CELL_COLORS.fp }}>{fp}</span> &times; <span style={{ color: CELL_COLORS.fn }}>{fn}</span>)
          </div>
          <div className="text-sm font-mono text-purple-800">
            = <span style={{ color: "#16a34a" }}>{areaUpper.toLocaleString()}</span> / <span style={{ color: "#dc2626" }}>{areaLower.toLocaleString()}</span>
          </div>
          <div className="text-lg font-bold text-purple-700">
            = {orValue === Infinity ? "\u221E" : orValue.toFixed(1)}
          </div>
        </div>

        {/* Equivalence to LR */}
        <div className="bg-indigo-50 rounded-lg p-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-indigo-700">Also equals +LR / &minus;LR:</span>
            <span className="font-bold text-indigo-700">
              {stats.positiveLR.toFixed(2)} / {stats.negativeLR.toFixed(2)} = {orValue === Infinity ? "\u221E" : orValue.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Caution */}
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-sm text-black">
            <strong>Caution:</strong> Two tests with very different sensitivity/specificity combinations can yield the same odds ratio. A high DOR does not guarantee that the test is clinically useful &mdash; always consider sensitivity and specificity individually. Drag the box to see how different positions can produce similar odds ratios.
          </p>
        </div>
      </div>
    </LessonLayout>
  );
}
