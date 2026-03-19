import { useState } from "react";
import { LessonLayout } from "./LessonLayout";
import { TruthDiagram } from "../Diagram/TruthDiagram";
import { CELL_COLORS } from "../../utils/colors";
import type { CellValues, DiagnosticStats } from "../../utils/statistics";
import type { LessonNavProps } from "./lessonTypes";

function IntroTooltip({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className="absolute left-0 top-full mt-1 z-50 w-full p-3 text-xs text-slate-700 bg-white border border-slate-200 rounded-lg shadow-lg leading-relaxed">
          <p className="mb-2">
            The <strong>truth diagram</strong> (also called the 2&times;2 diagram)
            was introduced by Johnson (1999) as a graphical alternative to the
            standard contingency table used in diagnostic testing.
          </p>
          <p className="mb-2">
            Instead of four numbers in a grid, a single rectangle on a coordinate
            system encodes all four cells of the 2&times;2 table through its
            position and shape. The origin of the axes divides the rectangle into
            regions corresponding to TP, FP, FN, and TN.
          </p>
          <p className="mb-2">
            This makes it possible to <em>see</em> statistics like sensitivity,
            specificity, PPV, NPV, likelihood ratios, and even Bayes' theorem
            as geometric relationships &mdash; lengths, areas, slopes, and
            proportions &mdash; rather than abstract formulas.
          </p>
          <p>
            Drag the box and its corners on the diagram to explore how changing
            the test results affects every statistic simultaneously.
          </p>
        </div>
      )}
    </div>
  );
}

interface IntroProps extends LessonNavProps {
  values: CellValues;
  stats: DiagnosticStats;
  setValues: (v: CellValues) => void;
}

