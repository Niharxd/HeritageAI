import { ChangeEvent, useMemo, useState } from "react";
import {
  AlertTriangle,
  Brain,
  Download,
  FileImage,
  Flame,
  ImageUp,
  Loader2,
  ScanSearch,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import type { ReactNode } from "react";
import { analyzeImage } from "./api";
import type { AnalysisResult, Domain } from "./types";

const riskClass = {
  LOW: "riskLow",
  MEDIUM: "riskMedium",
  HIGH: "riskHigh"
};

export function App() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [domain, setDomain] = useState<Domain>("auto");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reportJson = useMemo(() => {
    if (!result) return "";
    return JSON.stringify(
      {
        domain: result.domain,
        damageSeverity: result.detection.severity,
        detections: result.detection.detections,
        enhancement: result.enhancement,
        semantic: result.semantic,
        risk: result.risk,
        explanation: result.explanation
      },
      null,
      2
    );
  }, [result]);

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
    setResult(null);
    setError("");
    if (preview) URL.revokeObjectURL(preview);
    setPreview(selected ? URL.createObjectURL(selected) : "");
  }

  async function runAnalysis() {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      setResult(await analyzeImage(file, domain));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  function downloadReport() {
    if (!reportJson) return;
    const blob = new Blob([reportJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "heritage_analysis.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="appShell">
      <aside className="sidePanel">
        <div className="brand">
          <div className="brandMark">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1>Heritage AI</h1>
            <p>Preservation Console</p>
          </div>
        </div>

        <label className="uploadBox">
          <input type="file" accept="image/*" onChange={onFileChange} />
          {preview ? (
            <img src={preview} alt="Selected artifact preview" />
          ) : (
            <div className="uploadEmpty">
              <ImageUp size={34} />
              <span>Choose image</span>
            </div>
          )}
        </label>

        <div className="controlGroup">
          <label>Artifact Type</label>
          <div className="segmented">
            {(["auto", "manuscript", "monument"] as Domain[]).map((item) => (
              <button
                key={item}
                className={domain === item ? "active" : ""}
                type="button"
                onClick={() => setDomain(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <button className="primaryButton" type="button" disabled={!file || loading} onClick={runAnalysis}>
          {loading ? <Loader2 className="spin" size={18} /> : <ScanSearch size={18} />}
          Analyze
        </button>

        {result && (
          <button className="secondaryButton" type="button" onClick={downloadReport}>
            <Download size={18} />
            JSON Report
          </button>
        )}

        {error && (
          <div className="errorBox">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}
      </aside>

      <section className="workspace">
        <header className="topBar">
          <div>
            <p className="eyebrow">Observe / Detect / Enhance / Interpret / Predict / Explain</p>
            <h2>AI-Based Cultural Heritage Preservation System</h2>
          </div>
          {result && <span className="domainBadge">{result.domain}</span>}
        </header>

        {!result ? (
          <section className="emptyState">
            <FileImage size={48} />
            <h3>Upload an artifact image to begin</h3>
            <p>The dashboard will fill with detection overlays, restoration output, semantic data, risk, and heatmaps.</p>
          </section>
        ) : (
          <>
            <section className="metricsGrid">
              <Metric icon={<Flame />} label="Damage Severity" value={`${result.detection.severity.toFixed(1)}/100`} />
              <Metric icon={<Sparkles />} label="Enhancement" value={`${result.enhancement.improvement.toFixed(1)}%`} />
              <Metric
                icon={<Brain />}
                label="Risk"
                value={`${result.risk.level} ${result.risk.score.toFixed(1)}`}
                className={riskClass[result.risk.level]}
              />
            </section>

            <section className="imageGrid">
              <ImagePanel title="Original" src={result.images.original} />
              <ImagePanel title="Damage Overlay" src={result.images.detectionOverlay} />
              <ImagePanel title="Enhanced Output" src={result.images.enhanced} />
              <ImagePanel title="Explanation Heatmap" src={result.images.heatmap} />
            </section>

            <section className="contentGrid">
              <div className="panel">
                <div className="panelHeader">
                  <h3>Detected Regions</h3>
                  <span>{result.detection.detections.length}</span>
                </div>
                <div className="tableWrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Severity</th>
                        <th>Box</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.detection.detections.length === 0 ? (
                        <tr>
                          <td colSpan={3}>No major damaged regions found.</td>
                        </tr>
                      ) : (
                        result.detection.detections.map((item, index) => (
                          <tr key={`${item.label}-${index}`}>
                            <td>{item.label}</td>
                            <td>{item.severity.toFixed(1)}</td>
                            <td>{item.bbox.join(", ")}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="panel">
                <div className="panelHeader">
                  <h3>{result.domain === "manuscript" ? "Extracted Text" : "Structured Labels"}</h3>
                </div>
                {result.domain === "manuscript" ? (
                  <textarea readOnly value={result.semantic.text || ""} />
                ) : (
                  <pre>{JSON.stringify(result.semantic.labels ?? {}, null, 2)}</pre>
                )}
              </div>

              <div className="panel widePanel">
                <div className="panelHeader">
                  <h3>Risk Explanation</h3>
                  <span className={riskClass[result.risk.level]}>{result.risk.level}</span>
                </div>
                <div className="riskLayout">
                  {Object.entries(result.explanation.contributions).map(([key, value]) => (
                    <div className="contribution" key={key}>
                      <span>{key.replace(/_/g, " ")}</span>
                      <strong>{value.toFixed(2)}</strong>
                    </div>
                  ))}
                </div>
                <ul className="reasonList">
                  {result.risk.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>
            </section>
          </>
        )}
      </section>
    </main>
  );
}

function Metric({
  icon,
  label,
  value,
  className = ""
}: {
  icon: ReactNode;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`metric ${className}`}>
      <div className="metricIcon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function ImagePanel({ title, src }: { title: string; src: string }) {
  return (
    <figure className="imagePanel">
      <figcaption>{title}</figcaption>
      <img src={src} alt={title} />
    </figure>
  );
}
