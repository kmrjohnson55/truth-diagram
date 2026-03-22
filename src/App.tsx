import { useState, useCallback, useMemo } from "react";
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

  const [currentLesson, setCurrentLesson] = useState<number>(0);

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
  const goPrev = () => setCurrentLesson((n) => Math.max(0, n - 1));
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

  // Introduction (landing page)
  if (currentLesson === 0) {
    return (
      <AppShell costMode={costMode} setCostMode={setCostMode}>
        <Lesson0_Introduction key="intro" {...navProps} values={values} stats={stats} setValues={setValues} />
      </AppShell>
    );
  }
  // Lesson 1: Sensitivity & Specificity
  if (currentLesson === 1) {
    return (
      <AppShell costMode={costMode} setCostMode={setCostMode}>
        <Lesson3_SensSpec key="lesson1" {...navProps} {...dataProps} />
      </AppShell>
    );
  }
  // Lesson 2: Predictive Values
  if (currentLesson === 2) {
    return (
      <AppShell costMode={costMode} setCostMode={setCostMode}>
        <Lesson4_PredValues key="lesson2" {...navProps} {...dataProps} />
      </AppShell>
    );
  }
  // Lesson 3: Diagnostic Odds Ratio
  if (currentLesson === 3) {
    return (
      <AppShell costMode={costMode} setCostMode={setCostMode}>
        <LessonOddsRatio key="lesson3" {...navProps} {...dataProps} />
      </AppShell>
    );
  }
  // Lesson 4: Likelihood Ratios & Bayes
  if (currentLesson === 4) {
    return (
      <AppShell costMode={costMode} setCostMode={setCostMode}>
        <Lesson6_LikelihoodRatios key="lesson4" {...navProps} {...dataProps} />
      </AppShell>
    );
  }
  // Lesson 5: Chi-Square Test
  if (currentLesson === 5) {
    return (
      <AppShell costMode={costMode} setCostMode={setCostMode}>
        <Lesson7_ChiSquare key="lesson5" {...navProps} {...dataProps} />
      </AppShell>
    );
  }
  // Lesson 6: ROC Curves
  if (currentLesson === 6) {
    return (
      <AppShell costMode={costMode} setCostMode={setCostMode}>
        <Lesson5_Trajectory key="lesson6" {...navProps} {...dataProps} />
      </AppShell>
    );
  }
  // Lesson 7: Compare Two Tests
  if (currentLesson === 7) {
    return (
      <AppShell costMode={costMode} setCostMode={setCostMode}>
        <Lesson9_Compare key="lesson7" {...navProps} {...dataProps}
          valuesA={valuesA} valuesB={valuesB} statsA={statsA} statsB={statsB}
          setValuesA={setValuesA} setValuesB={setValuesB} setValueA={setValueA} setValueB={setValueB} />
      </AppShell>
    );
  }
  // Lesson 8: Curve Data
  if (currentLesson === 8) {
    return (
      <AppShell costMode={costMode} setCostMode={setCostMode}>
        <LessonCurveInput key="lesson8" {...navProps} {...dataProps} />
      </AppShell>
    );
  }
  // Lesson 9: Summary
  if (currentLesson === 9) {
    return (
      <AppShell costMode={costMode} setCostMode={setCostMode}>
        <Lesson8_Sandbox key="lesson9" {...navProps} {...dataProps} />
      </AppShell>
    );
  }

  // Fallback: go to Intro
  return (
    <AppShell costMode={costMode} setCostMode={setCostMode}>
      <Lesson0_Introduction key="intro" {...navProps} values={values} stats={stats} setValues={setValues} />
    </AppShell>
  );
}

export default App;