export function Lesson0_Introduction({
  values,
  stats: _stats,
  setValues,
  totalLessons,
  onPrev,
  onNext,
  onHome,
  onGoTo,
  lessonTitles,
}: IntroProps) {
  return (
    <LessonLayout
      meta={{
        number: 0,
        title: "Introduction",
        subtitle: "What is the truth diagram?",
      }}
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
          overlays={[]}
          hideTickAnnotation
          renderExtraSvg={(layout) => {
            const { centerX: cx, centerY: cy, scale: s } = layout;
            const { tp, fp, fn, tn } = values;

            // Box corners in SVG coords
            const ulY = cy - tp * s;
            const llY = cy + fn * s;
            const ulX = cx - fp * s;
            const urX = cx + tn * s;

            // Axis geometry (must match Axes.tsx)
            const arrowSize = 7;
            const axisOvershoot = Math.max(20, s * 5);
            const upLen = tp * s + axisOvershoot;
            const downLen = fn * s + axisOvershoot;
            const leftLen = fp * s + axisOvershoot;
            const rightLen = tn * s + axisOvershoot;

            // Midpoints for Test +/− labels
            const tpMidY = cy - (tp * s) / 2;
            const fnMidY = cy + (fn * s) / 2;

            // Bracket system
            const bracketColor = "#b45309";
            const bracketOffset = 18;
            const bracketWidth = 6;

            // Vertical bracket (right) — "With disease"
            const vx = urX + bracketOffset;
            const vmid = (ulY + llY) / 2;
            const vPath = `M${vx - bracketWidth},${ulY} Q${vx},${ulY} ${vx},${ulY + 8} L${vx},${vmid - 6} Q${vx},${vmid} ${vx + bracketWidth},${vmid} Q${vx},${vmid} ${vx},${vmid + 6} L${vx},${llY - 8} Q${vx},${llY} ${vx - bracketWidth},${llY}`;

            // Horizontal bracket (below) — "Without disease"
            const hy = llY + bracketOffset;
            const hmid = (ulX + urX) / 2;
            const hPath = `M${ulX},${hy - bracketWidth} Q${ulX},${hy} ${ulX + 8},${hy} L${hmid - 6},${hy} Q${hmid},${hy} ${hmid},${hy + bracketWidth} Q${hmid},${hy} ${hmid + 6},${hy} L${urX - 8},${hy} Q${urX},${hy} ${urX},${hy - bracketWidth}`;

            return (
              <g>
                {/* ── Cell abbreviations beside each axis label ── */}
                {/* TP beside "True positive" (above up arrow) */}
                <text x={cx} y={cy - upLen - arrowSize - 6 + 15} textAnchor="middle"
                  fontSize={12} fontWeight={700} fill={CELL_COLORS.tp} style={{ userSelect: "none" }}>(TP)</text>
                {/* FN beside "False negative" (below down arrow) */}
                <text x={cx} y={cy + downLen + arrowSize + 16 + 14} textAnchor="middle"
                  fontSize={12} fontWeight={700} fill={CELL_COLORS.fn} style={{ userSelect: "none" }}>(FN)</text>
                {/* FP beside "False positive" (left of left arrow) */}
                <text x={cx - leftLen - arrowSize - 6} y={cy + 26} textAnchor="end"
                  fontSize={12} fontWeight={700} fill={CELL_COLORS.fp} style={{ userSelect: "none" }}>(FP)</text>
                {/* TN beside "True negative" (right of right arrow) */}
                <text x={cx + rightLen + arrowSize + 6} y={cy + 26} textAnchor="start"
                  fontSize={12} fontWeight={700} fill={CELL_COLORS.tn} style={{ userSelect: "none" }}>(TN)</text>

                {/* ── Curly brackets ── */}
                <path d={vPath} fill="none" stroke={bracketColor} strokeWidth={1.5} />
                <text x={vx + bracketWidth + 4} y={vmid + 4} fontSize={11} fontWeight={600} fill={bracketColor}>
                  With disease
                </text>
                <path d={hPath} fill="none" stroke={bracketColor} strokeWidth={1.5} />
                <text x={hmid} y={hy + bracketWidth + 14} textAnchor="middle" fontSize={11} fontWeight={600} fill={bracketColor}>
                  Without disease
                </text>
              </g>
            );
          }}
        />
      }
    >
      <div className="space-y-5">
        {/* ── Hero header ── */}
        <div>
          <h2 className="text-lg font-bold text-slate-800 mb-1">
            The Truth Diagram
          </h2>
          <IntroTooltip>
            <p className="text-sm text-slate-600 leading-relaxed">
              A graphical way to visualize diagnostic test results. The
              traditional 2&times;2 table becomes an interactive picture where
              every statistic can be <em>seen at a glance</em>.{" "}
              <span className="text-indigo-500 cursor-help underline decoration-dotted">
                More&hellip;
              </span>
            </p>
          </IntroTooltip>
        </div>

        {/* ── Visual 2×2 mini-table ── */}
        <div>
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
            How It Maps to the 2&times;2 Table
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
                      &uarr; TP
                    </span>
                  </td>
                  <td className="p-2 text-center border-l border-slate-200">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-yellow-700 bg-yellow-50">
                      &larr; FP
                    </span>
                  </td>
                </tr>
                <tr className="border-t border-slate-200">
                  <td className="p-2 font-semibold text-slate-500">Test −</td>
                  <td className="p-2 text-center border-l border-slate-200">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-red-700 bg-red-50">
                      &darr; FN
                    </span>
                  </td>
                  <td className="p-2 text-center border-l border-slate-200">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-blue-700 bg-blue-50">
                      &rarr; TN
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">
            Each cell maps to a direction on the diagram. The arrow shows
            which way that cell extends from the origin.
          </p>
        </div>

        {/* ── Shape & position explanation ── */}
        <div>
          <p className="text-sm text-slate-600 leading-relaxed">
            The <strong>shape</strong> of the box reflects prevalence (how
            common the disease is). The <strong>position</strong> reflects
            test performance. A perfect test places the entire box in the
            upper-right quadrant.
          </p>
        </div>

        {/* ── Lesson cards ── */}
        <div>
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
            8 Lessons
          </h3>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { n: 1, title: "Box & Axes", desc: "Coordinate system" },
              { n: 2, title: "Sens / Spec", desc: "Test accuracy" },
              { n: 3, title: "PPV / NPV", desc: "Predictive values" },
              { n: 4, title: "ROC Curves", desc: "Threshold tradeoffs" },
              { n: 5, title: "LR & Bayes", desc: "Odds and slopes" },
              { n: 6, title: "Chi-Square", desc: "Significance testing" },
              { n: 7, title: "Compare", desc: "Two tests side-by-side" },
              { n: 8, title: "Sandbox", desc: "Free exploration" },
            ].map((l) => (
              <button
                key={l.n}
                onClick={() => onGoTo(l.n)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 transition-colors text-left"
              >
                <span className="text-xs font-bold text-indigo-500 w-4 shrink-0">{l.n}</span>
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-slate-700 block truncate">{l.title}</span>
                  <span className="text-[10px] text-slate-400 block truncate">{l.desc}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── References (compact) ── */}
        <details className="text-xs text-slate-500">
          <summary className="font-semibold text-slate-600 uppercase tracking-wide cursor-pointer hover:text-slate-800">
            References
          </summary>
          <ol className="mt-2 space-y-1.5 list-decimal list-inside leading-relaxed">
            <li>
              Johnson KM. <em>J Clin Epidemiol</em> 1999;52:1073&ndash;1082.
            </li>
            <li>
              Johnson KM, Johnson BK. <em>AJR</em> 2014;203:W14&ndash;W20.
            </li>
            <li>
              Johnson KM. <em>Diagnosis</em> 2017;4(3):159&ndash;167.
            </li>
          </ol>
        </details>

        {/* ── Start button ── */}
        <div className="pt-1">
          <button
            onClick={() => onGoTo(1)}
            className="w-full px-4 py-2 text-sm font-semibold text-white bg-indigo-400 hover:bg-indigo-500 rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            Start Lesson 1: Box &amp; Axes &rarr;
          </button>
        </div>
      </div>
    </LessonLayout>
  );
}
