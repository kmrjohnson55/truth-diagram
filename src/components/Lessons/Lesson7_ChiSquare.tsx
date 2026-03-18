import { useMemo, useState } from "react";
import { LessonLayout } from "./LessonLayout";
import { TruthDiagram } from "../Diagram/TruthDiagram";
import { TwoByTwoTable } from "../UI/TwoByTwoTable";
import {
  computeExpectedValues,
  computeChiSquare,
  chiSquarePValue,
  formatRatio,
} from "../../utils/statistics";
import { toSvg } from "../../utils/geometry";
import { CELL_COLORS } from "../../utils/colors";
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
      {/* Label at bottom-left of expected box */}
      <text
        x={ll.x - 4}
        y={lr.y + 14}
        fontSize={10}
        fill="#94a3b8"
        fontWeight={500}
        textAnchor="start"
      >
        Expected
      </text>
    </g>
  );
}

/* ─── Chi-square contribution lines ─── */

function ChiSquareContribLines({
  values,
  expected,
  centerX,
  centerY,
  scale,
}: {
  values: CellValues;
  expected: ExpectedValues;
  centerX: number;
  centerY: number;
  scale: number;
}) {
  const colors: Record<string, string> = {
    tp: CELL_COLORS.tp,
    fp: CELL_COLORS.fp,
    fn: CELL_COLORS.fn,
    tn: CELL_COLORS.tn,
  };

  // For each cell, draw a line from observed boundary to expected boundary
  // TP: vertical up from origin
  // FN: vertical down from origin
  // FP: horizontal left from origin
  // TN: horizontal right from origin
  const entries: { key: keyof CellValues; obs: number; exp: number; dir: [number, number] }[] = [
    { key: "tp", obs: values.tp, exp: expected.tp, dir: [0, 1] },
    { key: "fn", obs: values.fn, exp: expected.fn, dir: [0, -1] },
    { key: "fp", obs: values.fp, exp: expected.fp, dir: [-1, 0] },
    { key: "tn", obs: values.tn, exp: expected.tn, dir: [1, 0] },
  ];

  const origin = toSvg(0, 0, centerX, centerY, scale);
  // Offset amount (pixels) to draw parallel lines side-by-side
  const offset = 4;

  return (
    <g>
      {entries.map(({ key, obs, exp, dir }) => {
        const obsX = dir[0] * obs;
        const obsY = dir[1] * obs;
        const expX = dir[0] * exp;
        const expY = dir[1] * exp;
        const pObs = toSvg(obsX, obsY, centerX, centerY, scale);
        const pExp = toSvg(expX, expY, centerX, centerY, scale);
        // Per Fig. 6: draw two PARALLEL lines side by side
        // Solid = origin to observed, Dashed = origin to expected
        // Offset perpendicular to the axis direction
        const perpX = dir[1] === 0 ? 0 : offset; // horizontal axes: offset vertically
        const perpY = dir[0] === 0 ? 0 : offset; // vertical axes: offset horizontally
        return (
          <g key={key}>
            {/* Solid: origin → observed boundary */}
            <line
              x1={origin.x - perpX} y1={origin.y - perpY}
              x2={pObs.x - perpX} y2={pObs.y - perpY}
              stroke={colors[key]}
              strokeWidth={5}
              opacity={0.8}
              strokeLinecap="butt"
            />
            {/* Dashed: origin → expected boundary (offset parallel) */}
            <line
              x1={origin.x + perpX} y1={origin.y + perpY}
              x2={pExp.x + perpX} y2={pExp.y + perpY}
              stroke={colors[key]}
              strokeWidth={5}
              opacity={0.5}
              strokeLinecap="butt"
              strokeDasharray="4 3"
            />
          </g>
        );
      })}
    </g>
  );
}

/* ─── Main lesson component ─── */

