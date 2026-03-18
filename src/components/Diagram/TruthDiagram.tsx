import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import type { CellValues } from "../../utils/statistics";
import { computeLayout, toSvg } from "../../utils/geometry";
import { Axes } from "./Axes";
import { SubjectBox } from "./SubjectBox";
import { StatOverlays } from "./StatOverlays";
import { VisualFormula } from "./VisualFormula";
import type { OverlayType } from "./StatOverlays";

interface TruthDiagramProps {
  values: CellValues;
  onDrag?: (newValues: CellValues) => void;
  overlays?: OverlayType[];
  /** Render prop for extra SVG elements (receives current layout params) */
  renderExtraSvg?: (layout: { centerX: number; centerY: number; scale: number }) => React.ReactNode;
  /** Optional text displayed below the diagram, replacing the default drag hint */
  belowDiagramText?: React.ReactNode;
  /** Extra margin for layout (e.g., to fit expected box in chi-square) */
  extraMargin?: number;
}

const SVG_WIDTH = 560;
const SVG_HEIGHT = 500;
const CORNER_RADIUS = 6;
const CORNER_HIT_RADIUS = 12;

type DragMode = "box" | "corner-ul" | "corner-ur" | "corner-ll" | "corner-lr" | null;

export function TruthDiagram({ values, onDrag, overlays = [], renderExtraSvg, belowDiagramText, extraMargin = 0 }: TruthDiagramProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragMode, setDragMode] = useState<DragMode>(null);
  const dragStart = useRef<{
    x: number; y: number; values: CellValues;
    centerX: number; centerY: number; scale: number;
  } | null>(null);
  const [hoverCorner, setHoverCorner] = useState<string | null>(null);

  const computedLayout = useMemo(
    () => computeLayout(values, SVG_WIDTH, SVG_HEIGHT, 60 + extraMargin),
    [values]
  );

  const { centerX, centerY, scale } =
    dragMode && dragStart.current
      ? dragStart.current
      : computedLayout;

  const getSvgPoint = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const ctm = svg.getScreenCTM();
      if (!ctm) return { x: 0, y: 0 };
      const point = new DOMPoint(e.clientX, e.clientY);
      const svgPoint = point.matrixTransform(ctm.inverse());
      return { x: svgPoint.x, y: svgPoint.y };
    },
    []
  );

  const corners = useMemo(() => ({
    ul: toSvg(-values.fp, values.tp, centerX, centerY, scale),
    ur: toSvg(values.tn, values.tp, centerX, centerY, scale),
    ll: toSvg(-values.fp, -values.fn, centerX, centerY, scale),
    lr: toSvg(values.tn, -values.fn, centerX, centerY, scale),
  }), [values, centerX, centerY, scale]);

  const nearCorner = useCallback(
    (pt: { x: number; y: number }): DragMode => {
      const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
        Math.hypot(a.x - b.x, a.y - b.y);
      if (dist(pt, corners.ul) < CORNER_HIT_RADIUS) return "corner-ul";
      if (dist(pt, corners.ur) < CORNER_HIT_RADIUS) return "corner-ur";
      if (dist(pt, corners.ll) < CORNER_HIT_RADIUS) return "corner-ll";
      if (dist(pt, corners.lr) < CORNER_HIT_RADIUS) return "corner-lr";
      return null;
    },
    [corners]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!onDrag) return;
      const pt = getSvgPoint(e);

      const corner = nearCorner(pt);
      if (corner) {
        setDragMode(corner);
        dragStart.current = { x: pt.x, y: pt.y, values: { ...values }, centerX, centerY, scale };
        e.preventDefault();
        return;
      }

      const ul = corners.ul;
      const lr = corners.lr;
      if (pt.x >= ul.x && pt.x <= lr.x && pt.y >= ul.y && pt.y <= lr.y) {
        setDragMode("box");
        dragStart.current = { x: pt.x, y: pt.y, values: { ...values }, centerX, centerY, scale };
        e.preventDefault();
      }
    },
    [values, corners, onDrag, getSvgPoint, nearCorner]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragMode || !dragStart.current || !onDrag) return;
      const pt = getSvgPoint(e);
      const orig = dragStart.current.values;
      const { centerX: cx, centerY: cy, scale: s } = dragStart.current;

      if (dragMode === "box") {
        const dx = pt.x - dragStart.current.x;
        const dy = pt.y - dragStart.current.y;
        const dUnitsX = dx / s;
        const dUnitsY = -dy / s;

        const diseased = orig.tp + orig.fn;
        const healthy = orig.fp + orig.tn;

        const newTp = Math.round(Math.max(0, Math.min(diseased, orig.tp + dUnitsY)));
        const newFn = diseased - newTp;
        const newTn = Math.round(Math.max(0, Math.min(healthy, orig.tn + dUnitsX)));
        const newFp = healthy - newTn;

        onDrag({ tp: newTp, fp: newFp, fn: newFn, tn: newTn });
      } else {
        const diagX = (pt.x - cx) / s;
        const diagY = -(pt.y - cy) / s;

        let { tp, fp, fn, tn } = orig;

        switch (dragMode) {
          case "corner-ul":
            fp = Math.round(Math.max(0, -diagX));
            tp = Math.round(Math.max(0, diagY));
            break;
          case "corner-ur":
            tn = Math.round(Math.max(0, diagX));
            tp = Math.round(Math.max(0, diagY));
            break;
          case "corner-ll":
            fp = Math.round(Math.max(0, -diagX));
            fn = Math.round(Math.max(0, -diagY));
            break;
          case "corner-lr":
            tn = Math.round(Math.max(0, diagX));
            fn = Math.round(Math.max(0, -diagY));
            break;
        }

        onDrag({ tp, fp, fn, tn });
      }
    },
    [dragMode, onDrag, getSvgPoint]
  );

  const handleMouseUp = useCallback(() => {
    setDragMode(null);
    dragStart.current = null;
  }, []);

  useEffect(() => {
    if (dragMode) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragMode, handleMouseMove, handleMouseUp]);

  // Lightweight hover just for corner cursor changes
  const handleHoverForCursor = useCallback(
    (e: React.MouseEvent) => {
      if (dragMode) return;
      const pt = getSvgPoint(e);
      setHoverCorner(nearCorner(pt));
    },
    [getSvgPoint, nearCorner, dragMode]
  );

  const getCursor = () => {
    if (dragMode) {
      if (dragMode === "box") return "grabbing";
      if (dragMode === "corner-ul" || dragMode === "corner-lr") return "nwse-resize";
      return "nesw-resize";
    }
    if (hoverCorner === "corner-ul" || hoverCorner === "corner-lr") return "nwse-resize";
    if (hoverCorner === "corner-ur" || hoverCorner === "corner-ll") return "nesw-resize";
    return "default";
  };

  return (
    <div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="w-full"
        style={{ cursor: getCursor(), maxHeight: "70vh", overflow: "visible" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleHoverForCursor}
        onMouseLeave={() => setHoverCorner(null)}
      >
        <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="white" rx={8} />

        <SubjectBox
          values={values}
          centerX={centerX}
          centerY={centerY}
          scale={scale}
        />

        {overlays.length > 0 && (
          <StatOverlays
            values={values}
            centerX={centerX}
            centerY={centerY}
            scale={scale}
            activeOverlays={overlays}
          />
        )}

        <Axes
          centerX={centerX}
          centerY={centerY}
          scale={scale}
          values={values}
        />

        {/* Corner handles */}
        {onDrag && (
          <g className="corner-handles">
            {(["ul", "ur", "ll", "lr"] as const).map((key) => (
              <circle
                key={key}
                cx={corners[key].x}
                cy={corners[key].y}
                r={CORNER_RADIUS}
                fill={hoverCorner === `corner-${key}` || dragMode === `corner-${key}` ? "#64748b" : "#94a3b8"}
                stroke="white"
                strokeWidth={1.5}
                style={{ cursor: key === "ul" || key === "lr" ? "nwse-resize" : "nesw-resize" }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  const mode = `corner-${key}` as DragMode;
                  setDragMode(mode);
                  const pt = getSvgPoint(e);
                  dragStart.current = { x: pt.x, y: pt.y, values: { ...values }, centerX, centerY, scale };
                }}
              />
            ))}
          </g>
        )}

        {/* Extra SVG (diagonals, ghost boxes) */}
        {renderExtraSvg?.({ centerX, centerY, scale })}
      </svg>

      {/* Below-diagram text: custom or default hint */}
      {belowDiagramText ? (
        <div className="text-xs text-slate-600 text-center mt-2 px-4 leading-relaxed">
          {belowDiagramText}
        </div>
      ) : onDrag && !dragMode ? (
        <div className="text-xs text-slate-600 text-center mt-1">
          Drag box to move &middot; Drag corners to resize
        </div>
      ) : null}

      {/* Visual formula below the diagram */}
      {overlays.length > 0 && (
        <VisualFormula values={values} activeOverlays={overlays} />
      )}
    </div>
  );
}
