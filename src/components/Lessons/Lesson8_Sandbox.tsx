import { useState, useMemo } from "react";
import { LessonLayout } from "./LessonLayout";
import { TruthDiagram } from "../Diagram/TruthDiagram";
import { DiagonalOverlays } from "../Diagram/DiagonalOverlays";
import { toSvg, computeLayout } from "../../utils/geometry";
import { TwoByTwoTable } from "../UI/TwoByTwoTable";
import {
  formatStat,
  formatRatio,
  computeExpectedValues,
  computeChiSquare,
  chiSquarePValue,
} from "../../utils/statistics";
import {
  computeDPrime,
  generateTrajectory,
  computeAUC,
  computeTAI,
  computeCDISimple,
} from "../../utils/trajectory";
import { CELL_COLORS } from "../../utils/colors";
import type { CellValues, DiagnosticStats } from "../../utils/statistics";
import type { OverlayType } from "../Diagram/StatOverlays";
import type { LessonNavProps } from "./lessonTypes";

interface Lesson8Props extends LessonNavProps {
  values: CellValues;
  stats: DiagnosticStats;
  setValue: (key: keyof CellValues, val: number) => void;
  setValues: (v: CellValues) => void;
}

/* ─── Overlay toggle button ─── */

function OverlayToggle({
  label,
  active,
  color,
  onClick,
}: {
  label: string;
  active: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
        active
          ? "text-white border-transparent"
          : "text-black border-slate-200 bg-white hover:bg-slate-50"
      }`}
      style={active ? { backgroundColor: color, borderColor: color } : {}}
    >
      {label}
    </button>
  );
}

/* ─── ROC curve mini component ─── */

const ROC_SIZE = 180;
const ROC_PAD = 28;

function MiniRocCurve({
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
  const fillD = pathD +
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
      <circle cx={tx(currentFpr)} cy={ty(currentSens)} r={4} fill="#4f46e5" stroke="white" strokeWidth={1.5} />
      <text x={ROC_SIZE / 2} y={ROC_SIZE - 4} textAnchor="middle" fontSize={8} fill="#94a3b8">1 − Specificity</text>
      <text x={8} y={ROC_SIZE / 2} textAnchor="middle" fontSize={8} fill="#94a3b8" transform={`rotate(-90, 8, ${ROC_SIZE / 2})`}>Sensitivity</text>
    </svg>
  );
}

/* ─── Main lesson component ─── */

export function Lesson8_Sandbox({
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
  costState,
}: Lesson8Props) {
  const [activeOverlays, setActiveOverlays] = useState<OverlayType[]>([]);
  const [showDiagonals, setShowDiagonals] = useState(false);
  const [showChiSquare, setShowChiSquare] = useState(false);
  const [showTrajectory, setShowTrajectory] = useState(false);
  const [showROC, setShowROC] = useState(false);
  const [showOddsRatio, setShowOddsRatio] = useState(false);

  const toggleOverlay = (ov: OverlayType) => {
    setActiveOverlays((prev) =>
      prev.includes(ov) ? prev.filter((o) => o !== ov) : [...prev, ov]
    );
  };

  // Chi-square
  const expected = useMemo(() => computeExpectedValues(values), [values]);
  const chi2 = useMemo(() => computeChiSquare(values, expected), [values, expected]);
  const pValue = useMemo(() => chiSquarePValue(chi2), [chi2]);

  // Trajectory / ROC
  const diseased = values.tp + values.fn;
  const healthy = values.fp + values.tn;
  const dPrime = useMemo(() => computeDPrime(stats.sensitivity, stats.specificity), [stats.sensitivity, stats.specificity]);
  const trajectory = useMemo(() => generateTrajectory(dPrime, 200), [dPrime]);
  const auc = useMemo(() => computeAUC(trajectory), [trajectory]);
  const tai = useMemo(() => computeTAI(trajectory, diseased, healthy), [trajectory, diseased, healthy]);
  const cdi = useMemo(() => computeCDISimple(trajectory, diseased, healthy), [trajectory, diseased, healthy]);

  // Odds ratio
  const { tp, fp, fn, tn } = values;
  const orValue = fp * fn > 0 ? (tp * tn) / (fp * fn) : Infinity;

  // Trajectory diagram points
  const trajectoryDiagramPoints = useMemo(() => {
    return trajectory.map((p) => {
      const tpVal = Math.round(p.sensitivity * diseased);
      const fpVal = Math.round((1 - p.specificity) * healthy);
      return { diagramX: -fpVal, diagramY: tpVal };
    });
  }, [trajectory, diseased, healthy]);

  // Fixed layout for trajectory mode
  const trajectoryLayout = useMemo(() => {
    if (!showTrajectory) return undefined;
    let maxTp = 0, maxFp = 0, maxFn = 0, maxTn = 0;
    for (const p of trajectory) {
      maxTp = Math.max(maxTp, Math.round(p.sensitivity * diseased));
      maxFp = Math.max(maxFp, Math.round((1 - p.specificity) * healthy));
      maxFn = Math.max(maxFn, diseased - Math.round(p.sensitivity * diseased));
      maxTn = Math.max(maxTn, healthy - Math.round((1 - p.specificity) * healthy));
    }
    return computeLayout({ tp: maxTp, fp: maxFp, fn: maxFn, tn: maxTn }, 560, 500, 65);
  }, [showTrajectory, trajectory, diseased, healthy]);

  return (
    <LessonLayout
      meta={{
        number: 9,
        title: "Summary",
        subtitle: "Explore freely — all overlays, stats, and the 2×2 table",
      }}
      totalLessons={totalLessons}
      onPrev={onPrev}
      onNext={onNext}
      onHome={onHome}
      onGoTo={onGoTo}
      lessonTitles={lessonTitles}
      costState={costState}
      keyInsight={
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
          <p className="text-sm text-indigo-800">
            Free exploration &mdash; toggle any overlay, drag the box, change values, and see
            every statistic update in real time. Use presets below the diagram to load examples.
          </p>
        </div>
      }
      values={values}
      diagramFooter={<TwoByTwoTable values={values} setValue={setValue} setValues={setValues} costState={costState} />}
      diagram={
        <TruthDiagram
          values={values}
          onDrag={costState.costMode ? undefined : setValues}
          overlays={activeOverlays}
          fixedLayout={showTrajectory ? trajectoryLayout : undefined}
          renderExtraSvg={(showDiagonals || showChiSquare || showTrajectory || showOddsRatio) ? (layout) => {
            const { centerX: cx, centerY: cy, scale: s } = layout;
            return (
              <g>
                {showDiagonals && (
                  <DiagonalOverlays values={values} centerX={cx} centerY={cy} scale={s} />
                )}
                {showChiSquare && (() => {
                  const e = expected;
                  const eUl = toSvg(-e.fp, e.tp, cx, cy, s);
                  const eUr = toSvg(e.tn, e.tp, cx, cy, s);
                  const eLl = toSvg(-e.fp, -e.fn, cx, cy, s);
                  const eLr = toSvg(e.tn, -e.fn, cx, cy, s);
                  const pathD = `M${eUl.x},${eUl.y} L${eUr.x},${eUr.y} L${eLr.x},${eLr.y} L${eLl.x},${eLl.y} Z`;
                  return (
                    <g>
                      <path d={pathD} fill="none" stroke="#94a3b8" strokeWidth={2} strokeDasharray="8 4" opacity={0.6} />
                      <text x={eLl.x - 4} y={eLr.y + 14} fontSize={10} fill="#94a3b8" fontWeight={500}>Expected</text>
                    </g>
                  );
                })()}
                {showOddsRatio && (() => {
                  const tpH = tp * s; const fpW = fp * s; const fnH = fn * s; const tnW = tn * s;
                  return (
                    <g>
                      <rect x={cx} y={cy - tpH} width={tnW} height={tpH}
                        fill="#16a34a" fillOpacity={0.12} stroke="#16a34a" strokeWidth={1.5} strokeDasharray="4,3" />
                      {tpH > 10 && tnW > 30 && (
                        <text x={cx + tnW / 2} y={cy - tpH / 2} textAnchor="middle" dominantBaseline="middle"
                          fontSize={10} fontWeight={600} fill="#16a34a" style={{ userSelect: "none" }}>TP×TN</text>
                      )}
                      <rect x={cx - fpW} y={cy} width={fpW} height={fnH}
                        fill="#dc2626" fillOpacity={0.12} stroke="#dc2626" strokeWidth={1.5} strokeDasharray="4,3" />
                      {fnH > 10 && fpW > 30 && (
                        <text x={cx - fpW / 2} y={cy + fnH / 2} textAnchor="middle" dominantBaseline="middle"
                          fontSize={10} fontWeight={600} fill="#dc2626" style={{ userSelect: "none" }}>FP×FN</text>
                      )}
                    </g>
                  );
                })()}
                {showTrajectory && (() => {
                  const svgPts = trajectoryDiagramPoints.map((p) => toSvg(p.diagramX, p.diagramY, cx, cy, s));
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
                  const opPt = toSvg(-fp, tp, cx, cy, s);
                  return (
                    <g>
                      <line x1={chanceStart.x} y1={chanceStart.y} x2={chanceEnd.x} y2={chanceEnd.y}
                        stroke="#ef4444" strokeWidth={1.5} strokeDasharray="8 5" opacity={0.5} />
                      <path d={pathD} fill="none" stroke="#eab308" strokeWidth={3} opacity={0.85} />
                      <circle cx={opPt.x} cy={opPt.y} r={5} fill="#1e293b" stroke="white" strokeWidth={1.5} />
                    </g>
                  );
                })()}
              </g>
            );
          } : undefined}
        />
      }
    >
      <div className="space-y-4">
        {/* Overlay toggles */}
        <div>
          <h3 className="text-xs font-semibold text-black uppercase tracking-wide mb-2">
            Overlays
          </h3>
          <div className="flex flex-wrap gap-2">
            <OverlayToggle label="Sensitivity" active={activeOverlays.includes("sensitivity")}
              color={CELL_COLORS.tp} onClick={() => toggleOverlay("sensitivity")} />
            <OverlayToggle label="Specificity" active={activeOverlays.includes("specificity")}
              color={CELL_COLORS.tn} onClick={() => toggleOverlay("specificity")} />
            <OverlayToggle label="PPV" active={activeOverlays.includes("ppv")}
              color={CELL_COLORS.tp} onClick={() => toggleOverlay("ppv")} />
            <OverlayToggle label="NPV" active={activeOverlays.includes("npv")}
              color={CELL_COLORS.tn} onClick={() => toggleOverlay("npv")} />
            <OverlayToggle label="Odds Ratio" active={showOddsRatio}
              color="#7c3aed" onClick={() => setShowOddsRatio(!showOddsRatio)} />
            <OverlayToggle label="+/− LR" active={showDiagonals}
              color="#64748b" onClick={() => setShowDiagonals(!showDiagonals)} />
            <OverlayToggle label="Chi²" active={showChiSquare}
              color="#4f46e5" onClick={() => setShowChiSquare(!showChiSquare)} />
            <OverlayToggle label="Trajectory" active={showTrajectory}
              color="#ca8a04" onClick={() => setShowTrajectory(!showTrajectory)} />
            <OverlayToggle label="ROC" active={showROC}
              color="#6366f1" onClick={() => setShowROC(!showROC)} />
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Trajectory / ROC panels */}
        {showTrajectory && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 space-y-1.5">
            <h4 className="text-xs font-bold text-black uppercase">Trajectory Metrics</h4>
            <div className="flex justify-between text-sm"><span>TAI</span><span className="font-bold text-indigo-700">{tai.toFixed(3)}</span></div>
            <div className="flex justify-between text-sm"><span>CDI</span><span className="font-bold text-purple-700">{cdi.toFixed(3)}</span></div>
            <p className="text-xs text-amber-700 italic mt-1">
              Modeled trajectory (fictional). For real data, go to the <strong>Curve Data</strong> page.
            </p>
          </div>
        )}

        {showROC && (
          <div className="space-y-2">
            <div className="flex gap-3 items-start">
              <div className="shrink-0">
                <MiniRocCurve trajectory={trajectory} currentSens={stats.sensitivity} currentFpr={1 - stats.specificity} />
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span>AUC</span><span className="font-bold text-indigo-700">{auc.toFixed(3)}</span></div>
                <div className="flex justify-between"><span>d&prime;</span><span className="font-bold text-slate-700">{dPrime.toFixed(2)}</span></div>
              </div>
            </div>
            <p className="text-xs text-amber-700 italic">
              Modeled ROC curve (fictional). For real data, go to the <strong>Curve Data</strong> page.
            </p>
          </div>
        )}

        {/* All statistics */}
        {(() => {
          const isCost = costState.costMode;
          const suffix = isCost ? "\u1D9C\u1D52\u02E2\u1D57" : "";
          return (
            <>
              <div>
                <h3 className="text-xs font-semibold text-black uppercase tracking-wide mb-2">
                  All Statistics{isCost && <sub className="text-[9px] text-orange-500 ml-0.5">cost</sub>}
                </h3>
                <div className="space-y-1">
                  <StatRow label={`Sensitivity${suffix}`} value={formatStat(stats.sensitivity)} color={CELL_COLORS.tp} />
                  <StatRow label={`Specificity${suffix}`} value={formatStat(stats.specificity)} color={CELL_COLORS.tn} />
                  <StatRow label={`PPV${suffix}`} value={formatStat(stats.ppv)} color={CELL_COLORS.tp} />
                  <StatRow label={`NPV${suffix}`} value={formatStat(stats.npv)} color={CELL_COLORS.tn} />
                  <StatRow label={`Accuracy${suffix}`} value={formatStat(stats.accuracy)} color="#64748b" />
                  <StatRow label={`Prevalence${suffix}`} value={formatStat(stats.prevalence)} color="#94a3b8" />
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-black uppercase tracking-wide mb-2">
                  Advanced{isCost && <sub className="text-[9px] text-orange-500 ml-0.5">cost</sub>}
                </h3>
                <div className="space-y-1">
                  <StatRow label={`Positive LR${suffix}`} value={formatRatio(stats.positiveLR)} color="#16a34a" />
                  <StatRow label={`Negative LR${suffix}`} value={formatRatio(stats.negativeLR)} color="#dc2626" />
                  <StatRow label={`Odds Ratio${suffix}`} value={orValue === Infinity ? "\u221E" : orValue.toFixed(1)} color="#7c3aed" />
                  <StatRow label={`Pretest Odds${suffix}`} value={formatRatio(stats.pretestOdds)} color="#64748b" />
                  <StatRow label="\u03C7\u00B2" value={formatRatio(chi2)} color="#4f46e5" />
                  <StatRow label="p-value" value={pValue < 0.001 ? "< 0.001" : pValue.toFixed(4)}
                    color={pValue < 0.05 ? "#16a34a" : "#ca8a04"} />
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between text-xs text-black bg-slate-50 rounded-md px-2 py-1.5">
                <span>Total {isCost ? "cost" : "subjects"}</span>
                <span className="font-bold text-slate-800 tabular-nums">{stats.total}</span>
              </div>
            </>
          );
        })()}
      </div>
    </LessonLayout>
  );
}

/* ─── Helper row component ─── */

function StatRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-slate-50">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-3.5 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-xs font-medium text-slate-700">{label}</span>
      </div>
      <span className="text-xs font-semibold text-slate-800 tabular-nums">{value}</span>
    </div>
  );
}
