import type { BatchResult } from "../types";

const riskColor = { LOW: "#2d5a27", MEDIUM: "#b8860b", HIGH: "#8b1a1a" };

export function BatchResults({ result, onOpen }: {
  result: BatchResult;
  onOpen: (id: string) => void;
}) {
  function exportCsv() {
    const rows = [
      ["Filename", "Domain", "Severity", "Risk Level", "Risk Score", "Estimated Age"],
      ...result.results.map(r => [
        r.filename, r.domain,
        r.severity.toFixed(1),
        r.risk?.level ?? "",
        r.risk?.score?.toFixed(1) ?? "",
        r.age?.estimated_age ?? "",
      ]),
    ];
    const csv  = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "batch_results.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="batchResults">
      <div className="batchHeader">
        <div>
          <h3>Batch Results</h3>
          <p>{result.total} image{result.total !== 1 ? "s" : ""} analysed
            {result.errors.length > 0 && `, ${result.errors.length} failed`}
          </p>
        </div>
        <button type="button" className="secondaryButton" onClick={exportCsv}>
          Export CSV
        </button>
      </div>

      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>Preview</th>
              <th>Filename</th>
              <th>Domain</th>
              <th>Severity</th>
              <th>Risk</th>
              <th>Age Est.</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {result.results.map(r => (
              <tr key={r.id}>
                <td>
                  <img src={r.thumbnail} alt={r.filename}
                    style={{ width: 48, height: 36, objectFit: "cover", borderRadius: 3 }} />
                </td>
                <td>{r.filename}</td>
                <td>{r.domain}</td>
                <td>{r.severity.toFixed(1)}</td>
                <td>
                  <span style={{
                    color: riskColor[r.risk?.level ?? "LOW"],
                    fontWeight: 700,
                    fontFamily: "Cinzel, serif",
                    fontSize: 12,
                  }}>
                    {r.risk?.level} {r.risk?.score?.toFixed(1)}
                  </span>
                </td>
                <td>{r.age?.estimated_age ?? "—"}</td>
                <td>
                  <button type="button" className="batchOpenBtn" onClick={() => onOpen(r.id)}>
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {result.errors.length > 0 && (
        <div className="batchErrors">
          <strong>Failed:</strong>
          {result.errors.map(e => (
            <span key={e.filename}>{e.filename}: {e.error}</span>
          ))}
        </div>
      )}
    </div>
  );
}
