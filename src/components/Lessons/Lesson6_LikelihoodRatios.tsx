import { LessonLayout } from "./LessonLayout";
import { TruthDiagram } from "../Diagram/TruthDiagram";
import { DiagonalOverlays } from "../Diagram/DiagonalOverlays";
import { formatStat, formatRatio } from "../../utils/statistics";
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

/* ─── Main lesson component ─── */

export function Lesson6_LikelihoodRatios({
  values,
  stats,
  setValue,
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

  // Pretest odds = prevalence / (1 - prevalence) = diseased / healthy
  const pretestOdds = healthy > 0 ? diseased / healthy : Infinity;

  // Posttest odds positive = TP / FP
  const posttestOddsPos = fp > 0 ? tp / fp : Infinity;

  // Posttest odds negative = FN / TN
  const posttestOddsNeg = tn > 0 ? fn / tn : 0;

  // +LR = sens / (1 - spec)
  const posLR = stats.positiveLR;
  // -LR = (1 - sens) / spec
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
      keyInsight={
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
          <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wide">
            Bayes&rsquo; Rule (Odds Form)
          </h3>
          <p className="text-sm text-amber-800 leading-relaxed">
            Posttest odds = Pretest odds &times; LR
          </p>
          <div className="space-y-1 text-sm font-mono text-amber-900">
            <div>
              <strong>+ test:</strong>{" "}
              {formatRatio(pretestOdds)} &times; {formatRatio(posLR)} ={" "}
              <strong>{formatRatio(pretestOdds * posLR)}</strong>
              {" "}
              <span className="text-xs text-amber-600">(actual: {formatRatio(posttestOddsPos)})</span>
            </div>
            <div>
              <strong>&minus; test:</strong>{" "}
              {formatRatio(pretestOdds)} &times; {formatRatio(negLR)} ={" "}
              <strong>{formatRatio(pretestOdds * negLR)}</strong>
              {" "}
              <span className="text-xs text-amber-600">(actual: {formatRatio(posttestOddsNeg)})</span>
            </div>
          </div>
          <p className="text-xs text-amber-700 mt-1">
            Small rounding differences arise because the cells are integers.
          </p>
        </div>
      }
      diagram={
        <TruthDiagram
          values={values}
          onDrag={setValues}
          overlays={[]}
          renderExtraSvg={(layout) => (
            <DiagonalOverlays
              values={values}
              centerX={layout.centerX}
              centerY={layout.centerY}
              scale={layout.scale}
            />
          )}
        />
      }
    >
      <div className="space-y-5">
        {/* 1) What you see: three diagonals whose SLOPES are odds */}
        <div>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">
            Three Diagonals &mdash; Three Odds
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            The truth diagram encodes odds as the{" "}
            <strong>slope</strong> of diagonal lines. Each diagonal&rsquo;s
            rise/run ratio gives you an odds value directly:
          </p>
        </div>

        {/* Pretest odds (gray dashed) */}
        <div className="bg-slate-50 rounded-lg p-3 space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-6 h-0.5 bg-slate-400" style={{ backgroundImage: "repeating-linear-gradient(90deg, #64748b 0 6px, transparent 6px 10px)" }} />
            <span className="text-xs font-semibold text-slate-600 uppercase">
              Dashed gray &mdash; Pretest odds
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Connects upper-left to lower-right corner of the box.
          </p>
          <div className="text-sm font-mono text-slate-700">
            <strong>Slope</strong> = height / width = Diseased / Healthy
            = {diseased} / {healthy}
            = <strong>{formatRatio(pretestOdds)}</strong>
          </div>
          <div className="text-xs text-slate-500">
            (Prevalence = {formatStat(stats.prevalence)})
          </div>
        </div>

        {/* Posttest odds positive (orange) */}
        <div className="bg-orange-50 rounded-lg p-3 space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-6 h-0.5 rounded" style={{ backgroundColor: "#ea580c" }} />
            <span className="text-xs font-semibold text-orange-700 uppercase">
              Orange &mdash; Posttest odds (+)
            </span>
          </div>
          <p className="text-xs text-orange-600 leading-relaxed">
            Origin &rarr; upper-left corner. <strong>Steeper is better</strong> &mdash;
            a steep slope means a positive result strongly favors disease.
          </p>
          <div className="text-sm font-mono text-orange-800">
            <strong>Slope</strong> ={" "}
            <span style={{ color: CELL_COLORS.tp }}>TP</span>
            {" / "}
            <span style={{ color: CELL_COLORS.fp }}>FP</span>
            {" = "}
            <span style={{ color: CELL_COLORS.tp }}>{tp}</span>
            {" / "}
            <span style={{ color: CELL_COLORS.fp }}>{fp}</span>
            {" = "}
            <strong>{formatRatio(posttestOddsPos)}</strong>
          </div>
        </div>

        {/* Posttest odds negative (teal) */}
        <div className="bg-teal-50 rounded-lg p-3 space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-6 h-0.5 rounded" style={{ backgroundColor: "#0d9488" }} />
            <span className="text-xs font-semibold text-teal-700 uppercase">
              Teal &mdash; Posttest odds (&minus;)
            </span>
          </div>
          <p className="text-xs text-teal-600 leading-relaxed">
            Origin &rarr; lower-right corner. <strong>Flatter is better</strong> &mdash;
            a shallow slope means a negative result strongly argues against disease.
          </p>
          <div className="text-sm font-mono text-teal-800">
            <strong>Slope</strong> ={" "}
            <span style={{ color: CELL_COLORS.fn }}>FN</span>
            {" / "}
            <span style={{ color: CELL_COLORS.tn }}>TN</span>
            {" = "}
            <span style={{ color: CELL_COLORS.fn }}>{fn}</span>
            {" / "}
            <span style={{ color: CELL_COLORS.tn }}>{tn}</span>
            {" = "}
            <strong>{formatRatio(posttestOddsNeg)}</strong>
          </div>
        </div>

        {/* 2) Derived: Likelihood Ratios connect the slopes */}
        <div>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">
            Likelihood Ratios
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            The likelihood ratio is the <em>ratio</em> of a posttest slope to
            the pretest slope. It tells you how much the test result changes
            the odds, independent of prevalence.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
              <div className="text-xs text-orange-600 font-semibold uppercase">+LR</div>
              <div className="text-xs font-mono text-orange-700 mt-1">
                Sens / (1&minus;Spec)
              </div>
              <div className="text-lg font-bold text-orange-700">
                {formatRatio(posLR)}
              </div>
              <div className="text-xs text-orange-500 mt-1">
                Higher is better (&gt;10 = strong)
              </div>
            </div>
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 text-center">
              <div className="text-xs text-teal-600 font-semibold uppercase">&minus;LR</div>
              <div className="text-xs font-mono text-teal-700 mt-1">
                (1&minus;Sens) / Spec
              </div>
              <div className="text-lg font-bold text-teal-700">
                {formatRatio(negLR)}
              </div>
              <div className="text-xs text-teal-500 mt-1">
                Lower is better (&lt;0.1 = strong)
              </div>
            </div>
          </div>
        </div>

        {/* Preset selector */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">
            Presets
          </label>
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
            <option value="" disabled>
              Load a preset...
            </option>
            <optgroup label="General Examples">
              {generalPresets.map((p) => (
                <option key={p.name} value={presets.indexOf(p)}>
                  {p.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Clinical Examples">
              {clinicalPresets.map((p) => (
                <option key={p.name} value={presets.indexOf(p)}>
                  {p.name}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Summary */}
        <div className="text-xs text-slate-400 bg-slate-50 rounded-lg p-3">
          <strong>Try it:</strong> Drag the box upward and rightward toward
          the ideal quadrant. Watch the{" "}
          <strong style={{ color: "#ea580c" }}>orange slope</strong> steepen
          (good +LR) and the{" "}
          <strong style={{ color: "#0d9488" }}>teal slope</strong> flatten
          (good &minus;LR). The perfect test has an infinite orange slope
          and a zero teal slope.
        </div>
      </div>
    </LessonLayout>
  );
}
