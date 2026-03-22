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
          belowDiagramText={(() => {
            // Scale rectangles proportional to actual areas, fitting within formula space
            const maxArea = Math.max(areaUpper, areaLower, 1);
            const maxW = 70; // max rect width
            const maxH = 26; // max rect height
            // Use sqrt of area ratio so the rectangle "looks" proportional
            const greenScale = Math.sqrt(areaUpper / maxArea);
            const redScale = Math.sqrt(areaLower / maxArea);
            const greenW = Math.max(12, Math.round(maxW * greenScale));
            const greenH = Math.max(8, Math.round(maxH * greenScale));
            const redW = Math.max(12, Math.round(maxW * redScale));
            const redH = Math.max(8, Math.round(maxH * redScale));
            // Center both rects at x=230, fraction line at y=38
            const greenX = 230 - greenW / 2;
            const greenY = 36 - greenH - 2;
            const redX = 230 - redW / 2;
            const redY = 40;
            const areaLabelX = Math.max(greenX + greenW, redX + redW) + 6;
            const fracLineLeft = Math.min(greenX, redX) - 5;
            const fracLineRight = areaLabelX + 28;

            return (
            <div className="mx-auto max-w-lg">
              <svg viewBox="0 0 480 90" className="w-full" style={{ maxHeight: 90 }}>
                <defs>
                  <pattern id="hatch-green" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
                    <line x1="0" y1="0" x2="0" y2="6" stroke="#16a34a" strokeWidth="1.5" strokeOpacity="0.5" />
                  </pattern>
                  <pattern id="hatch-red" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(-45)">
                    <line x1="0" y1="0" x2="0" y2="5" stroke="#dc2626" strokeWidth="2" strokeOpacity="0.6" />
                  </pattern>
                </defs>

                {/* "Odds Ratio =" */}
                <text x="0" y="48" fontSize="14" fontWeight="700" fill="#1e1b4b" fontFamily="Arial">Odds Ratio =</text>

                {/* Text fraction: TP × TN / FP × FN */}
                <text x="130" y="30" fontSize="13" fontWeight="600" fill="#334155" textAnchor="middle" fontFamily="Arial">TP &times; TN</text>
                <line x1="100" y1="38" x2="162" y2="38" stroke="#334155" strokeWidth="1.5" />
                <text x="130" y="55" fontSize="13" fontWeight="600" fill="#334155" textAnchor="middle" fontFamily="Arial">FP &times; FN</text>

                <text x="178" y="48" fontSize="14" fontWeight="700" fill="#1e1b4b" fontFamily="Arial">=</text>

                {/* Dynamic green hatched rectangle — proportional to TP×TN area */}
                <rect x={greenX} y={greenY} width={greenW} height={greenH}
                  fill="url(#hatch-green)" stroke="#16a34a" strokeWidth="1" />
                <text x={areaLabelX} y={greenY + greenH / 2 + 4}
                  fontSize="10" fill="#16a34a" fontWeight="600" fontFamily="Arial">Area</text>

                {/* Fraction line */}
                <line x1={fracLineLeft} y1="38" x2={fracLineRight} y2="38" stroke="#334155" strokeWidth="1.5" />

                {/* Dynamic red hatched rectangle — proportional to FP×FN area */}
                <rect x={redX} y={redY} width={redW} height={redH}
                  fill="url(#hatch-red)" stroke="#dc2626" strokeWidth="1" />
                <text x={areaLabelX} y={redY + redH / 2 + 4}
                  fontSize="10" fill="#dc2626" fontWeight="600" fontFamily="Arial">Area</text>

                {/* "=" */}
                <text x={fracLineRight + 12} y="48" fontSize="14" fontWeight="700" fill="#1e1b4b" fontFamily="Arial">=</text>

                {/* Numeric fraction */}
                <text x={fracLineRight + 60} y="30" fontSize="12" fontWeight="600" fill="#16a34a" textAnchor="middle" fontFamily="Arial">{areaUpper.toLocaleString()}</text>
                <line x1={fracLineRight + 28} y1="38" x2={fracLineRight + 92} y2="38" stroke="#334155" strokeWidth="1.5" />
                <text x={fracLineRight + 60} y="55" fontSize="12" fontWeight="600" fill="#dc2626" textAnchor="middle" fontFamily="Arial">{areaLower.toLocaleString()}</text>

                {/* Final result */}
                <text x={fracLineRight + 102} y="48" fontSize="16" fontWeight="800" fill="#6b21a8" fontFamily="Arial">= {orValue === Infinity ? "\u221E" : orValue.toFixed(1)}</text>
              </svg>
            </div>
            );
          })()}
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

        {/* Text-only formula reference */}
        <div className="bg-purple-50 rounded-lg p-3 text-sm font-mono text-purple-800">
          DOR{sub} = (<span style={{ color: CELL_COLORS.tp }}>TP{sub}</span> &times; <span style={{ color: CELL_COLORS.tn }}>TN{sub}</span>) / (<span style={{ color: CELL_COLORS.fp }}>FP{sub}</span> &times; <span style={{ color: CELL_COLORS.fn }}>FN{sub}</span>) = <span className="font-bold text-purple-700 text-base">{orValue === Infinity ? "\u221E" : orValue.toFixed(1)}</span>
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
