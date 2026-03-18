import { LessonLayout } from "./LessonLayout";
import { TruthDiagram } from "../Diagram/TruthDiagram";
import { DiagonalOverlays } from "../Diagram/DiagonalOverlays";
import { formatRatio } from "../../utils/statistics";
import { CELL_COLORS } from "../../utils/colors";
import { presets, generalPresets, clinicalPresets } from "../../utils/presets";
import type { CellValues, DiagnosticStats } from "../../utils/statistics";
import type { LessonNavProps } from "./lessonTypes";

interface Lesson6Props extends LessonNavProps {
  values: CellValues;
  stats: DiagnosticStats;
  setValue: (key: keyof CellValues, val: number) => void;
  setValues: (v: CellValues) => void;
}

export function Lesson6_LikelihoodRatios({
  values,
  stats,
  setValue: _setValue,
  setValues,
  totalLessons,
  onPrev,
  onNext,
  onHome,
  onGoTo,
  lessonTitles,
}: Lesson6Props) {
  const { tp, fp, fn, tn } = values;
  const diseased = tp + fn;
  const healthy = fp + tn;

  const pretestOdds = healthy > 0 ? diseased / healthy : Infinity;
  const posttestOddsPos = fp > 0 ? tp / fp : Infinity;
  const posttestOddsNeg = tn > 0 ? fn / tn : 0;
  const posLR = stats.positiveLR;
  const negLR = stats.negativeLR;

  return (
    <LessonLayout
      meta={{
        number: 5,
        title: "Likelihood Ratios & Bayes",
        subtitle: "How slopes encode odds and connect pre- to post-test",
      }}
      totalLessons={totalLessons}
      onPrev={onPrev}
      onNext={onNext}
      onHome={onHome}
      onGoTo={onGoTo}
      lessonTitles={lessonTitles}
      values={values}
      keyInsight={
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-amber-800">
            <strong>Key insight:</strong> The truth diagram encodes odds as
            the <strong>slope</strong> of diagonal lines. Likelihood ratios
            connect odds before the test to odds after the test via
            Bayes&rsquo; rule.
          </p>
        </div>
      }
      diagram={
        <TruthDiagram
          values={values}
          onDrag={setValues}
          overlays={[]}
          extraMargin={15}
          renderExtraSvg={(layout) => (
            <DiagonalOverlays
              values={values}
              centerX={layout.centerX}
              centerY={layout.centerY}
              scale={layout.scale}
            />
          )}
          belowDiagramText={
            <>
              <strong>Positive LR</strong> = odds after a positive test / odds before the test
              = {formatRatio(posttestOddsPos)} / {formatRatio(pretestOdds)}
              = <strong>{formatRatio(posLR)}</strong>
              <br />
              <strong>Negative LR</strong> = odds after a negative test / odds before the test
              = {formatRatio(posttestOddsNeg)} / {formatRatio(pretestOdds)}
              = <strong>{formatRatio(negLR)}</strong>
            </>
          }
        />
      }
    >
      <div className="space-y-5">
        {/* ── Section 1: Three Odds ── */}
        <div>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">
            Three Diagonals &mdash; Three Odds
          </h3>

          {/* Odds before the test (brown dashed) */}
          <div className="rounded-lg p-3 space-y-1 mb-2" style={{ backgroundColor: "#fef3c7" }}>
            <div className="flex items-center gap-2">
              <span className="w-6 h-0.5" style={{ backgroundImage: "repeating-linear-gradient(90deg, #92400e 0 6px, transparent 6px 10px)" }} />
              <span className="text-xs font-semibold uppercase" style={{ color: "#92400e" }}>Odds before the test (box diagonal)</span>
            </div>
            <div className="text-sm font-mono" style={{ color: "#78350f" }}>
              Diseased / Healthy = {diseased} / {healthy} = <strong>{formatRatio(pretestOdds)}</strong>
            </div>
          </div>

          {/* Odds after a positive test (green) */}
          <div className="bg-green-50 rounded-lg p-3 space-y-1 mb-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-0.5 rounded" style={{ backgroundColor: "#16a34a" }} />
              <span className="text-xs font-semibold text-green-700 uppercase">Odds after a positive test</span>
            </div>
            <p className="text-sm text-green-600">Steeper is better</p>
            <div className="text-sm font-mono text-green-800">
              <span style={{ color: CELL_COLORS.tp }}>TP</span> / <span style={{ color: CELL_COLORS.fp }}>FP</span>
              {" = "}{tp} / {fp} = <strong>{formatRatio(posttestOddsPos)}</strong>
            </div>
          </div>

          {/* Odds after a negative test (red) */}
          <div className="bg-red-50 rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-6 h-0.5 rounded" style={{ backgroundColor: "#dc2626" }} />
              <span className="text-xs font-semibold text-red-700 uppercase">Odds after a negative test</span>
            </div>
            <p className="text-sm text-red-600">Flatter is better</p>
            <div className="text-sm font-mono text-red-800">
              <span style={{ color: CELL_COLORS.fn }}>FN</span> / <span style={{ color: CELL_COLORS.tn }}>TN</span>
              {" = "}{fn} / {tn} = <strong>{formatRatio(posttestOddsNeg)}</strong>
            </div>
          </div>
        </div>

        {/* ── Section 2: Likelihood Ratios ── */}
        <div>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">
            Likelihood Ratios
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed mb-3">
            The likelihood ratio is simply the factor by which the odds before the test
            (the pretest slope) is increased (positive LR) or decreased (negative LR) by the test.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <div className="text-xs text-green-600 font-semibold uppercase">Positive LR</div>
              <div className="text-xs font-mono text-green-700 mt-1">odds after positive test / odds before test</div>
              <div className="text-lg font-bold text-green-700">{formatRatio(posLR)}</div>
              <div className="text-xs text-green-600 mt-1">Higher is better (&gt;10 = strong)</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
              <div className="text-xs text-red-600 font-semibold uppercase">Negative LR</div>
              <div className="text-xs font-mono text-red-700 mt-1">odds after negative test / odds before test</div>
              <div className="text-lg font-bold text-red-700">{formatRatio(negLR)}</div>
              <div className="text-xs text-red-600 mt-1">Lower is better (&lt;0.1 = strong)</div>
            </div>
          </div>
        </div>

        {/* ── Section 3: Bayes' Theorem ── */}
        <div>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">
            Bayes&rsquo; Theorem (Odds Form)
          </h3>
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 space-y-3">
            <p className="text-sm text-indigo-800 leading-relaxed">
              Bayes&rsquo; theorem, expressed as odds, simply says that the odds of
              having the disease after a positive test is the pretest odds times the
              positive likelihood ratio. Likewise, the odds of having the disease
              after a negative test is the pretest odds times the negative likelihood ratio.
            </p>
            <div className="space-y-2 font-mono text-sm text-indigo-900">
              <div className="bg-white/60 rounded px-3 py-2">
                odds<sub>after positive test</sub> = odds<sub>before test</sub> &times; LR<sub>positive</sub>
              </div>
              <div className="bg-white/60 rounded px-3 py-2">
                odds<sub>after negative test</sub> = odds<sub>before test</sub> &times; LR<sub>negative</sub>
              </div>
            </div>
            <p className="text-sm text-indigo-800 leading-relaxed">
              Put another way, Bayes&rsquo; theorem simply says that the odds of
              having the disease after a test depends on the shape of the box and
              its position on the axes. Thus the 2&times;2 diagram is essentially
              synonymous with Bayes&rsquo; theorem.
            </p>
          </div>
        </div>

        {/* Preset selector */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Presets</label>
          <select
            onChange={(e) => {
              const preset = presets[parseInt(e.target.value)];
              if (preset) setValues(preset.values);
            }}
            defaultValue=""
            className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md
              focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent
              bg-white text-slate-800"
          >
            <option value="" disabled>Load a preset...</option>
            <optgroup label="General Examples">
              {generalPresets.map((p) => (
                <option key={p.name} value={presets.indexOf(p)}>{p.name}</option>
              ))}
            </optgroup>
            <optgroup label="Clinical Examples">
              {clinicalPresets.map((p) => (
                <option key={p.name} value={presets.indexOf(p)}>{p.name}</option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>
    </LessonLayout>
  );
}
