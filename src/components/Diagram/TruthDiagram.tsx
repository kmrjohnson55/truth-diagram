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
}

const SVG_WIDTH = 560;
const SVG_HEIGHT = 500;
const CORNER_RADIUS = 6;
const CORNER_HIT_RADIUS = 12;

type DragMode = "box" | "corner-ul" | "corner-ur" | "corner-ll" | "corner-lr" | null;

export function TruthDiagram({ values, onDrag, overlays = [], renderExtraSvg }: TruthDiagramProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragMode, setDragMode] = useState<DragMode>(null);
  const dragStart = useRef<{
    x: number; y: number; values: CellValues;
    centerX: number; centerY: number; scale: number;
  } | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const [hoverCorner, setHoverCorner] = useState<string | null>(null);

  const computedLayout = useMemo(
    () => computeLayout(values, SVG_WIDTH, SVG_HEIGHT, 60),
    [values]
  );

  // During drag, lock the layout (origin + scale) so axes stay fixed
  // and only the box redraws. On release, layout recalculates to fit.
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

      // Check corners first
      const corner = nearCorner(pt);
      if (corner) {
        setDragMode(corner);
        dragStart.current = { x: pt.x, y: pt.y, values: { ...values }, centerX, centerY, scale };
        e.preventDefault();
        return;
      }

      // Then check box interior for box drag
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
      // Use layout from drag start to avoid feedback loop
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
        // Corner drag: convert SVG point to diagram coords using initial layout
        const diagX = (pt.x - cx) / s;
        const diagY = -(pt.y - cy) / s; // y is flipped

        let { tp, fp, fn, tn } = orig;

        switch (dragMode) {
          case "corner-ul": // controls FP (left = -x) and TP (up = +y)
            fp = Math.round(Math.max(0, -diagX));
            tp = Math.round(Math.max(0, diagY));
            break;
          case "corner-ur": // controls TN (right = +x) and TP (up = +y)
            tn = Math.round(Math.max(0, diagX));
            tp = Math.round(Math.max(0, diagY));
            break;
          case "corner-ll": // controls FP (left = -x) and FN (down = -y)
            fp = Math.round(Math.max(0, -diagX));
            fn = Math.round(Math.max(0, -diagY));
            break;
          case "corner-lr": // controls TN (right = +x) and FN (down = -y)
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

  const handleHover = useCallback(
    (e: React.MouseEvent) => {
      if (dragMode) return;
      const pt = getSvgPoint(e);

      // Check corner hover for cursor
      const corner = nearCorner(pt);
      setHoverCorner(corner);

      const origin = toSvg(0, 0, centerX, centerY, scale);
      const ul = corners.ul;
      const lr = corners.lr;

      if (pt.x < ul.x || pt.x > lr.x || pt.y < ul.y || pt.y > lr.y) {
        setTooltip(null);
        return;
      }

      let text: string;
      if (pt.x < origin.x && pt.y < origin.y) {
        text = `True Positives: ${values.tp}`;
      } else if (pt.x >= origin.x && pt.y < origin.y) {
        text = `False Positives: ${values.fp}`;
      } else if (pt.x < origin.x && pt.y >= origin.y) {
        text = `False Negatives: ${values.fn}`;
      } else {
        text = `True Negatives: ${values.tn}`;
      }
      setTooltip({ x: pt.x + 12, y: pt.y - 12, text });
    },
    [values, centerX, centerY, scale, getSvgPoint, corners, nearCorner, dragMode]
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
        style={{ cursor: getCursor(), maxHeight: "70vh" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleHover}
        onMouseLeave={() => { setTooltip(null); setHoverCorner(null); }}
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

        {/* Extra SVG (diagonals, ghost boxes) — rendered above axes & box */}
        {renderExtraSvg?.({ centerX, centerY, scale })}

        {/* Tooltip */}
        {tooltip && (
          <g>
            <rect
              x={tooltip.x}
              y={tooltip.y - 16}
              width={tooltip.text.length * 7.5 + 16}
              height={24}
              fill="rgba(15, 23, 42, 0.9)"
              rx={4}
            />
            <text
              x={tooltip.x + 8}
              y={tooltip.y}
              fontSize={12}
              fill="white"
              dominantBaseline="middle"
            >
              {tooltip.text}
            </text>
          </g>
        )}

        {/* Drag hint */}
        {onDrag && !dragMode && (
          <text
            x={SVG_WIDTH / 2}
            y={SVG_HEIGHT - 8}
            textAnchor="middle"
            fontSize={11}
            fill="#94a3b8"
          >
            Drag box to move · Drag corners to resize
          </text>
        )}
      </svg>

      {/* Visual formula below the diagram */}
      {overlays.length > 0 && (
        <VisualFormula values={values} activeOverlays={overlays} />
      )}
    </div>
  );
}
