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
}: LessonCurveInputProps) {
  const defaultRows = useMemo(() => generateDefaultRows(values), []);
  const [rows, setRows] = useState<ThresholdRow[]>(defaultRows);

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

  // Compute stats for each row
  const rowStats = useMemo(() => {
    return rows.map((r) => {
      const cv: CellValues = { tp: r.tp, fp: r.fp, fn: r.fn, tn: r.tn };
      return computeStats(cv);
    });
  }, [rows]);

  // Validate: diseased (TP+FN) and healthy (FP+TN) should be consistent across rows
  const rowTotals = useMemo(() => {
    return rows.map((r) => ({ diseased: r.tp + r.fn, healthy: r.fp + r.tn }));
  }, [rows]);

  const expectedDiseased = rows.length > 0 ? rowTotals[0].diseased : 0;
  const expectedHealthy = rows.length > 0 ? rowTotals[0].healthy : 0;

  const rowErrors = useMemo(() => {
    if (rows.length === 0) return [];
    return rowTotals.map((t, i) => {
      if (i === 0) return null; // first row defines the expected totals
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
      diagram={
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-bold text-black uppercase tracking-wide mb-3">
            Threshold Data Table
          </h3>
          <p className="text-sm text-black mb-3">
            Enter the 2&times;2 table values for each threshold of your diagnostic test.
            Each row represents a different cutoff value tested against a gold standard.
          </p>
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
                      <input
                        type="number" min={0} value={row.tp}
                        onChange={(e) => updateRow(i, "tp", e.target.value)}
                        className="w-14 px-1 py-1 text-xs text-center border border-green-200 rounded bg-green-50 font-bold text-green-700"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="number" min={0} value={row.fp}
                        onChange={(e) => updateRow(i, "fp", e.target.value)}
                        className="w-14 px-1 py-1 text-xs text-center border border-yellow-200 rounded bg-yellow-50 font-bold text-yellow-700"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="number" min={0} value={row.fn}
                        onChange={(e) => updateRow(i, "fn", e.target.value)}
                        className="w-14 px-1 py-1 text-xs text-center border border-red-200 rounded bg-red-50 font-bold text-red-700"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="number" min={0} value={row.tn}
                        onChange={(e) => updateRow(i, "tn", e.target.value)}
                        className="w-14 px-1 py-1 text-xs text-center border border-blue-200 rounded bg-blue-50 font-bold text-blue-700"
                      />
                    </td>
                    <td className="p-1.5 text-xs text-center font-mono text-black">
                      {formatStat(rowStats[i]?.sensitivity ?? 0)}
                    </td>
                    <td className="p-1.5 text-xs text-center font-mono text-black">
                      {formatStat(rowStats[i]?.specificity ?? 0)}
                    </td>
                    <td className="p-1">
                      <button
                        onClick={() => removeRow(i)}
                        className="text-xs text-red-400 hover:text-red-600 px-1"
                        title="Remove row"
                      >&times;</button>
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
          <div className="flex gap-2 mt-3">
            <button onClick={addRow}
              className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors">
              + Add Row
            </button>
            <button onClick={resetToDefault}
              className="px-3 py-1.5 text-xs font-medium text-black bg-slate-100 hover:bg-slate-200 rounded-md transition-colors">
              Reset to Model Data
            </button>
          </div>
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
          <h3 className="text-sm font-bold text-black mb-2">Current Data Summary</h3>
          <div className="text-sm text-black space-y-1">
            <div className="flex justify-between">
              <span>Number of thresholds:</span>
              <span className="font-bold">{rows.length}</span>
            </div>
            {rows.length > 0 && (() => {
              const first = rows[0];
              const diseasedFirst = first.tp + first.fn;
              const healthyFirst = first.fp + first.tn;
              return (
                <>
                  <div className="flex justify-between">
                    <span>Diseased subjects (row 1):</span>
                    <span className="font-bold">{diseasedFirst}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Healthy subjects (row 1):</span>
                    <span className="font-bold">{healthyFirst}</span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        <p className="text-sm text-black italic">
          This page will be further developed to support CSV upload, real trajectory/ROC
          generation, and computation of AUC, TAI, CDI, and d&prime; from your actual data.
        </p>
      </div>
    </LessonLayout>
  );
}
