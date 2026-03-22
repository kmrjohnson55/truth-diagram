import { useMemo } from "react";
import { LessonLayout } from "./LessonLayout";
import { TruthDiagram } from "../Diagram/TruthDiagram";
import { CELL_COLORS } from "../../utils/colors";
import { computeLayout } from "../../utils/geometry";
import { formatStat } from "../../utils/statistics";
import type { CellValues, DiagnosticStats } from "../../utils/statistics";
import type { LessonNavProps } from "./lessonTypes";

interface IntroProps extends LessonNavProps {
  values: CellValues;
  stats: DiagnosticStats;
  setValues: (v: CellValues) => void;
}

export function Lesson0_Introduction({
  values,
  stats,
  setValues,
  totalLessons,
  onPrev,
  onNext,
  onHome,
  onGoTo,
  lessonTitles,
  costState,
  testToggle,
}: IntroProps) {
  // Fixed wider layout — disable auto-zoom, use generous padding
  // Only re-compute if values grow beyond the fixed extent (anti-clipping)
  const fixedExtent: CellValues = { tp: 140, fp: 140, fn: 140, tn: 140 };
  const safeExtent = useMemo<CellValues>(() => ({
    tp: Math.max(fixedExtent.tp, values.tp),
    fp: Math.max(fixedExtent.fp, values.fp),
    fn: Math.max(fixedExtent.fn, values.fn),
    tn: Math.max(fixedExtent.tn, values.tn),
  }), [values]);
  const fixedLayout = useMemo(
    () => computeLayout(safeExtent, 560, 500, 60),
    [safeExtent]
  );

  // Computed values for Subject Box / Prevalence sections
  const { tp, fp, fn, tn } = values;
  const diseased = tp + fn;
  const healthy = fp + tn;
  const ratio = diseased > 0 && healthy > 0 ? diseased / healthy : 1;
  let shapeIcon: string;
  let shapeDesc: string;
  if (ratio > 1.3) { shapeIcon = "\u25AE"; shapeDesc = "tall and narrow \u2014 high prevalence"; }
  else if (ratio < 0.77) { shapeIcon = "\u25AC"; shapeDesc = "short and wide \u2014 low prevalence"; }
  else { shapeIcon = "\u25A0"; shapeDesc = "roughly square \u2014 ~50% prevalence"; }

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
      costState={costState}
      testToggle={testToggle}
      diagramFooter={
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Left: 2×2 table */}
          <div className="lg:w-1/2">
            <h3 className="text-sm font-bold text-black uppercase tracking-wide mb-2">
              How It Maps to the 2&times;2 Table
            </h3>
            <div className="rounded-lg border border-slate-200 overflow-hidden text-sm">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="p-2 text-black font-medium"></th>
                    <th className="p-2 text-center font-semibold text-amber-700 border-l border-slate-200">With disease</th>
                    <th className="p-2 text-center font-semibold text-amber-700 border-l border-slate-200">Without disease</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-slate-200">
                    <td className="p-2 font-semibold text-black">Test +</td>
                    <td className="p-2 text-center border-l border-slate-200">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-green-700 bg-green-50">
                        &uarr; TP = {values.tp}
                      </span>
                    </td>
                    <td className="p-2 text-center border-l border-slate-200">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-yellow-700 bg-yellow-50">
                        &larr; FP = {values.fp}
                      </span>
                    </td>
                  </tr>
                  <tr className="border-t border-slate-200">
                    <td className="p-2 font-semibold text-black">Test &minus;</td>
                    <td className="p-2 text-center border-l border-slate-200">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-red-700 bg-red-50">
                        &darr; FN = {values.fn}
                      </span>
                    </td>
                    <td className="p-2 text-center border-l border-slate-200">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-blue-700 bg-blue-50">
                        &rarr; TN = {values.tn}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-sm text-black leading-relaxed">
              Each cell maps to a direction on the diagram. The arrow shows
              which way that cell extends from the origin.
            </p>
          </div>

          {/* Right: Subject Box + Prevalence */}
          <div className="lg:w-1/2 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-black uppercase tracking-wide mb-2">The Subject Box</h3>
              <p className="text-sm text-black leading-relaxed">
                The origin is always inside the box, so every cell value is always &ge; 0.
              </p>
              <div className="mt-2 bg-slate-50 rounded-lg p-3 space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-black">Vertical side:</span>
                  <span className="font-semibold">
                    <span style={{ color: CELL_COLORS.tp }}>TP</span>
                    {" + "}
                    <span style={{ color: CELL_COLORS.fn }}>FN</span>
                    {" = "}
                    <span style={{ color: CELL_COLORS.tp }}>{tp}</span>
                    {" + "}
                    <span style={{ color: CELL_COLORS.fn }}>{fn}</span>
                    {" = "}
                    <span className="text-black">{diseased}</span>
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-black">Horizontal side:</span>
                  <span className="font-semibold">
                    <span style={{ color: CELL_COLORS.fp }}>FP</span>
                    {" + "}
                    <span style={{ color: CELL_COLORS.tn }}>TN</span>
                    {" = "}
                    <span style={{ color: CELL_COLORS.fp }}>{fp}</span>
                    {" + "}
                    <span style={{ color: CELL_COLORS.tn }}>{tn}</span>
                    {" = "}
                    <span className="text-black">{healthy}</span>
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      }
      diagram={
        <TruthDiagram
          values={values}
          onDrag={costState.costMode ? undefined : setValues}
          overlays={[]}
          hideTickAnnotation
          fixedLayout={fixedLayout}
          axisOvershootOverride={60}
          belowDiagramText={
            <>
              <div className="bg-indigo-50 rounded-lg p-3 text-sm mb-2 mx-auto max-w-sm">
                <div className="flex justify-between items-center">
                  <span className="text-indigo-600">Current prevalence:</span>
                  <span className="font-bold text-indigo-700">{formatStat(stats.prevalence)}</span>
                </div>
                <p className="mt-1 text-xs text-indigo-600 font-medium">
                  <span className="text-base leading-none mr-1">{shapeIcon}</span>
                  {shapeDesc}
                </p>
              </div>
              Drag box to move &middot; Drag corners to resize
            </>
          }
          renderExtraSvg={(layout) => {
            const { centerX: cx, centerY: cy, scale: s } = layout;
            const { tp, fp, fn, tn } = values;

            // Box corners in SVG coords
            const ulY = cy - tp * s;
            const llY = cy + fn * s;
            const ulX = cx - fp * s;
            const urX = cx + tn * s;

            // Axis geometry — use same overshoot as passed to TruthDiagram
            const arrowSize = 7;
            const axisOvershoot = 60;
            const upLen = tp * s + axisOvershoot;
            const downLen = fn * s + axisOvershoot;
            const leftLen = fp * s + axisOvershoot;
            const rightLen = tn * s + axisOvershoot;

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
                {/* ── Cell abbreviations below each axis label, well clear ── */}
                <text x={cx} y={cy - upLen - arrowSize - 24} textAnchor="middle"
                  fontSize={12} fontWeight={700} fill={CELL_COLORS.tp} style={{ userSelect: "none" }}>(TP)</text>
                <text x={cx} y={cy + downLen + arrowSize + 34} textAnchor="middle"
                  fontSize={12} fontWeight={700} fill={CELL_COLORS.fn} style={{ userSelect: "none" }}>(FN)</text>
                <text x={cx - leftLen - arrowSize - 10} y={cy + 28} textAnchor="end"
                  fontSize={12} fontWeight={700} fill={CELL_COLORS.fp} style={{ userSelect: "none" }}>(FP)</text>
                <text x={cx + rightLen + arrowSize + 10} y={cy + 28} textAnchor="start"
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
        {/* ── Bold heading ── */}
        <div>
          <h2 className="text-xl font-bold text-black mb-2">
            The Two by Two Diagram
          </h2>
          <p className="text-base text-black leading-relaxed">
            In diagnostic testing, many terms are used to describe how well the test detects the disease or disorder.
            Examples are &ldquo;sensitivity&rdquo;, &ldquo;specificity&rdquo;, &ldquo;predictive values&rdquo;, &ldquo;odds ratio&rdquo;, &ldquo;likelihood ratios&rdquo; and numerous others. In the literature and medical presentations there is often not much consistency in their use; as a physician listening to or reading research, I was perpetually unclear on how these terms &ldquo;fit together&rdquo;.
          </p>
          <p className="text-base text-black leading-relaxed mt-3">
            My solution was to invent the visual 2 by 2 diagram, or <strong>truth diagram</strong>, as a graphical alternative to the standard contingency table used in diagnostic testing (Johnson 1999). The concepts listed above, and many others, are represented graphically, and their inter-relationships can be clearly visualized.
          </p>
          <p className="text-base text-black leading-relaxed mt-3">
            Instead of four numbers in a grid, a single rectangle on a coordinate system encodes all four cells of the 2&times;2 table through its position and shape. Each hemi-axis corresponds to one cell (see below). The vertical height corresponds to the number of subjects with the disorder, and the horizontal width corresponds to the number of subjects without the disorder. A low, wide box represents a low prevalence of the disorder; a high narrow box represents a high prevalence.
          </p>
          <p className="text-base text-black leading-relaxed mt-3">
            The diagram makes it possible to see statistics like sensitivity, specificity, PPV, NPV, likelihood ratios, and even Bayes&rsquo; theorem as geometric relationships &mdash; lengths, areas, slopes, and proportions &mdash; rather than abstract formulas.
          </p>
          <p className="text-base text-black leading-relaxed mt-3">
            Drag or resize the box to see how the cell values change. The other lessons in this app explain each of the terms and how they appear on the diagram. Any of these screens can be saved for presentation and publication purposes. &mdash; Kevin M. Johnson, M.D.
          </p>
        </div>

        {/* ── References (Vancouver style, always visible) ── */}
        <div>
          <h3 className="text-sm font-bold text-black uppercase tracking-wide mb-2">
            References
          </h3>
          <ol className="text-sm text-black space-y-2 list-decimal list-inside leading-relaxed">
            <li>
              Johnson KM. The two by two diagram: a graphical truth table. <em>J Clin Epidemiol.</em> 1999;52(11):1073-82.
              {" "}[<a href="https://pubmed.ncbi.nlm.nih.gov/10527001/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">PubMed</a>]
              {" "}[<a href="https://www.researchgate.net/publication/12773609" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">ResearchGate</a>]
            </li>
            <li>
              Johnson KM, Johnson BK. Visual presentation of statistical concepts in diagnostic testing: the 2&times;2 diagram. <em>AJR Am J Roentgenol.</em> 2014;203(1):W14-20.
              {" "}[<a href="https://pubmed.ncbi.nlm.nih.gov/24951225/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">PubMed</a>]
              {" "}[<a href="https://www.researchgate.net/publication/263322395" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">ResearchGate</a>]
            </li>
            <li>
              Johnson KM. Using Bayes&rsquo; rule in diagnostic testing: a graphical explanation. <em>Diagnosis (Berl).</em> 2017;4(3):159-67.
              {" "}[<a href="https://pubmed.ncbi.nlm.nih.gov/29536931/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">PubMed</a>]
              {" "}[<a href="https://www.researchgate.net/publication/319190834" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">ResearchGate</a>]
            </li>
          </ol>
        </div>
      </div>
    </LessonLayout>
  );
}
