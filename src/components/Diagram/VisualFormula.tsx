import type { CellValues } from "../../utils/statistics";
import { CELL_COLORS } from "../../utils/colors";
import type { OverlayType } from "./StatOverlays";

interface VisualFormulaProps {
  values: CellValues;
  activeOverlays: OverlayType[];
}

interface FormulaDef {
  name: string;
  trueKey: keyof CellValues;
  falseKey: keyof CellValues;
}

const FORMULAS: Record<OverlayType, FormulaDef> = {
  sensitivity: { name: "Sensitivity", trueKey: "tp", falseKey: "fn" },
  specificity: { name: "Specificity", trueKey: "tn", falseKey: "fp" },
  ppv: { name: "PPV", trueKey: "tp", falseKey: "fp" },
  npv: { name: "NPV", trueKey: "tn", falseKey: "fn" },
};

function ColorBar({ color }: { color: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 36,
        height: 8,
        backgroundColor: color,
        borderRadius: 2,
        verticalAlign: "middle",
      }}
    />
  );
}

function Fraction({
  numerator,
  denominator,
}: {
  numerator: React.ReactNode;
  denominator: React.ReactNode;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        verticalAlign: "middle",
        margin: "0 6px",
        lineHeight: 1.3,
      }}
    >
      <span style={{ padding: "0 4px" }}>{numerator}</span>
      <span
        style={{
          width: "100%",
          height: 1,
          backgroundColor: "#94a3b8",
        }}
      />
      <span style={{ padding: "0 4px" }}>{denominator}</span>
    </span>
  );
}

export function VisualFormula({ values, activeOverlays }: VisualFormulaProps) {
  if (activeOverlays.length === 0) return null;

  return (
    <div className="mt-3 space-y-3">
      {activeOverlays.map((overlay) => {
        const def = FORMULAS[overlay];
        const trueVal = values[def.trueKey];
        const falseVal = values[def.falseKey];
        const total = trueVal + falseVal;
        const result = total > 0 ? ((trueVal / total) * 100).toFixed(0) : "0";
        const trueColor = CELL_COLORS[def.trueKey];
        const falseColor = CELL_COLORS[def.falseKey];

        return (
          <div
            key={overlay}
            className="flex items-center gap-1 text-sm text-slate-600 flex-wrap justify-center"
          >
            <span className="font-medium text-slate-700">{def.name}</span>
            <span className="text-slate-600 mx-1">=</span>

            {/* Visual fraction with colored bars */}
            <Fraction
              numerator={<ColorBar color={trueColor} />}
              denominator={
                <span className="flex items-center gap-1">
                  <ColorBar color={trueColor} />
                  <span className="text-xs text-slate-600">+</span>
                  <ColorBar color={falseColor} />
                </span>
              }
            />

            <span className="text-slate-600 mx-1">=</span>

            {/* Numeric fraction */}
            <Fraction
              numerator={
                <span className="text-sm tabular-nums" style={{ color: trueColor }}>
                  {trueVal}
                </span>
              }
              denominator={
                <span className="text-sm tabular-nums">
                  <span style={{ color: trueColor }}>{trueVal}</span>
                  <span className="text-slate-600"> + </span>
                  <span style={{ color: falseColor }}>{falseVal}</span>
                </span>
              }
            />

            <span className="text-slate-600 mx-1">=</span>

            {/* Percentage result */}
            <span className="font-bold text-slate-800 text-base">
              {result}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
