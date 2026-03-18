import { useState, useMemo, useEffect } from "react";
import { LessonLayout } from "./LessonLayout";
import { TruthDiagram } from "../Diagram/TruthDiagram";
import { TwoByTwoTable } from "../UI/TwoByTwoTable";
import { formatStat, computeStats } from "../../utils/statistics";
import {
  computeDPrime,
  trajectoryPoint,
  generateTrajectory,
  thresholdFromSensitivity,
  computeAUC,
} from "../../utils/trajectory";
import { computeLayout, toSvg } from "../../utils/geometry";
import type { CellValues, DiagnosticStats } from "../../utils/statistics";
import type { LessonNavProps } from "./lessonTypes";

interface Lesson5Props extends LessonNavProps {
  values: CellValues;
  stats: DiagnosticStats;
  setValues: (v: CellValues) => void;
  setValue: (key: keyof CellValues, val: number) => void;
}

const ROC_SIZE = 220;
const ROC_PAD = 32;

function RocCurve({
  trajectory,
  currentSens,
  currentFpr,
}: {
  trajectory: { sensitivity: number; specificity: number }[];
  currentSens: number;
  currentFpr: number;
}) {
  const s = ROC_SIZE - ROC_PAD * 2;
  const tx = (fpr: number) => ROC_PAD + fpr * s;
  const ty = (sens: number) => ROC_PAD + (1 - sens) * s;

  const pathD = trajectory
    .map((p, i) => {
      const x = tx(1 - p.specificity);
      const y = ty(p.sensitivity);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const first = trajectory[0];
  const last = trajectory[trajectory.length - 1];
  const fillD =
    pathD +
    ` L${tx(1 - last.specificity).toFixed(1)},${ty(0).toFixed(1)}` +
    ` L${tx(1 - first.specificity).toFixed(1)},${ty(0).toFixed(1)} Z`;

  return (
    <svg viewBox={`0 0 ${ROC_SIZE} ${ROC_SIZE}`} style={{ width: "100%", maxWidth: ROC_SIZE, background: "white", borderRadius: 8 }}>
      <rect width={ROC_SIZE} height={ROC_SIZE} fill="white" rx={8} />
      <line x1={ROC_PAD} y1={ROC_PAD} x2={ROC_PAD} y2={ROC_SIZE - ROC_PAD} stroke="#cbd5e1" strokeWidth={1} />
      <line x1={ROC_PAD} y1={ROC_SIZE - ROC_PAD} x2={ROC_SIZE - ROC_PAD} y2={ROC_SIZE - ROC_PAD} stroke="#cbd5e1" strokeWidth={1} />
      <line x1={ROC_PAD} y1={ROC_SIZE - ROC_PAD} x2={ROC_SIZE - ROC_PAD} y2={ROC_PAD}
        stroke="#ef4444" strokeWidth={1} strokeDasharray="4 3" opacity={0.5} />
      <path d={fillD} fill="#4f46e5" opacity={0.08} />
      <path d={pathD} fill="none" stroke="#4f46e5" strokeWidth={2} />
      <circle cx={tx(currentFpr)} cy={ty(currentSens)} r={5}
        fill="#4f46e5" stroke="white" strokeWidth={1.5} />
      <text x={ROC_SIZE / 2} y={ROC_SIZE - 6} textAnchor="middle" fontSize={10} fill="#94a3b8">
        1 − Specificity (FPR)
      </text>
      <text x={10} y={ROC_SIZE / 2} textAnchor="middle" fontSize={10} fill="#94a3b8"
        transform={`rotate(-90, 10, ${ROC_SIZE / 2})`}>
        Sensitivity (TPR)
      </text>
    </svg>
  );
}

export function Lesson5_Trajectory({
  values,
  stats,
  setValues,
  setValue,
  totalLessons,
  onPrev,
  onNext,
  onHome,
  onGoTo,
  lessonTitles,
}: Lesson5Props) {
  const diseased = values.tp + values.fn;
  const healthy = values.fp + values.tn;

  const dPrime = useMemo(
    () => computeDPrime(stats.sensitivity, stats.specificity),
    [stats.sensitivity, stats.specificity]
  );

  const initialThreshold = useMemo(
    () => thresholdFromSensitivity(dPrime, stats.sensitivity),
    [dPrime, stats.sensitivity]
  );

  const [threshold, setThreshold] = useState(initialThreshold);

  useEffect(() => {
    setThreshold(thresholdFromSensitivity(dPrime, stats.sensitivity));
  }, [values.tp, values.fp, values.fn, values.tn]);

  const sliderValues = useMemo(
    () => trajectoryPoint(dPrime, threshold, diseased, healthy),
    [dPrime, threshold, diseased, healthy]
  );
  const sliderStats = useMemo(() => computeStats(sliderValues), [sliderValues]);

  const trajectory = useMemo(
    () => generateTrajectory(dPrime, 300),
    [dPrime]
  );

  const auc = useMemo(() => computeAUC(trajectory), [trajectory]);

  // Trajectory points for truth diagram (UL corner path)
  const trajectoryDiagramPoints = useMemo(() => {
    return trajectory.map((p) => {
      const tpVal = Math.round(p.sensitivity * diseased);
      const fpVal = Math.round((1 - p.specificity) * healthy);
      return { diagramX: -fpVal, diagramY: tpVal };
    });
  }, [trajectory, diseased, healthy]);

  // Fixed layout: computed from a "max extent" box that fits the full trajectory range.
  // Use the full diseased/healthy counts as the box dimensions (worst case positioning).
  const fixedLayout = useMemo(() => {
    const maxValues: CellValues = { tp: diseased, fp: healthy, fn: 0, tn: 0 };
    return computeLayout(maxValues, 560, 500, 85);
  }, [diseased, healthy]);

  return (
    <LessonLayout
      meta={{
        number: 4,
        title: "ROC Curves",
        subtitle: "How the threshold tradeoff shapes the diagram",
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
            <strong>Key insight:</strong> The truth diagram and ROC curve contain
            similar information, but the diagram preserves{" "}
            <em>prevalence</em> (the box shape), which the ROC curve discards.
            This means it ignores predictive values, among other limitations.
          </p>
        </div>
      }
      values={values}
      diagramFooter={<TwoByTwoTable values={values} setValue={setValue} setValues={setValues} />}
      diagram={
        <TruthDiagram
          values={sliderValues}
          onDrag={setValues}
          overlays={["sensitivity", "specificity"]}
          extraMargin={25}
          fixedLayout={fixedLayout}
          renderExtraSvg={(layout) => {
            const { centerX: cx, centerY: cy, scale: s } = layout;
            const svgPts = trajectoryDiagramPoints.map((p) =>
              toSvg(p.diagramX, p.diagramY, cx, cy, s)
            );
            let pathD = `M${svgPts[0].x.toFixed(1)},${svgPts[0].y.toFixed(1)}`;
            for (let i = 1; i < svgPts.length - 1; i += 2) {
              const cp = svgPts[i];
              const end = svgPts[Math.min(i + 1, svgPts.length - 1)];
              pathD += ` Q${cp.x.toFixed(1)},${cp.y.toFixed(1)} ${end.x.toFixed(1)},${end.y.toFixed(1)}`;
            }
            // Chance trajectory: parallel to box diagonal, clipped to box dimensions
            const chanceStart = toSvg(0, 0, cx, cy, s);
            const ratio = healthy > 0 ? diseased / healthy : 1;
            // Clip: cannot extend beyond diseased (vertical) or healthy (horizontal)
            const maxHoriz = healthy;
            const maxVert = diseased;
            const ext = Math.min(maxHoriz, maxVert / ratio);
            const chanceEnd = toSvg(-ext, ext * ratio, cx, cy, s);
            const opPt = toSvg(-sliderValues.fp, sliderValues.tp, cx, cy, s);
            return (
              <g>
                <line
                  x1={chanceStart.x} y1={chanceStart.y}
                  x2={chanceEnd.x} y2={chanceEnd.y}
                  stroke="#ef4444" strokeWidth={1.5} strokeDasharray="8 5" opacity={0.5}
                />
                <text x={(chanceStart.x + chanceEnd.x) / 2 + 4} y={(chanceStart.y + chanceEnd.y) / 2 + 14}
                  fontSize={9} fill="#ef4444" fontWeight={500} opacity={0.7}>
                  Chance trajectory
                </text>
                <path d={pathD} fill="none" stroke="#eab308" strokeWidth={3} opacity={0.85} />
                <circle cx={opPt.x} cy={opPt.y} r={5} fill="#1e293b" stroke="white" strokeWidth={1.5} />
              </g>
            );
          }}
          belowDiagramText={
            <div className="space-y-2">
              {/* Slider immediately below diagram */}
              <div className="bg-slate-50 rounded-lg p-2 mx-auto max-w-md">
                <input
                  type="range"
                  min={-3.5}
                  max={3.5}
                  step={0.05}
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
                <div className="flex justify-between text-xs text-slate-600">
                  <span>&larr; More sensitive</span>
                  <span>More specific &rarr;</span>
                </div>
                <p className="text-xs text-slate-600 text-center mt-1">
                  Move the slider to move the subject box along the test trajectory.
                </p>
              </div>
            </div>
          }
        />
      }
    >
      <div className="space-y-5">
        <div>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">
            The Threshold Tradeoff
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            The test trajectory (<span className="font-semibold" style={{color:"#eab308"}}>yellow curve</span>)
            shows the path along which the upper-left corner of the box moves
            as the threshold changes. The box slides along this curve; its shape
            stays the same but its position changes. The{" "}
            <span className="font-semibold text-red-600">dashed red line</span> is the
            chance trajectory &mdash; the path a worthless test would follow,
            where the post-test probability equals the pre-test probability.
            The <strong>black dot</strong> marks the current operating point.
          </p>
        </div>

        {/* Live stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="text-xs text-green-600 font-semibold uppercase">Sensitivity</div>
            <div className="text-lg font-bold text-green-700">{formatStat(sliderStats.sensitivity)}</div>
            <div className="text-xs text-green-600">TP={sliderValues.tp} FN={sliderValues.fn}</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-xs text-blue-600 font-semibold uppercase">Specificity</div>
            <div className="text-lg font-bold text-blue-700">{formatStat(sliderStats.specificity)}</div>
            <div className="text-xs text-blue-600">TN={sliderValues.tn} FP={sliderValues.fp}</div>
          </div>
        </div>

        {/* ROC Curve + AUC + d' side by side */}
        <div>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">
            ROC Curve
          </h3>
          <div className="flex gap-3">
            <div className="shrink-0">
              <RocCurve
                trajectory={trajectory}
                currentSens={sliderStats.sensitivity}
                currentFpr={1 - sliderStats.specificity}
              />
            </div>
            <div className="space-y-3 text-sm text-slate-600">
              <div>
                <div className="font-semibold text-indigo-700">AUC = {auc.toFixed(3)}</div>
                <p className="text-xs leading-relaxed">
                  Area Under the Curve: measures overall test performance
                  across all thresholds. AUC = 0.5 is a coin flip; AUC = 1.0 is perfect.
                </p>
              </div>
              <div>
                <div className="font-semibold text-indigo-700">d&prime; = {dPrime.toFixed(2)}</div>
                <p className="text-xs leading-relaxed">
                  Discriminability index from signal detection theory.
                  Captures the separation between diseased and healthy distributions.
                  d&prime; = 0 is a coin flip; d&prime; &gt; 3 is excellent.
                </p>
              </div>
            </div>
          </div>
        </div>


      </div>
    </LessonLayout>
  );
}
