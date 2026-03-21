import { useState, useMemo, useCallback, useRef } from "react";
import { LessonLayout } from "./LessonLayout";
import { TruthDiagram } from "../Diagram/TruthDiagram";
import { formatStat, formatRatio, computeStats, computeExpectedValues, computeChiSquare } from "../../utils/statistics";
import { computeLayout, toSvg, computeAutoMagnification } from "../../utils/geometry";
import type { CellValues, DiagnosticStats } from "../../utils/statistics";
import type { LessonNavProps, CostState } from "./lessonTypes";

interface CompareProps extends LessonNavProps {
  values: CellValues;
  stats: DiagnosticStats;
  setValue: (key: keyof CellValues, val: number) => void;
  setValues: (v: CellValues) => void;
}

interface ComparisonPreset {
  name: string;
  valuesA: CellValues;
  valuesB: CellValues;
  labelA: string;
  labelB: string;
}

const COMPARISON_PRESETS: ComparisonPreset[] = [
  {
    name: "NLST: CT vs Radiography (Lung Cancer)",
    valuesA: { tp: 270, fp: 6911, fn: 136, tn: 18925 },
    valuesB: { tp: 175, fp: 2325, fn: 231, tn: 23511 },
    labelA: "Low-dose CT",
    labelB: "Chest Radiography",
  },
  {
    name: "High Sens vs High Spec (Generic)",
    valuesA: { tp: 95, fp: 40, fn: 5, tn: 60 },
    valuesB: { tp: 60, fp: 5, fn: 40, tn: 95 },
    labelA: "High Sensitivity Test",
    labelB: "High Specificity Test",
  },
  {
    name: "Good Test vs Mediocre Test",
    valuesA: { tp: 90, fp: 10, fn: 10, tn: 90 },
    valuesB: { tp: 70, fp: 30, fn: 30, tn: 70 },
    labelA: "Good Test",
    labelB: "Mediocre Test",
  },
];

/* ─── Draggable second box ─── */

function DraggableSecondBox({
  values, centerX, centerY, scale, color, label, onDrag,
}: {
  values: CellValues; centerX: number; centerY: number; scale: number;
  color: string; label: string;
  onDrag: (newValues: CellValues) => void;
}) {
  const isDragging = useRef(false);
  const startRef = useRef<{ x: number; y: number; values: CellValues } | null>(null);

  const ul = toSvg(-values.fp, values.tp, centerX, centerY, scale);
  const ur = toSvg(values.tn, values.tp, centerX, centerY, scale);
  const ll = toSvg(-values.fp, -values.fn, centerX, centerY, scale);
  const lr = toSvg(values.tn, -values.fn, centerX, centerY, scale);
  const pathD = `M${ul.x},${ul.y} L${ur.x},${ur.y} L${lr.x},${lr.y} L${ll.x},${ll.y} Z`;

  const getSvgPt = useCallback((e: MouseEvent | React.MouseEvent) => {
    const svg = document.querySelector("svg[viewBox]") as SVGSVGElement;
    if (!svg) return { x: 0, y: 0 };
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    return new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    isDragging.current = true;
    const pt = getSvgPt(e);
    startRef.current = { x: pt.x, y: pt.y, values: { ...values } };

    const diseased = values.tp + values.fn;
    const healthy = values.fp + values.tn;

    const handleMove = (me: MouseEvent) => {
      if (!isDragging.current || !startRef.current) return;
      const pt2 = getSvgPt(me);
      const dx = pt2.x - startRef.current.x;
      const dy = pt2.y - startRef.current.y;
      const dY = -dy / scale;
      const dX = dx / scale;
      const orig = startRef.current.values;
      const newTp = Math.max(0, Math.min(diseased, Math.round(orig.tp + dY)));
      const newFn = diseased - newTp;
      const newTn = Math.max(0, Math.min(healthy, Math.round(orig.tn + dX)));
      const newFp = healthy - newTn;
      onDrag({ tp: newTp, fp: newFp, fn: newFn, tn: newTn });
    };

    const handleUp = () => {
      isDragging.current = false;
      startRef.current = null;
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  }, [getSvgPt, values, scale, onDrag]);

  return (
    <g>
      <path d={pathD} fill={color} fillOpacity={0.08} stroke={color} strokeWidth={2.5}
        style={{ cursor: "grab" }} onMouseDown={handleMouseDown} />
      <text x={lr.x - 4} y={lr.y - 6} fontSize={13} fontWeight={700} fill={color} textAnchor="end">{label}</text>
    </g>
  );
}

/* ─── Editable 2×2 table for compare ─── */

function CompactCostCell({ count, costPer, label, color }: { count: number; costPer: number; label: string; color: string }) {
  const total = count * costPer;
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[9px] font-semibold" style={{ color }}>{label}<sub className="text-[7px]">cost</sub></span>
      <span className="text-xs font-bold tabular-nums" style={{ color }}>{total.toLocaleString()}</span>
      <span className="text-[8px] text-black tabular-nums">{count}&times;{costPer}</span>
    </div>
  );
}

