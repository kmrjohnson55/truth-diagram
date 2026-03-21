import { useState, useCallback, useMemo } from "react";
import { computeStats } from "../utils/statistics";
import type { CellValues, DiagnosticStats } from "../utils/statistics";
import { computeBoxCorners } from "../utils/geometry";
import type { BoxCorners } from "../utils/geometry";

export interface DiagramState {
  values: CellValues;
  stats: DiagnosticStats;
  corners: BoxCorners;
  setValues: (v: CellValues) => void;
  setValue: (key: keyof CellValues, val: number) => void;
}

const DEFAULT_VALUES: CellValues = { tp: 40, fp: 30, fn: 10, tn: 120 };

export function useDiagramState(
  initial: CellValues = DEFAULT_VALUES
): DiagramState {
  const [values, setValues] = useState<CellValues>(initial);

  const setValue = useCallback(
    (key: keyof CellValues, val: number) => {
      setValues((prev) => ({ ...prev, [key]: Math.max(0, Math.round(val)) }));
    },
    []
  );

  const stats = useMemo(() => computeStats(values), [values]);
  const corners = useMemo(() => computeBoxCorners(values), [values]);

  return { values, stats, corners, setValues, setValue };
}
