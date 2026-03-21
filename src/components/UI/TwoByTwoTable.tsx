import type { CellValues } from "../../utils/statistics";
import type { CostState } from "../Lessons/lessonTypes";
import { generalPresets, clinicalPresets, presets } from "../../utils/presets";

interface TwoByTwoTableProps {
  values: CellValues;
  setValue: (key: keyof CellValues, val: number) => void;
  setValues: (v: CellValues) => void;
  costState?: CostState;
  /** Keys of cells to dim (grey out) */
  dimCells?: (keyof CellValues)[];
}

function CostCell({ count, costPer, label, color }: { count: number; costPer: number; label: string; color: string }) {
  const total = count * costPer;
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[10px] font-semibold" style={{ color }}>{label}<sub className="text-[8px]">cost</sub></span>
      <span className="text-xs font-bold tabular-nums" style={{ color }}>{total.toLocaleString()}</span>
      <span className="text-[9px] text-black tabular-nums">{count}&times;{costPer}</span>
    </div>
  );
}

export function TwoByTwoTable({ values, setValue, setValues, costState, dimCells = [] }: TwoByTwoTableProps) {
  const costMode = costState?.costMode ?? false;
  const costs = costState?.costs ?? { tp: 1, fp: 1, fn: 1, tn: 1 };
  // In cost mode, values are already cost-weighted; subjectValues has raw counts
  const sv = costState?.subjectValues;
  const { tp, fp, fn, tn } = values;

  if (costMode && sv) {
    // values are cost totals; sv has raw subject counts
    const diseased = tp + fn;
    const healthy = fp + tn;
    const testPos = tp + fp;
    const testNeg = fn + tn;
    const total = tp + fp + fn + tn;

    return (
      <div className="space-y-3">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="p-1.5"></th>
                <th className="p-1.5 text-center font-semibold text-orange-700 border-b-2 border-orange-200 text-xs">Disease +</th>
                <th className="p-1.5 text-center font-semibold text-orange-700 border-b-2 border-orange-200 text-xs">Disease &minus;</th>
                <th className="p-1.5 text-center font-semibold text-orange-700 border-b-2 border-orange-100 text-xs">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-1.5 font-semibold text-black border-r-2 border-orange-200 text-xs">Test +</td>
                <td className="p-1.5 text-center">
                  <CostCell count={sv.tp} costPer={costs.tp} label="TP" color="#16a34a" />
                </td>
                <td className="p-1.5 text-center">
                  <CostCell count={sv.fp} costPer={costs.fp} label="FP" color="#ca8a04" />
                </td>
                <td className="p-1.5 text-center text-orange-700 font-medium text-xs">{testPos.toLocaleString()}</td>
              </tr>
              <tr>
                <td className="p-1.5 font-semibold text-black border-r-2 border-orange-200 text-xs">Test &minus;</td>
                <td className="p-1.5 text-center">
                  <CostCell count={sv.fn} costPer={costs.fn} label="FN" color="#dc2626" />
                </td>
                <td className="p-1.5 text-center">
                  <CostCell count={sv.tn} costPer={costs.tn} label="TN" color="#2563eb" />
                </td>
                <td className="p-1.5 text-center text-orange-700 font-medium text-xs">{testNeg.toLocaleString()}</td>
              </tr>
              <tr className="border-t-2 border-orange-200">
                <td className="p-1.5 font-semibold text-black text-xs">Total</td>
                <td className="p-1.5 text-center text-orange-700 font-medium text-xs">{diseased.toLocaleString()}</td>
                <td className="p-1.5 text-center text-orange-700 font-medium text-xs">{healthy.toLocaleString()}</td>
                <td className="p-1.5 text-center text-orange-800 font-bold text-xs">{total.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const isDim = (key: keyof CellValues) => dimCells.includes(key);

  // Standard (subject count) mode
  const diseased = tp + fn;
  const healthy = fp + tn;
  const testPos = tp + fp;
  const testNeg = fn + tn;
  const total = tp + fp + fn + tn;

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="p-1.5"></th>
              <th className="p-1.5 text-center font-semibold text-black border-b-2 border-slate-200 text-xs">Disease +</th>
              <th className="p-1.5 text-center font-semibold text-black border-b-2 border-slate-200 text-xs">Disease &minus;</th>
              <th className="p-1.5 text-center font-semibold text-black border-b-2 border-slate-100 text-xs">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-1.5 font-semibold text-black border-r-2 border-slate-200 text-xs">Test +</td>
              <td className={`p-1 text-center transition-opacity ${isDim("tp") ? "opacity-20" : ""}`}>
                <span className="text-[10px] font-semibold text-green-600 block">TP</span>
                <input type="number" min={0} value={tp}
                  onChange={(e) => setValue("tp", parseInt(e.target.value) || 0)}
                  className="w-16 px-1.5 py-0.5 text-sm font-bold text-green-700 bg-green-50 border border-green-200 rounded text-center"
                />
              </td>
              <td className={`p-1 text-center transition-opacity ${isDim("fp") ? "opacity-20" : ""}`}>
                <span className="text-[10px] font-semibold text-yellow-600 block">FP</span>
                <input type="number" min={0} value={fp}
                  onChange={(e) => setValue("fp", parseInt(e.target.value) || 0)}
                  className="w-16 px-1.5 py-0.5 text-sm font-bold text-yellow-700 bg-yellow-50 border border-yellow-200 rounded text-center"
                />
              </td>
              <td className="p-1.5 text-center text-black font-medium text-xs">{testPos}</td>
            </tr>
            <tr>
              <td className="p-1.5 font-semibold text-black border-r-2 border-slate-200 text-xs">Test &minus;</td>
              <td className={`p-1 text-center transition-opacity ${isDim("fn") ? "opacity-20" : ""}`}>
                <span className="text-[10px] font-semibold text-red-600 block">FN</span>
                <input type="number" min={0} value={fn}
                  onChange={(e) => setValue("fn", parseInt(e.target.value) || 0)}
                  className="w-16 px-1.5 py-0.5 text-sm font-bold text-red-700 bg-red-50 border border-red-200 rounded text-center"
                />
              </td>
              <td className={`p-1 text-center transition-opacity ${isDim("tn") ? "opacity-20" : ""}`}>
                <span className="text-[10px] font-semibold text-blue-600 block">TN</span>
                <input type="number" min={0} value={tn}
                  onChange={(e) => setValue("tn", parseInt(e.target.value) || 0)}
                  className="w-16 px-1.5 py-0.5 text-sm font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded text-center"
                />
              </td>
              <td className="p-1.5 text-center text-black font-medium text-xs">{testNeg}</td>
            </tr>
            <tr className="border-t-2 border-slate-200">
              <td className="p-1.5 font-semibold text-black text-xs">Total</td>
              <td className="p-1.5 text-center text-black font-medium text-xs">{diseased}</td>
              <td className="p-1.5 text-center text-black font-medium text-xs">{healthy}</td>
              <td className="p-1.5 text-center text-black font-bold text-xs">{total}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Presets + Default */}
      <div className="flex gap-2">
        <select
          value=""
          onChange={(e) => {
            const idx = parseInt(e.target.value);
            const preset = presets[idx];
            if (preset) setValues(preset.values);
          }}
          className="flex-1 px-2 py-1 text-xs border border-slate-200 rounded-md
            focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white text-slate-800"
        >
          <option value="">Load a preset example&hellip;</option>
          <optgroup label="General Examples">
            {generalPresets.map((p) => (
              <option key={p.name} value={presets.indexOf(p)}>{p.name}</option>
            ))}
          </optgroup>
          <optgroup label="Clinical Examples">
            {clinicalPresets.map((p) => (
              <option key={p.name} value={presets.indexOf(p)}>{p.name}</option>
            ))}
          </optgroup>
        </select>
        <button
          onClick={() => setValues({ tp: 80, fp: 20, fn: 20, tn: 80 })}
          className="px-2 py-1 text-xs font-medium text-black bg-slate-100 hover:bg-slate-200 rounded-md transition-colors shrink-0"
        >
          Default
        </button>
      </div>
    </div>
  );
}
