from __future__ import annotations

import json
from dataclasses import dataclass

import cv2
import numpy as np
import pytesseract

from backend.preprocessing import to_gray

# Curated heritage-relevant languages
# key = display name, value = tesseract lang code
SUPPORTED_LANGUAGES: dict[str, str] = {
    "English":            "eng",
    "Hindi":              "hin",
    "Sanskrit":           "san",
    "Tamil":              "tam",
    "Telugu":             "tel",
    "Arabic":             "ara",
    "Persian":            "fas",
    "Greek":              "ell",
    "Latin":              "lat",
    "Chinese Simplified": "chi_sim",
    "Japanese":           "jpn",
}

DEFAULT_LANG = "eng"


@dataclass
class OCRResult:
    text: str
    words: list[dict]
    language: str

    def as_dict(self) -> dict:
        return {"text": self.text, "words": self.words, "language": self.language}


class DigitizationSemanticEngine:
    def extract(
        self,
        image: np.ndarray,
        domain: str,
        detections: list[dict],
        language: str = DEFAULT_LANG,
    ) -> dict:
        if domain == "manuscript":
            return self._extract_text(image, language)
        return self._structure_monument_damage(detections)

    def _extract_text(self, image: np.ndarray, language: str = DEFAULT_LANG) -> dict:
        return OCRResult(text="OCR available in local version only.", words=[], language=language).as_dict()

    def _structure_monument_damage(self, detections: list[dict]) -> dict:
        summary: dict[str, dict] = {}
        for det in detections:
            label = det["label"]
            if label not in summary:
                summary[label] = {"count": 0, "max_severity": 0.0, "boxes": []}
            summary[label]["count"] += 1
            summary[label]["max_severity"] = max(summary[label]["max_severity"], det["severity"])
            summary[label]["boxes"].append(det["bbox"])
        return {"labels": summary, "json": json.dumps(summary, indent=2)}