function EditableCompactTable({
  values, color, label, onChange, stats, costState,
}: {
  values: CellValues; color: string; label: string;
  onChange: (key: keyof CellValues, val: number) => void;
  stats: DiagnosticStats;
  costState: CostState;
}) {
  const { tp, fp, fn, tn } = values;
  const isCost = costState.costMode;
  const costs = costState.costs;
  const sub = isCost ? <sub className="text-[8px] text-orange-500">cost</sub> : null;
  const inputClass = "w-14 px-1 py-0.5 text-xs font-bold rounded text-center border";
  return (
    <div className="rounded-lg border p-2" style={{ borderColor: color + "40" }}>
      <div className="text-xs font-semibold mb-1" style={{ color }}>{label}</div>
      <table className="w-full text-xs border-collapse">
        <thead><tr><th className="p-0.5"></th><th className="p-0.5 text-center text-black">D+</th><th className="p-0.5 text-center text-black">D−</th></tr></thead>
        <tbody>
          <tr>
            <td className="p-0.5 text-black border-r border-slate-200">T+</td>
            <td className="p-0.5 text-center">
              {isCost ? <CompactCostCell count={tp} costPer={costs.tp} label="TP" color="#16a34a" /> :
              <input type="number" min={0} value={tp} onChange={(e) => onChange("tp", parseInt(e.target.value) || 0)}
                className={`${inputClass} text-green-700 bg-green-50 border-green-200`} />}
            </td>
            <td className="p-0.5 text-center">
              {isCost ? <CompactCostCell count={fp} costPer={costs.fp} label="FP" color="#ca8a04" /> :
              <input type="number" min={0} value={fp} onChange={(e) => onChange("fp", parseInt(e.target.value) || 0)}
                className={`${inputClass} text-yellow-700 bg-yellow-50 border-yellow-200`} />}
            </td>
          </tr>
          <tr>
            <td className="p-0.5 text-black border-r border-slate-200">T−</td>
            <td className="p-0.5 text-center">
              {isCost ? <CompactCostCell count={fn} costPer={costs.fn} label="FN" color="#dc2626" /> :
              <input type="number" min={0} value={fn} onChange={(e) => onChange("fn", parseInt(e.target.value) || 0)}
                className={`${inputClass} text-red-700 bg-red-50 border-red-200`} />}
            </td>
            <td className="p-0.5 text-center">
              {isCost ? <CompactCostCell count={tn} costPer={costs.tn} label="TN" color="#2563eb" /> :
              <input type="number" min={0} value={tn} onChange={(e) => onChange("tn", parseInt(e.target.value) || 0)}
                className={`${inputClass} text-blue-700 bg-blue-50 border-blue-200`} />}
            </td>
          </tr>
        </tbody>
      </table>
      <div className="mt-1 text-xs text-black space-y-0.5">
        <div>Sens{sub}: <strong>{formatStat(stats.sensitivity)}</strong> &nbsp; Spec{sub}: <strong>{formatStat(stats.specificity)}</strong></div>
        <div>N = {isCost ? (tp * costs.tp + fp * costs.fp + fn * costs.fn + tn * costs.tn).toLocaleString() : tp + fp + fn + tn} &nbsp; Prevalence{sub}: {formatStat(stats.prevalence)}</div>
      </div>
    </div>
  );
}

