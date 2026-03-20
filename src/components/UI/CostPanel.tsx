import type { CostWeights } from "../Lessons/lessonTypes";
import { CELL_COLORS } from "../../utils/colors";

const COST_PRESETS: { name: string; costs: CostWeights; description: string }[] = [
  {
    name: "Mammography Screening",
    costs: { tp: 5000, fp: 500, fn: 50000, tn: 0 },
    description: "Missed cancer (FN) costs 100\u00d7 more than unnecessary biopsy (FP)",
  },
  {
    name: "COVID Rapid Test",
    costs: { tp: 100, fp: 200, fn: 5000, tn: 0 },
    description: "Missed infection (FN) leads to spread; false alarm (FP) causes isolation",
  },
  {
    name: "Equal Costs",
    costs: { tp: 1, fp: 1, fn: 1, tn: 1 },
    description: "All outcomes weighted equally",
  },
  {
    name: "FN-Dominant (10:1)",
    costs: { tp: 1, fp: 1, fn: 10, tn: 0 },
    description: "False negatives 10\u00d7 worse than false positives",
  },
];

const fields: { key: keyof CostWeights; label: string; abbr: string; color: string }[] = [
  { key: "tp", label: "True Positive", abbr: "TP", color: CELL_COLORS.tp },
  { key: "fp", label: "False Positive", abbr: "FP", color: CELL_COLORS.fp },
  { key: "fn", label: "False Negative", abbr: "FN", color: CELL_COLORS.fn },
  { key: "tn", label: "True Negative", abbr: "TN", color: CELL_COLORS.tn },
];

interface CostPanelProps {
  costs: CostWeights;
  setCost: (key: keyof CostWeights, val: number) => void;
  setCosts: (c: CostWeights) => void;
}

export function CostPanel({ costs, setCost, setCosts }: CostPanelProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-orange-700 uppercase tracking-wide">
        Cost Per Subject
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {fields.map(({ key, abbr, color }) => (
          <div key={key}>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full mr-1.5"
                style={{ backgroundColor: color }}
              />
              {abbr} cost
            </label>
            <input
              type="number"
              min={0}
              value={costs[key]}
              onChange={(e) => setCost(key, Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-3 py-1.5 text-sm border border-orange-200 rounded-md
                focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent
                bg-white text-slate-800"
            />
          </div>
        ))}
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">
          Cost Presets
        </label>
        <select
          onChange={(e) => {
            const preset = COST_PRESETS[parseInt(e.target.value)];
            if (preset) setCosts({ ...preset.costs });
          }}
          value=""
          className="w-full px-3 py-1.5 text-sm border border-orange-200 rounded-md
            focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent
            bg-white text-slate-800"
        >
          <option value="">Load a cost preset...</option>
          {COST_PRESETS.map((p, i) => (
            <option key={p.name} value={i}>{p.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
