import { useState, useCallback, useMemo } from "react";
import { TruthDiagram } from "./components/Diagram/TruthDiagram";
import { InputPanel } from "./components/UI/InputPanel";
import { StatsPanel } from "./components/UI/StatsPanel";
import { CostPanel } from "./components/UI/CostPanel";
import { Lesson0_Introduction } from "./components/Lessons/Lesson0_Introduction";
import { Lesson3_SensSpec } from "./components/Lessons/Lesson3_SensSpec";
import { Lesson4_PredValues } from "./components/Lessons/Lesson4_PredValues";
import { LessonOddsRatio } from "./components/Lessons/LessonOddsRatio";
import { Lesson5_Trajectory } from "./components/Lessons/Lesson5_Trajectory";
import { Lesson6_LikelihoodRatios } from "./components/Lessons/Lesson6_LikelihoodRatios";
import { Lesson7_ChiSquare } from "./components/Lessons/Lesson7_ChiSquare";
import { Lesson8_Sandbox } from "./components/Lessons/Lesson8_Sandbox";
import { Lesson9_Compare } from "./components/Lessons/Lesson9_Compare";
import { LessonCurveInput } from "./components/Lessons/LessonCurveInput";
import { useDiagramState } from "./hooks/useDiagramState";
import { computeStats } from "./utils/statistics";
import type { CostWeights, CostState, TestToggleState } from "./components/Lessons/lessonTypes";
import type { CellValues } from "./utils/statistics";

const TOTAL_LESSONS = 9;

const LESSON_TITLES = [
  "Sensitivity & Specificity",
  "Predictive Values",
  "Diagnostic Odds Ratio",
  "Likelihood Ratios & Bayes",
  "Chi-Square Test",
  "ROC Curves",
  "Compare Two Tests",
  "Curve Data",
  "Summary",
];

