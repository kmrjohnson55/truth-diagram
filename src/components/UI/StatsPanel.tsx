import { formatStat, formatRatio, computeStats } from "../../utils/statistics";
import type { CellValues, DiagnosticStats } from "../../utils/statistics";
import type { CostWeights } from "../Lessons/lessonTypes";
import { CELL_COLORS } from "../../utils/colors";

interface StatsPanelProps {
  stats: DiagnosticStats;
  costMode?: boolean;
  values?: CellValues;
  costs?: CostWeights;
}

interface StatRow {
  label: React.ReactNode;
  value: string;
  description: string;
  color: string;
}

function CostLabel({ name }: { name: string }) {
  return <>{name}<sub className="text-[9px] text-orange-500">cost</sub></>;
}

export function StatsPanel({ stats, costMode, values, costs }: StatsPanelProps) {
  const showCosts = costMode && values && costs;

  // Cost-weighted values and stats
  const costValues = showCosts
    ? { tp: values.tp * costs.tp, fp: values.fp * costs.fp, fn: values.fn * costs.fn, tn: values.tn * costs.tn }
    : null;
  const costStats = costValues ? computeStats(costValues) : null;

  // Choose which stats to display as the primary set
  const displayStats = costStats ?? stats;

  const rows: StatRow[] = showCosts
    ? [
        { label: <CostLabel name="Sensitivity" />, value: formatStat(displayStats.sensitivity), description: "TP\u1d9c / (TP\u1d9c + FN\u1d9c)", color: CELL_COLORS.tp },
        { label: <CostLabel name="Specificity" />, value: formatStat(displayStats.specificity), description: "TN\u1d9c / (TN\u1d9c + FP\u1d9c)", color: CELL_COLORS.tn },
        { label: <CostLabel name="PPV" />, value: formatStat(displayStats.ppv), description: "TP\u1d9c / (TP\u1d9c + FP\u1d9c)", color: CELL_COLORS.tp },
        { label: <CostLabel name="NPV" />, value: formatStat(displayStats.npv), description: "TN\u1d9c / (TN\u1d9c + FN\u1d9c)", color: CELL_COLORS.tn },
        { label: <CostLabel name="Accuracy" />, value: formatStat(displayStats.accuracy), description: "(TP\u1d9c + TN\u1d9c) / Total\u1d9c", color: "#64748b" },
        { label: <CostLabel name="Prevalence" />, value: formatStat(displayStats.prevalence), description: "(TP\u1d9c + FN\u1d9c) / Total\u1d9c", color: "#94a3b8" },
      ]
    : [
        { label: "Sensitivity", value: formatStat(stats.sensitivity), description: "TP / (TP + FN)", color: CELL_COLORS.tp },
        { label: "Specificity", value: formatStat(stats.specificity), description: "TN / (TN + FP)", color: CELL_COLORS.tn },
        { label: "PPV", value: formatStat(stats.ppv), description: "TP / (TP + FP)", color: CELL_COLORS.tp },
        { label: "NPV", value: formatStat(stats.npv), description: "TN / (TN + FN)", color: CELL_COLORS.tn },
        { label: "Accuracy", value: formatStat(stats.accuracy), description: "(TP + TN) / Total", color: "#64748b" },
        { label: "Prevalence", value: formatStat(stats.prevalence), description: "(TP + FN) / Total", color: "#94a3b8" },
      ];

  const advancedRows: StatRow[] = showCosts
    ? [
        { label: <CostLabel name="+LR" />, value: formatRatio(displayStats.positiveLR), description: "Sens\u1d9c / (1 \u2212 Spec\u1d9c)", color: "#ea580c" },
        { label: <CostLabel name="\u2212LR" />, value: formatRatio(displayStats.negativeLR), description: "(1 \u2212 Sens\u1d9c) / Spec\u1d9c", color: "#0d9488" },
        { label: <CostLabel name="Odds Ratio" />, value: formatRatio(displayStats.oddsRatio), description: "(TP\u1d9c\u00d7TN\u1d9c) / (FP\u1d9c\u00d7FN\u1d9c)", color: "#64748b" },
      ]
    : [
        { label: "+LR", value: formatRatio(stats.positiveLR), description: "Sens / (1 \u2212 Spec)", color: "#ea580c" },
        { label: "\u2212LR", value: formatRatio(stats.negativeLR), description: "(1 \u2212 Sens) / Spec", color: "#0d9488" },
        { label: "Odds Ratio", value: formatRatio(stats.oddsRatio), description: "(TP\u00d7TN) / (FP\u00d7FN)", color: "#64748b" },
      ];

  // Cost breakdown table
  const costBreakdown = showCosts && costValues
    ? { ...costValues, total: costValues.tp + costValues.fp + costValues.fn + costValues.tn }
    : null;

  return (
    <div className="space-y-4">
      {/* Cost breakdown (when cost mode is on) */}
      {showCosts && costBreakdown && (
        <>
          <h3 className="text-sm font-semibold text-orange-700 uppercase tracking-wide">
            Cost Breakdown
          </h3>

          <div className="bg-orange-50 rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-orange-100">
                  <th className="p-1.5 text-left text-orange-800">Cell</th>
                  <th className="p-1.5 text-center text-orange-800">Count</th>
                  <th className="p-1.5 text-center text-orange-800">&times;</th>
                  <th className="p-1.5 text-center text-orange-800">Cost/ea</th>
                  <th className="p-1.5 text-center text-orange-800">=</th>
                  <th className="p-1.5 text-right text-orange-800">Total</th>
                </tr>
              </thead>
              <tbody>
                {(["tp", "fp", "fn", "tn"] as (keyof CellValues)[]).map((key) => {
                  const count = values[key];
                  const costPer = costs[key];
                  const cellTotal = count * costPer;
                  const color = CELL_COLORS[key];
                  return (
                    <tr key={key} className="border-t border-orange-100">
                      <td className="p-1.5 font-bold" style={{ color }}>
                        {key.toUpperCase()}
                      </td>
                      <td className="p-1.5 text-center tabular-nums">{count}</td>
                      <td className="p-1.5 text-center text-black">&times;</td>
                      <td className="p-1.5 text-center tabular-nums">{costPer}</td>
                      <td className="p-1.5 text-center text-black">=</td>
                      <td className="p-1.5 text-right font-semibold tabular-nums">
                        {cellTotal.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
                <tr className="border-t-2 border-orange-200">
                  <td className="p-1.5 font-bold text-orange-800" colSpan={5}>
                    Total Cost
                  </td>
                  <td className="p-1.5 text-right font-bold text-orange-800 tabular-nums">
                    {costBreakdown.total.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <hr className="border-orange-200" />
        </>
      )}

      <h3 className="text-sm font-semibold text-black uppercase tracking-wide">
        {showCosts ? <>Statistics<sub className="text-[9px] text-orange-500 ml-0.5">cost</sub></> : "Statistics"}
      </h3>

      <div className="space-y-1.5">
        {rows.map((row, i) => (
          <div
            key={i}
            className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-slate-50"
          >
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full" style={{ backgroundColor: row.color }} />
              <div>
                <span className="text-sm font-medium text-slate-700">{row.label}</span>
                <span className="text-xs text-black ml-1.5">{row.description}</span>
              </div>
            </div>
            <span className="text-sm font-semibold text-slate-800 tabular-nums">{row.value}</span>
          </div>
        ))}
      </div>

      <hr className="border-slate-100" />

      <h3 className="text-sm font-semibold text-black uppercase tracking-wide">
        {showCosts ? <>Advanced<sub className="text-[9px] text-orange-500 ml-0.5">cost</sub></> : "Advanced"}
      </h3>

      <div className="space-y-1.5">
        {advancedRows.map((row, i) => (
          <div
            key={i}
            className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-slate-50"
          >
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full" style={{ backgroundColor: row.color }} />
              <div>
                <span className="text-sm font-medium text-slate-700">{row.label}</span>
                <span className="text-xs text-black ml-1.5">{row.description}</span>
              </div>
            </div>
            <span className="text-sm font-semibold text-slate-800 tabular-nums">{row.value}</span>
          </div>
        ))}
      </div>

      {showCosts && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-orange-800">Spending Efficiency</span>
            <span className="text-lg font-bold text-orange-700 tabular-nums">{formatStat(displayStats.accuracy)}</span>
          </div>
          <p className="text-xs text-orange-700 mt-1">
            Percentage of testing expenditure that produced the correct answer.
          </p>
        </div>
      )}

      <div className="pt-2 text-xs text-black">
        Total {showCosts ? "cost" : "subjects"}: {showCosts && costBreakdown ? costBreakdown.total.toLocaleString() : stats.total}
      </div>
    </div>
  );
}