export function Lesson7_ChiSquare({
  values,
  stats: _stats,
  setValue,
  setValues,
  totalLessons,
  onPrev,
  onNext,
  onHome,
  onGoTo,
  lessonTitles,
}: Lesson7Props) {
  const showContributions = true;
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
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
          <p className="text-sm text-amber-800">
            <strong>What is &chi;&sup2;?</strong>{" "}
            The chi-square statistic tests whether there is a statistically
            significant association between two categorical variables &mdash;
            here, between the test result (positive/negative) and the true
            disease status (present/absent). A large &chi;&sup2; indicates
            the test discriminates between disease and no-disease better
            than chance alone.
          </p>
          <p className="text-sm text-amber-800">
            <strong>On the diagram:</strong> The{" "}
            <span className="text-slate-600 font-semibold">dashed gray box</span>{" "}
            shows where the box would sit under the null hypothesis of
            independence (no association), in other words, if the test had no effect on the likelihood of disease. The displacement between the
            solid and dashed boxes corresponds to the &chi;&sup2; value.
          </p>
        </div>
      }
      values={values}
      diagramFooter={<TwoByTwoTable values={values} setValue={setValue} setValues={setValues} />}
      diagram={
        <TruthDiagram
          values={values}
          onDrag={setValues}
          overlays={[]}
          extraMargin={30}
          renderExtraSvg={(layout) => (
            <>
              <GhostExpectedBox
                expected={expected}
                centerX={layout.centerX}
                centerY={layout.centerY}
                scale={layout.scale}
              />
              {showContributions && (
                <ChiSquareContribLines
                  values={values}
                  expected={expected}
                  centerX={layout.centerX}
                  centerY={layout.centerY}
                  scale={layout.scale}
                />
              )}
            </>
          )}
          belowDiagramText={
            <div className="space-y-2">
              <div className="text-xs text-slate-600 text-center">
                Solid colors are observed values, dotted colors are expected values.
              </div>
              <div className="text-center text-sm text-slate-800 font-medium leading-relaxed">
                <span style={{ fontFamily: "Georgia, serif", fontSize: "1.1em" }}>&chi;</span>&sup2; ={" "}
                <span className="inline-flex flex-col items-center mx-1">
                  <span>(<span style={{color: CELL_COLORS.tp}}>&#9632;</span> &minus; <span style={{color: CELL_COLORS.tp}}>&#9633;</span>)&sup2;</span>
                  <span className="border-t border-slate-400 text-xs"><span style={{color: CELL_COLORS.tp}}>&#9633;</span></span>
                </span>
                {" + "}
                <span className="inline-flex flex-col items-center mx-1">
                  <span>(<span style={{color: CELL_COLORS.tn}}>&#9632;</span> &minus; <span style={{color: CELL_COLORS.tn}}>&#9633;</span>)&sup2;</span>
                  <span className="border-t border-slate-400 text-xs"><span style={{color: CELL_COLORS.tn}}>&#9633;</span></span>
                </span>
                {" + "}
                <span className="inline-flex flex-col items-center mx-1">
                  <span>(<span style={{color: CELL_COLORS.fn}}>&#9632;</span> &minus; <span style={{color: CELL_COLORS.fn}}>&#9633;</span>)&sup2;</span>
                  <span className="border-t border-slate-400 text-xs"><span style={{color: CELL_COLORS.fn}}>&#9633;</span></span>
                </span>
                {" + "}
                <span className="inline-flex flex-col items-center mx-1">
                  <span>(<span style={{color: CELL_COLORS.fp}}>&#9632;</span> &minus; <span style={{color: CELL_COLORS.fp}}>&#9633;</span>)&sup2;</span>
                  <span className="border-t border-slate-400 text-xs"><span style={{color: CELL_COLORS.fp}}>&#9633;</span></span>
                </span>
              </div>
            </div>
          }
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
            <span className="text-slate-600 font-semibold">dashed gray box</span>{" "}
            shows where the box would sit if the test had no discriminatory
            power &mdash; i.e., if disease status and test result were independent.
            The displacement between the two measures how informative the test is.
          </p>
        </div>

        {/* Chi-square statistic box (with toggle inside) */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 space-y-2">
          <h3 className="text-sm font-bold text-indigo-800 uppercase tracking-wide" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
            &#x3C7;&sup2; Statistic
          </h3>
          <div className="text-sm font-mono text-indigo-800">
            <span style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>&#x3C7;</span>&sup2; = &Sigma;(O&minus;E)&sup2;/E ={" "}
            <strong className="text-lg">{formatRatio(chi2)}</strong>
          </div>
          <p className="text-xs text-indigo-600 leading-relaxed">
            Each cell contributes the squared distance between observed and
            expected, normalized by expected. Larger displacements on the
            diagram produce larger values.
          </p>
          <div className="text-sm text-indigo-700">
            p-value ={" "}
            <strong>
              {pValue < 0.001
                ? "< 0.001"
                : pValue.toFixed(4)}
            </strong>
            <span className="text-xs text-indigo-600 ml-1">(df = 1)</span>
          </div>
          <div
            className={`text-sm font-medium rounded-md px-3 py-1.5 ${
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

        {/* Expected values table (moved below chi-square box) */}
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
                  <th className="p-2 text-left text-slate-600">Cell</th>
                  <th className="p-2 text-center text-slate-600">Observed</th>
                  <th className="p-2 text-center text-slate-600">Expected</th>
                  <th className="p-2 text-center text-slate-600">(O&minus;E)&sup2;/E</th>
                </tr>
              </thead>
              <tbody>
                {cells.map((c) => (
                  <tr key={c.key} className="border-t border-slate-100">
                    <td className="p-2 font-semibold text-slate-700">{c.label}</td>
                    <td className="p-2 text-center font-mono">{c.o}</td>
                    <td className="p-2 text-center font-mono text-slate-600">
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

      </div>
    </LessonLayout>
  );
}
