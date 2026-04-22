from __future__ import annotations

import base64
import io
import json

import cv2
import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

from backend.pipeline import CulturalHeritagePipeline
from utils.visualization import draw_detections, overlay_mask


app = FastAPI(title="Cultural Heritage Preservation API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pipeline = CulturalHeritagePipeline()


def read_upload_as_rgb(raw: bytes) -> np.ndarray:
    try:
        return np.array(Image.open(io.BytesIO(raw)).convert("RGB"))
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Upload must be a valid image.") from exc


def encode_png_base64(image: np.ndarray) -> str:
    rgb = np.clip(image, 0, 255).astype(np.uint8)
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    ok, buffer = cv2.imencode(".png", bgr)
    if not ok:
        raise HTTPException(status_code=500, detail="Could not encode output image.")
    return "data:image/png;base64," + base64.b64encode(buffer).decode("ascii")


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/api/analyze")
async def analyze(
    file: UploadFile = File(...),
    domain: str = Form("auto"),
) -> dict:
    if domain not in {"auto", "manuscript", "monument"}:
        raise HTTPException(status_code=400, detail="domain must be auto, manuscript, or monument")

    image = read_upload_as_rgb(await file.read())
    result = pipeline.run(image, domain=domain)

    detection = result["detection"]
    detection_overlay = draw_detections(
        overlay_mask(image, detection["mask"], alpha=0.38),
        detection["detections"],
    )
    heatmap_overlay = overlay_mask(image, result["explanation"]["detection"]["heatmap"], alpha=0.48)

    semantic = result["semantic"]
    if "json" in semantic and isinstance(semantic["json"], str):
        try:
            semantic["labels"] = json.loads(semantic["json"])
        except json.JSONDecodeError:
            pass

    return {
        "domain": result["domain"],
        "images": {
            "original": encode_png_base64(image),
            "detectionOverlay": encode_png_base64(detection_overlay),
            "enhanced": encode_png_base64(result["enhancement"]["image"]),
            "heatmap": encode_png_base64(heatmap_overlay),
        },
        "detection": {
            "severity": detection["severity"],
            "detections": detection["detections"],
        },
        "enhancement": {
            "improvement": result["enhancement"]["improvement"],
        },
        "semantic": semantic,
        "risk": result["risk"],
        "explanation": result["explanation"]["risk"],
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
