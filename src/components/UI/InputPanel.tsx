import type { CellValues } from "../../utils/statistics";
import { generalPresets, clinicalPresets, presets } from "../../utils/presets";
import { CELL_COLORS } from "../../utils/colors";

interface InputPanelProps {
  values: CellValues;
  setValue: (key: keyof CellValues, val: number) => void;
  setValues: (v: CellValues) => void;
}

const fields: { key: keyof CellValues; label: string; color: string }[] = [
  { key: "tp", label: "True Positives (TP)", color: CELL_COLORS.tp },
  { key: "fp", label: "False Positives (FP)", color: CELL_COLORS.fp },
  { key: "fn", label: "False Negatives (FN)", color: CELL_COLORS.fn },
  { key: "tn", label: "True Negatives (TN)", color: CELL_COLORS.tn },
];

export function InputPanel({ values, setValue, setValues }: InputPanelProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
        Cell Values
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {fields.map(({ key, label, color }) => (
          <div key={key}>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full mr-1.5"
                style={{ backgroundColor: color }}
              />
              {label}
            </label>
            <input
              type="number"
              min={0}
              value={values[key]}
              onChange={(e) => setValue(key, parseInt(e.target.value) || 0)}
              className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md
                focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent
                bg-white text-slate-800"
            />
          </div>
        ))}
      </div>

      <div className="text-sm font-medium text-slate-600 pt-2 border-t border-slate-100">
        Total subjects: {values.tp + values.fp + values.fn + values.tn}
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">
          Presets
        </label>
        <select
          onChange={(e) => {
            const preset = presets[parseInt(e.target.value)];
            if (preset) setValues(preset.values);
          }}
          value=""
          className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md
            focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent
            bg-white text-slate-800"
        >
          <option value="">
            Load a preset...
          </option>
          <optgroup label="General Examples">
            {generalPresets.map((p) => (
              <option key={p.name} value={presets.indexOf(p)}>
                {p.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="Clinical Examples">
            {clinicalPresets.map((p) => (
              <option key={p.name} value={presets.indexOf(p)}>
                {p.name}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      <button
        onClick={() => setValues({ tp: 80, fp: 20, fn: 20, tn: 80 })}
        className="w-full px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
      >
        Reset to default values
      </button>
    </div>
  );
}
