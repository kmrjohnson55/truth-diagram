import { useState, useRef, useEffect } from "react";
import { exportSVG, exportFullScreenPNG, exportViaPrint, generateShareableLink } from "../../utils/export";
import type { CellValues } from "../../utils/statistics";

interface ExportPanelProps {
  values: CellValues;
  lesson?: number;
}

export function ExportButton({ values, lesson }: ExportPanelProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const handlePNG = async () => {
    await exportFullScreenPNG(`truth-diagram-lesson${lesson || 0}.png`);
    setOpen(false);
  };

  const handleSVG = () => {
    exportSVG(`truth-diagram-lesson${lesson || 0}.svg`);
    setOpen(false);
  };

  const handlePrint = () => {
    exportViaPrint();
    setOpen(false);
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
        className="px-2.5 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 border border-indigo-200 rounded-md transition-colors"
        title="Export diagram"
      >
        Export
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
          <button
            onClick={handlePrint}
            className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <span className="font-medium">Print / Save as PDF (Recommended)</span>
            <br />
            <span className="text-xs text-slate-600">Full screen with all text, best for publications</span>
          </button>
          <button
            onClick={handlePNG}
            className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <span className="font-medium">Export as PNG</span>
            <br />
            <span className="text-xs text-slate-600">Full screen capture for slides</span>
          </button>
          <button
            onClick={handleSVG}
            className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <span className="font-medium">Export diagram as SVG</span>
            <br />
            <span className="text-xs text-slate-600">Scalable vector of diagram only</span>
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
