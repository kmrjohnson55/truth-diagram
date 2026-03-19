import { useState, useMemo } from "react";
import { LessonLayout } from "./LessonLayout";
import { TruthDiagram } from "../Diagram/TruthDiagram";
import { formatStat, formatRatio, computeStats } from "../../utils/statistics";
import { toSvg } from "../../utils/geometry";
import type { CellValues, DiagnosticStats } from "../../utils/statistics";
import type { LessonNavProps } from "./lessonTypes";

interface CompareProps extends LessonNavProps {
  values: CellValues;
  stats: DiagnosticStats;
  setValue: (key: keyof CellValues, val: number) => void;
  setValues: (v: CellValues) => void;
}

interface ComparisonPreset {
  name: string;
  diseased: number;
  healthy: number;
  sensA: number;
  specA: number;
  sensB: number;
  specB: number;
  labelA: string;
  labelB: string;
  reference?: string;
}

const COMPARISON_PRESETS: ComparisonPreset[] = [
  {
    name: "NLST: CT vs Radiography (Lung Cancer)",
    diseased: 406,
    healthy: 25836,
    sensA: 0.67,
    specA: 0.73,
    sensB: 0.43,
    specB: 0.91,
    labelA: "Low-dose CT",
    labelB: "Chest Radiography",
    reference: "NLST Research Team, NEJM 2013. Johnson & Johnson, AJR 2014.",
  },
  {
    name: "High Sens vs High Spec (Generic)",
    diseased: 100,
    healthy: 100,
    sensA: 0.95,
    specA: 0.60,
    sensB: 0.60,
    specB: 0.95,
    labelA: "High Sensitivity Test",
    labelB: "High Specificity Test",
  },
  {
    name: "Good Test vs Mediocre Test",
    diseased: 100,
    healthy: 100,
    sensA: 0.90,
    specA: 0.90,
    sensB: 0.70,
    specB: 0.70,
    labelA: "Good Test",
    labelB: "Mediocre Test",
  },
];

function computeFromSensSpec(
  sens: number,
  spec: number,
  diseased: number,
  healthy: number
): CellValues {
  const tp = Math.round(sens * diseased);
  const fn = diseased - tp;
  const tn = Math.round(spec * healthy);
  const fp = healthy - tn;
  return { tp, fp, fn, tn };
}

/* ─── Second box overlay ─── */

function SecondBoxOverlay({
  values,
  centerX,
  centerY,
  scale,
  color,
  label,
}: {
  values: CellValues;
  centerX: number;
  centerY: number;
  scale: number;
  color: string;
  label: string;
}) {
  const ul = toSvg(-values.fp, values.tp, centerX, centerY, scale);
  const ur = toSvg(values.tn, values.tp, centerX, centerY, scale);
  const ll = toSvg(-values.fp, -values.fn, centerX, centerY, scale);
  const lr = toSvg(values.tn, -values.fn, centerX, centerY, scale);
  const pathD = `M${ul.x},${ul.y} L${ur.x},${ur.y} L${lr.x},${lr.y} L${ll.x},${ll.y} Z`;

  return (
    <g>
      <path
        d={pathD}
        fill={color}
        fillOpacity={0.08}
        stroke={color}
        strokeWidth={2.5}
        strokeDasharray="8 4"
      />
      <text
        x={ur.x + 4}
        y={ur.y - 6}
        fontSize={11}
        fontWeight={600}
        fill={color}
      >
        {label}
      </text>
    </g>
  );
}

/* ─── Stat comparison row ─── */

function CompareRow({
  label,
  valueA,
  valueB,
  betterHigher = true,
}: {
  label: string;
  valueA: string;
  valueB: string;
  betterHigher?: boolean;
}) {
  const numA = parseFloat(valueA);
  const numB = parseFloat(valueB);
  const aWins = betterHigher ? numA > numB : numA < numB;
  const bWins = betterHigher ? numB > numA : numB < numA;

  return (
    <tr className="border-t border-slate-100">
      <td className="py-1.5 px-2 text-xs font-medium text-slate-700">{label}</td>
      <td className={`py-1.5 px-2 text-xs text-center font-semibold tabular-nums ${aWins ? "text-blue-700 bg-blue-50" : "text-slate-600"}`}>
        {valueA}
      </td>
      <td className={`py-1.5 px-2 text-xs text-center font-semibold tabular-nums ${bWins ? "text-orange-700 bg-orange-50" : "text-slate-600"}`}>
        {valueB}
      </td>
    </tr>
  );
}

