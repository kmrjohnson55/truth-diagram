import { LessonLayout } from "./LessonLayout";
import { TruthDiagram } from "../Diagram/TruthDiagram";
import type { CellValues, DiagnosticStats } from "../../utils/statistics";
import type { LessonNavProps } from "./lessonTypes";

interface IntroProps extends LessonNavProps {
  values: CellValues;
  stats: DiagnosticStats;
  setValues: (v: CellValues) => void;
}

export function Lesson0_Introduction({
  values,
  stats: _stats,
  setValues,
  totalLessons,
  onPrev,
  onNext,
  onHome,
  onGoTo,
  lessonTitles,
}: IntroProps) {
  return (
    <LessonLayout
      meta={{
        number: 0,
        title: "Introduction",
        subtitle: "What is the truth diagram?",
      }}
      totalLessons={totalLessons}
      onPrev={onPrev}
      onNext={onNext}
      onHome={onHome}
      onGoTo={onGoTo}
      lessonTitles={lessonTitles}
      diagram={
        <TruthDiagram
          values={values}
          onDrag={setValues}
          overlays={[]}
        />
      }
    >
      <div className="space-y-5">
        <div>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">
            What Is the Truth Diagram?
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            The truth diagram (or 2&times;2 diagram) is a graphical way to
            visualize and understand the results of a diagnostic test. It
            replaces the traditional 2&times;2 contingency table with an
            interactive picture where every important statistic &mdash;
            sensitivity, specificity, predictive values, likelihood ratios,
            and more &mdash; can be <em>seen at a glance</em>.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">
            How It Works
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            A rectangle represents all subjects in the study. It sits on a
            four-direction coordinate system:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            <li>
              <strong className="text-green-600">&uarr; Up</strong> = True
              Positives (TP) &mdash; disease present, test positive
            </li>
            <li>
              <strong className="text-red-600">&darr; Down</strong> = False
              Negatives (FN) &mdash; disease present, test negative
            </li>
            <li>
              <strong className="text-yellow-600">&larr; Left</strong> = False
              Positives (FP) &mdash; disease absent, test positive
            </li>
            <li>
              <strong className="text-blue-600">&rarr; Right</strong> = True
              Negatives (TN) &mdash; disease absent, test negative
            </li>
          </ul>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            The <strong>shape</strong> of the box reflects prevalence (how
            common the disease is). The <strong>position</strong> of the box
            reflects how well the test performs. A perfect test would place
            the entire box in the upper-right quadrant.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">
            Using These Lessons
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Work through the eight lessons in order. Each builds on
            the previous one:
          </p>
          <ol className="mt-2 space-y-1 text-sm text-slate-600 list-decimal list-inside">
            <li><strong>Box &amp; Axes</strong> &mdash; the coordinate system</li>
            <li><strong>Sensitivity &amp; Specificity</strong> &mdash; basic test accuracy</li>
            <li><strong>Predictive Values</strong> &mdash; PPV, NPV, and prevalence effects</li>
            <li><strong>ROC Curves</strong> &mdash; threshold tradeoffs</li>
            <li><strong>Likelihood Ratios &amp; Bayes</strong> &mdash; odds and slopes</li>
            <li><strong>Chi-Square Test</strong> &mdash; statistical significance</li>
            <li><strong>Compare Two Tests</strong> &mdash; side-by-side on the same population</li>
            <li><strong>Sandbox</strong> &mdash; free exploration with all features</li>
          </ol>
        </div>

        <div>
          <p className="text-sm text-slate-600 leading-relaxed">
            On every screen, you can <strong>drag the box</strong> to change
            its position and <strong>drag the corners</strong> to resize it.
            Try it now with the diagram on the left!
          </p>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">
            References
          </h3>
          <ol className="space-y-2 text-xs text-slate-600 list-decimal list-inside leading-relaxed">
            <li>
              Johnson KM. The two by two diagram: a graphical truth table.
              <em> J Clin Epidemiol</em> 1999;52:1073&ndash;1082.
            </li>
            <li>
              Johnson KM, Johnson BK. Visual presentation of statistical
              concepts in diagnostic testing: the 2&times;2 diagram.
              <em> AJR Am J Roentgenol</em> 2014;203:W14&ndash;W20.
            </li>
            <li>
              Johnson KM. Using Bayes&rsquo; rule in diagnostic testing: a
              graphical explanation.
              <em> Diagnosis</em> 2017;4(3):159&ndash;167.
            </li>
          </ol>
        </div>

        <button
          onClick={() => onGoTo(1)}
          className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-colors"
        >
          Start Lesson 1: Box &amp; Axes &rarr;
        </button>
      </div>
    </LessonLayout>
  );
}
