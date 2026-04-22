from __future__ import annotations

import cv2
import numpy as np

from backend.preprocessing import normalize_image, to_gray


DAMAGE_CLASSES = ("crack", "stain", "fading", "erosion")


class DamageDetectionEngine:
    """Damage detector with a reliable local heuristic baseline.

    A trained CNN/segmentation model can be plugged in later, but this baseline
    is intentionally transparent and runnable on a laptop.
    """

    def __init__(self, min_area_ratio: float = 0.0006):
        self.min_area_ratio = min_area_ratio

    def detect(self, image: np.ndarray, domain: str = "auto") -> dict:
        image = normalize_image(image)
        gray = to_gray(image)
        h, w = gray.shape

        crack_mask = self._detect_cracks(gray)
        stain_mask = self._detect_stains(image)
        fading_mask = self._detect_fading(gray)
        erosion_mask = self._detect_erosion(gray)

        masks = {
            "crack": crack_mask,
            "stain": stain_mask,
            "fading": fading_mask,
            "erosion": erosion_mask,
        }
        combined = np.maximum.reduce(list(masks.values()))
        detections = self._masks_to_detections(masks, image_area=h * w)
        severity = self._severity_score(combined, detections)

        return {
            "mask": combined,
            "class_masks": masks,
            "detections": detections,
            "severity": severity,
        }

    def _detect_cracks(self, gray: np.ndarray) -> np.ndarray:
        blackhat_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (17, 17))
        blackhat = cv2.morphologyEx(gray, cv2.MORPH_BLACKHAT, blackhat_kernel)
        edges = cv2.Canny(gray, 45, 130)
        combined = cv2.bitwise_or(blackhat, edges)
        _, mask = cv2.threshold(combined, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        line_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        return cv2.morphologyEx(mask, cv2.MORPH_OPEN, line_kernel)

    def _detect_stains(self, image: np.ndarray) -> np.ndarray:
        hsv = cv2.cvtColor(image, cv2.COLOR_RGB2HSV)
        h, s, v = cv2.split(hsv)
        brownish = ((h > 5) & (h < 35) & (s > 35) & (v < 210)).astype(np.uint8) * 255
        dark_blobs = cv2.inRange(v, 0, 120)
        mask = cv2.bitwise_or(brownish, dark_blobs)
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
        return cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)

    def _detect_fading(self, gray: np.ndarray) -> np.ndarray:
        local_mean = cv2.GaussianBlur(gray, (0, 0), 21)
        low_contrast = (np.abs(gray.astype(np.int16) - local_mean.astype(np.int16)) < 8)
        bright = gray > np.percentile(gray, 58)
        mask = (low_contrast & bright).astype(np.uint8) * 255
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
        return cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)

    def _detect_erosion(self, gray: np.ndarray) -> np.ndarray:
        lap = cv2.Laplacian(gray, cv2.CV_64F)
        texture = cv2.convertScaleAbs(lap)
        _, rough = cv2.threshold(texture, np.percentile(texture, 88), 255, cv2.THRESH_BINARY)
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        return cv2.morphologyEx(rough, cv2.MORPH_CLOSE, kernel)

    def _masks_to_detections(self, masks: dict[str, np.ndarray], image_area: int) -> list[dict]:
        detections: list[dict] = []
        min_area = max(20, int(image_area * self.min_area_ratio))
        for label, mask in masks.items():
            contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            for contour in contours:
                area = cv2.contourArea(contour)
                if area < min_area:
                    continue
                x, y, w, h = cv2.boundingRect(contour)
                severity = min(100.0, 20.0 + (area / image_area) * 1800.0 + max(w, h) / 12.0)
                detections.append(
                    {
                        "label": label,
                        "bbox": [int(x), int(y), int(w), int(h)],
                        "area": float(area),
                        "severity": float(severity),
                    }
                )
        return sorted(detections, key=lambda item: item["severity"], reverse=True)[:30]

    def _severity_score(self, mask: np.ndarray, detections: list[dict]) -> float:
        damaged_ratio = float(np.mean(mask > 0))
        detection_factor = min(35.0, len(detections) * 3.0)
        area_factor = min(55.0, damaged_ratio * 140.0)
        top_factor = max([det["severity"] for det in detections], default=0.0) * 0.10
        return round(min(100.0, area_factor + detection_factor + top_factor), 2)
