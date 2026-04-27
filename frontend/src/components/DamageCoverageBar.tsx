import type { Detection } from "../types";

const COLORS: Record<string, string> = {
  crack:   "#8b1a1a",
  stain:   "#b8860b",
  fading:  "#5c3d1e",
  erosion: "#2d5a27",
};

function colorFor(label: string) {
  return COLORS[label.toLowerCase()] ?? "#7a6248";
}

export function DamageCoverageBar({ detections, imageArea }: { detections: Detection[]; imageArea?: number }) {
  if (!detections.length) return null;

  const totals: Record<string, number> = {};
  for (const d of detections) {
    totals[d.label] = (totals[d.label] ?? 0) + d.area;
  }

  const total = Object.values(totals).reduce((a, b) => a + b, 0);
  const base  = imageArea && imageArea > 0 ? imageArea : total;

  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);

  return (
    <div className="damageCoverage">
      {entries.map(([label, area]) => {
        const pct = Math.min(100, (area / base) * 100);
        return (
          <div key={label} className="damageCoverageRow">
            <span style={{ color: colorFor(label) }}>{label}</span>
            <div className="damageCoverageTrack">
              <div style={{ width: `${pct}%`, background: colorFor(label) }} />
            </div>
            <strong>{pct.toFixed(1)}%</strong>
          </div>
        );
      })}
    </div>
  );
}
