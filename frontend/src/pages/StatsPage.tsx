import { useEffect, useState } from "react";
import { getHistory } from "../api";
import type { HistoryRecord } from "../types";
import { TrendChart } from "../components/TrendChart";
import { getTrend } from "../api";
import type { TrendPoint } from "../types";
import { BarChart2, AlertTriangle, Flame, Brain, FileImage } from "lucide-react";

const riskColor = { LOW: "#2d5a27", MEDIUM: "#b8860b", HIGH: "#8b1a1a" };

export function StatsPage() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [trend,   setTrend]   = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getHistory(), getTrend(20)])
      .then(([h, t]) => { setRecords(h); setTrend(t); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="statsEmpty"><p>Loading statistics…</p></div>;
  if (records.length === 0) return (
    <div className="statsEmpty">
      <BarChart2 size={40} />
      <p>No analyses yet. Run some analyses to see statistics.</p>
    </div>
  );

  const total       = records.length;
  const avgSeverity = records.reduce((s, r) => s + r.severity, 0) / total;
  const avgRisk     = records.reduce((s, r) => s + (r.risk?.score ?? 0), 0) / total;
  const highRisk    = records.filter(r => r.risk?.level === "HIGH").length;
  const domains     = { manuscript: 0, monument: 0, unknown: 0 } as Record<string, number>;
  records.forEach(r => { domains[r.domain] = (domains[r.domain] ?? 0) + 1; });

  const riskDist = { LOW: 0, MEDIUM: 0, HIGH: 0 };
  records.forEach(r => { if (r.risk?.level) riskDist[r.risk.level]++; });

  const highest = [...records].sort((a, b) => (b.risk?.score ?? 0) - (a.risk?.score ?? 0))[0];
  const lowest  = [...records].sort((a, b) => (a.risk?.score ?? 0) - (b.risk?.score ?? 0))[0];

  return (
    <div className="statsPage">
      <div className="statsHeader">
        <h2>Archive Statistics</h2>
        <p>Summary of all {total} analyses in your archive.</p>
      </div>

      {/* Summary metrics */}
      <div className="statsGrid">
        <StatCard icon={<FileImage size={20} />}  label="Total Analyses"    value={String(total)} />
        <StatCard icon={<Flame size={20} />}       label="Avg Damage Severity" value={avgSeverity.toFixed(1)} />
        <StatCard icon={<Brain size={20} />}       label="Avg Risk Score"    value={avgRisk.toFixed(1)} />
        <StatCard icon={<AlertTriangle size={20} />} label="High Risk Artifacts" value={String(highRisk)}
          highlight={highRisk > 0} />
      </div>

      {/* Risk distribution */}
      <div className="statsRow">
        <div className="panel statsPanel">
          <div className="panelHeader"><h3>Risk Distribution</h3></div>
          <div className="riskDistBars">
            {(["LOW", "MEDIUM", "HIGH"] as const).map(level => (
              <div key={level} className="riskDistRow">
                <span style={{ color: riskColor[level], fontFamily: "Cinzel, serif", fontSize: 11, letterSpacing: "0.1em" }}>
                  {level}
                </span>
                <div className="riskDistTrack">
                  <div style={{
                    width: `${(riskDist[level] / total) * 100}%`,
                    background: riskColor[level],
                  }} />
                </div>
                <span>{riskDist[level]} ({((riskDist[level] / total) * 100).toFixed(0)}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Domain split */}
        <div className="panel statsPanel">
          <div className="panelHeader"><h3>Domain Split</h3></div>
          <div className="riskDistBars">
            {Object.entries(domains).filter(([, v]) => v > 0).map(([domain, count]) => (
              <div key={domain} className="riskDistRow">
                <span style={{ fontFamily: "Cinzel, serif", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  {domain}
                </span>
                <div className="riskDistTrack">
                  <div style={{ width: `${(count / total) * 100}%`, background: "var(--gold)" }} />
                </div>
                <span>{count} ({((count / total) * 100).toFixed(0)}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trend chart */}
      <div className="panel">
        <div className="panelHeader"><h3>Damage &amp; Risk Trend (last 20)</h3></div>
        <div style={{ padding: 16 }}><TrendChart points={trend} /></div>
      </div>

      {/* Highest / lowest risk */}
      <div className="statsRow">
        <div className="panel statsPanel">
          <div className="panelHeader"><h3>Highest Risk Artifact</h3></div>
          <div className="statsArtifact">
            <img src={highest.thumbnail} alt="Highest risk" />
            <div>
              <p style={{ color: riskColor[highest.risk?.level ?? "LOW"], fontFamily: "Cinzel, serif", fontWeight: 700 }}>
                {highest.risk?.level} — {highest.risk?.score?.toFixed(1)}
              </p>
              <p>{highest.domain.toUpperCase()}</p>
              <p>{new Date(highest.timestamp).toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="panel statsPanel">
          <div className="panelHeader"><h3>Lowest Risk Artifact</h3></div>
          <div className="statsArtifact">
            <img src={lowest.thumbnail} alt="Lowest risk" />
            <div>
              <p style={{ color: riskColor[lowest.risk?.level ?? "LOW"], fontFamily: "Cinzel, serif", fontWeight: 700 }}>
                {lowest.risk?.level} — {lowest.risk?.score?.toFixed(1)}
              </p>
              <p>{lowest.domain.toUpperCase()}</p>
              <p>{new Date(lowest.timestamp).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, highlight = false }: {
  icon: React.ReactNode; label: string; value: string; highlight?: boolean;
}) {
  return (
    <div className={`statCard ${highlight ? "statCardAlert" : ""}`}>
      <div className="statCardIcon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}
