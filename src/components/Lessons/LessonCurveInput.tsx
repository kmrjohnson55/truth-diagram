import React, { useState, useMemo } from "react";
import { LessonLayout } from "./LessonLayout";
import { computeStats, formatStat } from "../../utils/statistics";
import type { CellValues, DiagnosticStats } from "../../utils/statistics";
import type { LessonNavProps } from "./lessonTypes";
import {
  computeDPrime,
  trajectoryPoint,
} from "../../utils/trajectory";

interface LessonCurveInputProps extends LessonNavProps {
  values: CellValues;
  stats: DiagnosticStats;
  setValue: (key: keyof CellValues, val: number) => void;
  setValues: (v: CellValues) => void;
}

interface ThresholdRow {
  threshold: string;
  tp: number;
  fp: number;
  fn: number;
  tn: number;
}

function generateDefaultRows(values: CellValues): ThresholdRow[] {
  const diseased = values.tp + values.fn;
  const healthy = values.fp + values.tn;
  const stats = computeStats(values);
  const dPrime = computeDPrime(stats.sensitivity, stats.specificity);
  const thresholds = [-2.0, -1.5, -1.0, -0.5, 0.0, 0.5, 1.0, 1.5, 2.0, 2.5];

  return thresholds.map((t) => {
    const pt = trajectoryPoint(dPrime, t, diseased, healthy);
    return {
      threshold: t.toFixed(1),
      tp: pt.tp,
      fp: pt.fp,
      fn: pt.fn,
      tn: pt.tn,
    };
  });
}

/* ─── CSV parsing ─── */

