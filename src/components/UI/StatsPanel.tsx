import { formatStat, formatRatio } from "../../utils/statistics";
import type { DiagnosticStats } from "../../utils/statistics";
import { CELL_COLORS } from "../../utils/colors";

interface StatsPanelProps {
  stats: DiagnosticStats;
}

interface StatRow {
  label: string;
  value: string;
  description: string;
  color: string;
}

export function StatsPanel({ stats }: StatsPanelProps) {
  const rows: StatRow[] = [
    {
      label: "Sensitivity",
      value: formatStat(stats.sensitivity),
      description: "TP / (TP + FN)",
      color: CELL_COLORS.tp,
    },
    {
      label: "Specificity",
      value: formatStat(stats.specificity),
      description: "TN / (TN + FP)",
      color: CELL_COLORS.tn,
    },
    {
      label: "PPV",
      value: formatStat(stats.ppv),
      description: "TP / (TP + FP)",
      color: CELL_COLORS.tp,
    },
    {
      label: "NPV",
      value: formatStat(stats.npv),
      description: "TN / (TN + FN)",
      color: CELL_COLORS.tn,
    },
    {
      label: "Accuracy",
      value: formatStat(stats.accuracy),
      description: "(TP + TN) / Total",
      color: "#64748b",
    },
    {
      label: "Prevalence",
      value: formatStat(stats.prevalence),
      description: "(TP + FN) / Total",
      color: "#94a3b8",
    },
  ];

  const advancedRows: StatRow[] = [
    {
      label: "+LR",
      value: formatRatio(stats.positiveLR),
      description: "Sens / (1 \u2212 Spec)",
      color: "#ea580c",
    },
    {
      label: "\u2212LR",
      value: formatRatio(stats.negativeLR),
      description: "(1 \u2212 Sens) / Spec",
      color: "#0d9488",
    },
    {
      label: "Odds Ratio",
      value: formatRatio(stats.oddsRatio),
      description: "(TP\u00d7TN) / (FP\u00d7FN)",
      color: "#64748b",
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
        Statistics
      </h3>

      <div className="space-y-1.5">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-slate-50"
          >
            <div className="flex items-center gap-2">
              <span
                className="w-1.5 h-4 rounded-full"
                style={{ backgroundColor: row.color }}
              />
              <div>
                <span className="text-sm font-medium text-slate-700">
                  {row.label}
                </span>
                <span className="text-xs text-slate-600 ml-1.5">
                  {row.description}
                </span>
              </div>
            </div>
            <span className="text-sm font-semibold text-slate-800 tabular-nums">
              {row.value}
            </span>
          </div>
        ))}
      </div>

      <hr className="border-slate-100" />

      <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
        Advanced
      </h3>

      <div className="space-y-1.5">
        {advancedRows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-slate-50"
          >
            <div className="flex items-center gap-2">
              <span
                className="w-1.5 h-4 rounded-full"
                style={{ backgroundColor: row.color }}
              />
              <div>
                <span className="text-sm font-medium text-slate-700">
                  {row.label}
                </span>
                <span className="text-xs text-slate-600 ml-1.5">
                  {row.description}
                </span>
              </div>
            </div>
            <span className="text-sm font-semibold text-slate-800 tabular-nums">
              {row.value}
            </span>
          </div>
        ))}
      </div>

      <div className="pt-2 text-xs text-slate-600">
        Total subjects: {stats.total}
      </div>
    </div>
  );
}
