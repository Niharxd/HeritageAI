import { useEffect, useRef, useState } from "react";

export function HeatmapSlider({
  original, heatmap
}: { original: string; heatmap: string }) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const [alpha, setAlpha] = useState(50);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const imgA = new Image();
    const imgB = new Image();
    let loaded = 0;

    function draw() {
      canvas!.width  = imgA.naturalWidth;
      canvas!.height = imgA.naturalHeight;
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);
      ctx.globalAlpha = 1;
      ctx.drawImage(imgA, 0, 0);
      ctx.globalAlpha = alpha / 100;
      ctx.drawImage(imgB, 0, 0);
      ctx.globalAlpha = 1;
    }

    imgA.onload = imgB.onload = () => { loaded++; if (loaded === 2) draw(); };
    imgA.src = original;
    imgB.src = heatmap;
  }, [original, heatmap, alpha]);

  return (
    <div className="heatmapSlider">
      <div className="heatmapSliderLabel">
        <span>Original</span>
        <span>Heatmap Blend: {alpha}%</span>
        <span>Heatmap</span>
      </div>
      <input
        type="range" min={0} max={100} value={alpha}
        onChange={e => setAlpha(Number(e.target.value))}
        className="heatmapRange"
      />
      <canvas ref={canvasRef} className="heatmapCanvas" />
    </div>
  );
}
