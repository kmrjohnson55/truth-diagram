import type { CellValues } from "../../utils/statistics";
import { generalPresets, clinicalPresets, presets } from "../../utils/presets";

interface TwoByTwoTableProps {
  values: CellValues;
  setValue: (key: keyof CellValues, val: number) => void;
  setValues: (v: CellValues) => void;
}

export function TwoByTwoTable({ values, setValue, setValues }: TwoByTwoTableProps) {
  const { tp, fp, fn, tn } = values;
  const diseased = tp + fn;
  const healthy = fp + tn;
  const testPos = tp + fp;
  const testNeg = fn + tn;
  const total = tp + fp + fn + tn;

  return (
    <div className="space-y-3">
      {/* 2×2 Table with editable cells */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="p-1.5"></th>
              <th className="p-1.5 text-center font-semibold text-slate-600 border-b-2 border-slate-200 text-xs">Disease +</th>
              <th className="p-1.5 text-center font-semibold text-slate-600 border-b-2 border-slate-200 text-xs">Disease &minus;</th>
              <th className="p-1.5 text-center font-semibold text-slate-600 border-b-2 border-slate-100 text-xs">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-1.5 font-semibold text-slate-600 border-r-2 border-slate-200 text-xs">Test +</td>
              <td className="p-1 text-center">
                <input type="number" min={0} value={tp}
                  onChange={(e) => setValue("tp", parseInt(e.target.value) || 0)}
                  className="w-16 px-1.5 py-0.5 text-sm font-bold text-green-700 bg-green-50 border border-green-200 rounded text-center"
                />
              </td>
              <td className="p-1 text-center">
                <input type="number" min={0} value={fp}
                  onChange={(e) => setValue("fp", parseInt(e.target.value) || 0)}
                  className="w-16 px-1.5 py-0.5 text-sm font-bold text-yellow-700 bg-yellow-50 border border-yellow-200 rounded text-center"
                />
              </td>
              <td className="p-1.5 text-center text-slate-600 font-medium text-xs">{testPos}</td>
            </tr>
            <tr>
              <td className="p-1.5 font-semibold text-slate-600 border-r-2 border-slate-200 text-xs">Test &minus;</td>
              <td className="p-1 text-center">
                <input type="number" min={0} value={fn}
                  onChange={(e) => setValue("fn", parseInt(e.target.value) || 0)}
                  className="w-16 px-1.5 py-0.5 text-sm font-bold text-red-700 bg-red-50 border border-red-200 rounded text-center"
                />
              </td>
              <td className="p-1 text-center">
                <input type="number" min={0} value={tn}
                  onChange={(e) => setValue("tn", parseInt(e.target.value) || 0)}
                  className="w-16 px-1.5 py-0.5 text-sm font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded text-center"
                />
              </td>
              <td className="p-1.5 text-center text-slate-600 font-medium text-xs">{testNeg}</td>
            </tr>
            <tr className="border-t-2 border-slate-200">
              <td className="p-1.5 font-semibold text-slate-600 text-xs">Total</td>
              <td className="p-1.5 text-center text-slate-600 font-medium text-xs">{diseased}</td>
              <td className="p-1.5 text-center text-slate-600 font-medium text-xs">{healthy}</td>
              <td className="p-1.5 text-center text-slate-600 font-bold text-xs">{total}</td>
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
          <option value="">Load a preset...</option>
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
          className="px-2 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors shrink-0"
        >
          Default
        </button>
      </div>
    </div>
  );
}
