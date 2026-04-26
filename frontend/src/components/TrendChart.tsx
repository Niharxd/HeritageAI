import { useEffect, useRef } from "react";
import type { TrendPoint } from "../types";

const W = 600, H = 220, PAD = { top: 20, right: 20, bottom: 40, left: 48 };
const IW = W - PAD.left - PAD.right;
const IH = H - PAD.top - PAD.bottom;

function scaleX(i: number, n: number) {
  return PAD.left + (n < 2 ? IW / 2 : (i / (n - 1)) * IW);
}
function scaleY(v: number) {
  return PAD.top + IH - (v / 100) * IH;
}

export function TrendChart({ points }: { points: TrendPoint[] }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || points.length === 0) return;
    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    // grid
    ctx.strokeStyle = "rgba(184,134,11,0.15)";
    ctx.lineWidth = 1;
    [0, 25, 50, 75, 100].forEach(v => {
      const y = scaleY(v);
      ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(W - PAD.right, y); ctx.stroke();
      ctx.fillStyle = "#7a6248";
      ctx.font = "11px 'EB Garamond', serif";
      ctx.textAlign = "right";
      ctx.fillText(String(v), PAD.left - 6, y + 4);
    });

    // x labels
    ctx.fillStyle = "#7a6248";
    ctx.font = "10px 'EB Garamond', serif";
    ctx.textAlign = "center";
    points.forEach((p, i) => {
      const x = scaleX(i, points.length);
      const d = new Date(p.timestamp);
      ctx.fillText(`${d.getMonth()+1}/${d.getDate()}`, x, H - PAD.bottom + 16);
    });

    function drawLine(values: number[], color: string) {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = "round";
      values.forEach((v, i) => {
        const x = scaleX(i, values.length);
        const y = scaleY(v);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
      values.forEach((v, i) => {
        ctx.beginPath();
        ctx.arc(scaleX(i, values.length), scaleY(v), 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      });
    }

    drawLine(points.map(p => p.severity),   "#b8860b");
    drawLine(points.map(p => p.risk_score),  "#8b1a1a");

    // legend
    const items = [["Severity", "#b8860b"], ["Risk Score", "#8b1a1a"]] as const;
    items.forEach(([label, color], i) => {
      const lx = PAD.left + i * 120;
      const ly = H - 8;
      ctx.fillStyle = color;
      ctx.fillRect(lx, ly - 8, 14, 3);
      ctx.fillStyle = "#4a3520";
      ctx.font = "11px 'EB Garamond', serif";
      ctx.textAlign = "left";
      ctx.fillText(label, lx + 18, ly);
    });
  }, [points]);

  if (points.length === 0) {
    return <p className="trendEmpty">No trend data yet. Analyse more artifacts to see the chart.</p>;
  }

  return (
    <div className="trendWrap">
      <canvas ref={ref} />
    </div>
  );
}
