import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle, Brain, Download, FileImage, Flame,
  ImageUp, Loader2, ScanSearch, ScrollText, Sparkles,
  LayoutGrid, GitCompare, Pencil, Clock, Wrench, FlaskConical,
  Mail, Github, Linkedin, Layers, Moon, Sun, BarChart2, Map,
  Sliders, ListChecks, AlertOctagon, RefreshCw, QrCode
} from "lucide-react";
import type { ReactNode } from "react";
import { analyzeImage, analyzeBatch, getPdfUrl, getRecord, getLanguages, checkDuplicate, getDocxUrl, getQrUrl } from "./api";
import type { AnalysisResult, BatchResult, Domain, OcrLanguage } from "./types";
import { Gallery } from "./pages/Gallery";
import { Compare } from "./pages/Compare";
import { LandingPage } from "./pages/LandingPage";
import { StatsPage } from "./pages/StatsPage";
import { MapView } from "./pages/MapView";
import { UrgencyQueue } from "./pages/UrgencyQueue";
import { AnnotationTool } from "./components/AnnotationTool";
import { ProgressSteps } from "./components/ProgressSteps";
import { ImageLightbox } from "./components/ImageLightbox";
import { HeatmapSlider } from "./components/HeatmapSlider";
import { DetectionInspector } from "./components/DetectionInspector";
import { BatchResults } from "./components/BatchResults";
import { LocationPicker } from "./components/LocationPicker";
import { EnhancementSlider } from "./components/EnhancementSlider";
import { DamageCoverageBar } from "./components/DamageCoverageBar";
import { ChecklistPanel } from "./components/ChecklistPanel";
import { useToast } from "./components/Toast";
import { useDarkMode } from "./components/DarkMode";
import { checkImageQuality, QualityWarnings } from "./components/ImageQuality";
import type { QualityResult } from "./components/ImageQuality";

type View = "analyze" | "gallery" | "compare" | "stats" | "map" | "urgency";
type Tab  = "results" | "annotate" | "heatmap" | "inspect" | "enhance" | "checklist";

const riskClass    = { LOW: "riskLow", MEDIUM: "riskMedium", HIGH: "riskHigh" };
const urgencyClass = { High: "urgHigh", Medium: "urgMedium", Low: "urgLow" };
const PIPELINE_STEPS = ["Observe", "Detect", "Enhance", "Interpret", "Predict", "Explain"];

