import { useState, useRef, useEffect } from "react";
import { exportSVG, exportDiagramPNG, exportFullScreenPNG, generateShareableLink } from "../../utils/export";
import type { CellValues } from "../../utils/statistics";

interface ExportPanelProps {
  values: CellValues;
  lesson?: number;
}

export function ExportButton({ values, lesson }: ExportPanelProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
          btnRef.current && !btnRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const toggleMenu = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
    setOpen(!open);
  };

  const handleDiagramPNG = async () => {
    setOpen(false);
    await exportDiagramPNG(`truth-diagram-lesson${lesson || 0}.png`);
  };

  const handleSVG = () => {
    exportSVG(`truth-diagram-lesson${lesson || 0}.svg`);
    setOpen(false);
  };

  const handleFullScreen = () => {
    setOpen(false);
    // Delay print until React re-renders and menu is gone
    setTimeout(() => exportFullScreenPNG(), 100);
  };

  const handleLink = () => {
    const link = generateShareableLink(values, lesson);
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggleMenu}
        className="px-2.5 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 border border-indigo-200 rounded-md transition-colors"
        title="Export diagram"
      >
        Export
      </button>

      {/* Portal-style: fixed position to avoid overflow clipping */}
      {open && (
        <div
          ref={menuRef}
          className="fixed w-64 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-[9999]"
          style={{ top: menuPos.top, right: menuPos.right }}
        >
          <button
            onClick={handleDiagramPNG}
            className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <span className="font-medium">Diagram as PNG</span>
            <br />
            <span className="text-xs text-slate-600">High-res diagram only (no text), saves to Downloads</span>
          </button>
          <button
            onClick={handleSVG}
            className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <span className="font-medium">Diagram as SVG</span>
            <br />
            <span className="text-xs text-slate-600">Scalable vector of diagram only</span>
          </button>
          <hr className="my-1 border-slate-100" />
          <button
            onClick={handleFullScreen}
            className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <span className="font-medium">Full screen as PDF</span>
            <br />
            <span className="text-xs text-slate-600">Entire screen with all text (Print dialog)</span>
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
    </>
  );
}
