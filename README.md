<<<<<<< HEAD
# HeritageAI
It
=======
# AI-Based Cultural Heritage Preservation System

This is a local, beginner-friendly conservation assistant for manuscript and monument images.
It follows the full pipeline:

Observe -> Detect -> Enhance -> Interpret -> Predict -> Explain

The app now uses a React frontend and a FastAPI Python backend. The first version works immediately with OpenCV-based detection and enhancement. Training scripts are included so you can later replace the baseline with CNN, ResNet, or autoencoder models.

## Project Structure

```text
History/
  backend/
    damage_detection.py          # crack/stain/fading/erosion detection
    enhancement.py               # non-hallucinating restoration support
    explainability.py            # heatmap and risk explanation
    ocr_engine.py                # Tesseract OCR and structured labels
    pipeline.py                  # connects all engines
    preprocessing.py
  frontend/
    src/
      App.tsx                    # React dashboard
      api.ts                     # API client
      styles.css                 # application styling
    package.json
    vite.config.ts
  training/
    generate_synthetic_data.py
    train_damage_classifier.py   # ResNet18 transfer-learning starter
    train_enhancement_autoencoder.py
  utils/
    image_io.py
    visualization.py
  data/
    raw/
    processed/
    synthetic/
  models/
  outputs/
  app.py                         # FastAPI backend
  requirements.txt
```

## Setup

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

For manuscript OCR, install the free Tesseract desktop program and make sure `tesseract.exe` is on PATH.
The app still runs without it, but OCR will show an installation message.

Install Node.js from https://nodejs.org/ if `node --version` does not work.

Then install the React dependencies:

```bash
cd frontend
npm install
```

## Run The App

Terminal 1, start the backend:

```bash
python -m uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

Terminal 2, start the React frontend:

```bash
cd frontend
npm run dev
```

Open `http://127.0.0.1:5173`, then upload a manuscript or monument image. You will see:

On Windows, you can also double-click these files from the project folder:

```text
start_backend.bat
start_frontend.bat
```

Keep both command windows open while using the website.

- original image
- damage detection overlay
- enhanced/restored output
- OCR text for manuscripts
- structured damage labels for monuments
- risk score and level
- heatmap explanation
- downloadable JSON report

## Step-By-Step Build Plan

1. Build the local baseline first.
   The OpenCV detector gives visible masks and boxes immediately, which makes the product testable before expensive model training.

2. Add enhancement next.
   Conservation work needs visibility improvement, but this project avoids hallucinating missing content. The baseline uses denoising, adaptive thresholding, CLAHE, and sharpening.

3. Add interpretation.
   Manuscripts go to OCR. Monuments become structured damage labels with counts, boxes, and severity.

4. Add risk prediction.
   A small interpretable regression-style formula turns severity, number of damaged regions, and restoration improvement into LOW, MEDIUM, or HIGH risk.

5. Add explainability.
   The heatmap comes from the damage mask. The risk explanation exposes the exact score contributions.

6. Train better models only after the pipeline works.
   Replace the detector with ResNet/EfficientNet for classification or U-Net/Mask R-CNN for segmentation when you have labeled data.

## Dataset Strategy

Good sources to start from:

- DIBCO / H-DIBCO historical document binarization datasets for degraded manuscript-style documents: https://paperswithcode.com/dataset/dibco-and-h-dibco
- Historical-crack18-19 for historical building surface cracks: https://pmc.ncbi.nlm.nih.gov/articles/PMC8818920/
- CODEBRIM for concrete defect classes such as crack, corrosion stain, exposed bar, efflorescence, and spallation: https://datasetninja.com/codebrim
- Roboflow crack segmentation datasets for quick object-detection/segmentation experiments: https://universe.roboflow.com/shm-v25ds/crack-detection-7lgyo
- Recent large structural damage collections such as StructDamage can be useful for classification research: https://arxiv.org/abs/2603.10484

If you do not have labeled data yet, simulate it:

```bash
python training/generate_synthetic_data.py --count 500
```

This creates paired clean/damaged images and masks under `data/synthetic/`.

Useful augmentation ideas:

- cracks: random polylines, dark thin strokes, branching strokes
- fading: low-contrast washed-out patches
- stains: brown/yellow transparent blobs
- erosion: local blur, noise, rough texture
- imaging variation: rotation, crop, brightness, blur, perspective distortion

## Train Basic Models

Generate synthetic paired restoration data:

```bash
python training/generate_synthetic_data.py --count 500
python training/train_enhancement_autoencoder.py --data data/synthetic --epochs 5
```

Train a ResNet18 damage classifier with folder labels:

```text
data/classification/
  crack/
  stain/
  fading/
  erosion/
  clean/
```

```bash
python training/train_damage_classifier.py --data data/classification --epochs 3
```

## How The Logic Works

Think of the system as a careful assistant, not a magic restorer.

It first looks for visual symptoms: dark thin crack-like lines, brown stain-like blobs, low-contrast faded areas, and rough eroded texture. It turns those regions into masks and boxes, then computes a severity score from how much of the image is affected and how strong the detections are.

Enhancement makes the image easier to inspect. For manuscripts, it cleans noise and improves text contrast. For monuments, it improves surface texture and contrast. It does not invent missing letters or rebuild broken carvings.

The risk score is intentionally simple: more severe damage and more damaged regions raise risk; better restoration visibility lowers uncertainty a little.

## Production Improvements

- Replace heuristic masks with a trained U-Net or YOLO segmentation model.
- Use EfficientNet or ConvNeXt for damage classification.
- Add Grad-CAM for trained CNN predictions.
- Add human review tools so conservators can correct masks.
- Store reports in SQLite/PostgreSQL.
- Track the same artifact over time and train a real time-series risk model.
>>>>>>> 565ed99 (Initial commit)
