from __future__ import annotations

import cv2
import numpy as np


LABEL_COLORS = {
    "crack": (255, 60, 60),
    "stain": (255, 170, 40),
    "fading": (80, 180, 255),
    "erosion": (180, 90, 255),
    "damage": (255, 60, 60),
}


def mask_to_heatmap(mask: np.ndarray) -> np.ndarray:
    mask_u8 = np.clip(mask, 0, 255).astype(np.uint8)
    heat_bgr = cv2.applyColorMap(mask_u8, cv2.COLORMAP_JET)
    return cv2.cvtColor(heat_bgr, cv2.COLOR_BGR2RGB)


def overlay_mask(image: np.ndarray, mask: np.ndarray, alpha: float = 0.45) -> np.ndarray:
    heatmap = mask_to_heatmap(mask)
    return cv2.addWeighted(image, 1 - alpha, heatmap, alpha, 0)


def draw_detections(image: np.ndarray, detections: list[dict]) -> np.ndarray:
    output = image.copy()
    for det in detections:
        x, y, w, h = det["bbox"]
        label = det.get("label", "damage")
        severity = det.get("severity", 0)
        color = LABEL_COLORS.get(label, LABEL_COLORS["damage"])
        cv2.rectangle(output, (x, y), (x + w, y + h), color, 2)
        text = f"{label} {severity:.0f}"
        cv2.putText(output, text, (x, max(18, y - 6)), cv2.FONT_HERSHEY_SIMPLEX, 0.55, color, 2)
    return output
