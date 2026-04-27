# Heritage AI — AI-Based Cultural Heritage Preservation System

> Built by **Nihar Ranjan Patra**
> [niharpatra2277@gmail.com](mailto:niharpatra2277@gmail.com) · [GitHub](https://github.com/Niharxd) · [LinkedIn](https://www.linkedin.com/in/nihar-patra-98841336a/)

A fully local, beginner-friendly conservation assistant for manuscript and monument images.
No cloud. No API keys. Everything runs on your machine.

---

## Screenshots

| Landing Page | Analyse View |
|---|---|
| ![Landing Page](screenshots/01_landing_page.png) | ![Analyse](screenshots/02_analyse_empty.png) |

| Archive | Dark Mode |
|---|---|
| ![Archive](screenshots/04_archive_page.png) | ![Dark Mode](screenshots/03_dark_mode.png) |

| Statistics | Map View |
|---|---|
| ![Stats](screenshots/06_stats_page.png) | ![Map](screenshots/07_map_page.png) |

---

## Pipeline

```
Observe → Detect → Enhance → Interpret → Predict → Explain
```

---

## Features

### Analysis
- **Damage Detection** — detects cracks, stains, fading, and erosion using OpenCV heuristics
- **Enhancement** — denoising, CLAHE, adaptive thresholding without hallucinating missing content
- **OCR** — extracts text from manuscripts using Tesseract (11 languages supported)
- **Structured Labels** — counts and boxes damage types for monuments
- **Risk Scoring** — LOW / MEDIUM / HIGH with score breakdown and reasons
- **Heatmap Explainability** — shows which pixels drove the damage detection
- **Degradation-Based Age Estimate** — estimates artifact age from visual degradation (with disclaimer)
- **Restoration Suggestions** — maps damage types to specific conservation techniques with urgency levels

### Image Tools
- **Heatmap Slider** — blend heatmap 0–100% over the original image in real time
- **Detection Inspector** — click any row in the detections table to highlight that bounding box on the image
- **Image Lightbox** — click any of the 4 analysis images to open fullscreen (press Escape to close)
- **Annotation Tool** — draw coloured rectangles on the image and add notes

### Batch & Export
- **Batch Analysis** — upload up to 10 images at once, get a summary table
- **PDF Report** — full conservation report with images, tables, and recommendations
- **JSON Export** — complete analysis data as JSON
- **CSV Export** — detections table as a spreadsheet

### Archive
- **Analysis History** — every analysis saved automatically with thumbnail, risk, age
- **Notes / Journal** — write and save conservator field notes per artifact
- **Artifact Groups** — tag records as the same artifact, view a deterioration timeline
- **Risk Alert Threshold** — set a score cutoff, records above it get a red alert badge
- **Trend Chart** — severity and risk score over time (last 20 analyses)
- **Delete Records** — remove individual analyses from the archive

### Map View
- **Interactive World Map** — Leaflet + OpenStreetMap, no API key needed
- **Risk-Colored Pins** — green = LOW, gold = MEDIUM, red = HIGH
- **Nominatim Geocoding** — type any place name (e.g. "Konark, Odisha") to assign a location
- **Pin Popups** — thumbnail, place name, risk level, domain, date, and "View Analysis" button

### UI / UX
- **Landing Page** — intro screen with project description, features, and tech stack
- **Dark Mode** — full dark parchment theme, persists across sessions
- **Keyboard Shortcuts** — `A` Analyse · `G` Archive · `C` Compare · `S` Stats · `M` Map · `Escape` close
- **Drag & Drop Upload** — drag images directly onto the upload box
- **Image Quality Checker** — warns if image is too dark, overexposed, blurry, or too small
- **Progress Steps** — animated step indicator during analysis
- **Toast Notifications** — pop-up confirmations for all actions
- **Compare Tool** — side-by-side diff of two past analyses with severity and risk change
- **Statistics Page** — total analyses, average severity, risk distribution, domain split, highest/lowest risk

### OCR Languages
English · Hindi · Sanskrit · Tamil · Telugu · Arabic · Persian · Greek · Latin · Chinese Simplified · Japanese

---

## Project Structure

```text
History/
  backend/
    age_estimation.py            # degradation-based age estimate
    damage_detection.py          # crack/stain/fading/erosion detection
    enhancement.py               # non-hallucinating restoration
    explainability.py            # heatmap and risk explanation
    history_store.py             # archive, notes, groups, locations, settings
    ocr_engine.py                # Tesseract OCR with multi-language support
    pdf_report.py                # ReportLab PDF generation
    pipeline.py                  # connects all engines
    preprocessing.py             # image normalisation utilities
    restoration_suggestions.py   # conservation technique recommendations
    risk_prediction.py           # LOW/MEDIUM/HIGH risk scoring
  frontend/
    src/
      components/
        AnnotationTool.tsx       # draw and note regions on image
        BatchResults.tsx         # batch analysis summary table
        DarkMode.tsx             # dark mode context and hook
        DetectionInspector.tsx   # click-to-highlight detection regions
        HeatmapSlider.tsx        # blend heatmap over original
        ImageLightbox.tsx        # fullscreen image zoom
        ImageQuality.tsx         # pre-analysis quality checker
        LocationPicker.tsx       # Nominatim geocoding search
        ProgressSteps.tsx        # animated pipeline step indicator
        Toast.tsx                # notification system
        TrendChart.tsx           # canvas severity/risk line chart
      pages/
        Compare.tsx              # side-by-side analysis comparison
        Gallery.tsx              # archive with notes, groups, alerts
        LandingPage.tsx          # intro screen
        MapView.tsx              # Leaflet world map with pins
        StatsPage.tsx            # archive statistics dashboard
      App.tsx                    # main app with all views
      api.ts                     # API client
      styles.css                 # full heritage theme CSS
      types.ts                   # TypeScript type definitions
  training/
    download_material_dataset.py # auto-download training images from Bing
    generate_synthetic_data.py   # synthetic damage data generator
    train_damage_classifier.py   # ResNet18 damage classifier
    train_enhancement_autoencoder.py
    train_material_classifier.py # material CNN with hard negatives
  utils/
    image_io.py
    visualization.py
  data/
    raw/
    processed/
    synthetic/
  models/                        # trained model weights go here
  outputs/                       # history.json, groups.json, logs
  screenshots/                   # demo screenshots
  app.py                         # FastAPI backend (v3)
  generate_screenshots.py        # auto-capture demo screenshots
  requirements.txt
  start_backend.bat
  start_frontend.bat
```

---

## Setup

### 1. Python dependencies

```bash
pip install -r requirements.txt
```

### 2. Tesseract OCR (optional but recommended)

Download and install from: https://github.com/UB-Mannheim/tesseract/wiki

Make sure `tesseract.exe` is on your PATH. The app runs without it but OCR will show an install message.

For non-English languages, install the language data packs from the same page.

### 3. Node.js

Download from https://nodejs.org/ if `node --version` does not work.

### 4. Frontend dependencies

```bash
cd frontend
npm install
```

---

## Run The App

**Option A — Batch files (easiest on Windows)**

Double-click `start_backend.bat`, then double-click `start_frontend.bat`.
Keep both windows open.

**Option B — Terminal**

Terminal 1 (backend):
```bash
python -m uvicorn app:app --host 127.0.0.1 --port 8000
```

Terminal 2 (frontend):
```bash
cd frontend
npm run dev
```

Open **http://127.0.0.1:5173**


## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `A` | Analyse view |
| `G` | Archive (Gallery) |
| `C` | Compare |
| `S` | Statistics |
| `M` | Map view |
| `Enter` | Run analysis (when file selected) |
| `Escape` | Close lightbox / modal |

---

## OCR Language Support

| Language | Tesseract Code |
|----------|---------------|
| English | `eng` |
| Hindi | `hin` |
| Sanskrit | `san` |
| Tamil | `tam` |
| Telugu | `tel` |
| Arabic | `ara` |
| Persian | `fas` |
| Greek | `ell` |
| Latin | `lat` |
| Chinese Simplified | `chi_sim` |
| Japanese | `jpn` |

---

## Train Better Models

### Damage classifier (ResNet18)

```bash
python training/train_damage_classifier.py --data data/classification --epochs 15
```

Expected folder structure:
```
data/classification/
  crack/
  stain/
  fading/
  erosion/
  clean/
```

### Enhancement autoencoder

```bash
python training/generate_synthetic_data.py --count 500
python training/train_enhancement_autoencoder.py --data data/synthetic --epochs 10
```

### Dataset sources

- [DIBCO / H-DIBCO](https://paperswithcode.com/dataset/dibco-and-h-dibco) — degraded manuscript documents
- [Historical-crack18-19](https://pmc.ncbi.nlm.nih.gov/articles/PMC8818920/) — historical building cracks
- [CODEBRIM](https://datasetninja.com/codebrim) — concrete defect classes
- [Roboflow crack detection](https://universe.roboflow.com/shm-v25ds/crack-detection-7lgyo) — segmentation datasets
- [StructDamage](https://arxiv.org/abs/2603.10484) — structural damage classification

---

## Known Limitations

- Damage detection uses OpenCV heuristics, not a trained segmentation model. Results vary with image quality.
- Age estimation is based on visual degradation only — not a scientific dating method.
- OCR accuracy depends on image quality and Tesseract language pack installation.
- Map view requires an internet connection for OpenStreetMap tiles and Nominatim geocoding.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.13 · FastAPI · Uvicorn |
| Computer Vision | OpenCV · NumPy · Pillow |
| OCR | Tesseract · pytesseract |
| PDF | ReportLab |
| ML Training | PyTorch · torchvision (ResNet18) |
| Frontend | React 18 · TypeScript · Vite |
| Map | Leaflet · OpenStreetMap · Nominatim |
| Geocoding | OpenStreetMap Nominatim (free, no key) |

---

## Production Improvements

- Replace heuristic masks with a trained U-Net or YOLO segmentation model
- Use EfficientNet or ConvNeXt for damage classification
- Add Grad-CAM for trained CNN predictions
- Store reports in SQLite/PostgreSQL instead of JSON files
- Add user authentication for multi-user conservation teams
- Deploy with Docker + Nginx for institutional use
