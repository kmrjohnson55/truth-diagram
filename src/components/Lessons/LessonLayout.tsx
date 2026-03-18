import type { ReactNode } from "react";
import { ExportButton } from "../UI/ExportPanel";
import type { CellValues } from "../../utils/statistics";

export interface LessonMeta {
  number: number;
  title: string;
  subtitle: string;
}

interface LessonLayoutProps {
  meta: LessonMeta;
  totalLessons: number;
  onPrev: () => void;
  onNext: () => void;
  onHome: () => void;
  onGoTo: (lesson: number) => void;
  lessonTitles: string[];
  /** Left side: the diagram area */
  diagram: ReactNode;
  /** Optional key insight box rendered at the top of the right panel */
  keyInsight?: ReactNode;
  /** Optional content rendered above the diagram on the left side */
  diagramHeader?: ReactNode;
  /** Right side: educational content */
  children: ReactNode;
  /** Current cell values for export */
  values?: CellValues;
}

export function LessonLayout({
  meta,
  totalLessons: _totalLessons,
  onPrev: _onPrev,
  onNext: _onNext,
  onHome,
  onGoTo,
  lessonTitles,
  diagram,
  keyInsight,
  diagramHeader,
  children,
  values,
}: LessonLayoutProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header: Home + dropdown nav + export */}
      <div className="px-4 py-2 bg-indigo-600 flex items-center gap-3">
        <button
          onClick={onHome}
          className="px-2.5 py-1 text-sm font-medium text-indigo-100 hover:text-white hover:bg-indigo-500 rounded-md transition-colors shrink-0"
        >
          &larr; Home
        </button>

        <select
          value={meta.number}
          onChange={(e) => {
            const val = parseInt(e.target.value);
            if (val === -1) onHome();
            else onGoTo(val);
          }}
          className="px-3 py-1.5 text-sm font-bold bg-indigo-500 text-white border border-indigo-400 rounded-md
            focus:outline-none focus:ring-2 focus:ring-white/40 cursor-pointer min-w-[220px]"
        >
          <option value={-1}>Introduction</option>
          {lessonTitles.map((title, i) => (
            <option key={i} value={i + 1}>
              {i + 1}. {title}
            </option>
          ))}
        </select>

        <div className="ml-auto shrink-0">
          {values && <ExportButton values={values} lesson={meta.number} />}
        </div>
      </div>

      {/* Main content: diagram + text side-by-side */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6 overflow-auto">
        {/* Left: Diagram (~60%) */}
        <div className="flex-1 min-w-0 lg:w-3/5">
          {diagramHeader && <div className="mb-3">{diagramHeader}</div>}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            {diagram}
          </div>
        </div>

        {/* Right: Educational content (~40%) */}
        <div className="w-full lg:w-2/5 shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4 h-full overflow-auto">
            {keyInsight}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