function CostToggle({ costMode, setCostMode }: { costMode: boolean; setCostMode: (on: boolean) => void }) {
  const [showTooltip, setShowTooltip] = useState(false);
  return (
    <div className="relative flex items-center gap-1.5">
      <button
        onClick={() => setCostMode(!costMode)}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
          costMode
            ? "bg-orange-100 text-orange-800 border-orange-300"
            : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
        }`}
      >
        <span className={`w-2 h-2 rounded-full ${costMode ? "bg-orange-500" : "bg-slate-300"}`} />
        {costMode ? "Cost Mode ON" : "Cost Mode"}
      </button>
      <span
        className="inline-flex items-center justify-center w-4 h-4 text-[9px] font-bold text-orange-400 bg-orange-50 border border-orange-200 rounded-full cursor-help select-none"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >?</span>
      {showTooltip && (
        <div
          className="absolute right-0 top-full mt-1 z-50 w-72 p-3 text-xs text-slate-700 bg-white border border-slate-200 rounded-lg shadow-lg leading-relaxed"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <p className="font-semibold text-orange-700 mb-1">Cost Mode <span className="text-[9px] bg-orange-100 text-orange-600 px-1 py-0.5 rounded">BETA</span></p>
          <p className="mb-1.5">
            Multiplies each cell count by a per-subject cost, then redraws the
            diagram and recalculates all statistics using cost-weighted values.
          </p>
          <p className="mb-1.5">
            The resulting statistics (sensitivity<sub>cost</sub>, PPV<sub>cost</sub>, etc.)
            are <strong>cost-weighted analogs</strong> of the standard measures &mdash;
            they reflect the relative economic impact rather than subject counts.
          </p>
          <p className="text-slate-500 italic">
            This is an experimental feature. Cost-weighted statistics are not
            standard epidemiological measures and should be interpreted with care.
          </p>
        </div>
      )}
    </div>
  );
}

function Header({ costMode, setCostMode, hideCostToggle }: { costMode: boolean; setCostMode: (on: boolean) => void; hideCostToggle?: boolean }) {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Johnson Truth Diagram</h1>
          <p className="text-xs text-slate-600">
            Interactive 2&times;2 diagnostic testing visualization
          </p>
        </div>
        {!hideCostToggle && <CostToggle costMode={costMode} setCostMode={setCostMode} />}
      </div>
    </header>
  );
}

function AppShell({ children, costMode, setCostMode, hideCostToggle }: { children: React.ReactNode; costMode: boolean; setCostMode: (on: boolean) => void; hideCostToggle?: boolean }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header costMode={costMode} setCostMode={setCostMode} hideCostToggle={hideCostToggle} />
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}

function App() {
  // Test A (default)
  const { values: valuesA, stats: statsA, setValues: setValuesA, setValue: setValueA } = useDiagramState();
  // Test B (optional second test)
  // Test B default: same population (50 diseased, 150 healthy) but
  // a mediocre test (~60% sens, ~60% spec) — clearly worse than Test A
  const [valuesB, setValuesB] = useState<CellValues>({ tp: 30, fp: 60, fn: 20, tn: 90 });
  const setValueB = useCallback(
    (key: keyof CellValues, val: number) => setValuesB((prev) => ({ ...prev, [key]: Math.max(0, Math.round(val)) })),
    []
  );
  const statsB = useMemo(() => computeStats(valuesB), [valuesB]);
  const [hasTestB, setHasTestB] = useState(true);
  const [activeTest, setActiveTest] = useState<"A" | "B">("A");

  const [currentLesson, setCurrentLesson] = useState<number>(-1);

  // Cost state
  const [costMode, setCostMode] = useState(false);
  const [costs, setCosts] = useState<CostWeights>({ tp: 1, fp: 1, fn: 10, tn: 0 });
  const setCost = useCallback(
    (key: keyof CostWeights, val: number) => setCosts((prev) => ({ ...prev, [key]: val })),
    []
  );

  // Active test values — Test A is default, Test B only when toggled
  const values = activeTest === "B" && hasTestB ? valuesB : valuesA;
  const stats = activeTest === "B" && hasTestB ? statsB : statsA;
  const setValues = activeTest === "B" && hasTestB ? setValuesB : setValuesA;
  const setValue = activeTest === "B" && hasTestB ? setValueB : setValueA;

  // Cost-weighted values — these become THE cell values when cost mode is on
  const effectiveValues = useMemo(() =>
    costMode
      ? { tp: values.tp * costs.tp, fp: values.fp * costs.fp, fn: values.fn * costs.fn, tn: values.tn * costs.tn }
      : values,
    [values, costs, costMode]
  );
  const effectiveStats = useMemo(() => computeStats(effectiveValues), [effectiveValues]);

  const costState: CostState = {
    costMode, costs, setCostMode, setCosts, setCost,
    subjectValues: costMode ? values : undefined,
  };

  const testToggle: TestToggleState = {
    activeTest,
    setActiveTest,
    hasTestB,
  };

  const goHome = () => setCurrentLesson(0);
  const goPrev = () => setCurrentLesson((n) => Math.max(1, n - 1));
  const goNext = () => setCurrentLesson((n) => Math.min(TOTAL_LESSONS, n + 1));
  const goToLesson = useCallback((n: number) => {
    // Auto-enable Test B when visiting Compare page
    if (n === 7 && !hasTestB) setHasTestB(true);
    setCurrentLesson(n);
  }, [hasTestB]);

  const navProps = {
    totalLessons: TOTAL_LESSONS,
    onPrev: goPrev,
    onNext: goNext,
    onHome: goHome,
    onGoTo: goToLesson,
    lessonTitles: LESSON_TITLES,
    costState,
    testToggle,
  };
  const dataProps = { values: effectiveValues, stats: effectiveStats, setValue, setValues };

  // Introduction
  if (currentLesson === -1) {
    return (
      <AppShell costMode={costMode} setCostMode={setCostMode} hideCostToggle>
        <Lesson0_Introduction key="intro" {...navProps} values={values} stats={stats} setValues={setValues} />
      </AppShell>
    );
  }
  // Lesson 1: Sensitivity & Specificity
  if (currentLesson === 1) {
    return (
      <AppShell costMode={costMode} setCostMode={setCostMode} hideCostToggle>
        <Lesson3_SensSpec key="lesson1" {...navProps} {...dataProps} />
      </AppShell>
    );
  }
  // Lesson 2: Predictive Values
  if (currentLesson === 2) {
    return (
      <AppShell costMode={costMode} setCostMode={setCostMode} hideCostToggle>
        <Lesson4_PredValues key="lesson2" {...navProps} {...dataProps} />
      </AppShell>
    );
  }
  // Lesson 3: Diagnostic Odds Ratio
  if (currentLesson === 3) {
    return (
      <AppShell costMode={costMode} setCostMode={setCostMode} hideCostToggle>
        <LessonOddsRatio key="lesson3" {...navProps} {...dataProps} />
      </AppShell>
    );
  }
  // Lesson 4: Likelihood Ratios & Bayes
  if (currentLesson === 4) {
    return (
      <AppShell costMode={costMode} setCostMode={setCostMode} hideCostToggle>
        <Lesson6_LikelihoodRatios key="lesson4" {...navProps} {...dataProps} />
      </AppShell>
    );
  }
  // Lesson 5: Chi-Square Test
  if (currentLesson === 5) {
    return (
      <AppShell costMode={costMode} setCostMode={setCostMode} hideCostToggle>
        <Lesson7_ChiSquare key="lesson5" {...navProps} {...dataProps} />
      </AppShell>
    );
  }
  // Lesson 6: ROC Curves
  if (currentLesson === 6) {
    return (
      <AppShell costMode={costMode} setCostMode={setCostMode} hideCostToggle>
        <Lesson5_Trajectory key="lesson6" {...navProps} {...dataProps} />
      </AppShell>
    );
  }
  // Lesson 7: Compare Two Tests
  if (currentLesson === 7) {
    return (
      <AppShell costMode={costMode} setCostMode={setCostMode} hideCostToggle>
        <Lesson9_Compare key="lesson7" {...navProps} {...dataProps}
          valuesA={valuesA} valuesB={valuesB} statsA={statsA} statsB={statsB}
          setValuesA={setValuesA} setValuesB={setValuesB} setValueA={setValueA} setValueB={setValueB} />
      </AppShell>
    );
  }
  // Lesson 8: Curve Data
  if (currentLesson === 8) {
    return (
      <AppShell costMode={costMode} setCostMode={setCostMode} hideCostToggle>
        <LessonCurveInput key="lesson8" {...navProps} {...dataProps} />
      </AppShell>
    );
  }
  // Lesson 9: Summary
  if (currentLesson === 9) {
    return (
      <AppShell costMode={costMode} setCostMode={setCostMode} hideCostToggle>
        <Lesson8_Sandbox key="lesson9" {...navProps} {...dataProps} />
      </AppShell>
    );
  }

  // Home view
  return (
    <div className="min-h-screen bg-slate-50">
      <Header costMode={costMode} setCostMode={setCostMode} hideCostToggle />
      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Introduction button */}
        <div className="mb-4">
          <button
            onClick={() => goToLesson(-1)}
            className="w-full flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 hover:shadow-md transition-all text-left"
          >
            <span className="text-2xl">{"\uD83D\uDCD6"}</span>
            <div>
              <span className="text-sm text-indigo-600 font-bold">Introduction</span>
              <p className="text-sm text-slate-600">What is the truth diagram and how to use these lessons</p>
            </div>
          </button>
        </div>

        {/* Lessons navigation cards */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">
            Lessons
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { n: 1, title: "Sensitivity & Specificity", icon: "\uD83C\uDFAF" },
              { n: 2, title: "Predictive Values", icon: "\uD83D\uDD2E" },
              { n: 3, title: "Diagnostic Odds Ratio", icon: "\uD83D\uDCCA" },
              { n: 4, title: "Likelihood Ratios & Bayes", icon: "\u2696\uFE0F" },
              { n: 5, title: "Chi-Square Test", icon: "\uD83D\uDCD0" },
              { n: 6, title: "ROC Curves", icon: "\uD83D\uDCC8" },
              { n: 7, title: "Compare Two Tests", icon: "\uD83D\uDD0D" },
              { n: 8, title: "Curve Data", icon: "\uD83D\uDCC1" },
              { n: 9, title: "Summary", icon: "\uD83E\uDDEA" },
            ].map((lesson) => (
              <button
                key={lesson.n}
                onClick={() => goToLesson(lesson.n)}
                className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all text-left"
              >
                <span className="text-2xl">{lesson.icon}</span>
                <div>
                  <span className="text-xs text-indigo-600 font-semibold">
                    Lesson {lesson.n}
                  </span>
                  <p className="text-sm font-medium text-slate-700">
                    {lesson.title}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Cost mode banner */}
        {costMode && (
          <div className="mb-4 bg-orange-50 border border-orange-200 rounded-xl p-3 text-xs text-orange-800">
            <strong>Cost mode active.</strong> Diagram dimensions and statistics reflect cost-weighted values (count &times; cost per subject).
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <div className={`bg-white rounded-xl shadow-sm border p-4 ${costMode ? "border-orange-200" : "border-slate-200"}`}>
              <TruthDiagram
                values={effectiveValues}
                onDrag={costMode ? undefined : setValues}
                costMode={costMode}
                subjectValues={costMode ? values : undefined}
              />
            </div>
          </div>
          <div className="w-full lg:w-80 shrink-0 space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <InputPanel
                values={values}
                setValue={setValue}
                setValues={setValues}
              />
            </div>
            {costMode && (
              <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-4">
                <CostPanel costs={costs} setCost={setCost} setCosts={setCosts} />
              </div>
            )}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <StatsPanel
                stats={stats}
                costMode={costMode}
                values={values}
                costs={costs}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
