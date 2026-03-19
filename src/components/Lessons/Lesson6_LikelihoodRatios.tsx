import { LessonLayout } from "./LessonLayout";
import { TruthDiagram } from "../Diagram/TruthDiagram";
import { DiagonalOverlays } from "../Diagram/DiagonalOverlays";
import { TwoByTwoTable } from "../UI/TwoByTwoTable";
import { formatRatio } from "../../utils/statistics";
import { CELL_COLORS } from "../../utils/colors";
import type { CellValues, DiagnosticStats } from "../../utils/statistics";
import type { LessonNavProps } from "./lessonTypes";

interface Lesson6Props extends LessonNavProps {
  values: CellValues;
  stats: DiagnosticStats;
  setValue: (key: keyof CellValues, val: number) => void;
  setValues: (v: CellValues) => void;
}

/* ─── Quality helpers ─── */

function posLRQuality(lr: number): { label: string; color: string } {
  if (!isFinite(lr)) return { label: "Perfect", color: "#15803d" };
  if (lr >= 10) return { label: "Strong", color: "#15803d" };
  if (lr >= 5) return { label: "Moderate", color: "#ca8a04" };
  if (lr >= 2) return { label: "Weak", color: "#ea580c" };
  return { label: "Useless", color: "#dc2626" };
}

function negLRQuality(lr: number): { label: string; color: string } {
  if (lr <= 0) return { label: "Perfect", color: "#15803d" };
  if (lr < 0.1) return { label: "Strong", color: "#15803d" };
  if (lr < 0.2) return { label: "Moderate", color: "#ca8a04" };
  if (lr < 0.5) return { label: "Weak", color: "#ea580c" };
  return { label: "Useless", color: "#dc2626" };
}