function parseCSV(text: string): ThresholdRow[] {
  const lines = text.trim().split(/\r?\n/);
  const rows: ThresholdRow[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    // Skip header-like lines
    if (i === 0 && /[a-zA-Z]/.test(line.replace(/["',]/g, "").replace(/threshold/i, ""))) continue;
    const parts = line.split(/[,\t;]+/).map(s => s.trim().replace(/^["']|["']$/g, ""));
    if (parts.length < 4) continue;
    // Try: threshold,tp,fp,fn,tn or just tp,fp,fn,tn
    let threshold = "";
    let tp: number, fp: number, fn: number, tn: number;
    if (parts.length >= 5) {
      threshold = parts[0];
      tp = parseInt(parts[1]) || 0;
      fp = parseInt(parts[2]) || 0;
      fn = parseInt(parts[3]) || 0;
      tn = parseInt(parts[4]) || 0;
    } else {
      tp = parseInt(parts[0]) || 0;
      fp = parseInt(parts[1]) || 0;
      fn = parseInt(parts[2]) || 0;
      tn = parseInt(parts[3]) || 0;
    }
    rows.push({ threshold, tp, fp, fn, tn });
  }
  return rows;
}

/* ─── Interpolation ─── */

function interpolateRows(rows: ThresholdRow[], factor: number): ThresholdRow[] {
  if (rows.length < 2 || factor <= 1) return rows;
  const result: ThresholdRow[] = [rows[0]];
  for (let i = 1; i < rows.length; i++) {
    const prev = rows[i - 1];
    const curr = rows[i];
    for (let j = 1; j < factor; j++) {
      const t = j / factor;
      result.push({
        threshold: prev.threshold && curr.threshold
          ? (parseFloat(prev.threshold) * (1 - t) + parseFloat(curr.threshold) * t).toFixed(2)
          : "",
        tp: Math.round(prev.tp * (1 - t) + curr.tp * t),
        fp: Math.round(prev.fp * (1 - t) + curr.fp * t),
        fn: Math.round(prev.fn * (1 - t) + curr.fn * t),
        tn: Math.round(prev.tn * (1 - t) + curr.tn * t),
      });
    }
    result.push(curr);
  }
  return result;
}

/* ─── Data table component (reused for A and B) ─── */

function DataTable({
  rows,
  setRows,
  values,
  color,
  label,
}: {
  rows: ThresholdRow[];
  setRows: React.Dispatch<React.SetStateAction<ThresholdRow[]>>;
  values: CellValues;
  color: string;
  label: string;
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const updateRow = (index: number, field: keyof ThresholdRow, value: string) => {
    setRows((prev) => {
      const next = [...prev];
      if (field === "threshold") {
        next[index] = { ...next[index], threshold: value };
      } else {
        next[index] = { ...next[index], [field]: Math.max(0, parseInt(value) || 0) };
      }
      return next;
    });
  };

  const addRow = () => {
    setRows((prev) => [...prev, { threshold: "", tp: 0, fp: 0, fn: 0, tn: 0 }]);
  };

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const resetToDefault = () => {
    setRows(generateDefaultRows(values));
  };

  const rowStats = useMemo(() => {
    return rows.map((r) => {
      const cv: CellValues = { tp: r.tp, fp: r.fp, fn: r.fn, tn: r.tn };
      return computeStats(cv);
    });
  }, [rows]);

  const rowTotals = useMemo(() => {
    return rows.map((r) => ({ diseased: r.tp + r.fn, healthy: r.fp + r.tn }));
  }, [rows]);

  const expectedDiseased = rows.length > 0 ? rowTotals[0].diseased : 0;
  const expectedHealthy = rows.length > 0 ? rowTotals[0].healthy : 0;

  const rowErrors = useMemo(() => {
    if (rows.length === 0) return [];
    return rowTotals.map((t, i) => {
      if (i === 0) return null;
      const issues: string[] = [];
      if (t.diseased !== expectedDiseased) {
        issues.push(`Diseased (TP+FN) = ${t.diseased}, expected ${expectedDiseased}`);
      }
      if (t.healthy !== expectedHealthy) {
        issues.push(`Healthy (FP+TN) = ${t.healthy}, expected ${expectedHealthy}`);
      }
      return issues.length > 0 ? issues.join("; ") : null;
    });
  }, [rowTotals, expectedDiseased, expectedHealthy]);

  return (
    <div>
      <h3 className="text-sm font-bold uppercase tracking-wide mb-2" style={{ color }}>
        {label}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-100">
              <th className="p-2 text-left text-xs font-bold text-black">#</th>
              <th className="p-2 text-center text-xs font-bold text-black">Threshold</th>
              <th className="p-2 text-center text-xs font-bold" style={{ color: "#16a34a" }}>TP</th>
              <th className="p-2 text-center text-xs font-bold" style={{ color: "#ca8a04" }}>FP</th>
              <th className="p-2 text-center text-xs font-bold" style={{ color: "#dc2626" }}>FN</th>
              <th className="p-2 text-center text-xs font-bold" style={{ color: "#2563eb" }}>TN</th>
              <th className="p-2 text-center text-xs font-bold text-black">Sens</th>
              <th className="p-2 text-center text-xs font-bold text-black">Spec</th>
              <th className="p-2 text-center text-xs font-bold text-black"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <React.Fragment key={i}>
              <tr className={`border-t border-slate-100 ${rowErrors[i] ? "bg-red-50" : "hover:bg-slate-50"}`}>
                <td className="p-1.5 text-xs text-black font-mono">
                  {i + 1}
                  {rowErrors[i] && <span className="text-red-500 ml-0.5" title={rowErrors[i]!}>⚠</span>}
                </td>
                <td className="p-1">
                  <input
                    type="text"
                    value={row.threshold}
                    onChange={(e) => updateRow(i, "threshold", e.target.value)}
                    className="w-16 px-1.5 py-1 text-xs text-center border border-slate-200 rounded bg-white"
                    placeholder="e.g. 5.0"
                  />
                </td>
                <td className="p-1">
                  <input type="number" min={0} value={row.tp}
                    onChange={(e) => updateRow(i, "tp", e.target.value)}
                    className="w-14 px-1 py-1 text-xs text-center border border-green-200 rounded bg-green-50 font-bold text-green-700" />
                </td>
                <td className="p-1">
                  <input type="number" min={0} value={row.fp}
                    onChange={(e) => updateRow(i, "fp", e.target.value)}
                    className="w-14 px-1 py-1 text-xs text-center border border-yellow-200 rounded bg-yellow-50 font-bold text-yellow-700" />
                </td>
                <td className="p-1">
                  <input type="number" min={0} value={row.fn}
                    onChange={(e) => updateRow(i, "fn", e.target.value)}
                    className="w-14 px-1 py-1 text-xs text-center border border-red-200 rounded bg-red-50 font-bold text-red-700" />
                </td>
                <td className="p-1">
                  <input type="number" min={0} value={row.tn}
                    onChange={(e) => updateRow(i, "tn", e.target.value)}
                    className="w-14 px-1 py-1 text-xs text-center border border-blue-200 rounded bg-blue-50 font-bold text-blue-700" />
                </td>
                <td className="p-1.5 text-xs text-center font-mono text-black">
                  {formatStat(rowStats[i]?.sensitivity ?? 0)}
                </td>
                <td className="p-1.5 text-xs text-center font-mono text-black">
                  {formatStat(rowStats[i]?.specificity ?? 0)}
                </td>
                <td className="p-1">
                  <button onClick={() => removeRow(i)}
                    className="text-xs text-red-400 hover:text-red-600 px-1" title="Remove row">&times;</button>
                </td>
              </tr>
              {rowErrors[i] && (
                <tr className="bg-red-50">
                  <td colSpan={9} className="px-2 py-1 text-xs text-red-600">
                    Row {i + 1}: {rowErrors[i]} (row 1 defines the reference totals)
                  </td>
                </tr>
              )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        <button onClick={addRow}
          className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors">
          + Add Row
        </button>
        <button onClick={resetToDefault}
          className="px-3 py-1.5 text-xs font-medium text-black bg-slate-100 hover:bg-slate-200 rounded-md transition-colors">
          Reset to Model Data
        </button>
        <button onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-md transition-colors">
          Upload CSV
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.tsv,.txt"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
              const text = ev.target?.result;
              if (typeof text === "string") {
                const parsed = parseCSV(text);
                if (parsed.length > 0) setRows(parsed);
              }
            };
            reader.readAsText(file);
            e.target.value = ""; // reset so same file can be re-uploaded
          }}
        />
        <button onClick={() => {
          const interpolated = interpolateRows(rows, 3);
          setRows(interpolated);
        }}
          className="px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-md transition-colors"
          title="Insert interpolated points between existing rows (3× density)">
          Interpolate (3&times;)
        </button>
      </div>

      {rows.length > 0 && (
        <div className="mt-3 bg-slate-50 rounded-lg p-2 text-xs text-black space-y-0.5">
          <div className="flex justify-between"><span>Thresholds:</span><span className="font-bold">{rows.length}</span></div>
          <div className="flex justify-between"><span>Diseased (row 1):</span><span className="font-bold">{expectedDiseased}</span></div>
          <div className="flex justify-between"><span>Healthy (row 1):</span><span className="font-bold">{expectedHealthy}</span></div>
        </div>
      )}
    </div>
  );
}

/* ─── Main component ─── */

export function LessonCurveInput({
  values,
  stats: _stats,
  setValue: _setValue,
  setValues: _setValues,
  totalLessons,
  onPrev,
  onNext,
  onHome,
  onGoTo,
  lessonTitles,
  costState,
  testToggle,
}: LessonCurveInputProps) {
  const defaultRowsA = useMemo(() => generateDefaultRows(values), []);
  // Generate different default for B (different d')
  const defaultRowsB = useMemo(() => {
    const diseased = values.tp + values.fn;
    const healthy = values.fp + values.tn;
    const tpB = Math.round(0.6 * diseased);
    const tnB = Math.round(0.9 * healthy);
    const valB: CellValues = { tp: tpB, fp: healthy - tnB, fn: diseased - tpB, tn: tnB };
    return generateDefaultRows(valB);
  }, []);

  const [rowsA, setRowsA] = useState<ThresholdRow[]>(defaultRowsA);
  const [rowsB, setRowsB] = useState<ThresholdRow[]>(defaultRowsB);
  const [showDualData, setShowDualData] = useState(false);
  const [activeTab, setActiveTab] = useState<"A" | "B">("A");

  return (
    <LessonLayout
      meta={{
        number: 8,
        title: "Curve Data",
        subtitle: "Enter or upload threshold data for real test trajectories",
      }}
      totalLessons={totalLessons}
      onPrev={onPrev}
      onNext={onNext}
      onHome={onHome}
      onGoTo={onGoTo}
      lessonTitles={lessonTitles}
      costState={costState}
      testToggle={testToggle}
      diagram={
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-black uppercase tracking-wide">
              Threshold Data Table
            </h3>
            <label className="flex items-center gap-1.5 text-xs text-black">
              <input type="checkbox" checked={showDualData} onChange={(e) => setShowDualData(e.target.checked)}
                className="accent-indigo-500" />
              Two tests (A &amp; B)
            </label>
          </div>
          <p className="text-sm text-black mb-3">
            Enter the 2&times;2 table values for each threshold of your diagnostic test.
            Each row represents a different cutoff value tested against a gold standard.
            {showDualData && " Use the tabs below to switch between Test A and Test B data."}
          </p>

          {showDualData ? (
            <>
              <div className="flex gap-1 mb-3">
                <button
                  onClick={() => setActiveTab("A")}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-t-md transition-colors ${
                    activeTab === "A"
                      ? "bg-blue-100 text-blue-700 border border-blue-200 border-b-0"
                      : "bg-slate-50 text-black border border-slate-200 border-b-0 hover:bg-slate-100"
                  }`}
                >
                  Test A
                </button>
                <button
                  onClick={() => setActiveTab("B")}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-t-md transition-colors ${
                    activeTab === "B"
                      ? "bg-orange-100 text-orange-700 border border-orange-200 border-b-0"
                      : "bg-slate-50 text-black border border-slate-200 border-b-0 hover:bg-slate-100"
                  }`}
                >
                  Test B
                </button>
              </div>
              {activeTab === "A" ? (
                <DataTable rows={rowsA} setRows={setRowsA} values={values} color="#2563eb" label="Test A Data" />
              ) : (
                <DataTable rows={rowsB} setRows={setRowsB} values={values} color="#ea580c" label="Test B Data" />
              )}
            </>
          ) : (
            <DataTable rows={rowsA} setRows={setRowsA} values={values} color="#1e293b" label="Test Data" />
          )}
        </div>
      }
    >
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-black">Curve Data Input</h2>

        <p className="text-base text-black leading-relaxed">
          The ROC curves and test trajectories shown in the other lessons are
          based on a <strong>theoretical model</strong> (Gaussian equal-variance
          signal detection). To analyze a <strong>real diagnostic test</strong>,
          you need actual 2&times;2 table data at multiple threshold values,
          determined by testing against a gold standard.
        </p>

        <p className="text-base text-black leading-relaxed">
          Enter your threshold data in the table on the left. Each row represents
          one cutoff value. The sensitivity and specificity are computed automatically.
          This data can then be used to generate real ROC curves and test trajectories.
        </p>

        {showDualData && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
            <p className="text-sm text-indigo-800">
              <strong>Two-test mode</strong> is enabled. You can enter separate threshold
              data for each test. Use the tabs on the left to switch between
              Test A and Test B. This corresponds to the two tests shown on the
              <strong> Compare</strong> page.
            </p>
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-amber-800">
            <strong>How to obtain this data:</strong> Apply your diagnostic test to a population
            with a known gold standard. For each candidate threshold, count the number of true
            positives, false positives, false negatives, and true negatives. Enter those counts here.
            The total number of diseased and healthy subjects should remain constant across rows
            (only the classification changes as the threshold varies).
          </p>
        </div>

        <div className="bg-slate-50 rounded-lg p-3">
          <h3 className="text-sm font-bold text-black mb-1">CSV Format</h3>
          <p className="text-sm text-black leading-relaxed">
            Upload a CSV file with columns: <code className="text-xs bg-slate-200 px-1 rounded">threshold,TP,FP,FN,TN</code>.
            The threshold column is optional. Tab-separated and semicolon-separated files are also supported.
            A header row (if present) will be automatically skipped.
          </p>
        </div>
      </div>
    </LessonLayout>
  );
}