/* ─── Advanced comparison statistics ─── */

function youdenIndex(stats: DiagnosticStats): number {
  if (isNaN(stats.sensitivity) || isNaN(stats.specificity)) return NaN;
  return stats.sensitivity + stats.specificity - 1;
}

function diagnosticOddsRatio(v: CellValues): number {
  if (v.fp * v.fn === 0) return Infinity;
  return (v.tp * v.tn) / (v.fp * v.fn);
}

/**
 * Net Reclassification Improvement: how much does Test B improve over Test A?
 * NRI = (sensB - sensA) + (specB - specA)
 * Positive means B is better overall.
 */
function netReclassificationImprovement(sA: DiagnosticStats, sB: DiagnosticStats): number {
  if (isNaN(sA.sensitivity) || isNaN(sB.sensitivity)) return NaN;
  return (sB.sensitivity - sA.sensitivity) + (sB.specificity - sA.specificity);
}

/* ─── Stat comparison row ─── */

function TooltipDot({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative ml-1 inline-block">
      <span
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="inline-flex items-center justify-center w-3.5 h-3.5 text-[9px] font-bold text-black bg-slate-100 rounded-full cursor-help select-none"
      >?</span>
      {show && (
        <span className="absolute left-5 top-1/2 -translate-y-1/2 z-50 w-52 px-2 py-1.5 text-xs text-white bg-slate-800 rounded-md shadow-lg leading-relaxed whitespace-normal">
          {text}
        </span>
      )}
    </span>
  );
}

function CompareRow({ label, valueA, valueB, betterHigher = true, tooltip }: {
  label: string; valueA: string; valueB: string; betterHigher?: boolean; tooltip?: string;
}) {
  const numA = parseFloat(valueA);
  const numB = parseFloat(valueB);
  const aWins = betterHigher ? numA > numB : numA < numB;
  const bWins = betterHigher ? numB > numA : numB < numA;
  return (
    <tr className="border-t border-slate-100">
      <td className="py-1.5 px-2 text-xs font-medium text-slate-700">
        {label}
        {tooltip && <TooltipDot text={tooltip} />}
      </td>
      <td className={`py-1.5 px-2 text-xs text-center font-semibold tabular-nums ${aWins ? "text-blue-700 bg-blue-50" : "text-black"}`}>{valueA}</td>
      <td className={`py-1.5 px-2 text-xs text-center font-semibold tabular-nums ${bWins ? "text-orange-700 bg-orange-50" : "text-black"}`}>{valueB}</td>
    </tr>
  );
}

/* ─── Main component ─── */

