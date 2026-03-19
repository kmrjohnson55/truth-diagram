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

/* ─── Quality labels ─── */

function aucQuality(auc: number): { label: string; color: string; bg: string } {
  if (auc >= 0.9) return { label: "Excellent", color: "#15803d", bg: "#f0fdf4" };
  if (auc >= 0.8) return { label: "Good", color: "#16a34a", bg: "#f0fdf4" };
  if (auc >= 0.7) return { label: "Fair", color: "#ca8a04", bg: "#fefce8" };
  return { label: "Poor", color: "#dc2626", bg: "#fef2f2" };
}

function dPrimeQuality(d: number): { label: string; color: string; bg: string } {
  if (d >= 3) return { label: "Excellent", color: "#15803d", bg: "#f0fdf4" };
  if (d >= 2) return { label: "Good", color: "#16a34a", bg: "#f0fdf4" };
  if (d >= 1) return { label: "Fair", color: "#ca8a04", bg: "#fefce8" };
  return { label: "Poor", color: "#dc2626", bg: "#fef2f2" };
}

/* ─── ROC curve component ─── */

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

  // Grid lines at 0.25, 0.5, 0.75
  const gridTicks = [0.25, 0.5, 0.75];

  return (
    <svg viewBox={`0 0 ${ROC_SIZE} ${ROC_SIZE}`} style={{ width: "100%", maxWidth: ROC_SIZE, background: "white", borderRadius: 8 }}>
      <rect width={ROC_SIZE} height={ROC_SIZE} fill="white" rx={8} />

      {/* Grid lines */}
      {gridTicks.map((v) => (
        <g key={v}>
          <line x1={tx(v)} y1={ROC_PAD} x2={tx(v)} y2={ROC_SIZE - ROC_PAD}
            stroke="#e2e8f0" strokeWidth={0.5} strokeDasharray="3 3" />
          <line x1={ROC_PAD} y1={ty(v)} x2={ROC_SIZE - ROC_PAD} y2={ty(v)}
            stroke="#e2e8f0" strokeWidth={0.5} strokeDasharray="3 3" />
          <text x={tx(v)} y={ROC_SIZE - ROC_PAD + 12} textAnchor="middle" fontSize={8} fill="#94a3b8">{v.toFixed(2)}</text>
          <text x={ROC_PAD - 4} y={ty(v) + 3} textAnchor="end" fontSize={8} fill="#94a3b8">{v.toFixed(2)}</text>
        </g>
      ))}

      {/* Axes */}
      <line x1={ROC_PAD} y1={ROC_PAD} x2={ROC_PAD} y2={ROC_SIZE - ROC_PAD} stroke="#cbd5e1" strokeWidth={1} />
      <line x1={ROC_PAD} y1={ROC_SIZE - ROC_PAD} x2={ROC_SIZE - ROC_PAD} y2={ROC_SIZE - ROC_PAD} stroke="#cbd5e1" strokeWidth={1} />

      {/* Chance line */}
      <line x1={ROC_PAD} y1={ROC_SIZE - ROC_PAD} x2={ROC_SIZE - ROC_PAD} y2={ROC_PAD}
        stroke="#ef4444" strokeWidth={1} strokeDasharray="4 3" opacity={0.5} />

      {/* AUC fill + curve */}
      <path d={fillD} fill="#4f46e5" opacity={0.08} />
      <path d={pathD} fill="none" stroke="#4f46e5" strokeWidth={2} />

      {/* Current operating point */}
      <circle cx={tx(currentFpr)} cy={ty(currentSens)} r={5}
        fill="#4f46e5" stroke="white" strokeWidth={1.5} />

      {/* Axis labels */}
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

/* ─── Main lesson component ─── */

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
  const aucQ = aucQuality(auc);
  const dpQ = dPrimeQuality(dPrime);

  // Trajectory points for truth diagram (UL corner path)
  const trajectoryDiagramPoints = useMemo(() => {
    return trajectory.map((p) => {
      const tpVal = Math.round(p.sensitivity * diseased);
      const fpVal = Math.round((1 - p.specificity) * healthy);
      return { diagramX: -fpVal, diagramY: tpVal };
    });
  }, [trajectory, diseased, healthy]);

  // Fixed layout — compute actual extent from trajectory points
  const fixedLayout = useMemo(() => {
    let maxTp = 0, maxFp = 0, maxFn = 0, maxTn = 0;
    for (const p of trajectory) {
      const tpVal = Math.round(p.sensitivity * diseased);
      const fpVal = Math.round((1 - p.specificity) * healthy);
      maxTp = Math.max(maxTp, tpVal);
      maxFp = Math.max(maxFp, fpVal);
      maxFn = Math.max(maxFn, diseased - tpVal);
      maxTn = Math.max(maxTn, healthy - fpVal);
    }
    return computeLayout({ tp: maxTp, fp: maxFp, fn: maxFn, tn: maxTn }, 560, 500, 65);
  }, [trajectory, diseased, healthy]);

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
            This means the ROC curve ignores predictive values.
          </p>
        </div>
      }
      values={values}
      diagramFooter={<TwoByTwoTable values={sliderValues} setValue={setValue} setValues={setValues} />}
      diagram={
        <TruthDiagram
          values={sliderValues}
          onDrag={setValues}
          overlays={["sensitivity", "specificity"]}
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
            const chanceStart = toSvg(0, 0, cx, cy, s);
            const ratio = healthy > 0 ? diseased / healthy : 1;
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
              <div className="bg-slate-50 rounded-lg p-2 mx-auto max-w-md">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-0.5">
                  <span>Threshold</span>
                  <span className="font-mono font-semibold text-slate-700">{threshold.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={-3.5}
                  max={3.5}
                  step={0.05}
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>&larr; More sensitive</span>
                  <span>More specific &rarr;</span>
                </div>
              </div>
            </div>
          }
        />
      }
    >
      <div className="space-y-4">
        {/* Threshold explanation */}
        <div>
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
            The Threshold
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Many diagnostic tests produce a continuous measurement (e.g., blood glucose,
            PSA level, troponin). A <strong>threshold</strong> is chosen to classify results
            as &ldquo;positive&rdquo; or &ldquo;negative.&rdquo; Lowering the threshold
            catches more disease (higher sensitivity) but creates more false alarms (lower
            specificity). The slider below the diagram controls this threshold.
          </p>
        </div>

        {/* Diagram legend */}
        <div className="text-xs text-slate-600 space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-block w-5 h-0.5 rounded" style={{ background: "#eab308" }} />
            <span><strong className="text-yellow-600">Yellow curve</strong> = test trajectory (all possible thresholds)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-5 h-0.5 rounded border-t border-dashed border-red-400" />
            <span><strong className="text-red-500">Red dashed</strong> = chance trajectory (no diagnostic value)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-800" />
            <span><strong>Black dot</strong> = current operating point (threshold)</span>
          </div>
        </div>

        {/* Live stats — 2×2 grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-green-50 rounded-lg p-2 text-center">
            <div className="text-[10px] text-green-600 font-semibold uppercase">Sensitivity</div>
            <div className="text-base font-bold text-green-700 tabular-nums">{formatStat(sliderStats.sensitivity)}</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-2 text-center">
            <div className="text-[10px] text-blue-600 font-semibold uppercase">Specificity</div>
            <div className="text-base font-bold text-blue-700 tabular-nums">{formatStat(sliderStats.specificity)}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-2 text-center">
            <div className="text-[10px] text-green-600 font-semibold uppercase">PPV</div>
            <div className="text-base font-bold text-green-700 tabular-nums">{formatStat(sliderStats.ppv)}</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-2 text-center">
            <div className="text-[10px] text-blue-600 font-semibold uppercase">NPV</div>
            <div className="text-base font-bold text-blue-700 tabular-nums">{formatStat(sliderStats.npv)}</div>
          </div>
        </div>

        {/* ROC Curve + AUC + d' */}
        <div>
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
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
            <div className="space-y-2 text-sm text-slate-600">
              {/* AUC badge */}
              <div className="rounded-lg p-2" style={{ backgroundColor: aucQ.bg }}>
                <div className="flex items-center gap-2">
                  <span className="font-bold" style={{ color: aucQ.color }}>AUC = {auc.toFixed(3)}</span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: aucQ.color }}>
                    {aucQ.label}
                  </span>
                </div>
                <p className="text-[10px] leading-relaxed mt-0.5 text-slate-500">
                  Overall performance across all thresholds. 0.5 = coin flip, 1.0 = perfect.
                </p>
              </div>
              {/* d' badge */}
              <div className="rounded-lg p-2" style={{ backgroundColor: dpQ.bg }}>
                <div className="flex items-center gap-2">
                  <span className="font-bold" style={{ color: dpQ.color }}>d&prime; = {dPrime.toFixed(2)}</span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: dpQ.color }}>
                    {dpQ.label}
                  </span>
                </div>
                <p className="text-[10px] leading-relaxed mt-0.5 text-slate-500">
                  Separation between diseased and healthy distributions. 0 = no separation, &gt;3 = excellent.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </LessonLayout>
  );
}
