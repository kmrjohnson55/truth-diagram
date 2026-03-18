import { useState, useRef, useEffect } from "react";
import { exportSVG, exportPNG, generateShareableLink } from "../../utils/export";
import type { CellValues } from "../../utils/statistics";

interface ExportPanelProps {
  values: CellValues;
  lesson?: number;
}

export function ExportButton({ values, lesson }: ExportPanelProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const findSvg = (): SVGSVGElement | null => {
    return document.querySelector("svg[viewBox]");
  };

  const handleSVG = () => {
    const svg = findSvg();
    if (svg) {
      exportSVG(svg, `truth-diagram-lesson${lesson || 0}.svg`);
      setOpen(false);
    }
  };

  const handlePNG = async () => {
    const svg = findSvg();
    if (svg) {
      await exportPNG(svg, `truth-diagram-lesson${lesson || 0}.png`, 3);
      setOpen(false);
    }
  };

  const handleLink = () => {
    const link = generateShareableLink(values, lesson);
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="px-2.5 py-1.5 text-sm font-medium text-indigo-100 hover:text-white hover:bg-indigo-500 rounded-md transition-colors"
        title="Export diagram"
      >
        Export
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
          <button
            onClick={handlePNG}
            className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <span className="font-medium">Export as PNG</span>
            <br />
            <span className="text-xs text-slate-600">High-resolution (3x) for publications &amp; slides</span>
          </button>
          <button
            onClick={handleSVG}
            className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <span className="font-medium">Export as SVG</span>
            <br />
            <span className="text-xs text-slate-600">Scalable vector for editing &amp; printing</span>
          </button>
          <hr className="my-1 border-slate-100" />
          <button
            onClick={handleLink}
            className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <span className="font-medium">{copied ? "\u2705 Link copied!" : "Copy shareable link"}</span>
            <br />
            <span className="text-xs text-slate-600">Interactive link with current values</span>
          </button>
        </div>
      )}
    </div>
  );
}
