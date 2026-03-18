/**
 * Export utilities: PNG (diagram or full screen), SVG, print, shareable link
 */

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export the SVG diagram as a high-resolution PNG (diagram only, no clipping).
 * Expands the viewBox to capture any overflow (labels, etc.).
 */
export async function exportDiagramPNG(
  filename = "truth-diagram.png"
): Promise<void> {
  const svgEl = document.querySelector("svg[viewBox]") as SVGSVGElement;
  if (!svgEl) return;

  const scale = 3;

  // Get the actual bounding box of ALL rendered content (including overflow)
  const bbox = svgEl.getBBox();
  const padding = 20;
  const x = bbox.x - padding;
  const y = bbox.y - padding;
  const width = bbox.width + padding * 2;
  const height = bbox.height + padding * 2;

  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  // Use the expanded bounding box as viewBox to capture everything
  clone.setAttribute("viewBox", `${x} ${y} ${width} ${height}`);
  clone.setAttribute("width", String(Math.ceil(width)));
  clone.setAttribute("height", String(Math.ceil(height)));
  clone.style.background = "white";
  clone.style.overflow = "visible";

  const svgString = new XMLSerializer().serializeToString(clone);

  // Try blob URL first, fall back to data URI
  const renderToCanvas = (imgSrc: string): Promise<void> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(width) * scale;
        canvas.height = Math.ceil(height) * scale;
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(); return; }
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) downloadBlob(blob, filename);
          resolve();
        }, "image/png");
      };
      img.onerror = () => resolve();
      img.src = imgSrc;
    });
  };

  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const blobUrl = URL.createObjectURL(svgBlob);

  try {
    await renderToCanvas(blobUrl);
  } catch {
    // Fallback: data URI
    const dataUri = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgString)));
    await renderToCanvas(dataUri);
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

/**
 * Export the full screen (whole page) as PNG using Print/Save as PDF.
 * This is the most reliable way to capture the entire layout with text.
 */
export function exportFullScreenPNG() {
  window.print();
}

/**
 * Export just the SVG diagram as a vector file (no clipping)
 */
export function exportSVG(filename = "truth-diagram.svg") {
  const svgEl = document.querySelector("svg[viewBox]") as SVGSVGElement;
  if (!svgEl) return;

  const bbox = svgEl.getBBox();
  const padding = 20;

  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("viewBox", `${bbox.x - padding} ${bbox.y - padding} ${bbox.width + padding * 2} ${bbox.height + padding * 2}`);
  clone.setAttribute("width", String(Math.ceil(bbox.width + padding * 2)));
  clone.setAttribute("height", String(Math.ceil(bbox.height + padding * 2)));
  clone.style.background = "white";

  const svgString = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  downloadBlob(blob, filename);
}

/**
 * Use browser print dialog for best quality full-screen export (PDF)
 */
export function exportViaPrint() {
  window.print();
}

/**
 * Generate a shareable link encoding the current state
 */
export function generateShareableLink(
  values: { tp: number; fp: number; fn: number; tn: number },
  lesson?: number
): string {
  const base = window.location.origin + window.location.pathname;
  const params = new URLSearchParams({
    tp: String(values.tp),
    fp: String(values.fp),
    fn: String(values.fn),
    tn: String(values.tn),
  });
  if (lesson !== undefined) {
    params.set("lesson", String(lesson));
  }
  return `${base}?${params.toString()}`;
}