export function Lesson9_Compare({
  values,
  stats: _stats,
  setValue: _setValue,
  setValues: _setValues,
  totalLessons, onPrev, onNext, onHome, onGoTo, lessonTitles, costState,
}: CompareProps) {
  // Test A initializes from the shared app values
  const [valuesA, setValuesA] = useState<CellValues>(() => ({ ...values }));
  // Test B: same proportions but different position (~60% sens, ~90% spec)
  const [valuesB, setValuesB] = useState<CellValues>(() => {
    const diseased = values.tp + values.fn;
    const healthy = values.fp + values.tn;
    const tpB = Math.round(0.6 * diseased);
    const tnB = Math.round(0.9 * healthy);
    return { tp: tpB, fp: healthy - tnB, fn: diseased - tpB, tn: tnB };
  });
  const [sameProportions, setSameProportions] = useState(true);
  const [magEnabled, setMagEnabled] = useState(true);
  const [labelA, setLabelA] = useState("Test A");
  const [labelB, setLabelB] = useState("Test B");

  // Apply cost weighting when cost mode is on
  const { costMode, costs } = costState;
  const effectiveA = useMemo<CellValues>(() =>
    costMode ? { tp: valuesA.tp * costs.tp, fp: valuesA.fp * costs.fp, fn: valuesA.fn * costs.fn, tn: valuesA.tn * costs.tn } : valuesA,
    [valuesA, costs, costMode]
  );
  const effectiveB = useMemo<CellValues>(() =>
    costMode ? { tp: valuesB.tp * costs.tp, fp: valuesB.fp * costs.fp, fn: valuesB.fn * costs.fn, tn: valuesB.tn * costs.tn } : valuesB,
    [valuesB, costs, costMode]
  );

  const statsA = useMemo(() => computeStats(effectiveA), [effectiveA]);
  const statsB = useMemo(() => computeStats(effectiveB), [effectiveB]);

  // When same proportions: editing Test A's cells updates Test B to match population
  const handleChangeA = useCallback((key: keyof CellValues, val: number) => {
    setValuesA((prev) => {
      const next = { ...prev, [key]: val };
      if (sameProportions) {
        // Recalculate Test B for the new population
        const newDiseased = next.tp + next.fn;
        const newHealthy = next.fp + next.tn;
        const oldDiseased = valuesB.tp + valuesB.fn;
        const oldHealthy = valuesB.fp + valuesB.tn;
        if (newDiseased !== oldDiseased || newHealthy !== oldHealthy) {
          const sensB = oldDiseased > 0 ? valuesB.tp / oldDiseased : 0;
          const specB = oldHealthy > 0 ? valuesB.tn / oldHealthy : 0;
          const newTpB = Math.round(sensB * newDiseased);
          const newTnB = Math.round(specB * newHealthy);
          setValuesB({ tp: newTpB, fp: newHealthy - newTnB, fn: newDiseased - newTpB, tn: newTnB });
        }
      }
      return next;
    });
  }, [sameProportions, valuesB]);

  const handleChangeB = useCallback((key: keyof CellValues, val: number) => {
    setValuesB((prev) => {
      const next = { ...prev, [key]: val };
      if (sameProportions) {
        // Recalculate Test A for the new population
        const newDiseased = next.tp + next.fn;
        const newHealthy = next.fp + next.tn;
        const oldDiseased = valuesA.tp + valuesA.fn;
        const oldHealthy = valuesA.fp + valuesA.tn;
        if (newDiseased !== oldDiseased || newHealthy !== oldHealthy) {
          const sensA = oldDiseased > 0 ? valuesA.tp / oldDiseased : 0;
          const specA = oldHealthy > 0 ? valuesA.tn / oldHealthy : 0;
          const newTpA = Math.round(sensA * newDiseased);
          const newTnA = Math.round(specA * newHealthy);
          setValuesA({ tp: newTpA, fp: newHealthy - newTnA, fn: newDiseased - newTpA, tn: newTnA });
        }
      }
      return next;
    });
  }, [sameProportions, valuesA]);

  // Drag handlers
  const handleDragA = useCallback((newValues: CellValues) => {
    setValuesA(newValues);
    if (sameProportions) {
      const d = newValues.tp + newValues.fn;
      const h = newValues.fp + newValues.tn;
      const oldD = valuesB.tp + valuesB.fn;
      const oldH = valuesB.fp + valuesB.tn;
      if (d !== oldD || h !== oldH) {
        const sensB = oldD > 0 ? valuesB.tp / oldD : 0;
        const specB = oldH > 0 ? valuesB.tn / oldH : 0;
        setValuesB({ tp: Math.round(sensB * d), fp: h - Math.round(specB * h), fn: d - Math.round(sensB * d), tn: Math.round(specB * h) });
      }
    }
  }, [sameProportions, valuesB]);

  const handleDragB = useCallback((newValues: CellValues) => {
    setValuesB(newValues);
    if (sameProportions) {
      const d = newValues.tp + newValues.fn;
      const h = newValues.fp + newValues.tn;
      const oldD = valuesA.tp + valuesA.fn;
      const oldH = valuesA.fp + valuesA.tn;
      if (d !== oldD || h !== oldH) {
        const sensA = oldD > 0 ? valuesA.tp / oldD : 0;
        const specA = oldH > 0 ? valuesA.tn / oldH : 0;
        setValuesA({ tp: Math.round(sensA * d), fp: h - Math.round(specA * h), fn: d - Math.round(sensA * d), tn: Math.round(specA * h) });
      }
    }
  }, [sameProportions, valuesA]);

  // Auto-magnification for low prevalence
  const autoMag = useMemo(() => {
    const combined: CellValues = {
      tp: Math.max(effectiveA.tp, effectiveB.tp),
      fp: Math.max(effectiveA.fp, effectiveB.fp),
      fn: Math.max(effectiveA.fn, effectiveB.fn),
      tn: Math.max(effectiveA.tn, effectiveB.tn),
    };
    return computeAutoMagnification(combined);
  }, [effectiveA, effectiveB]);
  const yMag = magEnabled ? autoMag : 1;

  // Magnified values for display
  const magA = useMemo<CellValues>(() => yMag <= 1 ? effectiveA : { tp: Math.round(effectiveA.tp * yMag), fp: effectiveA.fp, fn: Math.round(effectiveA.fn * yMag), tn: effectiveA.tn }, [effectiveA, yMag]);
  const magB = useMemo<CellValues>(() => yMag <= 1 ? effectiveB : { tp: Math.round(effectiveB.tp * yMag), fp: effectiveB.fp, fn: Math.round(effectiveB.fn * yMag), tn: effectiveB.tn }, [effectiveB, yMag]);

  // Tight zoom: fit closely around both magnified boxes
  const fixedLayout = useMemo(() => {
    const maxValues: CellValues = {
      tp: Math.max(magA.tp, magB.tp),
      fp: Math.max(magA.fp, magB.fp),
      fn: Math.max(magA.fn, magB.fn),
      tn: Math.max(magA.tn, magB.tn),
    };
    return computeLayout(maxValues, 560, 500, 65);
  }, [magA, magB]);

  const loadPreset = (idx: number) => {
    const p = COMPARISON_PRESETS[idx];
    if (!p) return;
    setValuesA(p.valuesA);
    setValuesB(p.valuesB);
    setLabelA(p.labelA);
    setLabelB(p.labelB);
  };

  return (
    <LessonLayout
      meta={{ number: 7, title: "Compare Two Tests", subtitle: "Same population, different tests — which is better?" }}
      totalLessons={totalLessons} onPrev={onPrev} onNext={onNext} onHome={onHome} onGoTo={onGoTo}
      lessonTitles={lessonTitles} costState={costState} values={effectiveA}
      diagramFooter={
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-black">
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={sameProportions} onChange={(e) => setSameProportions(e.target.checked)}
                className="accent-indigo-500" />
              <span>Same population proportions <span className="text-black">&mdash; editing one adjusts the other</span></span>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <EditableCompactTable values={valuesA} color="#2563eb" label={labelA} onChange={handleChangeA} stats={statsA} costState={costState} />
            <EditableCompactTable values={valuesB} color="#ea580c" label={labelB} onChange={handleChangeB} stats={statsB} costState={costState} />
          </div>
          <select value="" onChange={(e) => loadPreset(parseInt(e.target.value))}
            className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md bg-white text-slate-800">
            <option value="">Load a comparison preset...</option>
            {COMPARISON_PRESETS.map((p, i) => (<option key={p.name} value={i}>{p.name}</option>))}
          </select>
        </div>
      }
      keyInsight={
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-amber-800">
            <strong>Key insight:</strong> Two tests applied to the same population produce different box positions.
            {sameProportions
              ? " Both boxes have the same shape (same prevalence) but different positions."
              : " When proportions differ, box shapes also differ — compare with care."}
            {" "}Drag either box to explore.
          </p>
        </div>
      }
      diagram={
        <TruthDiagram
          values={magA}
          onDrag={costState.costMode ? undefined : (newMagValues) => {
            // Convert magnified drag values back to real values
            if (yMag > 1) {
              handleDragA({ tp: Math.round(newMagValues.tp / yMag), fp: newMagValues.fp, fn: Math.round(newMagValues.fn / yMag), tn: newMagValues.tn });
            } else {
              handleDragA(newMagValues);
            }
          }}
          overlays={[]}
          fixedLayout={fixedLayout}
          yMag={1}
          axisExtent={{
            tp: Math.max(magA.tp, magB.tp),
            fp: Math.max(magA.fp, magB.fp),
            fn: Math.max(magA.fn, magB.fn),
            tn: Math.max(magA.tn, magB.tn),
          }}
          tickAxisExtent={{
            tp: Math.max(effectiveA.tp, effectiveB.tp),
            fp: Math.max(effectiveA.fp, effectiveB.fp),
            fn: Math.max(effectiveA.fn, effectiveB.fn),
            tn: Math.max(effectiveA.tn, effectiveB.tn),
          }}
          renderExtraSvg={(layout) => {
            const ulA = toSvg(-magA.fp, magA.tp, layout.centerX, layout.centerY, layout.scale);
            return (
              <g>
                <text
                  x={ulA.x + 4} y={ulA.y + 14}
                  fontSize={13} fontWeight={700} fill="#2563eb">{labelA}</text>
                <DraggableSecondBox
                  values={magB} centerX={layout.centerX} centerY={layout.centerY}
                  scale={layout.scale} color="#ea580c" label={labelB}
                  onDrag={(newMagValues) => {
                    if (yMag > 1) {
                      handleDragB({ tp: Math.round(newMagValues.tp / yMag), fp: newMagValues.fp, fn: Math.round(newMagValues.fn / yMag), tn: newMagValues.tn });
                    } else {
                      handleDragB(newMagValues);
                    }
                  }} />
              </g>
            );
          }}
          belowDiagramText={
            <>
              <div className="text-sm font-semibold text-slate-700">
                <strong style={{ color: "#2563eb" }}>{labelA}</strong> (blue) vs{" "}
                <strong style={{ color: "#ea580c" }}>{labelB}</strong> (orange)
              </div>
              {autoMag > 1 && (
                <div className="mt-1">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer select-none text-xs text-black">
                    <input type="checkbox" checked={magEnabled} onChange={(e) => setMagEnabled(e.target.checked)}
                      className="accent-slate-500" />
                    {magEnabled ? `Note: ↕ ${yMag}× vertical magnification` : "Magnify vertical axis"}
                  </label>
                </div>
              )}
            </>
          }
        />
      }
    >
      <div className="space-y-4">
        {/* Test names */}
        <div>
          <h3 className="text-xs font-semibold text-black uppercase tracking-wide mb-2">Test Names</h3>
          <div className="grid grid-cols-2 gap-2">
            <input type="text" value={labelA} onChange={(e) => setLabelA(e.target.value || "Test A")}
              className="px-2 py-1.5 text-sm border border-blue-200 rounded bg-blue-50 text-blue-700 font-bold" />
            <input type="text" value={labelB} onChange={(e) => setLabelB(e.target.value || "Test B")}
              className="px-2 py-1.5 text-sm border border-orange-200 rounded bg-orange-50 text-orange-700 font-bold" />
          </div>
        </div>

        {/* Basic comparison table */}
        <div>
          <h3 className="text-xs font-semibold text-black uppercase tracking-wide mb-2">
            Basic Statistics
          </h3>
          <div className="bg-slate-50 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-100">
                <th className="py-1.5 px-2 text-left text-xs text-black"></th>
                <th className="py-1.5 px-2 text-center text-xs font-semibold text-blue-700">
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-600 mr-1" />{labelA}
                </th>
                <th className="py-1.5 px-2 text-center text-xs font-semibold text-orange-700">
                  <span className="inline-block w-2 h-2 rounded-full bg-orange-600 mr-1" />{labelB}
                </th>
              </tr></thead>
              <tbody>
                <CompareRow label="Sensitivity" valueA={formatStat(statsA.sensitivity)} valueB={formatStat(statsB.sensitivity)} tooltip="Proportion of diseased subjects correctly identified. Higher is better." />
                <CompareRow label="Specificity" valueA={formatStat(statsA.specificity)} valueB={formatStat(statsB.specificity)} tooltip="Proportion of healthy subjects correctly identified. Higher is better." />
                <CompareRow label="PPV" valueA={formatStat(statsA.ppv)} valueB={formatStat(statsB.ppv)} tooltip="Positive Predictive Value: probability of disease given a positive test. Depends on prevalence." />
                <CompareRow label="NPV" valueA={formatStat(statsA.npv)} valueB={formatStat(statsB.npv)} tooltip="Negative Predictive Value: probability of health given a negative test. Depends on prevalence." />
                <CompareRow label="Accuracy" valueA={formatStat(statsA.accuracy)} valueB={formatStat(statsB.accuracy)} tooltip="Proportion of all subjects correctly classified: (TP+TN)/Total." />
                <CompareRow label="Prevalence" valueA={formatStat(statsA.prevalence)} valueB={formatStat(statsB.prevalence)} tooltip="Proportion of subjects with disease: (TP+FN)/Total." />
                <CompareRow label="Positive LR" valueA={formatRatio(statsA.positiveLR)} valueB={formatRatio(statsB.positiveLR)} tooltip="How much a positive result increases the odds of disease. >10 is strong." />
                <CompareRow label="Negative LR" valueA={formatRatio(statsA.negativeLR)} valueB={formatRatio(statsB.negativeLR)} betterHigher={false} tooltip="How much a negative result decreases the odds of disease. <0.1 is strong." />
              </tbody>
            </table>
          </div>
        </div>

        <hr className="border-slate-200" />

        {/* Advanced comparison statistics */}
        <div>
          <h3 className="text-xs font-semibold text-black uppercase tracking-wide mb-2">
            Global Comparison
          </h3>
          <div className="bg-slate-50 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-100">
                <th className="py-1.5 px-2 text-left text-xs text-black"></th>
                <th className="py-1.5 px-2 text-center text-xs font-semibold text-blue-700">
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-600 mr-1" />{labelA}
                </th>
                <th className="py-1.5 px-2 text-center text-xs font-semibold text-orange-700">
                  <span className="inline-block w-2 h-2 rounded-full bg-orange-600 mr-1" />{labelB}
                </th>
              </tr></thead>
              <tbody>
                <CompareRow label="Youden's Index (J)" valueA={formatRatio(youdenIndex(statsA))} valueB={formatRatio(youdenIndex(statsB))} tooltip="Sensitivity + Specificity − 1. Range 0 (worthless) to 1 (perfect). 0.5 = moderate, 0.8+ = good." />
                <CompareRow label="Diagnostic OR" valueA={formatRatio(diagnosticOddsRatio(effectiveA))} valueB={formatRatio(diagnosticOddsRatio(effectiveB))} tooltip="(TP×TN)/(FP×FN). Ratio of odds of positive result in diseased vs healthy. 1 = worthless, 10 = moderate, 100+ = strong." />
                <CompareRow label="Chi-Square" valueA={formatRatio((() => { const e = computeExpectedValues(effectiveA); return computeChiSquare(effectiveA, e); })())} valueB={formatRatio((() => { const e = computeExpectedValues(effectiveB); return computeChiSquare(effectiveB, e); })())} tooltip="Tests whether the test discriminates better than chance. ≥3.84 = significant (p<0.05), ≥6.63 = p<0.01." />
                {(() => {
                  const nri = netReclassificationImprovement(statsA, statsB);
                  const nriStr = isNaN(nri) ? "N/A" : (nri > 0 ? "+" : "") + (nri * 100).toFixed(1) + "%";
                  const nriInterp = isNaN(nri) ? ""
                    : nri > 0 ? `${labelB} improves overall classification by ${(nri * 100).toFixed(1)}%`
                    : nri < 0 ? `${labelA} is better by ${(-nri * 100).toFixed(1)}%`
                    : "Both tests classify equally well";
                  return (
                    <tr className="border-t border-slate-100">
                      <td className="py-1.5 px-2 text-xs font-medium text-slate-700" colSpan={1}>
                        NRI
                        <TooltipDot text="Net Reclassification Improvement = (SensB−SensA) + (SpecB−SpecA). Positive means B improves overall classification." />
                      </td>
                      <td className="py-1.5 px-2 text-xs text-center tabular-nums text-slate-700" colSpan={2}>
                        <span className="font-semibold">{nriStr}</span>
                        <span className="block text-[10px] font-normal text-black mt-0.5">{nriInterp}</span>
                      </td>
                    </tr>
                  );
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </LessonLayout>
  );
}
