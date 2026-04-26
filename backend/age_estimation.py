from __future__ import annotations

import datetime

import cv2
import numpy as np

from backend.preprocessing import normalize_image, to_gray

_CURRENT_YEAR = datetime.datetime.now().year

# (degradation_threshold, min_age_years, max_age_years, note)
_AGE_TABLE = [
    (85, 1500, 3000, "Extreme degradation consistent with very ancient origin."),
    (70, 1000, 1500, "Severe material breakdown typical of artifacts over a millennium old."),
    (55,  600, 1000, "Significant wear patterns suggesting 600–1000 years of age."),
    (40,  300,  600, "Moderate degradation consistent with 300–600 years of age."),
    (25,  100,  300, "Light wear suggesting 100–300 years of age."),
    (0,    10,  100, "Minimal degradation; likely less than 100 years old."),
]


class AgeEstimationEngine:
    def estimate(self, image: np.ndarray, severity: float) -> dict:
        image = normalize_image(image)
        gray  = to_gray(image)

        texture_score = self._texture_complexity(gray)
        fade_score    = self._fading_index(gray)
        color_score   = self._color_shift(image)

        degradation = round(
            severity * 0.45 + texture_score * 0.25 + fade_score * 0.20 + color_score * 0.10,
            2,
        )
        degradation = float(np.clip(degradation, 0, 100))

        min_age, max_age, note = self._degradation_to_age(degradation)
        confidence = self._confidence(degradation)

        year_min = max(1, _CURRENT_YEAR - max_age)
        year_max = _CURRENT_YEAR - min_age

        return {
            "degradation_index": degradation,
            "estimated_age":     f"~{min_age}–{max_age} years old",
            "year_range":        f"{year_min}–{year_max}",
            "min_age_years":     min_age,
            "max_age_years":     max_age,
            "confidence":        confidence,
            "note":              note,
            "factors": {
                "damage_severity":    round(severity, 2),
                "texture_complexity": round(texture_score, 2),
                "fading_index":       round(fade_score, 2),
                "color_shift":        round(color_score, 2),
            },
        }

    def _texture_complexity(self, gray: np.ndarray) -> float:
        lap = cv2.Laplacian(gray, cv2.CV_64F)
        return float(np.clip(np.std(lap) / 3.0, 0, 100))

    def _fading_index(self, gray: np.ndarray) -> float:
        mean_brightness = float(np.mean(gray))
        contrast = float(np.std(gray))
        fade = max(0.0, (mean_brightness - 100) / 1.55 - contrast / 2.5)
        return float(np.clip(fade, 0, 100))

    def _color_shift(self, image: np.ndarray) -> float:
        hsv = cv2.cvtColor(image, cv2.COLOR_RGB2HSV)
        sat = float(np.mean(hsv[:, :, 1]))
        return float(np.clip(100 - sat, 0, 100))

    def _degradation_to_age(self, score: float) -> tuple[int, int, str]:
        for threshold, min_age, max_age, note in _AGE_TABLE:
            if score >= threshold:
                return min_age, max_age, note
        return _AGE_TABLE[-1][1], _AGE_TABLE[-1][2], _AGE_TABLE[-1][3]

    def _confidence(self, score: float) -> str:
        if score > 70 or score < 15:
            return "High"
        if score > 40:
            return "Medium"
        return "Low"
