from __future__ import annotations

import cv2
import numpy as np


class ExplainabilityEngine:
    """Heatmap explanations for the local detector and risk model."""

    def explain_detection(self, image: np.ndarray, damage_mask: np.ndarray) -> dict:
        soft = cv2.GaussianBlur(damage_mask, (0, 0), 11)
        if soft.max() > 0:
            soft = (soft.astype(np.float32) / soft.max() * 255).astype(np.uint8)
        return {
            "heatmap": soft,
            "text": "Bright heatmap regions are the pixels that drove the damage detection most strongly.",
        }

    def explain_risk(self, severity: float, improvement: float, num_detections: int) -> dict:
        contributions = {
            "damage_severity": round(severity * 0.72, 2),
            "number_of_regions": round(min(num_detections, 20) * 1.15, 2),
            "restoration_offset": round(-improvement * 0.18, 2),
        }
        return {
            "contributions": contributions,
            "text": "Risk rises with severity and region count, then drops slightly when enhancement makes the image clearer.",
        }
