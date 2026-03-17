import type { CellValues } from "../../utils/statistics";
import { toSvg } from "../../utils/geometry";

interface SubjectBoxProps {
  values: CellValues;
  centerX: number;
  centerY: number;
  scale: number;
}

export function SubjectBox({ values, centerX, centerY, scale }: SubjectBoxProps) {
  const { tp, fp, fn, tn } = values;

  const ul = toSvg(-fp, tp, centerX, centerY, scale);
  const ur = toSvg(tn, tp, centerX, centerY, scale);
  const ll = toSvg(-fp, -fn, centerX, centerY, scale);

  const width = ur.x - ul.x;
  const height = ll.y - ul.y;

  return (
    <g className="subject-box">
      <rect
        x={ul.x}
        y={ul.y}
        width={width}
        height={height}
        fill="none"
        stroke="#4f46e5"
        strokeWidth={2}
      />
    </g>
  );
}
