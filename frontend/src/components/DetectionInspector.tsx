import { useRef, useState } from "react";
import type { Detection } from "../types";

const COLORS: Record<string, string> = {
  crack:   "#ff3c3c",
  stain:   "#ffaa28",
  fading:  "#50b4ff",
  erosion:  "#b45aff",
};

export function DetectionInspector({
  imageSrc, detections
}: { imageSrc: string; detections: Detection[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef    = useRef<HTMLImageElement>(null);
  const [active, setActive] = useState<number | null>(null);

  function drawBoxes(highlight: number | null) {
    const canvas = canvasRef.current;
    const img    = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d")!;
    canvas.width  = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);

    detections.forEach((d, i) => {
      const [x, y, w, h] = d.bbox as number[];
      const color = COLORS[d.label] ?? "#e8b84b";
      const isActive = i === highlight;
      ctx.strokeStyle = color;
      ctx.lineWidth   = isActive ? 4 : 1.5;
      ctx.globalAlpha = isActive ? 1 : 0.45;
      ctx.strokeRect(x, y, w, h);
      if (isActive) {
        ctx.fillStyle = color + "33";
        ctx.fillRect(x, y, w, h);
        ctx.globalAlpha = 1;
        ctx.fillStyle = color;
        ctx.font = "bold 14px sans-serif";
        ctx.fillText(`${d.label} ${d.severity.toFixed(0)}`, x + 4, Math.max(18, y - 4));
      }
    });
    ctx.globalAlpha = 1;
  }

  function onImgLoad() { drawBoxes(active); }

  function selectRow(i: number) {
    const next = active === i ? null : i;
    setActive(next);
    drawBoxes(next);
  }

  return (
    <div className="detectionInspector">
      <div className="inspectorImage">
        <img ref={imgRef} src={imageSrc} alt="Detection" onLoad={onImgLoad} style={{ display: "none" }} />
        <canvas ref={canvasRef} className="inspectorCanvas" />
      </div>
      <div className="tableWrap">
        <table>
          <thead>
            <tr><th>Type</th><th>Severity</th><th>Bounding Box</th></tr>
          </thead>
          <tbody>
            {detections.length === 0
              ? <tr><td colSpan={3}>No damaged regions detected.</td></tr>
              : detections.map((d, i) => (
                <tr
                  key={i}
                  className={`inspectorRow ${active === i ? "inspectorRowActive" : ""}`}
                  onClick={() => selectRow(i)}
                  style={{ cursor: "pointer" }}
                >
                  <td>
                    <span className="detLabel" style={{ background: COLORS[d.label] ?? "#e8b84b" }} />
                    {d.label}
                  </td>
                  <td>{d.severity.toFixed(1)}</td>
                  <td>{(d.bbox as number[]).join(", ")}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}