/* ─── Main component ─── */

export function Lesson9_Compare({
  values,
  stats: _stats,
  setValue: _setValue,
  setValues,
  totalLessons,
  onPrev,
  onNext,
  onHome,
  onGoTo,
  lessonTitles,
}: CompareProps) {
  // Shared population
  const [diseased, setDiseased] = useState(values.tp + values.fn || 100);
  const [healthy, setHealthy] = useState(values.fp + values.tn || 100);

  // Test A (shown as the solid blue box via TruthDiagram)
  const [sensA, setSensA] = useState(0.80);
  const [specA, setSpecA] = useState(0.80);

  // Test B (shown as dashed orange overlay)
  const [sensB, setSensB] = useState(0.60);
  const [specB, setSpecB] = useState(0.90);

  const [labelA, setLabelA] = useState("Test A");
  const [labelB, setLabelB] = useState("Test B");

  const valuesA = useMemo(
    () => computeFromSensSpec(sensA, specA, diseased, healthy),
    [sensA, specA, diseased, healthy]
  );
  const valuesB = useMemo(
    () => computeFromSensSpec(sensB, specB, diseased, healthy),
    [sensB, specB, diseased, healthy]
  );

  const statsA = useMemo(() => computeStats(valuesA), [valuesA]);
  const statsB = useMemo(() => computeStats(valuesB), [valuesB]);

  // Keep parent state in sync with Test A
  useMemo(() => setValues(valuesA), [valuesA]);

  const loadPreset = (idx: number) => {
    const p = COMPARISON_PRESETS[idx];
    if (!p) return;
    setDiseased(p.diseased);
    setHealthy(p.healthy);
    setSensA(p.sensA);
    setSpecA(p.specA);
    setSensB(p.sensB);
    setSpecB(p.specB);
    setLabelA(p.labelA);
    setLabelB(p.labelB);
  };

  return (
    <LessonLayout
      meta={{
        number: 7,
        title: "Compare Two Tests",
        subtitle: "Same population, different tests — which is better?",
      }}
      totalLessons={totalLessons}
      onPrev={onPrev}
      onNext={onNext}
      onHome={onHome}
      onGoTo={onGoTo}
      lessonTitles={lessonTitles}
      values={valuesA}
      keyInsight={
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-amber-800">
            <strong>Key insight:</strong> Two tests applied to the same
            population will produce different box positions on the diagram.
            By overlaying both, you can see at a glance which test has
            better sensitivity, specificity, or predictive values.
          </p>
        </div>
      }
      diagram={
        <TruthDiagram
          values={valuesA}
          overlays={[]}
          renderExtraSvg={(layout) => (
            <g>
              {/* Label for Test A */}
              <text
                x={toSvg(valuesA.tn, valuesA.tp, layout.centerX, layout.centerY, layout.scale).x + 4}
                y={toSvg(valuesA.tn, valuesA.tp, layout.centerX, layout.centerY, layout.scale).y - 6}
                fontSize={11} fontWeight={600} fill="#2563eb"
              >
                {labelA}
              </text>
              {/* Test B overlay */}
              <SecondBoxOverlay
                values={valuesB}
                centerX={layout.centerX}
                centerY={layout.centerY}
                scale={layout.scale}
                color="#ea580c"
                label={labelB}
              />
            </g>
          )}
          belowDiagramText={
            <>
              <strong style={{ color: "#2563eb" }}>{labelA}</strong> (solid blue) vs{" "}
              <strong style={{ color: "#ea580c" }}>{labelB}</strong> (dashed orange)
              — same {diseased + healthy} subjects ({diseased} diseased, {healthy} healthy).
            </>
          }
        />
      }
    >
      <div className="space-y-4">
        {/* Preset selector */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Comparison Presets</label>
          <select
            value=""
            onChange={(e) => loadPreset(parseInt(e.target.value))}
            className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-md bg-white text-slate-800"
          >
            <option value="">Load a comparison preset...</option>
            {COMPARISON_PRESETS.map((p, i) => (
              <option key={p.name} value={i}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Population controls */}
        <div>
          <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Shared Population</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-600">Diseased</label>
              <input type="number" min={1} value={diseased}
                onChange={(e) => setDiseased(parseInt(e.target.value) || 1)}
                className="w-full px-2 py-1 text-sm border border-slate-200 rounded text-center" />
            </div>
            <div>
              <label className="text-xs text-slate-600">Healthy</label>
              <input type="number" min={1} value={healthy}
                onChange={(e) => setHealthy(parseInt(e.target.value) || 1)}
                className="w-full px-2 py-1 text-sm border border-slate-200 rounded text-center" />
            </div>
          </div>
        </div>

        {/* Test A controls */}
        <div className="bg-blue-50 rounded-lg p-3 space-y-2">
          <h3 className="text-xs font-semibold text-blue-700 uppercase">{labelA} (solid)</h3>
          <div>
            <label className="text-xs text-blue-600">Sensitivity: {(sensA * 100).toFixed(0)}%</label>
            <input type="range" min={0} max={100} value={Math.round(sensA * 100)}
              onChange={(e) => setSensA(parseInt(e.target.value) / 100)}
              className="w-full accent-blue-500" />
          </div>
          <div>
            <label className="text-xs text-blue-600">Specificity: {(specA * 100).toFixed(0)}%</label>
            <input type="range" min={0} max={100} value={Math.round(specA * 100)}
              onChange={(e) => setSpecA(parseInt(e.target.value) / 100)}
              className="w-full accent-blue-500" />
          </div>
        </div>

        {/* Test B controls */}
        <div className="bg-orange-50 rounded-lg p-3 space-y-2">
          <h3 className="text-xs font-semibold text-orange-700 uppercase">{labelB} (dashed)</h3>
          <div>
            <label className="text-xs text-orange-600">Sensitivity: {(sensB * 100).toFixed(0)}%</label>
            <input type="range" min={0} max={100} value={Math.round(sensB * 100)}
              onChange={(e) => setSensB(parseInt(e.target.value) / 100)}
              className="w-full accent-orange-500" />
          </div>
          <div>
            <label className="text-xs text-orange-600">Specificity: {(specB * 100).toFixed(0)}%</label>
            <input type="range" min={0} max={100} value={Math.round(specB * 100)}
              onChange={(e) => setSpecB(parseInt(e.target.value) / 100)}
              className="w-full accent-orange-500" />
          </div>
        </div>

        {/* Comparison table */}
        <div>
          <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
            Head-to-Head Comparison
          </h3>
          <div className="bg-slate-50 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100">
                  <th className="py-1.5 px-2 text-left text-xs text-slate-600"></th>
                  <th className="py-1.5 px-2 text-center text-xs font-semibold text-blue-700">{labelA}</th>
                  <th className="py-1.5 px-2 text-center text-xs font-semibold text-orange-700">{labelB}</th>
                </tr>
              </thead>
              <tbody>
                <CompareRow label="Sensitivity" valueA={formatStat(statsA.sensitivity)} valueB={formatStat(statsB.sensitivity)} />
                <CompareRow label="Specificity" valueA={formatStat(statsA.specificity)} valueB={formatStat(statsB.specificity)} />
                <CompareRow label="PPV" valueA={formatStat(statsA.ppv)} valueB={formatStat(statsB.ppv)} />
                <CompareRow label="NPV" valueA={formatStat(statsA.npv)} valueB={formatStat(statsB.npv)} />
                <CompareRow label="Accuracy" valueA={formatStat(statsA.accuracy)} valueB={formatStat(statsB.accuracy)} />
                <CompareRow label="Positive LR" valueA={formatRatio(statsA.positiveLR)} valueB={formatRatio(statsB.positiveLR)} />
                <CompareRow label="Negative LR" valueA={formatRatio(statsA.negativeLR)} valueB={formatRatio(statsB.negativeLR)} betterHigher={false} />
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </LessonLayout>
  );
}
