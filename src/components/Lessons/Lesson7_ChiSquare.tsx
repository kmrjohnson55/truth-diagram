import { useMemo } from "react";
import { LessonLayout } from "./LessonLayout";
import { TruthDiagram } from "../Diagram/TruthDiagram";
import { InputPanel } from "../UI/InputPanel";
import {
  computeExpectedValues,
  computeChiSquare,
  chiSquarePValue,
  formatRatio,
} from "../../utils/statistics";
import { toSvg } from "../../utils/geometry";
import type { CellValues, DiagnosticStats, ExpectedValues } from "../../utils/statistics";
import type { LessonNavProps } from "./lessonTypes";

interface Lesson7Props extends LessonNavProps {
  values: CellValues;
  stats: DiagnosticStats;
  setValue: (key: keyof CellValues, val: number) => void;
  setValues: (v: CellValues) => void;
}

/* ─── Ghost box overlay showing expected values ─── */

function GhostExpectedBox({
  expected,
  centerX,
  centerY,
  scale,
}: {
  expected: ExpectedValues;
  centerX: number;
  centerY: number;
  scale: number;
}) {
  const ul = toSvg(-expected.fp, expected.tp, centerX, centerY, scale);
  const ur = toSvg(expected.tn, expected.tp, centerX, centerY, scale);
  const ll = toSvg(-expected.fp, -expected.fn, centerX, centerY, scale);
  const lr = toSvg(expected.tn, -expected.fn, centerX, centerY, scale);

  const pathD = `M${ul.x},${ul.y} L${ur.x},${ur.y} L${lr.x},${lr.y} L${ll.x},${ll.y} Z`;

  return (
    <g className="ghost-expected">
      <path
        d={pathD}
        fill="none"
        stroke="#94a3b8"
        strokeWidth={2}
        strokeDasharray="8 4"
        opacity={0.6}
      />
      {/* Label */}
      <text
        x={ur.x + 4}
        y={ur.y - 6}
        fontSize={10}
        fill="#94a3b8"
        fontWeight={500}
      >
        Expected
      </text>
    </g>
  );
}

/* ─── Main lesson component ─── */

export function Lesson7_ChiSquare({
  values,
  stats,
  setValue,
  setValues,
  totalLessons,
  onPrev,
  onNext,
  onHome,
  onGoTo,
  lessonTitles,
}: Lesson7Props) {
  const expected = useMemo(() => computeExpectedValues(values), [values]);
  const chi2 = useMemo(() => computeChiSquare(values, expected), [values, expected]);
  const pValue = useMemo(() => chiSquarePValue(chi2), [chi2]);

  // Per-cell contributions
  const cells = (["tp", "fp", "fn", "tn"] as (keyof CellValues)[]).map((key) => {
    const o = values[key];
    const e = expected[key];
    const contrib = e > 0 ? (o - e) ** 2 / e : 0;
    return { key, label: key.toUpperCase(), o, e, contrib };
  });

  return (
    <LessonLayout
      meta={{
        number: 6,
        title: "Chi-Square Test",
        subtitle: "Measuring departure from chance",
      }}
      totalLessons={totalLessons}
      onPrev={onPrev}
      onNext={onNext}
      onHome={onHome}
      onGoTo={onGoTo}
      lessonTitles={lessonTitles}
      keyInsight={
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-amber-800">
            <strong>Key insight:</strong> The{" "}
            <span className="text-slate-500 font-semibold">dashed gray box</span>{" "}
            shows where the box would sit if the test were no better than chance.
            The chi-square statistic measures the squared distance between
            observed and expected, normalized by expected. A larger displacement
            means a more informative test.
          </p>
        </div>
      }
      diagram={
        <TruthDiagram
          values={values}
          onDrag={setValues}
          overlays={[]}
          renderExtraSvg={(layout) => (
            <GhostExpectedBox
              expected={expected}
              centerX={layout.centerX}
              centerY={layout.centerY}
              scale={layout.scale}
            />
          )}
        />
      }
    >
      <div className="space-y-5">
        {/* What you see on the diagram */}
        <div>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">
            Reading the Diagram
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            The <strong>solid box</strong> shows the observed data. The{" "}
            <span className="text-slate-500 font-semibold">dashed gray box</span>{" "}
            shows where the box would sit if the test had no discriminatory
            power &mdash; i.e., if disease status and test result were independent.
            The displacement between the two measures how informative the test is.
          </p>
        </div>

        {/* How expected values are computed */}
        <div>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">
            Expected Values (Under H&#8320;)
          </h3>
          <div className="bg-slate-50 rounded-lg p-3 mb-2">
            <div className="text-sm font-mono text-slate-700">
              E = (row total &times; column total) / grand total
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-100">
                  <th className="p-2 text-left text-slate-500">Cell</th>
                  <th className="p-2 text-center text-slate-500">Observed</th>
                  <th className="p-2 text-center text-slate-500">Expected</th>
                  <th className="p-2 text-center text-slate-500">(O&minus;E)&sup2;/E</th>
                </tr>
              </thead>
              <tbody>
                {cells.map((c) => (
                  <tr key={c.key} className="border-t border-slate-100">
                    <td className="p-2 font-semibold text-slate-700">{c.label}</td>
                    <td className="p-2 text-center font-mono">{c.o}</td>
                    <td className="p-2 text-center font-mono text-slate-500">
                      {c.e.toFixed(1)}
                    </td>
                    <td className="p-2 text-center font-mono font-semibold">
                      {c.contrib.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Chi-square result */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 space-y-2">
          <h3 className="text-sm font-bold text-indigo-800 uppercase tracking-wide">
            &chi;&sup2; Statistic
          </h3>
          <div className="text-sm font-mono text-indigo-800">
            &chi;&sup2; = &Sigma;(O&minus;E)&sup2;/E ={" "}
            <strong className="text-lg">{formatRatio(chi2)}</strong>
          </div>
          <p className="text-xs text-indigo-600 leading-relaxed">
            Each cell contributes the squared distance between observed and
            expected, normalized by expected. Larger displacements on the
            diagram produce larger &chi;&sup2; values.
          </p>
          <div className="text-sm text-indigo-700">
            p-value ={" "}
            <strong>
              {pValue < 0.001
                ? "< 0.001"
                : pValue.toFixed(4)}
            </strong>
            <span className="text-xs text-indigo-500 ml-1">(df = 1)</span>
          </div>
          <div
            className={`mt-2 text-sm font-medium rounded-md px-3 py-1.5 ${
              pValue < 0.05
                ? "bg-green-100 text-green-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {pValue < 0.05
              ? "Significant association between test result and disease status (p < 0.05)"
              : "No significant association detected (p \u2265 0.05)"}
          </div>
        </div>

        {/* Try it */}
        <div className="text-xs text-slate-400 bg-slate-50 rounded-lg p-3">
          <strong>Try it:</strong> Drag the box toward the origin &mdash; the
          solid and dashed boxes converge and &chi;&sup2; shrinks toward zero.
          Load the &quot;Worthless Test&quot; preset to see perfect overlap
          (&chi;&sup2; &asymp; 0), then load &quot;Balanced Example&quot; to see
          a significant displacement.
        </div>

        <hr className="border-slate-100" />
        <InputPanel values={values} setValue={setValue} setValues={setValues} />
      </div>
    </LessonLayout>
  );
}