function oddsToWords(odds: number): string {
  if (!isFinite(odds)) return "disease is essentially certain";
  if (odds >= 10) return `disease is ${odds.toFixed(0)}× more likely than not`;
  if (odds >= 2) return `disease is ${odds.toFixed(1)}× more likely than not`;
  if (odds > 1.05) return `disease is slightly more likely than not`;
  if (odds >= 0.95) return "disease is equally likely as not";
  if (odds >= 0.5) return "disease is slightly less likely than not";
  if (odds >= 0.1) return `disease is ${(1 / odds).toFixed(1)}× less likely than not`;
  if (odds > 0) return `disease is ${(1 / odds).toFixed(0)}× less likely than not`;
  return "disease is essentially ruled out";
}

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

  const pretestOdds = healthy > 0 ? diseased / healthy : Infinity;
  const posttestOddsPos = fp > 0 ? tp / fp : Infinity;
  const posttestOddsNeg = tn > 0 ? fn / tn : 0;
  const posLR = stats.positiveLR;
  const negLR = stats.negativeLR;
  const posQ = posLRQuality(posLR);
  const negQ = negLRQuality(negLR);

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
      diagramFooter={<TwoByTwoTable values={values} setValue={setValue} setValues={setValues} />}
      keyInsight={
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-amber-800">
            <strong>Key insight:</strong> Each diagonal on the diagram represents
            the odds of disease in a specific context. A good test makes the
            green diagonal steep (high odds after +) and the red diagonal flat
            (low odds after &minus;).
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
          belowDiagramText={
            <span className="text-xs">
              Drag the box to see how the three diagonal slopes change.
            </span>
          }
        />
      }
    >
      <div className="space-y-4">
        {/* ── Three Odds ── */}
        <div>
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
            Three Diagonals = Three Odds
          </h3>

          {/* Pretest odds */}
          <div className="bg-slate-50 rounded-lg p-2.5 mb-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-5 h-0.5" style={{ backgroundImage: "repeating-linear-gradient(90deg, #92400e 0 6px, transparent 6px 10px)" }} />
              <span className="text-[10px] font-bold text-slate-600 uppercase">Pretest odds (box diagonal)</span>
            </div>
            <div className="text-sm font-mono text-slate-800">
              Diseased / Healthy = {diseased} / {healthy} = <strong>{formatRatio(pretestOdds)}</strong>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5 italic">{oddsToWords(pretestOdds)}</p>
          </div>

          {/* Post-test odds — grid layout */}
          <div className="grid grid-cols-2 gap-2">
            {/* Positive */}
            <div className="bg-slate-50 rounded-lg p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-4 h-0.5 rounded" style={{ backgroundColor: "#16a34a" }} />
                <span className="text-[10px] font-bold text-slate-600 uppercase">After + test</span>
              </div>
              <div className="text-xs font-mono text-slate-800">
                <span style={{ color: CELL_COLORS.tp }}>TP</span>/<span style={{ color: CELL_COLORS.fp }}>FP</span> = {tp}/{fp} = <strong>{formatRatio(posttestOddsPos)}</strong>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Steeper = better</p>
              <p className="text-[10px] text-slate-600 italic mt-0.5">{oddsToWords(posttestOddsPos)}</p>
            </div>
            {/* Negative */}
            <div className="bg-slate-50 rounded-lg p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-4 h-0.5 rounded" style={{ backgroundColor: "#dc2626" }} />
                <span className="text-[10px] font-bold text-slate-600 uppercase">After &minus; test</span>
              </div>
              <div className="text-xs font-mono text-slate-800">
                <span style={{ color: CELL_COLORS.fn }}>FN</span>/<span style={{ color: CELL_COLORS.tn }}>TN</span> = {fn}/{tn} = <strong>{formatRatio(posttestOddsNeg)}</strong>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Flatter = better</p>
              <p className="text-[10px] text-slate-600 italic mt-0.5">{oddsToWords(posttestOddsNeg)}</p>
            </div>
          </div>
        </div>

        {/* ── Likelihood Ratios ── */}
        <div>
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
            Likelihood Ratios
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed mb-2">
            The LR is the factor by which the test multiplies the pretest odds.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-center">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Positive LR</div>
              <div className="text-lg font-bold text-slate-800 mt-0.5">{formatRatio(posLR)}</div>
              <span className="inline-block mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: posQ.color }}>
                {posQ.label}
              </span>
              <div className="text-[10px] text-slate-400 mt-1">&gt;10 strong &middot; 5–10 moderate</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-center">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Negative LR</div>
              <div className="text-lg font-bold text-slate-800 mt-0.5">{formatRatio(negLR)}</div>
              <span className="inline-block mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: negQ.color }}>
                {negQ.label}
              </span>
              <div className="text-[10px] text-slate-400 mt-1">&lt;0.1 strong &middot; 0.1–0.2 moderate</div>
            </div>
          </div>
        </div>

        {/* ── Bayes' Theorem with live numbers ── */}
        <div>
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
            Bayes&rsquo; Theorem (Odds Form)
          </h3>
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 space-y-2">
            <div className="bg-white/60 rounded px-3 py-2 text-sm font-mono text-indigo-900">
              <div className="text-[10px] text-indigo-500 font-sans mb-0.5">After a positive test:</div>
              <span style={{ color: "#92400e" }}>{formatRatio(pretestOdds)}</span>
              {" × "}
              <span className="text-green-700">{formatRatio(posLR)}</span>
              {" = "}
              <strong className="text-green-700">{formatRatio(posttestOddsPos)}</strong>
            </div>
            <div className="bg-white/60 rounded px-3 py-2 text-sm font-mono text-indigo-900">
              <div className="text-[10px] text-indigo-500 font-sans mb-0.5">After a negative test:</div>
              <span style={{ color: "#92400e" }}>{formatRatio(pretestOdds)}</span>
              {" × "}
              <span className="text-red-700">{formatRatio(negLR)}</span>
              {" = "}
              <strong className="text-red-700">{formatRatio(posttestOddsNeg)}</strong>
            </div>
            <p className="text-[10px] text-indigo-600 leading-relaxed">
              Pretest odds &times; LR = post-test odds. The truth diagram is essentially
              a graphical representation of Bayes&rsquo; theorem.
            </p>
          </div>
        </div>

      </div>
    </LessonLayout>
  );
}
