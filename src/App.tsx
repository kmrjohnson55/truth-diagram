import { useState } from "react";
import { TruthDiagram } from "./components/Diagram/TruthDiagram";
import { InputPanel } from "./components/UI/InputPanel";
import { StatsPanel } from "./components/UI/StatsPanel";
import { Lesson2_BoxAxes } from "./components/Lessons/Lesson2_BoxAxes";
import { Lesson3_SensSpec } from "./components/Lessons/Lesson3_SensSpec";
import { Lesson4_PredValues } from "./components/Lessons/Lesson4_PredValues";
import { Lesson5_Trajectory } from "./components/Lessons/Lesson5_Trajectory";
import { Lesson6_LikelihoodRatios } from "./components/Lessons/Lesson6_LikelihoodRatios";
import { Lesson7_ChiSquare } from "./components/Lessons/Lesson7_ChiSquare";
import { Lesson8_Sandbox } from "./components/Lessons/Lesson8_Sandbox";
import { useDiagramState } from "./hooks/useDiagramState";

const TOTAL_LESSONS = 7;

const LESSON_TITLES = [
  "The Box and Axes",
  "Sensitivity & Specificity",
  "Predictive Values",
  "Trajectory & ROC",
  "Likelihood Ratios & Bayes",
  "Chi-Square Test",
  "Sandbox",
];

function Header() {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-xl font-bold text-slate-800">Truth Diagram</h1>
        <p className="text-xs text-slate-500">
          Interactive 2&times;2 diagnostic testing visualization
        </p>
      </div>
    </header>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}

function App() {
  const { values, stats, setValues, setValue } = useDiagramState();
  const [currentLesson, setCurrentLesson] = useState<number>(0); // 0 = home

  const goHome = () => setCurrentLesson(0);
  const goPrev = () => setCurrentLesson((n) => Math.max(1, n - 1));
  const goNext = () => setCurrentLesson((n) => Math.min(TOTAL_LESSONS, n + 1));

  const navProps = {
    totalLessons: TOTAL_LESSONS,
    onPrev: goPrev,
    onNext: goNext,
    onHome: goHome,
    onGoTo: setCurrentLesson,
    lessonTitles: LESSON_TITLES,
  };
  const dataProps = { values, stats, setValue, setValues };

  // Each lesson is a proper React component with its own hook lifecycle
  // Lesson 1: Box & Axes (formerly Lesson 2)
  if (currentLesson === 1) {
    return (
      <AppShell>
        <Lesson2_BoxAxes key="lesson1" {...navProps} {...dataProps} />
      </AppShell>
    );
  }
  // Lesson 2: Sensitivity & Specificity (formerly Lesson 3)
  if (currentLesson === 2) {
    return (
      <AppShell>
        <Lesson3_SensSpec key="lesson2" {...navProps} {...dataProps} />
      </AppShell>
    );
  }
  // Lesson 3: Predictive Values (formerly Lesson 4)
  if (currentLesson === 3) {
    return (
      <AppShell>
        <Lesson4_PredValues key="lesson3" {...navProps} {...dataProps} />
      </AppShell>
    );
  }
  // Lesson 4: Trajectory & ROC (formerly Lesson 5)
  if (currentLesson === 4) {
    return (
      <AppShell>
        <Lesson5_Trajectory key="lesson4" {...navProps} values={values} stats={stats} setValues={setValues} />
      </AppShell>
    );
  }
  // Lesson 5: Likelihood Ratios & Bayes (formerly Lesson 6)
  if (currentLesson === 5) {
    return (
      <AppShell>
        <Lesson6_LikelihoodRatios key="lesson5" {...navProps} {...dataProps} />
      </AppShell>
    );
  }
  // Lesson 6: Chi-Square Test (formerly Lesson 7)
  if (currentLesson === 6) {
    return (
      <AppShell>
        <Lesson7_ChiSquare key="lesson6" {...navProps} {...dataProps} />
      </AppShell>
    );
  }
  // Lesson 7: Sandbox (formerly Lesson 8)
  if (currentLesson === 7) {
    return (
      <AppShell>
        <Lesson8_Sandbox key="lesson7" {...navProps} {...dataProps} />
      </AppShell>
    );
  }

  // Home view
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Lessons navigation cards */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Lessons
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { n: 1, title: "Box & Axes", icon: "\u2795" },
              { n: 2, title: "Sensitivity & Specificity", icon: "\uD83C\uDFAF" },
              { n: 3, title: "Predictive Values", icon: "\uD83D\uDD2E" },
              { n: 4, title: "Trajectory & ROC", icon: "\uD83D\uDCC8" },
              { n: 5, title: "Likelihood Ratios & Bayes", icon: "\u2696\uFE0F" },
              { n: 6, title: "Chi-Square Test", icon: "\uD83D\uDCD0" },
              { n: 7, title: "Sandbox", icon: "\uD83E\uDDEA" },
            ].map((lesson) => (
              <button
                key={lesson.n}
                onClick={() => setCurrentLesson(lesson.n)}
                className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all text-left"
              >
                <span className="text-2xl">{lesson.icon}</span>
                <div>
                  <span className="text-xs text-indigo-500 font-semibold">
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

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <TruthDiagram values={values} onDrag={setValues} />
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
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <StatsPanel stats={stats} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
