import { useState } from "react";
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

type ViewMode = "odds" | "likelihood" | "bayes";

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

  const [viewMode, setViewMode] = useState<ViewMode>("odds");

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
            connect pretest odds to posttest odds via Bayes&rsquo; rule:
            Posttest odds = Pretest odds &times; LR.
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
            <>
              <strong>+LR</strong> = post-test odds (+) / pretest odds
              = {formatRatio(posttestOddsPos)} / {formatRatio(pretestOdds)}
              = <strong>{formatRatio(posLR)}</strong>
              <br />
              <strong>&minus;LR</strong> = post-test odds (&minus;) / pretest odds
              = {formatRatio(posttestOddsNeg)} / {formatRatio(pretestOdds)}
              = <strong>{formatRatio(negLR)}</strong>
            </>
          }
        />
      }
    >
      <div className="space-y-5">
        {/* Three-way toggle */}
        <div className="flex gap-1.5">
          {([
            { key: "odds" as ViewMode, label: "Odds Ratios" },
            { key: "likelihood" as ViewMode, label: "Likelihood Ratios" },
            { key: "bayes" as ViewMode, label: "Bayes\u2019 Theorem" },
          ]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setViewMode(key)}
              className={`flex-1 px-2 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                viewMode === key
                  ? "bg-indigo-500 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Section 1: Odds Ratios ── */}
        <div className={viewMode !== "odds" && viewMode !== "bayes" ? "opacity-30 transition-opacity" : "transition-opacity"}>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">
            Three Diagonals &mdash; Three Odds
          </h3>

          {/* Pretest odds */}
          <div className="bg-slate-50 rounded-lg p-3 space-y-1 mb-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-0.5" style={{ backgroundImage: "repeating-linear-gradient(90deg, #64748b 0 6px, transparent 6px 10px)" }} />
              <span className="text-xs font-semibold text-slate-600 uppercase">Pretest odds</span>
            </div>
            <div className="text-sm font-mono text-slate-700">
              Diseased / Healthy = {diseased} / {healthy} = <strong>{formatRatio(pretestOdds)}</strong>
            </div>
          </div>

          {/* Positive odds */}
          <div className="bg-orange-50 rounded-lg p-3 space-y-1 mb-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-0.5 rounded" style={{ backgroundColor: "#ea580c" }} />
              <span className="text-xs font-semibold text-orange-700 uppercase">Positive odds</span>
            </div>
            <p className="text-sm text-orange-600">Steeper is better</p>
            <div className="text-sm font-mono text-orange-800">
              <span style={{ color: CELL_COLORS.tp }}>TP</span> / <span style={{ color: CELL_COLORS.fp }}>FP</span>
              {" = "}{tp} / {fp} = <strong>{formatRatio(posttestOddsPos)}</strong>
            </div>
          </div>

          {/* Negative odds */}
          <div className="bg-teal-50 rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-6 h-0.5 rounded" style={{ backgroundColor: "#0d9488" }} />
              <span className="text-xs font-semibold text-teal-700 uppercase">Negative odds</span>
            </div>
            <p className="text-sm text-teal-600">Flatter is better</p>
            <div className="text-sm font-mono text-teal-800">
              <span style={{ color: CELL_COLORS.fn }}>FN</span> / <span style={{ color: CELL_COLORS.tn }}>TN</span>
              {" = "}{fn} / {tn} = <strong>{formatRatio(posttestOddsNeg)}</strong>
            </div>
          </div>
        </div>

        {/* ── Section 2: Likelihood Ratios ── */}
        <div className={viewMode !== "likelihood" && viewMode !== "bayes" ? "opacity-30 transition-opacity" : "transition-opacity"}>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">
            Likelihood Ratios
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed mb-3">
            Thus the likelihood ratio is simply the factor by which the pretest slope (odds) is increased (+LR) or decreased (&minus;LR) by the test.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
              <div className="text-xs text-orange-600 font-semibold uppercase">+LR</div>
              <div className="text-xs font-mono text-orange-700 mt-1">odds after + test / pretest odds</div>
              <div className="text-lg font-bold text-orange-700">{formatRatio(posLR)}</div>
              <div className="text-xs text-orange-600 mt-1">Higher is better (&gt;10 = strong)</div>
            </div>
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 text-center">
              <div className="text-xs text-teal-600 font-semibold uppercase">&minus;LR</div>
              <div className="text-xs font-mono text-teal-700 mt-1">odds after &minus; test / pretest odds</div>
              <div className="text-lg font-bold text-teal-700">{formatRatio(negLR)}</div>
              <div className="text-xs text-teal-600 mt-1">Lower is better (&lt;0.1 = strong)</div>
            </div>
          </div>
        </div>

        {/* ── Section 3: Bayes' Theorem ── */}
        <div className={viewMode !== "bayes" ? "opacity-30 transition-opacity" : "transition-opacity"}>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">
            Bayes&rsquo; Theorem (Odds Form)
          </h3>
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 space-y-2">
            <p className="text-sm font-semibold text-indigo-800">
              Posttest odds = Pretest odds &times; LR
            </p>
            <div className="space-y-1 text-sm font-mono text-indigo-900">
              <div>
                <strong>+ test:</strong>{" "}
                {formatRatio(pretestOdds)} &times; {formatRatio(posLR)} ={" "}
                <strong>{formatRatio(pretestOdds * posLR)}</strong>
                <span className="text-xs text-indigo-600 ml-1">(actual: {formatRatio(posttestOddsPos)})</span>
              </div>
              <div>
                <strong>&minus; test:</strong>{" "}
                {formatRatio(pretestOdds)} &times; {formatRatio(negLR)} ={" "}
                <strong>{formatRatio(pretestOdds * negLR)}</strong>
                <span className="text-xs text-indigo-600 ml-1">(actual: {formatRatio(posttestOddsNeg)})</span>
              </div>
            </div>
            <p className="text-xs text-indigo-600">
              Small rounding differences arise because the cells are integers.
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
