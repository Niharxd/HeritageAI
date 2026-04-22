from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np
from PIL import Image


def load_rgb_image(path_or_file) -> np.ndarray:
    """Load an image from a path or uploaded file as RGB uint8."""
    image = Image.open(path_or_file).convert("RGB")
    return np.array(image)


def save_rgb_image(image: np.ndarray, path: str | Path) -> None:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    bgr = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
    cv2.imwrite(str(path), bgr)


def resize_for_display(image: np.ndarray, max_side: int = 1100) -> np.ndarray:
    h, w = image.shape[:2]
    scale = min(1.0, max_side / max(h, w))
    if scale == 1.0:
        return image
    return cv2.resize(image, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
