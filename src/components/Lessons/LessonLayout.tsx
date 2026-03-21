import type { ReactNode } from "react";
import { ExportButton } from "../UI/ExportPanel";
import { CostPanel } from "../UI/CostPanel";
import type { CellValues } from "../../utils/statistics";
import type { CostState } from "./lessonTypes";

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
  costState: CostState;
  diagram: ReactNode;
  keyInsight?: ReactNode;
  diagramHeader?: ReactNode;
  /** Content rendered below the diagram on the left (2x2 table, presets, etc.) */
  diagramFooter?: ReactNode;
  children: ReactNode;
  values?: CellValues;
}

const SHORT_TITLES = [
  "Sens / Spec",
  "PPV / NPV",
  "Odds Ratio",
  "LR & Bayes",
  "Chi-Square",
  "ROC Curves",
  "Compare",
  "Summary",
];

export function LessonLayout({
  meta,
  totalLessons: _totalLessons,
  onPrev: _onPrev,
  onNext: _onNext,
  onHome,
  onGoTo,
  lessonTitles: _lessonTitles,
  costState,
  diagram,
  keyInsight,
  diagramHeader,
  diagramFooter,
  children,
  values,
}: LessonLayoutProps) {
  const { costMode, costs, setCost, setCosts } = costState;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2 bg-white border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto">
        <button
          onClick={onHome}
          className="px-2 py-1 text-xs font-medium text-black hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors shrink-0"
        >
          &larr; Home
        </button>
        <button
          onClick={() => onGoTo(-1)}
          className={`px-2 py-1 text-xs font-medium rounded-md transition-colors shrink-0 ${
            meta.number === 0 ? "bg-indigo-100 text-indigo-700" : "text-black hover:bg-slate-100"
          }`}
        >
          Intro
        </button>
        {SHORT_TITLES.map((title, i) => {
          const num = i + 1;
          const isCurrent = num === meta.number;
          return (
            <button
              key={num}
              onClick={() => onGoTo(num)}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-colors shrink-0 ${
                isCurrent
                  ? "bg-indigo-500 text-white"
                  : "bg-blue-50 text-black hover:bg-blue-100"
              }`}
            >
              {num}. {title}
            </button>
          );
        })}
        <div className="ml-auto shrink-0">
          {values && <ExportButton values={values} lesson={meta.number} />}
        </div>
      </div>

      {/* Cost mode banner */}
      {costMode && (
        <div className="px-6 py-1.5 bg-orange-50 border-b border-orange-200 text-xs text-orange-800 text-center">
          <strong>Cost mode active</strong> — diagram dimensions and values reflect costs (count &times; cost/subject)
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6 overflow-auto">
        {/* Left: Diagram + footer */}
        <div className="flex-1 min-w-0 lg:w-3/5">
          {diagramHeader && <div className="mb-3">{diagramHeader}</div>}
          <div className={`bg-white rounded-xl shadow-sm border p-4 ${costMode ? "border-orange-200" : "border-slate-200"}`}>
            {diagram}
          </div>
          {diagramFooter && (
            <div className="mt-3 bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              {diagramFooter}
            </div>
          )}
        </div>
        {/* Right: Educational content + cost panel */}
        <div className="w-full lg:w-2/5 shrink-0 space-y-4">
          {costMode && (
            <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-4">
              <CostPanel costs={costs} setCost={setCost} setCosts={setCosts} />
            </div>
          )}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4 overflow-auto">
            {keyInsight}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
