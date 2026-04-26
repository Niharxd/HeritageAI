import { useEffect, useState } from "react";
import { ArrowLeftRight, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { compareRecords, getHistory } from "../api";
import type { CompareResult, HistoryRecord } from "../types";

const riskColor = { LOW: "#2d5a27", MEDIUM: "#b8860b", HIGH: "#8b1a1a" };

export function Compare() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [idA, setIdA]         = useState("");
  const [idB, setIdB]         = useState("");
  const [result, setResult]   = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    getHistory().then(h => setRecords(h.reverse()));
  }, []);

  async function run() {
    if (!idA || !idB || idA === idB) {
      setError("Select two different records to compare.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      setResult(await compareRecords(idA, idB));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Compare failed");
    } finally {
      setLoading(false);
    }
  }

  function DiffIcon({ val }: { val: number }) {
    if (val > 0) return <TrendingUp  size={16} color="#8b1a1a" />;
    if (val < 0) return <TrendingDown size={16} color="#2d5a27" />;
    return <Minus size={16} color="#7a6248" />;
  }

  return (
    <div className="comparePage">
      <div className="compareHeader">
        <h2>Artifact Comparison</h2>
        <p>Select two past analyses to compare deterioration.</p>
      </div>

      <div className="compareSelectors">
        <div className="compareSelect">
          <label>Artifact A</label>
          <select value={idA} onChange={e => setIdA(e.target.value)}>
            <option value="">— Select —</option>
            {records.map(r => (
              <option key={r.id} value={r.id}>
                {new Date(r.timestamp).toLocaleString()} · {r.domain} · {r.risk?.level}
              </option>
            ))}
          </select>
        </div>
        <ArrowLeftRight size={22} color="#b8860b" />
        <div className="compareSelect">
          <label>Artifact B</label>
          <select value={idB} onChange={e => setIdB(e.target.value)}>
            <option value="">— Select —</option>
            {records.map(r => (
              <option key={r.id} value={r.id}>
                {new Date(r.timestamp).toLocaleString()} · {r.domain} · {r.risk?.level}
              </option>
            ))}
          </select>
        </div>
        <button type="button" className="primaryButton"
          disabled={loading || !idA || !idB} onClick={run}>
          {loading ? "Comparing…" : "Compare"}
        </button>
      </div>

      {error && <p className="compareError">{error}</p>}

      {result && (
        <>
          <div className="diffSummary">
            <div className="diffCard">
              <span>Severity Change</span>
              <div className="diffValue">
                <DiffIcon val={result.diff.severity_change} />
                <strong style={{ color: result.diff.severity_change > 0 ? "#8b1a1a" : "#2d5a27" }}>
                  {result.diff.severity_change > 0 ? "+" : ""}{result.diff.severity_change.toFixed(1)}
                </strong>
              </div>
            </div>
            <div className="diffCard">
              <span>Risk Score Change</span>
              <div className="diffValue">
                <DiffIcon val={result.diff.risk_score_change} />
                <strong style={{ color: result.diff.risk_score_change > 0 ? "#8b1a1a" : "#2d5a27" }}>
                  {result.diff.risk_score_change > 0 ? "+" : ""}{result.diff.risk_score_change.toFixed(1)}
                </strong>
              </div>
            </div>
          </div>

          <div className="compareGrid">
            {([result.a, result.b] as const).map((item, idx) => (
              <div key={item.id} className="compareColumn">
                <div className="compareColHeader">
                  <span className="compareLabel">Artifact {idx === 0 ? "A" : "B"}</span>
                  <span className="compareDomain">{item.domain.toUpperCase()}</span>
                  <span className="compareRisk"
                    style={{ color: riskColor[item.risk?.level ?? "LOW"] }}>
                    {item.risk?.level} · {item.risk?.score?.toFixed(1)}
                  </span>
                </div>
                <p className="compareDate">{new Date(item.timestamp).toLocaleString()}</p>

                <div className="compareImages">
                  {(["original", "detectionOverlay", "enhanced", "heatmap"] as const).map(k => (
                    <figure key={k} className="imagePanel">
                      <figcaption>{k.replace(/([A-Z])/g, " $1")}</figcaption>
                      <img src={item.images[k]} alt={k} />
                    </figure>
                  ))}
                </div>

                <div className="compareStats">
                  <div><span>Severity</span><strong>{item.severity?.toFixed(1)}</strong></div>
                  <div><span>Age</span><strong>{item.age?.estimated_age ?? "—"}</strong></div>
                  <div><span>Risk</span><strong>{item.risk?.level ?? "—"}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
