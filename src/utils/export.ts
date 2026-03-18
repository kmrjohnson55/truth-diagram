/**
 * Export utilities: PNG from SVG, SVG download, print, shareable link
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
 * Inline all computed styles on an SVG element so it renders correctly
 * when converted to an image (standalone, without CSS).
 */
function inlineStyles(svgClone: SVGSVGElement) {
  const allEls = svgClone.querySelectorAll("*");
  allEls.forEach((el) => {
    const computed = window.getComputedStyle(el as Element);
    (el as HTMLElement).style.cssText = computed.cssText;
  });
}

/**
 * Export the SVG diagram as a high-resolution PNG.
 * Finds the first SVG[viewBox] on the page, serializes it with
 * inlined styles, draws it onto a canvas at 3x scale, and downloads.
 */
export async function exportFullScreenPNG(
  filename = "truth-diagram.png"
): Promise<void> {
  const svgEl = document.querySelector("svg[viewBox]") as SVGSVGElement;
  if (!svgEl) return;

  const scale = 3; // 3x for publication quality

  // Clone the SVG and prepare it for standalone rendering
  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

  // Get viewBox dimensions
  const vb = svgEl.viewBox.baseVal;
  const width = vb.width || svgEl.clientWidth || 560;
  const height = vb.height || svgEl.clientHeight || 500;

  // Set explicit dimensions on clone
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));
  clone.style.background = "white";

  // Remove overflow:visible (can cause issues with canvas rendering)
  clone.style.overflow = "hidden";

  const svgString = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  return new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        resolve();
        return;
      }

      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (blob) downloadBlob(blob, filename);
        URL.revokeObjectURL(url);
        resolve();
      }, "image/png");
    };
    img.onerror = () => {
      // If SVG-to-image fails, try with data URI approach
      URL.revokeObjectURL(url);
      const dataUri = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgString)));
      const img2 = new Image();
      img2.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(); return; }
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img2, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) downloadBlob(blob, filename);
          resolve();
        }, "image/png");
      };
      img2.onerror = () => resolve();
      img2.src = dataUri;
    };
    img.src = url;
  });
}

/**
 * Export just the SVG diagram as a vector file
 */
export function exportSVG(filename = "truth-diagram.svg") {
  const svgEl = document.querySelector("svg[viewBox]") as SVGSVGElement;
  if (!svgEl) return;

  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.style.background = "white";

  // Set explicit dimensions
  const vb = svgEl.viewBox.baseVal;
  clone.setAttribute("width", String(vb.width || 560));
  clone.setAttribute("height", String(vb.height || 500));

  const svgString = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  downloadBlob(blob, filename);
}

/**
 * Use browser print dialog for best quality export (PDF or print)
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
