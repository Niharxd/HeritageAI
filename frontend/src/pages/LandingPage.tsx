import { useEffect, useRef, useState } from "react";
import {
  ScrollText, ScanSearch, Shield, BookOpen, BarChart2,
  Github, Mail, Linkedin, Map, GitCompare, Layers,
  Flame, Brain, Clock, Wrench, FileText, Zap,
  CheckSquare, AlertOctagon, Download, Eye
} from "lucide-react";

const PIPELINE = ["Observe", "Detect", "Enhance", "Interpret", "Predict", "Explain"];

const FEATURES = [
  { icon: <ScanSearch size={24} />,   title: "Damage Detection",       desc: "Detects cracks, stains, fading, and erosion with bounding boxes and severity scores using OpenCV heuristics." },
  { icon: <Shield size={24} />,       title: "Risk Assessment",         desc: "Scores preservation risk LOW / MEDIUM / HIGH with a full breakdown of contributing factors and reasons." },
  { icon: <BookOpen size={24} />,     title: "OCR & Interpretation",    desc: "Extracts text from manuscripts in 11 languages. Generates structured damage labels for monuments." },
  { icon: <Flame size={24} />,        title: "Heatmap Explainability",  desc: "Visual heatmaps show which pixels drove the damage detection. Blend 0–100% over the original image." },
  { icon: <Brain size={24} />,        title: "Age Estimation",          desc: "Estimates artifact age from visual degradation patterns with confidence levels and factor breakdown." },
  { icon: <Wrench size={24} />,       title: "Restoration Suggestions", desc: "Maps detected damage types to specific conservation techniques with urgency levels and specialist flags." },
  { icon: <BarChart2 size={24} />,    title: "Archive & Trends",        desc: "Every analysis saved automatically. Track deterioration over time, group artifacts, set risk alerts." },
  { icon: <Map size={24} />,          title: "World Map View",          desc: "Pin artifacts on an interactive Leaflet map. Risk-colored markers, Nominatim geocoding, no API key needed." },
  { icon: <GitCompare size={24} />,   title: "Compare Tool",            desc: "Side-by-side diff of two past analyses with severity and risk score change indicators." },
  { icon: <Layers size={24} />,       title: "Batch Analysis",          desc: "Upload up to 10 images at once and get a summary table with per-image risk and severity." },
  { icon: <AlertOctagon size={24} />, title: "Urgency Queue",           desc: "Dedicated view listing all HIGH-risk artifacts sorted by score — acts as a work queue for conservators." },
  { icon: <CheckSquare size={24} />,  title: "Conservator Checklist",   desc: "Per-artifact task list (Apply consolidant, Photograph reverse side…) with done/pending status." },
];

const EXPORTS = [
  { icon: <FileText size={18} />,  label: "PDF Report",    desc: "Full conservation report with images, tables, and recommendations." },
  { icon: <Download size={18} />,  label: "DOCX Report",   desc: "Pre-filled Word document formatted for museum submission." },
  { icon: <Download size={18} />,  label: "JSON Export",   desc: "Complete analysis data as structured JSON." },
  { icon: <Download size={18} />,  label: "CSV Export",    desc: "Detections table as a spreadsheet." },
  { icon: <Download size={18} />,  label: "ZIP Bundle",    desc: "Bundle selected records (images + reports) into one download." },
  { icon: <Eye size={18} />,       label: "QR Code",       desc: "Embed a QR linking to the archive record in the PDF report." },
];

const TECH = [
  { layer: "Backend",          tech: "Python 3.13 · FastAPI · Uvicorn" },
  { layer: "Computer Vision",  tech: "OpenCV · NumPy · Pillow" },
  { layer: "OCR",              tech: "Tesseract · pytesseract (11 languages)" },
  { layer: "ML Training",      tech: "PyTorch · torchvision · ResNet18" },
  { layer: "PDF / DOCX",       tech: "ReportLab · python-docx" },
  { layer: "Frontend",         tech: "React 19 · TypeScript · Vite" },
  { layer: "Map",              tech: "Leaflet · OpenStreetMap · Nominatim" },
  { layer: "QR / Duplicate",   tech: "qrcode · perceptual hashing (avg-hash)" },
];