export function App() {
  const toast              = useToast();
  const { dark, toggle }   = useDarkMode();
  const [landed, setLanded] = useState(false);

  const [view, setView]         = useState<View>("analyze");
  const [files, setFiles]       = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [domain, setDomain]     = useState<Domain>("auto");
  const [result, setResult]     = useState<AnalysisResult | null>(null);
  const [batch,  setBatch]      = useState<BatchResult | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("results");
  const [lightbox, setLightbox] = useState<{ src: string; title: string } | null>(null);
  const [language, setLanguage] = useState("eng");
  const [languages, setLanguages] = useState<OcrLanguage[]>([]);
  const [recentFiles, setRecentFiles] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("recentFiles") ?? "[]"); } catch { return []; }
  });
  const [dupWarning, setDupWarning] = useState<{ id: string; distance: number }[]>([]);

  useEffect(() => { getLanguages().then(setLanguages).catch(() => {}); }, []);
  const [quality,  setQuality]  = useState<QualityResult | null>(null);
  const [dragging, setDragging] = useState(false);
  const dropRef = useRef<HTMLLabelElement>(null);

  const isBatch = files.length > 1;

  const reportJson = useMemo(() => result ? JSON.stringify(result, null, 2) : "", [result]);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (!landed) return;
      if (e.key === "a" || e.key === "A") setView("analyze");
      if (e.key === "g" || e.key === "G") setView("gallery");
      if (e.key === "c" || e.key === "C") setView("compare");
      if (e.key === "s" || e.key === "S") setView("stats");
      if (e.key === "m" || e.key === "M") setView("map");
      if (e.key === "u" || e.key === "U") setView("urgency");
      if (e.key === "b" || e.key === "B") { setView("analyze"); dropRef.current?.click(); }
      if (e.key === "Escape") setLightbox(null);
      if ((e.key === "Enter") && view === "analyze" && files.length > 0 && !loading) runAnalysis();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [landed, view, files, loading]);

  // ── File handling ────────────────────────────────────────────────────────
  async function applyFiles(selected: File[]) {
    setFiles(selected);
    setResult(null);
    setBatch(null);
    setError("");
    setQuality(null);
    setDupWarning([]);
    previews.forEach(p => URL.revokeObjectURL(p));
    setPreviews(selected.map(f => URL.createObjectURL(f)));
    if (selected.length === 1) {
      const q = await checkImageQuality(selected[0]);
      setQuality(q);
      if (!q.ok) toast("Image quality warnings detected", "info");
      // duplicate check
      try {
        const dup = await checkDuplicate(selected[0]);
        if (dup.is_duplicate) {
          setDupWarning(dup.duplicates);
          toast(`Possible duplicate detected (${dup.duplicates.length} match${dup.duplicates.length > 1 ? "es" : ""})`, "info");
        }
      } catch { /* ignore */ }
      // recent files
      const name = selected[0].name;
      setRecentFiles(prev => {
        const updated = [name, ...prev.filter(n => n !== name)].slice(0, 5);
        localStorage.setItem("recentFiles", JSON.stringify(updated));
        return updated;
      });
    }
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    applyFiles(Array.from(e.target.files ?? []));
  }

  // ── Drag and drop ────────────────────────────────────────────────────────
  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragging(true); }, []);
  const onDragLeave = useCallback(() => setDragging(false), []);
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    if (dropped.length) applyFiles(dropped);
  }, []);

  // ── Analysis ─────────────────────────────────────────────────────────────
  async function runAnalysis() {
    if (files.length === 0) return;
    setLoading(true);
    setError("");
    setResult(null);
    setBatch(null);
    try {
      if (isBatch) {
        const b = await analyzeBatch(files, domain, language);
        setBatch(b);
        toast(`Batch complete — ${b.total} image${b.total !== 1 ? "s" : ""} analysed`);
      } else {
        const r = await analyzeImage(files[0], domain, language);
        setResult(r);
        setActiveTab("results");
        toast(`Analysis complete — Risk: ${r.risk.level}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Analysis failed";
      setError(msg);
      toast(msg, "error");
    } finally {
      setLoading(false);
    }
  }

  function downloadJson() {
    if (!reportJson) return;
    const blob = new Blob([reportJson], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "heritage_analysis.json"; a.click();
    URL.revokeObjectURL(url);
    toast("JSON report downloaded");
  }

  function exportCsv() {
    if (!result) return;
    const rows = [
      ["Type", "Severity", "X", "Y", "W", "H"],
      ...result.detection.detections.map(d => [
        d.label, d.severity.toFixed(1), ...(d.bbox as number[]).map(String)
      ]),
    ];
    const csv  = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "detections.csv"; a.click();
    URL.revokeObjectURL(url);
    toast("CSV detections downloaded");
  }

  async function downloadPdf(id: string) {
    try {
      const res  = await fetch(getPdfUrl(id));
      if (!res.ok) throw new Error("PDF generation failed");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = `heritage_${id.slice(0, 8)}.pdf`; a.click();
      URL.revokeObjectURL(url);
      toast("PDF report downloaded");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "PDF download failed";
      setError(msg);
      toast(msg, "error");
    }
  }

  function downloadDocx(id: string) {
    const a = document.createElement("a");
    a.href = getDocxUrl(id); a.download = `heritage_${id.slice(0, 8)}.docx`; a.click();
    toast("DOCX field report downloaded");
  }

  function openQr(id: string) {
    setLightbox({ src: getQrUrl(id), title: "QR Code — Archive Link" });
  }

  async function openFromGallery(id: string) {
    localStorage.setItem("launched", "1");
    setLanded(true);
  }

  if (!landed) return <LandingPage onLaunch={() => setLanded(true)} />;

  return (
    <main className="appShell">
      <aside className="sidePanel">
        <div className="brand">
          <div className="brandMark"><ScrollText size={26} /></div>
          <div>
            <h1>Heritage AI</h1>
            <p>Preservation Console</p>
          </div>
          <button type="button" className="darkToggle" onClick={toggle} title="Toggle dark mode">
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        <nav className="sideNav">
          {([
            ["analyze", "Analyse",  <ScanSearch size={16} />, "A"],
            ["gallery", "Archive",  <LayoutGrid size={16} />, "G"],
            ["compare", "Compare",  <GitCompare size={16} />, "C"],
            ["stats",   "Stats",    <BarChart2  size={16} />, "S"],
            ["map",     "Map",      <Map        size={16} />, "M"],
            ["urgency", "Urgent",   <AlertOctagon size={16} />, "U"],
          ] as [View, string, ReactNode, string][]).map(([v, label, icon, key]) => (
            <button key={v} type="button"
              className={`navItem ${view === v ? "active" : ""}`}
              onClick={() => setView(v)}>
              {icon}{label}
              <span className="navShortcut">{key}</span>
            </button>
          ))}
        </nav>

        {view === "analyze" && (
          <>
            <label
              ref={dropRef}
              className={`uploadBox ${dragging ? "uploadDragging" : ""}`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            >
              <input type="file" accept="image/*" multiple onChange={onFileChange} />
              {previews.length > 0
                ? previews.length === 1
                  ? <img src={previews[0]} alt="Selected artifact" />
                  : <div className="batchPreviewGrid">
                      {previews.slice(0, 6).map((p, i) => <img key={i} src={p} alt="" />)}
                      {previews.length > 6 && <div className="batchMoreCount">+{previews.length - 6}</div>}
                    </div>
                : <div className="uploadEmpty">
                    <ImageUp size={36} />
                    <span>Drop or Select Image{isBatch ? "s" : ""}</span>
                    <p>drag & drop or click to browse</p>
                  </div>
              }
            </label>

            {quality && <QualityWarnings warnings={quality.warnings} />}

            {dupWarning.length > 0 && (
              <div className="dupWarning">
                <AlertTriangle size={15} />
                <span>Possible duplicate — {dupWarning.length} similar record{dupWarning.length > 1 ? "s" : ""} in archive</span>
              </div>
            )}

            {recentFiles.length > 0 && files.length === 0 && (
              <div className="recentFiles">
                <p>Recent</p>
                {recentFiles.map(name => (
                  <span key={name} className="recentFile" title={name}>{name}</span>
                ))}
              </div>
            )}

            {isBatch && (
              <div className="batchBadge">
                <Layers size={14} /> Batch — {files.length} images
              </div>
            )}

            <div className="controlGroup">
              <label>Artifact Domain</label>
              <div className="segmented">
                {(["auto", "manuscript", "monument"] as Domain[]).map(d => (
                  <button key={d} type="button"
                    className={domain === d ? "active" : ""}
                    onClick={() => setDomain(d)}>{d}</button>
                ))}
              </div>
            </div>

            {languages.length > 0 && (
              <div className="controlGroup">
                <label>OCR Language</label>
                <select
                  className="langSelect"
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                >
                  {languages.map(l => (
                    <option key={l.code} value={l.code}>{l.name}</option>
                  ))}
                </select>
              </div>
            )}

            <button className="primaryButton" type="button"
              disabled={files.length === 0 || loading} onClick={runAnalysis}>
              {loading ? <Loader2 className="spin" size={18} /> : <ScanSearch size={18} />}
              {loading ? "Analysing…" : isBatch ? `Analyse ${files.length} Images` : "Begin Analysis"}
            </button>

            <ProgressSteps active={loading} />

            {result && !isBatch && (
              <div className="reportButtons">
                <button className="secondaryButton" type="button" onClick={downloadJson}>
                  <Download size={16} /> JSON
                </button>
                <button className="secondaryButton" type="button" onClick={() => downloadPdf(result.id)}>
                  <Download size={16} /> PDF
                </button>
                <button className="secondaryButton" type="button" onClick={() => downloadDocx(result.id)}>
                  <Download size={16} /> DOCX
                </button>
                <button className="secondaryButton" type="button" onClick={() => openQr(result.id)}>
                  <QrCode size={16} /> QR
                </button>
                <button className="secondaryButton" type="button" onClick={exportCsv}
                  style={{ gridColumn: "1 / -1" }}>
                  <Download size={16} /> CSV Detections
                </button>
                <button className="secondaryButton" type="button"
                  style={{ gridColumn: "1 / -1" }}
                  onClick={() => { setResult(null); setBatch(null); setError(""); }}
                >
                  <RefreshCw size={16} /> Re-run / New
                </button>
              </div>
            )}

            {error && (
              <div className="errorBox">
                <AlertTriangle size={18} /><span>{error}</span>
              </div>
            )}
          </>
        )}

        <div className="authorFooter">
          <p className="authorName">Nihar Ranjan Patra</p>
          <div className="authorLinks">
            <a href="mailto:niharpatra2277@gmail.com" title="Gmail" target="_blank" rel="noreferrer">
              <Mail size={16} /> Gmail
            </a>
            <a href="https://github.com/Niharxd" title="GitHub" target="_blank" rel="noreferrer">
              <Github size={16} /> GitHub
            </a>
            <a href="https://www.linkedin.com/in/nihar-patra-98841336a/" title="LinkedIn" target="_blank" rel="noreferrer">
              <Linkedin size={16} /> LinkedIn
            </a>
          </div>
        </div>
      </aside>

      <section className="workspace">
        {view === "gallery" && <Gallery onOpen={openFromGallery} />}
        {view === "compare" && <Compare />}
        {view === "stats"   && <StatsPage />}
        {view === "map"     && <MapView onOpen={openFromGallery} />}
        {view === "urgency" && <UrgencyQueue onOpen={openFromGallery} />}

        {view === "analyze" && (
          <>
            <header className="topBar">
              <div>
                <p className="eyebrow">Observe · Detect · Enhance · Interpret · Predict · Explain</p>
                <h2>AI-Based Cultural Heritage Preservation</h2>
              </div>
              {result && <span className="domainBadge">{result.domain}</span>}
            </header>

            {batch && <BatchResults result={batch} onOpen={openFromGallery} />}

            {!result && !batch && (
              <section className="emptyState">
                <div className="emptyStateIcon"><FileImage size={40} /></div>
                <h3>Awaiting Artifact</h3>
                <p>Upload a manuscript or monument image to begin the preservation analysis.</p>
                <div className="emptyPipeline">
                  {PIPELINE_STEPS.map((step, i) => (
                    <span key={step} style={{ display: "contents" }}>
                      <span className="pipelineStep">{step}</span>
                      {i < PIPELINE_STEPS.length - 1 && <span className="pipelineSep">›</span>}
                    </span>
                  ))}
                </div>
                <p className="shortcutHint">Shortcuts: <kbd>A</kbd> Analyse · <kbd>G</kbd> Archive · <kbd>C</kbd> Compare · <kbd>S</kbd> Stats · <kbd>M</kbd> Map · <kbd>U</kbd> Urgent · <kbd>B</kbd> Batch</p>
              </section>
            )}

            {result && (
              <>
                <div className="tabBar">
                  {([
                    ["results",   "Results",   <FlaskConical size={15} />],
                    ["inspect",   "Inspect",   <ScanSearch size={15} />],
                    ["heatmap",   "Heatmap",   <Flame size={15} />],
                    ["enhance",   "Enhance",   <Sliders size={15} />],
                    ["checklist", "Checklist", <ListChecks size={15} />],
                    ["annotate",  "Annotate",  <Pencil size={15} />],
                  ] as [Tab, string, ReactNode][]).map(([t, label, icon]) => (
                    <button key={t} type="button"
                      className={activeTab === t ? "active" : ""}
                      onClick={() => setActiveTab(t)}>
                      {icon} {label}
                    </button>
                  ))}
                </div>

                {activeTab === "enhance" && (
                  <div className="panel">
                    <div className="panelHeader"><h3>Before / After Enhancement</h3></div>
                    <div style={{ padding: 16 }}>
                      <EnhancementSlider original={result.images.original} enhanced={result.images.enhanced} />
                    </div>
                  </div>
                )}

                {activeTab === "checklist" && (
                  <div className="panel">
                    <div className="panelHeader"><h3>Conservator Checklist</h3></div>
                    <div style={{ padding: 16 }}>
                      <ChecklistPanel recordId={result.id} />
                    </div>
                  </div>
                )}

                {activeTab === "annotate" && (
                  <div className="panel">
                    <div className="panelHeader"><h3>Image Annotation</h3></div>
                    <div style={{ padding: 16 }}>
                      <AnnotationTool imageSrc={result.images.original} />
                    </div>
                  </div>
                )}

                {activeTab === "heatmap" && (
                  <div className="panel">
                    <div className="panelHeader"><h3>Heatmap Overlay Slider</h3></div>
                    <div style={{ padding: 16 }}>
                      <HeatmapSlider original={result.images.original} heatmap={result.images.heatmap} />
                    </div>
                  </div>
                )}

                {activeTab === "inspect" && (
                  <div className="panel">
                    <div className="panelHeader"><h3>Detection Inspector — click a row to highlight</h3></div>
                    <div style={{ padding: 16 }}>
                      <DetectionInspector imageSrc={result.images.original} detections={result.detection.detections} />
                    </div>
                  </div>
                )}

                {activeTab === "results" && (
                  <>
                    <section className="metricsGrid">
                      <Metric icon={<Flame />}       label="Damage Severity"    value={`${result.detection.severity.toFixed(1)} / 100`} />
                      <Metric icon={<Sparkles />}    label="Enhancement Gain"   value={`${result.enhancement.improvement.toFixed(1)}%`} />
                      <Metric icon={<Brain />}       label="Preservation Risk"  value={`${result.risk.level}  ${result.risk.score.toFixed(1)}`} className={riskClass[result.risk.level]} />
                      <Metric icon={<Clock />}       label="Degradation Age"    value={result.age.estimated_age} small />
                      <Metric icon={<FlaskConical />} label="Age Confidence"    value={result.age.confidence} small />
                    </section>

                    {result.detection.detections.length > 0 && (
                      <div className="panel">
                        <div className="panelHeader"><h3>Damage Coverage by Type</h3></div>
                        <div style={{ padding: 16 }}>
                          <DamageCoverageBar detections={result.detection.detections} />
                        </div>
                      </div>
                    )}

                    <div className="ornamentDivider">✦ ✦ ✦</div>

                    <section className="imageGrid">
                      {([
                        ["Original",            "original"],
                        ["Damage Overlay",      "detectionOverlay"],
                        ["Enhanced Output",     "enhanced"],
                        ["Explanation Heatmap", "heatmap"],
                      ] as [string, keyof typeof result.images][]).map(([title, key]) => (
                        <figure key={key} className="imagePanel"
                          onClick={() => setLightbox({ src: result.images[key], title })}
                          style={{ cursor: "zoom-in" }}>
                          <figcaption>{title} <span className="zoomHint">click to zoom</span></figcaption>
                          <img src={result.images[key]} alt={title} />
                        </figure>
                      ))}
                    </section>

                    <section className="contentGrid">
                      <div className="panel">
                        <div className="panelHeader">
                          <h3>{result.domain === "manuscript" ? "Extracted Text" : "Structured Labels"}</h3>
                        </div>
                        {result.domain === "manuscript"
                          ? <textarea readOnly value={result.semantic.text || ""} />
                          : <pre>{JSON.stringify(result.semantic.labels ?? {}, null, 2)}</pre>
                        }
                      </div>

                      <div className="panel">
                        <div className="panelHeader"><h3>Degradation-Based Age Estimate</h3></div>
                        <div className="agePanel">
                          <div className="ageDisclaimer">
                            ⚠ Based on visual degradation only — not a scientific dating method.
                          </div>
                          <div className="agePrimary">
                            <span>Estimated Age</span>
                            <strong>{result.age.estimated_age}</strong>
                            <p className="ageYearRange">Approx. year {result.age.year_range}</p>
                          </div>
                          <p className="ageNote">{result.age.note}</p>
                          <div className="ageFactors">
                            {Object.entries(result.age.factors).map(([k, v]) => (
                              <div key={k} className="ageFactor">
                                <span>{k.replace(/_/g, " ")}</span>
                                <div className="ageBar"><div style={{ width: `${Math.min(v, 100)}%` }} /></div>
                                <strong>{v.toFixed(1)}</strong>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="panel">
                        <div className="panelHeader"><h3>Artifact Location</h3></div>
                        <div style={{ padding: 16 }}>
                          <LocationPicker
                            recordId={result.id}
                            onSaved={() => {}}
                          />
                        </div>
                      </div>

                      <div className={`panel widePanel ${riskClass[result.risk.level]}`}>
                        <div className="panelHeader">
                          <h3>Risk Explanation</h3>
                          <span>{result.risk.level}</span>
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
                          {result.risk.reasons.map(r => <li key={r}>{r}</li>)}
                        </ul>
                      </div>

                      <div className="panel widePanel">
                        <div className="panelHeader">
                          <h3><Wrench size={14} style={{ marginRight: 6 }} />Restoration Recommendations</h3>
                          {result.suggestions.specialist_required && (
                            <span className="specialistBadge">Specialist Required</span>
                          )}
                        </div>
                        <div className="suggestionsWrap">
                          <p className="priorityNote">{result.suggestions.priority_note}</p>
                          <div className="suggestionsGrid">
                            {result.suggestions.suggestions.map(s => (
                              <div key={s.technique} className="suggestionCard">
                                <div className="suggestionHeader">
                                  <strong>{s.technique}</strong>
                                  <span className={`urgencyBadge ${urgencyClass[s.urgency]}`}>{s.urgency}</span>
                                </div>
                                <p>{s.description}</p>
                                {s.specialist && <span className="specialistTag">Requires specialist</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </section>
                  </>
                )}
              </>
            )}
          </>
        )}
      </section>

      {lightbox && (
        <ImageLightbox src={lightbox.src} title={lightbox.title} onClose={() => setLightbox(null)} />
      )}
    </main>
  );
}

function Metric({ icon, label, value, className = "", small = false }: {
  icon: ReactNode; label: string; value: string; className?: string; small?: boolean;
}) {
  return (
    <div className={`metric ${className} ${small ? "metricSmall" : ""}`}>
      <div className="metricIcon">{icon}</div>
      <div><span>{label}</span><strong>{value}</strong></div>
    </div>
  );
}
