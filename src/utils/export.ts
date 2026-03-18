/**
 * Export utilities: SVG, PNG, and shareable link generation
 */

/**
 * Serialize the main SVG diagram element to a string
 */
function getSvgString(svgEl: SVGSVGElement): string {
  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  // Add white background if not present
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.style.background = "white";
  return new XMLSerializer().serializeToString(clone);
}

/**
 * Download a blob as a file
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
 * Export the diagram as an SVG file
 */
export function exportSVG(svgEl: SVGSVGElement, filename = "truth-diagram.svg") {
  const svgString = getSvgString(svgEl);
  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  downloadBlob(blob, filename);
}

/**
 * Export the diagram as a high-resolution PNG
 */
export function exportPNG(
  svgEl: SVGSVGElement,
  filename = "truth-diagram.png",
  scaleFactor = 3 // 3x for publication quality
): Promise<void> {
  return new Promise((resolve, reject) => {
    const svgString = getSvgString(svgEl);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = svgEl.viewBox.baseVal.width * scaleFactor;
      canvas.height = svgEl.viewBox.baseVal.height * scaleFactor;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (blob) {
          downloadBlob(blob, filename);
          resolve();
        } else {
          reject(new Error("Could not create PNG blob"));
        }
      }, "image/png");

      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load SVG as image"));
    };
    img.src = url;
  });
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
