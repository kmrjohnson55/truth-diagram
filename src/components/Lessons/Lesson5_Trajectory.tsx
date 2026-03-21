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
  snapToTrajectory,
  computeAUC,
  computeTAI,
  computeCDISimple,
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

  const gridTicks = [0.25, 0.5, 0.75];

  return (
    <svg viewBox={`0 0 ${ROC_SIZE} ${ROC_SIZE}`} style={{ width: "100%", maxWidth: ROC_SIZE, background: "white", borderRadius: 8 }}>
      <rect width={ROC_SIZE} height={ROC_SIZE} fill="white" rx={8} />
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
      <line x1={ROC_PAD} y1={ROC_PAD} x2={ROC_PAD} y2={ROC_SIZE - ROC_PAD} stroke="#cbd5e1" strokeWidth={1} />
      <line x1={ROC_PAD} y1={ROC_SIZE - ROC_PAD} x2={ROC_SIZE - ROC_PAD} y2={ROC_SIZE - ROC_PAD} stroke="#cbd5e1" strokeWidth={1} />
      <line x1={ROC_PAD} y1={ROC_SIZE - ROC_PAD} x2={ROC_SIZE - ROC_PAD} y2={ROC_PAD}
        stroke="#ef4444" strokeWidth={1} strokeDasharray="4 3" opacity={0.5} />
      <path d={fillD} fill="#4f46e5" opacity={0.08} />
      <path d={pathD} fill="none" stroke="#4f46e5" strokeWidth={2} />
      <circle cx={tx(currentFpr)} cy={ty(currentSens)} r={5}
        fill="#4f46e5" stroke="white" strokeWidth={1.5} />
      <text x={ROC_SIZE / 2} y={ROC_SIZE - 6} textAnchor="middle" fontSize={10} fill="#94a3b8">
        1 &minus; Specificity (FPR)
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
  costState,
  testToggle,
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
  const tai = useMemo(() => computeTAI(trajectory, diseased, healthy), [trajectory, diseased, healthy]);
  const cdi = useMemo(() => computeCDISimple(trajectory, diseased, healthy), [trajectory, diseased, healthy]);
  const aucQ = aucQuality(auc);
  const taiQ = aucQuality(tai); // same scale
  const cdiQ = aucQuality(cdi);
  const dpQ = dPrimeQuality(dPrime);

  // Trajectory points for truth diagram (UL corner path)
  const trajectoryDiagramPoints = useMemo(() => {
    return trajectory.map((p) => {
      const tpVal = Math.round(p.sensitivity * diseased);
      const fpVal = Math.round((1 - p.specificity) * healthy);
      return { diagramX: -fpVal, diagramY: tpVal };
    });
  }, [trajectory, diseased, healthy]);

  // Fixed layout
  const fixedLayout = useMemo(() => {
    let maxTp = 0, maxFp = 0, maxFn = 0, maxTn = 0;
    for (const p of trajectory) {
      const tpVal = Math.round(p.sensitivity * diseased);
      const fpVal = Math.round((1 - p.specificity) * healthy);
      const fnVal = diseased - Math.round(p.sensitivity * diseased);
      const tnVal = healthy - Math.round((1 - p.specificity) * healthy);
      maxTp = Math.max(maxTp, tpVal);
      maxFp = Math.max(maxFp, fpVal);
      maxFn = Math.max(maxFn, fnVal);
      maxTn = Math.max(maxTn, tnVal);
    }
    return computeLayout({ tp: maxTp, fp: maxFp, fn: maxFn, tn: maxTn }, 560, 500, 65);
  }, [trajectory, diseased, healthy]);

  return (
    <LessonLayout
      meta={{
        number: 6,
        title: "ROC Curves",
        subtitle: "How the threshold tradeoff shapes the diagram",
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
            <strong>Key insight:</strong> The ROC curve is often used to assess the value of a diagnostic test. The truth diagram and ROC curve contain similar information, but the diagram preserves <em>prevalence</em> (the box shape) and uses absolute subject counts, which the ROC curve discards. If you have the test trajectory on the truth diagram, you can always construct the ROC curve; but given only the ROC curve, you cannot reconstruct the trajectory without knowing the group sizes.
          </p>
        </div>
      }
      values={values}
      diagramFooter={
        <div className="space-y-3">
          <div className="flex gap-3">
            {/* ROC curve on left */}
            <div className="shrink-0">
              <RocCurve
                trajectory={trajectory}
                currentSens={sliderStats.sensitivity}
                currentFpr={1 - sliderStats.specificity}
              />
            </div>
            {/* Metrics on right */}
            <div className="flex-1 space-y-2 text-sm text-black">
              {/* ROC-based metrics */}
              <div className="rounded-lg p-2" style={{ backgroundColor: aucQ.bg }}>
                <div className="flex items-center gap-2">
                  <span className="font-bold" style={{ color: aucQ.color }}>AUC = {auc.toFixed(3)}</span>
                  <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: aucQ.color }}>{aucQ.label}</span>
                </div>
                <p className="text-xs leading-relaxed mt-0.5 text-black">
                  Area Under the ROC Curve. Ignores prevalence.
                </p>
                <p className="text-xs text-black mt-0.5 opacity-60">&lt;0.7 poor &middot; 0.7–0.8 fair &middot; 0.8–0.9 good &middot; &ge;0.9 excellent</p>
              </div>
              <div className="rounded-lg p-2" style={{ backgroundColor: dpQ.bg }}>
                <div className="flex items-center gap-2">
                  <span className="font-bold" style={{ color: dpQ.color }}>d&prime; = {dPrime.toFixed(2)}</span>
                  <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: dpQ.color }}>{dpQ.label}</span>
                </div>
                <p className="text-xs leading-relaxed mt-0.5 text-black">
                  Separation between diseased and healthy distributions (signal detection theory).
                </p>
                <p className="text-xs text-black mt-0.5 opacity-60">&lt;1 poor &middot; 1–2 fair &middot; 2–3 good &middot; &ge;3 excellent</p>
              </div>
              {/* Trajectory-based metrics */}
              <div className="rounded-lg p-2 border border-indigo-200 bg-indigo-50">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-indigo-700">TAI = {tai.toFixed(3)}</span>
                  <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: taiQ.color }}>{taiQ.label}</span>
                </div>
                <p className="text-xs leading-relaxed mt-0.5 text-black">
                  <strong>Trajectory Area Index.</strong> Like AUC but prevalence-sensitive.
                </p>
                <p className="text-xs text-black mt-0.5 opacity-60">&lt;0.7 poor &middot; 0.7–0.8 fair &middot; 0.8–0.9 good &middot; &ge;0.9 excellent</p>
              </div>
              <div className="rounded-lg p-2 border border-purple-200 bg-purple-50">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-purple-700">CDI = {cdi.toFixed(3)}</span>
                  <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: cdiQ.color }}>{cdiQ.label}</span>
                </div>
                <p className="text-xs leading-relaxed mt-0.5 text-black">
                  <strong>Clinical Discrimination Index.</strong> Average PPV and NPV across all thresholds. Prevalence-sensitive.
                </p>
                <p className="text-xs text-black mt-0.5 opacity-60">&lt;0.7 poor &middot; 0.7–0.8 fair &middot; 0.8–0.9 good &middot; &ge;0.9 excellent</p>
              </div>
            </div>
          </div>
          <TwoByTwoTable values={sliderValues} setValue={setValue} setValues={setValues} costState={costState} />
        </div>
      }
      diagram={
        <TruthDiagram
          values={sliderValues}
          onDrag={(proposed) => {
            // Constrain the box to the trajectory curve
            const snapped = snapToTrajectory(proposed, dPrime, diseased, healthy);
            setValues(snapped);
            // Update threshold slider to match the snapped position
            const newSens = diseased > 0 ? snapped.tp / diseased : 0;
            setThreshold(thresholdFromSensitivity(dPrime, Math.max(0.001, Math.min(0.999, newSens))));
          }}
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
            const ext = Math.min(healthy, diseased / ratio);
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
              <div className="flex items-center justify-center gap-4 text-xs text-black">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-5 h-0.5 rounded" style={{ background: "#eab308" }} />
                  <span><strong className="text-yellow-600">Yellow</strong> = test trajectory</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-5 h-0.5 rounded border-t border-dashed border-red-400" />
                  <span><strong className="text-red-500">Red</strong> = chance</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-800" />
                  <span><strong>Dot</strong> = current threshold</span>
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-2 mx-auto max-w-md">
                <div className="flex items-center justify-between text-xs text-black mb-0.5">
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
                <div className="flex justify-between text-xs text-black">
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
        {/* Bold heading */}
        <h2 className="text-xl font-bold text-black">Receiver Operating Curves (ROC)</h2>

        {/* Threshold and trajectory explanation */}
        <div>
          <h3 className="text-xs font-bold text-black uppercase tracking-wide mb-1">
            Thresholds and the Test Trajectory
          </h3>
          <p className="text-base text-black leading-relaxed">
            Many diagnostic tests produce a continuous measurement (e.g., blood glucose,
            PSA level, troponin). A <strong>threshold</strong> is chosen to classify results
            as positive or negative. Lowering the threshold catches more disease
            (higher sensitivity) but creates more false alarms (lower specificity).
          </p>
          <p className="text-base text-black leading-relaxed mt-2">
            On the truth diagram, changing the threshold moves the box: lowering it
            pushes the box upward and leftward (more TPs, more FPs), while raising it
            pulls the box downward and rightward (fewer TPs, fewer FPs). The <strong>upper-left
            corner</strong> of the box traces a curved path called the <strong className="text-yellow-600">test trajectory</strong> as the threshold sweeps across its full range. This trajectory is seldom a straight line because sensitivity and specificity change together in a coupled way.
          </p>
          <p className="text-base text-black leading-relaxed mt-2">
            The <strong className="text-red-500">chance trajectory</strong> (red dashed diagonal)
            represents a test with no discriminatory value &mdash; along this line, the
            post-test probability of disease always equals the pre-test probability at every box position. The farther the
            test trajectory deviates from the chance line toward the upper-right quadrant,
            the better the test discriminates.
          </p>
        </div>

        {/* Trajectory vs ROC */}
        <div>
          <h3 className="text-xs font-bold text-black uppercase tracking-wide mb-1">
            Trajectory vs. ROC Curve
          </h3>
          <p className="text-base text-black leading-relaxed">
            The ROC curve and the test trajectory are generated by the same process &mdash;
            sweeping the threshold and plotting sensitivity against the false-positive rate.
            However, the ROC curve uses dimensionless proportions (rates), while the truth
            diagram uses absolute subject counts. At 50% prevalence, the trajectory has precisely
            the shape of the ROC curve (flipped left to right), but as prevalence deviates
            from 50%, the trajectory is stretched or compressed along the hemiaxes.
          </p>
          <p className="text-base text-black leading-relaxed mt-2">
            Critically, the truth diagram trajectory preserves <em>prevalence</em> and
            shows <em>predictive values</em> directly, which the ROC curve discards. The
            ROC curve&rsquo;s tendency to obscure the influence of prevalence can be a
            liability &mdash; two populations with very different disease rates might produce identical
            ROC curves but very different predictive values and clinical outcomes.
          </p>
        </div>

        {/* Live stats */}
        {(() => {
          const sub = costState.costMode ? <sub className="text-[9px] text-orange-500">cost</sub> : null;
          return (
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-green-50 rounded-lg p-2 text-center">
                <div className="text-xs text-green-600 font-semibold uppercase">Sensitivity{sub}</div>
                <div className="text-base font-bold text-green-700 tabular-nums">{formatStat(sliderStats.sensitivity)}</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-2 text-center">
                <div className="text-xs text-blue-600 font-semibold uppercase">Specificity{sub}</div>
                <div className="text-base font-bold text-blue-700 tabular-nums">{formatStat(sliderStats.specificity)}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-2 text-center">
                <div className="text-xs text-green-600 font-semibold uppercase">PPV{sub}</div>
                <div className="text-base font-bold text-green-700 tabular-nums">{formatStat(sliderStats.ppv)}</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-2 text-center">
                <div className="text-xs text-blue-600 font-semibold uppercase">NPV{sub}</div>
                <div className="text-base font-bold text-blue-700 tabular-nums">{formatStat(sliderStats.npv)}</div>
              </div>
            </div>
          );
        })()}

        {/* About the modeled trajectory */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-1">
            About This Trajectory
          </h3>
          <p className="text-sm text-amber-800 leading-relaxed">
            The trajectory shown here is a <strong>theoretical model</strong> based on signal detection theory, assuming Gaussian equal-variance distributions for the diseased and healthy populations. It is generated from the single operating point you set by dragging the box. In practice, a real test trajectory must be determined empirically by testing the diagnostic measure against a <strong>gold standard</strong> reference at multiple thresholds, using actual patient data. The resulting real-world curve is often asymmetric and irregular, reflecting the true distributional characteristics of the populations being tested.
          </p>
        </div>

      </div>
    </LessonLayout>
  );
}
