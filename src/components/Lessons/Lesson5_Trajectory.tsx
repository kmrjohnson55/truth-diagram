import { useState, useMemo, useEffect } from "react";
import { LessonLayout } from "./LessonLayout";
import { TruthDiagram } from "../Diagram/TruthDiagram";
import { formatStat, computeStats } from "../../utils/statistics";
import {
  computeDPrime,
  trajectoryPoint,
  generateTrajectory,
  thresholdFromSensitivity,
  computeAUC,
} from "../../utils/trajectory";
import { presets, generalPresets, clinicalPresets } from "../../utils/presets";
import type { CellValues, DiagnosticStats } from "../../utils/statistics";
import type { LessonNavProps } from "./lessonTypes";

interface Lesson5Props extends LessonNavProps {
  values: CellValues;
  stats: DiagnosticStats;
  setValues: (v: CellValues) => void;
}

const ROC_SIZE = 220;
const ROC_PAD = 32;

function RocCurve({
  trajectory,
  currentSens,
  currentFpr,
  auc,
}: {
  trajectory: { sensitivity: number; specificity: number }[];
  currentSens: number;
  currentFpr: number;
  auc: number;
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

  // Filled area under the curve
  const first = trajectory[0];
  const last = trajectory[trajectory.length - 1];
  const fillD =
    pathD +
    ` L${tx(1 - last.specificity).toFixed(1)},${ty(0).toFixed(1)}` +
    ` L${tx(1 - first.specificity).toFixed(1)},${ty(0).toFixed(1)} Z`;

  return (
    <svg viewBox={`0 0 ${ROC_SIZE} ${ROC_SIZE}`} style={{ width: "100%", maxWidth: ROC_SIZE, background: "white", borderRadius: 8 }}>
      <rect width={ROC_SIZE} height={ROC_SIZE} fill="white" rx={8} />

      {/* Axes */}
      <line x1={ROC_PAD} y1={ROC_PAD} x2={ROC_PAD} y2={ROC_SIZE - ROC_PAD} stroke="#cbd5e1" strokeWidth={1} />
      <line x1={ROC_PAD} y1={ROC_SIZE - ROC_PAD} x2={ROC_SIZE - ROC_PAD} y2={ROC_SIZE - ROC_PAD} stroke="#cbd5e1" strokeWidth={1} />

      {/* Chance line */}
      <line x1={ROC_PAD} y1={ROC_SIZE - ROC_PAD} x2={ROC_SIZE - ROC_PAD} y2={ROC_PAD}
        stroke="#ef4444" strokeWidth={1} strokeDasharray="4 3" opacity={0.5} />

      {/* AUC shaded area */}
      <path d={fillD} fill="#4f46e5" opacity={0.08} />

      {/* ROC curve */}
      <path d={pathD} fill="none" stroke="#4f46e5" strokeWidth={2} />

      {/* Current operating point */}
      <circle cx={tx(currentFpr)} cy={ty(currentSens)} r={5}
        fill="#4f46e5" stroke="white" strokeWidth={1.5} />

      {/* AUC label */}
      <text x={ROC_SIZE - ROC_PAD - 4} y={ROC_SIZE - ROC_PAD - 8}
        textAnchor="end" fontSize={11} fontWeight={600} fill="#4f46e5">
        AUC = {auc.toFixed(3)}
      </text>

      {/* Labels */}
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
  totalLessons,
  onPrev,
  onNext,
  onHome,
  onGoTo,
  lessonTitles,
}: Lesson5Props) {
  const diseased = values.tp + values.fn;
  const healthy = values.fp + values.tn;

  // Compute d' from the user's current values
  const dPrime = useMemo(
    () => computeDPrime(stats.sensitivity, stats.specificity),
    [stats.sensitivity, stats.specificity]
  );

  // Current threshold
  const initialThreshold = useMemo(
    () => thresholdFromSensitivity(dPrime, stats.sensitivity),
    [dPrime, stats.sensitivity]
  );

  const [threshold, setThreshold] = useState(initialThreshold);

  // Reset threshold when underlying values change (e.g. preset switch)
  useEffect(() => {
    setThreshold(thresholdFromSensitivity(dPrime, stats.sensitivity));
  }, [values.tp, values.fp, values.fn, values.tn]);

  // Box at current slider position
  const sliderValues = useMemo(
    () => trajectoryPoint(dPrime, threshold, diseased, healthy),
    [dPrime, threshold, diseased, healthy]
  );
  const sliderStats = useMemo(() => computeStats(sliderValues), [sliderValues]);

  // Full trajectory for the curve
  const trajectory = useMemo(
    () => generateTrajectory(dPrime, 120),
    [dPrime]
  );

  // AUC
  const auc = useMemo(() => computeAUC(trajectory), [trajectory]);

  return (
    <LessonLayout
      meta={{
        number: 4,
        title: "Test Trajectory & ROC",
        subtitle: "How the threshold tradeoff shapes the diagram",
      }}
      totalLessons={totalLessons}
      onPrev={onPrev}
      onNext={onNext}
      onHome={onHome}
      onGoTo={onGoTo}
      lessonTitles={lessonTitles}
      diagramHeader={
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-amber-800">
            <strong>Key insight:</strong> The truth diagram and ROC curve contain
            similar information, but the diagram preserves{" "}
            <em>prevalence</em> (the box shape), which the ROC curve discards.
          </p>
        </div>
      }
      diagram={
        <TruthDiagram
          values={sliderValues}
          onDrag={setValues}
          overlays={["sensitivity", "specificity"]}
        />
      }
    >
      <div className="space-y-5">
        <div>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">
            The Threshold Tradeoff
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Most diagnostic tests have an adjustable threshold (cutoff value).
            Moving the threshold changes the balance between sensitivity and
            specificity &mdash; you can&rsquo;t improve both at once.
          </p>
        </div>

        {/* Live stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="text-xs text-green-600 font-semibold uppercase">Sensitivity</div>
            <div className="text-lg font-bold text-green-700">{formatStat(sliderStats.sensitivity)}</div>
            <div className="text-xs text-green-500">TP={sliderValues.tp} FN={sliderValues.fn}</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-xs text-blue-600 font-semibold uppercase">Specificity</div>
            <div className="text-lg font-bold text-blue-700">{formatStat(sliderStats.specificity)}</div>
            <div className="text-xs text-blue-500">TN={sliderValues.tn} FP={sliderValues.fp}</div>
          </div>
        </div>

        {/* ROC Curve */}
        <div>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">
            ROC Curve
          </h3>
          <RocCurve
            trajectory={trajectory}
            currentSens={sliderStats.sensitivity}
            currentFpr={1 - sliderStats.specificity}
            auc={auc}
          />
          <p className="text-xs text-slate-500 mt-2">
            The <strong className="text-indigo-600">blue curve</strong> shows all
            possible sensitivity/specificity pairs for this test. The{" "}
            <span className="text-red-400">dashed red line</span> is a worthless
            test (coin flip). The <strong className="text-indigo-600">dot</strong>{" "}
            marks the current threshold position. The shaded area under the
            curve (AUC) measures overall test performance: 0.5 = chance, 1.0 = perfect.
          </p>
        </div>

        {/* Slider — below the ROC diagram */}
        <div className="bg-slate-50 rounded-lg p-3">
          <label className="text-xs font-semibold text-slate-500 uppercase block mb-2">
            Threshold Slider
          </label>
          <input
            type="range"
            min={-3.5}
            max={3.5}
            step={0.05}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-full accent-indigo-500"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>&larr; More sensitive</span>
            <span>More specific &rarr;</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Drag the slider to move the operating point along the ROC curve.
            The truth diagram and live stats update in real time.
          </p>
        </div>

        {/* d-prime explanation */}
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              d&prime; (d-prime)
            </span>
            <span className="text-lg font-bold text-indigo-600">{dPrime.toFixed(2)}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            d&prime; is the <em>discriminability index</em> from signal detection
            theory: d&prime; = &Phi;&sup1;(sensitivity) + &Phi;&sup1;(specificity),
            where &Phi;&sup1; is the inverse normal CDF. It captures the
            separation between the diseased and healthy distributions.
            A higher d&prime; means a more discriminating test. d&prime; = 0
            is a coin flip; d&prime; &gt; 3 is excellent.
          </p>
        </div>

        {/* Preset selector */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">
            Presets
          </label>
          <select
            onChange={(e) => {
              const preset = presets[parseInt(e.target.value)];
              if (preset) setValues(preset.values);
            }}
            defaultValue=""
            className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md
              focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent
              bg-white text-slate-800"
          >
            <option value="" disabled>
              Load a preset...
            </option>
            <optgroup label="General Examples">
              {generalPresets.map((p) => (
                <option key={p.name} value={presets.indexOf(p)}>
                  {p.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Clinical Examples">
              {clinicalPresets.map((p) => (
                <option key={p.name} value={presets.indexOf(p)}>
                  {p.name}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        <div className="text-xs text-slate-400 bg-slate-50 rounded-lg p-3">
          <strong>Try it:</strong> Move the slider left to increase sensitivity
          (catch more disease) at the cost of specificity (more false alarms).
          Watch the box shape stay the same while its position on the axes changes.
        </div>
      </div>
    </LessonLayout>
  );
}
