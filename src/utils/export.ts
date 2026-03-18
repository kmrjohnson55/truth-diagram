/**
 * Export utilities: full-screen PNG, SVG diagram, and shareable link
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
 * Export the full current screen as a high-res PNG using the browser's
 * native rendering. Captures the entire lesson layout (diagram + text).
 */
export async function exportFullScreenPNG(
  filename = "truth-diagram.png"
): Promise<void> {
  // Find the main content area (the flex container with diagram + text)
  const contentArea = document.querySelector(".flex-1.flex.flex-col.lg\\:flex-row") as HTMLElement
    || document.querySelector("main") as HTMLElement;

  if (!contentArea) {
    // Fallback: just print the page
    window.print();
    return;
  }

  // Use a hidden iframe approach: render to canvas via SVG foreignObject
  const scale = 2; // 2x for publication quality
  const rect = contentArea.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;

  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Clone the content and serialize to SVG foreignObject
  const clone = contentArea.cloneNode(true) as HTMLElement;
  clone.style.width = width + "px";
  clone.style.height = height + "px";
  clone.style.transform = "none";
  clone.style.position = "static";

  // Get all stylesheets as inline styles
  const styleSheets = Array.from(document.styleSheets);
  let cssText = "";
  for (const sheet of styleSheets) {
    try {
      const rules = Array.from(sheet.cssRules || []);
      cssText += rules.map(r => r.cssText).join("\n");
    } catch {
      // Cross-origin stylesheets can't be read
    }
  }

  const svgData = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width * scale}" height="${height * scale}">
      <defs>
        <style type="text/css"><![CDATA[${cssText}]]></style>
      </defs>
      <foreignObject width="${width}" height="${height}" transform="scale(${scale})">
        <div xmlns="http://www.w3.org/1999/xhtml">
          ${clone.outerHTML}
        </div>
      </foreignObject>
    </svg>
  `;

  const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  const img = new Image();

  return new Promise((resolve) => {
    img.onload = () => {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) downloadBlob(blob, filename);
        URL.revokeObjectURL(url);
        resolve();
      }, "image/png");
    };
    img.onerror = () => {
      // Fallback: use browser print dialog
      URL.revokeObjectURL(url);
      window.print();
      resolve();
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
