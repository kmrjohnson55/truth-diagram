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
      {/* Header: Home button + lesson number pills */}
      <div className="px-4 py-2 bg-white border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
        <button
          onClick={onHome}
          className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors shrink-0"
        >
          &larr; Home
        </button>

        <div className="h-4 w-px bg-slate-200 shrink-0" />

        {/* Lesson pills */}
        <div className="flex items-center gap-1 shrink-0">
          {lessonTitles.map((title, i) => {
            const num = i + 1;
            const isCurrent = num === meta.number;
            return (
              <button
                key={num}
                onClick={() => onGoTo(num)}
                title={title}
                className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-colors shrink-0 ${
                  isCurrent
                    ? "bg-indigo-500 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {num}
              </button>
            );
          })}
        </div>

        <div className="h-4 w-px bg-slate-200 shrink-0" />

        {/* Current lesson title */}
        <div className="min-w-0 shrink-0">
          <h2 className="text-sm font-bold text-slate-800 truncate">{meta.title}</h2>
          <p className="text-xs text-slate-600 truncate">{meta.subtitle}</p>
        </div>

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
