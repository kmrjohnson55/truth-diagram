import { useMemo } from "react";
import { LessonLayout } from "./LessonLayout";
import { TruthDiagram } from "../Diagram/TruthDiagram";
import { TwoByTwoTable } from "../UI/TwoByTwoTable";
import {
  computeExpectedValues,
  computeChiSquare,
  chiSquarePValue,
  formatRatio,
} from "../../utils/statistics";
import { toSvg, computeLayout } from "../../utils/geometry";
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
  costState,
  testToggle,
}: Lesson7Props) {
  const showContributions = true;
  const expected = useMemo(() => computeExpectedValues(values), [values]);
  const chi2 = useMemo(() => computeChiSquare(values, expected), [values, expected]);
  const pValue = useMemo(() => chiSquarePValue(chi2), [chi2]);

  // Chi-square uses raw counts, not cost-weighted — ghost box must match observed box shape
  // Fixed layout that fits both observed and expected boxes (in count space)
  const chiLayout = useMemo(() => {
    const maxVals = {
      tp: Math.max(values.tp, expected.tp),
      fp: Math.max(values.fp, expected.fp),
      fn: Math.max(values.fn, expected.fn),
      tn: Math.max(values.tn, expected.tn),
    };
    return computeLayout(maxVals, 560, 500, 70);
  }, [values, expected]);

  // Per-cell contributions
  const cellColors: Record<string, string> = { tp: CELL_COLORS.tp, fp: CELL_COLORS.fp, fn: CELL_COLORS.fn, tn: CELL_COLORS.tn };
  const cells = (["tp", "fp", "fn", "tn"] as (keyof CellValues)[]).map((key) => {
    const o = values[key];
    const e = expected[key];
    const contrib = e > 0 ? (o - e) ** 2 / e : 0;
    return { key, label: key.toUpperCase(), color: cellColors[key], o, e, contrib };
  });

  // Chi-square interpretation
  const chi2Interp = chi2 >= 10.83 ? "Very strong evidence results are not by chance"
    : chi2 >= 6.63 ? "Strong evidence results are not by chance"
    : chi2 >= 3.84 ? "Moderate evidence results are not by chance"
    : "Weak or no evidence results differ from chance";

  return (
    <LessonLayout
      meta={{
        number: 5,
        title: "Chi-Square Test",
        subtitle: "Measuring departure from chance",
      }}
      totalLessons={totalLessons}
      onPrev={onPrev}
      onNext={onNext}
      onHome={onHome}
      onGoTo={onGoTo}
      lessonTitles={lessonTitles}
      costState={costState}
      testToggle={testToggle}
      keyInsight={
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-amber-800">
            <strong>Key insight:</strong> The &chi;&sup2; statistic measures how far the observed data departs from what would be expected if the test had no discriminatory power. The dashed gray box on the diagram shows that null expectation; the greater the displacement between the two boxes, the larger the &chi;&sup2;.
          </p>
        </div>
      }
      values={values}
      diagramFooter={<TwoByTwoTable values={values} setValue={setValue} setValues={setValues} costState={costState} />}
      diagram={
        <TruthDiagram
          values={values}
          onDrag={costState.costMode ? undefined : setValues}
          overlays={[]}
          fixedLayout={chiLayout}
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
          belowDiagramText={(() => {
            const cellData = [
              { key: "tp" as const, color: CELL_COLORS.tp, label: "TP" },
              { key: "tn" as const, color: CELL_COLORS.tn, label: "TN" },
              { key: "fn" as const, color: CELL_COLORS.fn, label: "FN" },
              { key: "fp" as const, color: CELL_COLORS.fp, label: "FP" },
            ];
            return (
              <div className="space-y-3">
                <div className="text-xs text-black text-center">
                  Solid colors are observed values, dotted colors are expected values.
                </div>
                {/* Visual colored-block equation first */}
                <div className="text-center text-sm text-slate-800 leading-relaxed">
                  <span style={{ fontFamily: "Georgia, serif", fontSize: "1.1em" }}>&chi;</span>&sup2; ={" "}
                  {cellData.map((c, i) => {
                    // Striped square for expected values: tiny vertical stripes
                    const stripedSquare = (
                      <svg className="inline-block align-middle" width="14" height="14" viewBox="0 0 14 14">
                        <defs>
                          <pattern id={`stripes-${c.key}`} width="3" height="14" patternUnits="userSpaceOnUse">
                            <rect width="1.5" height="14" fill={c.color} opacity="0.7" />
                          </pattern>
                        </defs>
                        <rect x="0" y="0" width="14" height="14" rx="1.5" fill={`url(#stripes-${c.key})`} stroke="none" opacity="0.8" />
                      </svg>
                    );
                    return (
                      <span key={c.key}>
                        {i > 0 && " + "}
                        <span className="inline-flex flex-col items-center mx-0.5">
                          <span>(
                            <span className="inline-block w-3.5 h-3.5 rounded-sm align-middle" style={{backgroundColor: c.color}} />
                            {" \u2212 "}
                            {stripedSquare}
                          )&sup2;</span>
                          <span className="border-t border-slate-300 px-1">
                            {stripedSquare}
                          </span>
                        </span>
                      </span>
                    );
                  })}
                </div>
                {/* Then numeric equation with actual values */}
                <div className="text-center text-sm text-slate-800 leading-relaxed">
                  <span style={{ fontFamily: "Georgia, serif", fontSize: "1.1em" }}>&chi;</span>&sup2; ={" "}
                  {cellData.map((c, i) => {
                    const o = values[c.key];
                    const e = expected[c.key];
                    return (
                      <span key={c.key}>
                        {i > 0 && " + "}
                        <span className="inline-flex flex-col items-center mx-0.5">
                          <span style={{color: c.color}}>({o} &minus; {e.toFixed(1)})&sup2;</span>
                          <span className="border-t border-slate-300 px-1" style={{color: c.color}}>{e.toFixed(1)}</span>
                        </span>
                      </span>
                    );
                  })}
                  {" = "}
                  <strong>{chi2.toFixed(2)}</strong>
                </div>
              </div>
            );
          })()}
        />
      }
    >
      <div className="space-y-5">
        {/* Bold heading */}
        <h2 className="text-xl font-bold text-black">Chi-Squared Statistic</h2>

        {/* What you see on the diagram */}
        <div>
          <h3 className="text-sm font-bold text-black uppercase tracking-wide mb-2">
            Reading the Diagram
          </h3>
          <p className="text-sm text-black leading-relaxed">
            The <strong>solid box</strong> shows the observed data. The{" "}
            <span className="text-black font-semibold">dashed gray box</span>{" "}
            shows where the box would sit if the test had no discriminatory
            power &mdash; i.e., if disease status and test result were independent.
            The displacement between the two measures how informative the test is.
          </p>
        </div>

        {/* Chi-square statistic box */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-indigo-800" style={{ fontFamily: "Georgia, serif" }}>
              &chi;&sup2; = {formatRatio(chi2)}
            </span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white ${pValue < 0.05 ? "bg-green-600" : "bg-amber-500"}`}>
              {pValue < 0.05 ? "Significant" : "Not significant"}
            </span>
          </div>
          <p className="text-xs text-indigo-700 italic">{chi2Interp}</p>
          <div className="text-xs text-indigo-700">
            p-value = <strong>{pValue < 0.001 ? "< 0.001" : pValue.toFixed(4)}</strong>
            <span className="text-indigo-500 ml-1">(df = 1)</span>
          </div>
          <p className="text-[10px] text-indigo-600 leading-relaxed">
            Each cell contributes (O&minus;E)&sup2;/E. Larger box displacement = larger &chi;&sup2;.
          </p>
          {/* Compact significance thresholds */}
          <div className="text-[10px] text-indigo-500 flex flex-wrap gap-x-3">
            <span>&ge;3.84 &rarr; p&lt;.05</span>
            <span>&ge;6.63 &rarr; p&lt;.01</span>
            <span>&ge;10.83 &rarr; p&lt;.001</span>
          </div>
        </div>

        {/* Expected values table */}
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
                  <th className="p-2 text-left text-black">Cell</th>
                  <th className="p-2 text-center text-black">Observed</th>
                  <th className="p-2 text-center text-black">Expected</th>
                  <th className="p-2 text-center text-black">(O&minus;E)&sup2;/E</th>
                </tr>
              </thead>
              <tbody>
                {cells.map((c) => (
                  <tr key={c.key} className="border-t border-slate-100">
                    <td className="p-2 font-bold" style={{ color: c.color }}>{c.label}</td>
                    <td className="p-2 text-center font-mono">{c.o}</td>
                    <td className="p-2 text-center font-mono text-black">
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
