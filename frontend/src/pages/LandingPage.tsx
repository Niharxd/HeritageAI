import { ScrollText, ScanSearch, Shield, BookOpen, BarChart2, Github, Mail, Linkedin } from "lucide-react";

const FEATURES = [
  { icon: <ScanSearch size={22} />, title: "Damage Detection",     desc: "Detects cracks, stains, fading, and erosion using computer vision." },
  { icon: <Shield size={22} />,     title: "Risk Assessment",      desc: "Scores preservation risk as LOW, MEDIUM, or HIGH with full explanation." },
  { icon: <BookOpen size={22} />,   title: "OCR & Interpretation", desc: "Extracts text from manuscripts and structures damage labels for monuments." },
  { icon: <BarChart2 size={22} />,  title: "Archive & Trends",     desc: "Stores every analysis, tracks deterioration over time, and groups artifacts." },
];

const PIPELINE = ["Observe", "Detect", "Enhance", "Interpret", "Predict", "Explain"];

export function LandingPage({ onLaunch }: { onLaunch: () => void }) {
  return (
    <div className="landingPage">
      {/* Hero */}
      <section className="landingHero">
        <div className="landingHeroInner">
          <div className="landingLogo">
            <ScrollText size={40} />
          </div>
          <p className="landingEyebrow">AI-Based Cultural Heritage Preservation System</p>
          <h1 className="landingTitle">Heritage AI</h1>
          <p className="landingSubtitle">
            A local conservation assistant for manuscript and monument images.
            Detect damage, enhance visibility, assess risk, and preserve history.
          </p>
          <div className="landingPipeline">
            {PIPELINE.map((step, i) => (
              <span key={step} style={{ display: "contents" }}>
                <span className="landingPipelineStep">{step}</span>
                {i < PIPELINE.length - 1 && <span className="landingPipelineSep">›</span>}
              </span>
            ))}
          </div>
          <button type="button" className="landingLaunchBtn" onClick={onLaunch}>
            <ScanSearch size={20} />
            Launch Preservation Console
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="landingFeatures">
        <h2>What It Does</h2>
        <div className="landingFeaturesGrid">
          {FEATURES.map(f => (
            <div key={f.title} className="landingFeatureCard">
              <div className="landingFeatureIcon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section className="landingAbout">
        <h2>About This Project</h2>
        <div className="landingAboutGrid">
          <div className="landingAboutText">
            <p>
              Heritage AI is a beginner-friendly, fully local conservation assistant built with
              a <strong>FastAPI</strong> Python backend and a <strong>React + TypeScript</strong> frontend.
              It runs entirely on your machine — no cloud, no API keys, no data leaves your device.
            </p>
            <p>
              The system follows a structured pipeline: it first observes the image, detects visual
              damage symptoms using OpenCV heuristics, enhances visibility without hallucinating missing
              content, interprets the artifact (OCR for manuscripts, structured labels for monuments),
              predicts a preservation risk score, and explains its reasoning through heatmaps and
              contribution breakdowns.
            </p>
            <p>
              Training scripts are included so you can replace the baseline detectors with CNN,
              ResNet, or U-Net models when labeled data becomes available.
            </p>
            <div className="landingLimitations">
              <strong>Known Limitations</strong>
              <ul>
                <li>Damage detection uses heuristics, not a trained segmentation model</li>
                <li>Age estimation is based on visual degradation, not scientific dating</li>
                <li>OCR requires Tesseract to be installed separately</li>
              </ul>
            </div>
          </div>
          <div className="landingTechStack">
            <strong>Tech Stack</strong>
            <ul>
              <li>Python 3.13 · FastAPI · OpenCV · NumPy · Pillow</li>
              <li>React 18 · TypeScript · Vite</li>
              <li>ReportLab (PDF) · Tesseract (OCR)</li>
              <li>ResNet18 training scripts (PyTorch)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Author */}
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
        <button type="button" className="landingLaunchBtn landingLaunchBtnSm" onClick={onLaunch}>
          Launch App
        </button>
      </footer>
    </div>
  );
}
