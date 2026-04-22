from __future__ import annotations

import cv2
import numpy as np


def normalize_image(image: np.ndarray) -> np.ndarray:
    """Keep image in RGB uint8 format with a predictable contrast range."""
    if image.dtype != np.uint8:
        image = np.clip(image, 0, 255).astype(np.uint8)
    return image


def to_gray(image: np.ndarray) -> np.ndarray:
    return cv2.cvtColor(normalize_image(image), cv2.COLOR_RGB2GRAY)


def estimate_domain(image: np.ndarray) -> str:
    """Simple manuscript/monument guess for demo mode."""
    gray = to_gray(image)
    edges = cv2.Canny(gray, 80, 160)
    edge_density = float(np.mean(edges > 0))
    saturation = float(np.mean(cv2.cvtColor(image, cv2.COLOR_RGB2HSV)[:, :, 1]))

    # Manuscript scans usually have many fine dark strokes and low saturation.
    if edge_density > 0.08 and saturation < 85:
        return "manuscript"
    return "monument"


def apply_clahe_rgb(image: np.ndarray, clip_limit: float = 2.0) -> np.ndarray:
    lab = cv2.cvtColor(normalize_image(image), cv2.COLOR_RGB2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=(8, 8))
    enhanced_l = clahe.apply(l_channel)
    merged = cv2.merge([enhanced_l, a_channel, b_channel])
    return cv2.cvtColor(merged, cv2.COLOR_LAB2RGB)
