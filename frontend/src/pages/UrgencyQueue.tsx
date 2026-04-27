import { useEffect, useState } from "react";
import { AlertTriangle, ScanSearch } from "lucide-react";
import { getUrgencyQueue } from "../api";
import type { HistoryRecord } from "../types";

const riskColor = { LOW: "#2d5a27", MEDIUM: "#b8860b", HIGH: "#8b1a1a" };

export function UrgencyQueue({ onOpen }: { onOpen: (id: string) => void }) {
  const [items, setItems]   = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUrgencyQueue().then(setItems).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="galleryEmpty"><p>Loading queue…</p></div>;

  return (
    <div className="galleryPage">
      <div className="galleryHeader">
        <div>
          <h2>Urgency Queue</h2>
          <p>{items.length} HIGH-risk artifact{items.length !== 1 ? "s" : ""} requiring attention</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="galleryEmpty">
          <ScanSearch size={40} />
          <p>No HIGH-risk artifacts. All clear.</p>
        </div>
      ) : (
        <div className="urgencyList">
          {items.map((r, i) => (
            <div key={r.id} className="urgencyRow" onClick={() => onOpen(r.id)}>
              <span className="urgencyRank">#{i + 1}</span>
              <img src={r.thumbnail} alt="" className="urgencyThumb" />
              <div className="urgencyMeta">
                <p className="urgencyDomain">{r.domain.toUpperCase()}</p>
                <p className="urgencyAge">{r.age?.estimated_age ?? "—"}</p>
                {(r as any).location?.place_name && (
                  <p className="urgencyPlace">{(r as any).location.place_name}</p>
                )}
                <p className="urgencyDate">{new Date(r.timestamp).toLocaleString()}</p>
              </div>
              <div className="urgencyScores">
                <div className="urgencyScore" style={{ color: riskColor.HIGH }}>
                  <span>Risk Score</span>
                  <strong>{r.risk?.score?.toFixed(1)}</strong>
                </div>
                <div className="urgencyScore">
                  <span>Severity</span>
                  <strong>{r.severity?.toFixed(1)}</strong>
                </div>
              </div>
              {r.alert && (
                <span className="urgencyAlertBadge">
                  <AlertTriangle size={14} /> Alert
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
