import { useEffect, useRef, useState } from "react";

export function EnhancementSlider({ original, enhanced }: { original: string; enhanced: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pos, setPos] = useState(50);
  const origImg = useRef<HTMLImageElement | null>(null);
  const enhImg  = useRef<HTMLImageElement | null>(null);
  const loaded  = useRef(0);

  function draw(p: number) {
    const canvas = canvasRef.current;
    if (!canvas || !origImg.current || !enhImg.current) return;
    const ctx = canvas.getContext("2d")!;
    const w = canvas.width, h = canvas.height;
    const split = Math.round((p / 100) * w);
    ctx.drawImage(origImg.current, 0, 0, w, h);
    ctx.drawImage(enhImg.current, split, 0, w - split, h, split, 0, w - split, h);
    ctx.strokeStyle = "#e8b84b";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(split, 0); ctx.lineTo(split, h); ctx.stroke();
    ctx.fillStyle = "#e8b84b";
    ctx.beginPath(); ctx.arc(split, h / 2, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#1a0f05";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("⇔", split, h / 2 + 4);
  }

  function loadImage(src: string, ref: React.MutableRefObject<HTMLImageElement | null>) {
    const img = new Image();
    img.onload = () => {
      ref.current = img;
      loaded.current += 1;
      if (loaded.current === 2) {
        const canvas = canvasRef.current!;
        canvas.width  = img.naturalWidth;
        canvas.height = img.naturalHeight;
        draw(pos);
      }
    };
    img.src = src;
  }

  useEffect(() => {
    loaded.current = 0;
    loadImage(original, origImg);
    loadImage(enhanced, enhImg);
  }, [original, enhanced]);

  useEffect(() => { draw(pos); }, [pos]);

  function onMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (e.buttons !== 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setPos(Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)));
  }

  return (
    <div className="enhancementSlider">
      <div className="heatmapSliderLabel">
        <span>Original</span>
        <span>Enhanced</span>
      </div>
      <canvas
        ref={canvasRef}
        className="heatmapCanvas"
        style={{ cursor: "col-resize" }}
        onMouseMove={onMouseMove}
        onMouseDown={onMouseMove}
      />
      <input
        type="range" min={0} max={100} value={pos}
        onChange={e => setPos(Number(e.target.value))}
        className="heatmapRange"
      />
    </div>
  );
}
