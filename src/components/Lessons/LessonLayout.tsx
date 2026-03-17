import type { ReactNode } from "react";

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
}

export function LessonLayout({
  meta,
  totalLessons,
  onPrev,
  onNext,
  onHome,
  onGoTo,
  lessonTitles,
  diagram,
  keyInsight,
  diagramHeader,
  children,
}: LessonLayoutProps) {
  const isFirst = meta.number <= 1;
  const isLast = meta.number >= totalLessons;

  return (
    <div className="flex flex-col h-full">
      {/* Header with navigation + lesson picker */}
      <div className="px-4 py-2 bg-white border-b border-slate-200 flex items-center justify-between gap-2">
        {/* Left: nav buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onHome}
            className="px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
          >
            &larr; Home
          </button>
          <button
            onClick={onPrev}
            disabled={isFirst}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              isFirst
                ? "text-slate-300 cursor-not-allowed"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            &larr; Prev
          </button>
          <button
            onClick={onNext}
            disabled={isLast}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              isLast
                ? "text-slate-300 cursor-not-allowed"
                : "text-white bg-indigo-500 hover:bg-indigo-600"
            }`}
          >
            Next &rarr;
          </button>
        </div>

        {/* Center: badge + title */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs font-semibold text-white bg-indigo-500 rounded-full px-2.5 py-0.5 shrink-0">
            {meta.number} / {totalLessons}
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-800 truncate">{meta.title}</h2>
            <p className="text-xs text-slate-500 truncate">{meta.subtitle}</p>
          </div>
        </div>

        {/* Right: lesson picker */}
        <div className="shrink-0">
          <select
            value={meta.number}
            onChange={(e) => onGoTo(parseInt(e.target.value))}
            className="px-2 py-1 text-xs border border-slate-200 rounded-md
              focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent
              bg-white text-slate-700 cursor-pointer"
          >
            {lessonTitles.map((title, i) => (
              <option key={i} value={i + 1}>
                {i + 1}. {title}
              </option>
            ))}
          </select>
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
