import { useState } from "react";
import { TruthDiagram } from "./components/Diagram/TruthDiagram";
import { InputPanel } from "./components/UI/InputPanel";
import { StatsPanel } from "./components/UI/StatsPanel";
import { Lesson0_Introduction } from "./components/Lessons/Lesson0_Introduction";
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
  "ROC Curves",
  "Likelihood Ratios & Bayes",
  "Chi-Square Test",
  "Sandbox",
];

function Header() {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-xl font-bold text-slate-800">Johnson Truth Diagram</h1>
        <p className="text-xs text-slate-600">
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
  const [currentLesson, setCurrentLesson] = useState<number>(-1); // -1 = introduction

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

  // Introduction
  if (currentLesson === -1) {
    return (
      <AppShell>
        <Lesson0_Introduction key="intro" {...navProps} values={values} stats={stats} setValues={setValues} />
      </AppShell>
    );
  }
  // Lesson 1: Box & Axes
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
  // Lesson 4: ROC Curves (formerly Lesson 5)
  if (currentLesson === 4) {
    return (
      <AppShell>
        <Lesson5_Trajectory key="lesson4" {...navProps} {...dataProps} />
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
        {/* Introduction button */}
        <div className="mb-4">
          <button
            onClick={() => setCurrentLesson(-1)}
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
              { n: 1, title: "Box & Axes", icon: "\u2795" },
              { n: 2, title: "Sensitivity & Specificity", icon: "\uD83C\uDFAF" },
              { n: 3, title: "Predictive Values", icon: "\uD83D\uDD2E" },
              { n: 4, title: "ROC Curves", icon: "\uD83D\uDCC8" },
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

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <TruthDiagram
                values={values}
                onDrag={setValues}
                renderExtraSvg={(layout) => {
                  const { centerX: cx, centerY: cy, scale: s } = layout;
                  const { tp: t, fp: f, fn: n, tn: r } = values;
                  // Box corners in SVG coords
                  const ulY = cy - t * s;
                  const llY = cy + n * s;
                  const ulX = cx - f * s;
                  const urX = cx + r * s;
                  const bracketColor = "#b45309"; // burnt orange
                  const bracketOffset = 18;
                  const bracketWidth = 6;
                  // Vertical curly bracket (right side) — "Diseased"
                  const vx = urX + bracketOffset;
                  const vmid = (ulY + llY) / 2;
                  const vPath = `M${vx - bracketWidth},${ulY} Q${vx},${ulY} ${vx},${ulY + 8} L${vx},${vmid - 6} Q${vx},${vmid} ${vx + bracketWidth},${vmid} Q${vx},${vmid} ${vx},${vmid + 6} L${vx},${llY - 8} Q${vx},${llY} ${vx - bracketWidth},${llY}`;
                  // Horizontal curly bracket (below) — "Healthy"
                  const hy = llY + bracketOffset;
                  const hmid = (ulX + urX) / 2;
                  const hPath = `M${ulX},${hy - bracketWidth} Q${ulX},${hy} ${ulX + 8},${hy} L${hmid - 6},${hy} Q${hmid},${hy} ${hmid},${hy + bracketWidth} Q${hmid},${hy} ${hmid + 6},${hy} L${urX - 8},${hy} Q${urX},${hy} ${urX},${hy - bracketWidth}`;
                  return (
                    <g>
                      <path d={vPath} fill="none" stroke={bracketColor} strokeWidth={1.5} />
                      <text x={vx + bracketWidth + 4} y={vmid + 4} fontSize={11} fontWeight={600} fill={bracketColor}>
                        Diseased
                      </text>
                      <path d={hPath} fill="none" stroke={bracketColor} strokeWidth={1.5} />
                      <text x={hmid} y={hy + bracketWidth + 14} textAnchor="middle" fontSize={11} fontWeight={600} fill={bracketColor}>
                        Healthy
                      </text>
                    </g>
                  );
                }}
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