const STATS = [
  { value: "11",   label: "OCR Languages" },
  { value: "6",    label: "Pipeline Stages" },
  { value: "4",    label: "Damage Types" },
  { value: "100%", label: "Local — No Cloud" },
];

function useInView(ref: React.RefObject<Element | null>) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return visible;
}

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref);
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(28px)",
      transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

export function LandingPage({ onLaunch }: { onLaunch: () => void }) {
  const [pipelineStep, setPipelineStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setPipelineStep(s => (s + 1) % PIPELINE.length), 900);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="landingPage">

      {/* ── Hero ── */}
      <section className="landingHero">
        <div className="landingHeroInner">
          <div className="landingLogo">
            <ScrollText size={44} />
          </div>
          <p className="landingEyebrow">AI-Based Cultural Heritage Preservation System</p>
          <h1 className="landingTitle">Heritage AI</h1>
          <p className="landingSubtitle">
            A fully local conservation assistant for manuscript and monument images.
            No cloud. No API keys. Everything runs on your machine.
          </p>

          {/* Animated pipeline */}
          <div className="landingPipeline">
            {PIPELINE.map((step, i) => (
              <span key={step} style={{ display: "contents" }}>
                <span className={`landingPipelineStep ${i === pipelineStep ? "landingPipelineActive" : ""}`}>
                  {step}
                </span>
                {i < PIPELINE.length - 1 && <span className="landingPipelineSep">›</span>}
              </span>
            ))}
          </div>

          {/* Stats row */}
          <div className="landingStatsRow">
            {STATS.map(s => (
              <div key={s.label} className="landingStat">
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </div>
            ))}
          </div>

          <button type="button" className="landingLaunchBtn" onClick={onLaunch}>
            <ScanSearch size={20} />
            Launch Preservation Console
          </button>
          <p className="landingHeroNote">Press any key shortcut after launch: A · G · C · S · M · U</p>
        </div>

        {/* Scroll indicator */}
        <div className="landingScrollHint">
          <span>Scroll to explore</span>
          <div className="landingScrollDot" />
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="landingFeatures">
        <FadeIn>
          <div className="landingSectionLabel">Capabilities</div>
          <h2>Everything You Need to Preserve History</h2>
          <p className="landingSectionSub">
            A complete pipeline from raw image to conservation report — all running locally.
          </p>
        </FadeIn>
        <div className="landingFeaturesGrid">
          {FEATURES.map((f, i) => (
            <FadeIn key={f.title} delay={i * 50}>
              <div className="landingFeatureCard">
                <div className="landingFeatureIcon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── Pipeline Visual ── */}
      <section className="landingPipelineSection">
        <FadeIn>
          <div className="landingSectionLabel">How It Works</div>
          <h2>The Analysis Pipeline</h2>
        </FadeIn>
        <div className="landingPipelineVisual">
          {PIPELINE.map((step, i) => (
            <FadeIn key={step} delay={i * 100}>
              <div className="landingPipelineCard">
                <div className="landingPipelineNum">{String(i + 1).padStart(2, "0")}</div>
                <div className="landingPipelineCardTitle">{step}</div>
                <p className="landingPipelineCardDesc">{PIPELINE_DESCS[i]}</p>
              </div>
              {i < PIPELINE.length - 1 && <div className="landingPipelineConnector">›</div>}
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── Export Options ── */}
      <section className="landingExports">
        <FadeIn>
          <div className="landingSectionLabel">Export & Reports</div>
          <h2>Take Your Analysis Anywhere</h2>
        </FadeIn>
        <div className="landingExportsGrid">
          {EXPORTS.map((e, i) => (
            <FadeIn key={e.label} delay={i * 60}>
              <div className="landingExportCard">
                <div className="landingExportIcon">{e.icon}</div>
                <strong>{e.label}</strong>
                <p>{e.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── Tech Stack + About ── */}
      <section className="landingAbout">
        <FadeIn>
          <div className="landingSectionLabel">Under the Hood</div>
          <h2>About This Project</h2>
        </FadeIn>
        <div className="landingAboutGrid">
          <FadeIn delay={100}>
            <div className="landingAboutText">
              <p>
                Heritage AI is a fully local conservation assistant built with a <strong>FastAPI</strong> Python
                backend and a <strong>React 19 + TypeScript</strong> frontend. No data ever leaves your device.
              </p>
              <p>
                The system follows a structured pipeline: observe the image, detect visual damage using
                OpenCV heuristics, enhance visibility without hallucinating missing content, interpret the
                artifact (OCR for manuscripts, structured labels for monuments), predict a preservation
                risk score, and explain its reasoning through heatmaps and contribution breakdowns.
              </p>
              <p>
                Training scripts are included so you can replace the baseline detectors with CNN,
                ResNet18, or U-Net models when labeled data becomes available.
              </p>
              <div className="landingLimitations">
                <strong>Known Limitations</strong>
                <ul>
                  <li>Damage detection uses heuristics, not a trained segmentation model</li>
                  <li>Age estimation is based on visual degradation, not scientific dating</li>
                  <li>OCR requires Tesseract to be installed separately</li>
                  <li>Map view requires internet for OpenStreetMap tiles</li>
                </ul>
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={200}>
            <div className="landingTechStack">
              <strong>Tech Stack</strong>
              <div className="landingTechTable">
                {TECH.map(t => (
                  <div key={t.layer} className="landingTechRow">
                    <span className="landingTechLayer">{t.layer}</span>
                    <span className="landingTechValue">{t.tech}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Keyboard Shortcuts ── */}
      <section className="landingShortcuts">
        <FadeIn>
          <div className="landingSectionLabel">Keyboard Shortcuts</div>
          <h2>Navigate at the Speed of Thought</h2>
        </FadeIn>
        <FadeIn delay={100}>
          <div className="landingShortcutsGrid">
            {[
              ["A", "Analyse view"],
              ["G", "Archive (Gallery)"],
              ["C", "Compare"],
              ["S", "Statistics"],
              ["M", "Map view"],
              ["U", "Urgency Queue"],
              ["B", "Batch upload"],
              ["Enter", "Run analysis"],
              ["Esc", "Close modal"],
            ].map(([key, action]) => (
              <div key={key} className="landingShortcutRow">
                <kbd>{key}</kbd>
                <span>{action}</span>
              </div>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* ── CTA ── */}
      <section className="landingCta">
        <FadeIn>
          <div className="landingLogo" style={{ margin: "0 auto 24px" }}>
            <ScrollText size={36} />
          </div>
          <h2>Ready to Preserve History?</h2>
          <p>Upload your first artifact and let Heritage AI begin the analysis.</p>
          <button type="button" className="landingLaunchBtn" onClick={onLaunch}>
            <Zap size={20} />
            Launch Heritage AI
          </button>
        </FadeIn>
      </section>

      {/* ── Footer ── */}
      <footer className="landingFooter">
        <div className="landingAuthor">
          <div className="landingAuthorMark"><ScrollText size={22} /></div>
          <div>
            <p className="landingAuthorName">Nihar Ranjan Patra</p>
            <p className="landingAuthorRole">Developer · Heritage AI</p>
          </div>
        </div>
        <div className="landingAuthorLinks">
          <a href="mailto:niharpatra2277@gmail.com" target="_blank" rel="noreferrer">
            <Mail size={16} /> niharpatra2277@gmail.com
          </a>
          <a href="https://github.com/Niharxd" target="_blank" rel="noreferrer">
            <Github size={16} /> github.com/Niharxd
          </a>
          <a href="https://www.linkedin.com/in/nihar-patra-98841336a/" target="_blank" rel="noreferrer">
            <Linkedin size={16} /> linkedin.com/in/nihar-patra
          </a>
        </div>
      </footer>
    </div>
  );
}

const PIPELINE_DESCS = [
  "Load and normalise the image. Check quality — brightness, blur, resolution.",
  "Run OpenCV heuristics to find cracks, stains, fading, and erosion with bounding boxes.",
  "Apply CLAHE, denoising, and adaptive thresholding without hallucinating missing content.",
  "OCR for manuscripts (11 languages) or structured damage labels for monuments.",
  "Score preservation risk LOW / MEDIUM / HIGH with weighted factor contributions.",
  "Generate heatmaps showing which pixels drove detection. Produce restoration suggestions.",
];
