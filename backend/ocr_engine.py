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
        gray = to_gray(image)
        gray = cv2.medianBlur(gray, 3)

        # Use OSD-friendly PSM for non-Latin scripts
        lang_code = language if language in SUPPORTED_LANGUAGES.values() else DEFAULT_LANG
        config = "--psm 6"

        try:
            text = pytesseract.image_to_string(gray, lang=lang_code, config=config).strip()
            data = pytesseract.image_to_data(
                gray, lang=lang_code, config=config,
                output_type=pytesseract.Output.DICT
            )
            words = []
            for i, word in enumerate(data.get("text", [])):
                clean = word.strip()
                conf  = float(data["conf"][i]) if str(data["conf"][i]).replace(".", "", 1).isdigit() else -1.0
                if clean and conf > 0:
                    words.append({
                        "word":       clean,
                        "confidence": conf,
                        "bbox": [
                            int(data["left"][i]),
                            int(data["top"][i]),
                            int(data["width"][i]),
                            int(data["height"][i]),
                        ],
                    })
        except pytesseract.TesseractNotFoundError:
            text  = "Tesseract is not installed or not on PATH. Install it to enable OCR."
            words = []
        except Exception as e:
            # Language pack not installed
            text  = (
                f"OCR language pack '{lang_code}' is not installed. "
                f"Run: pip install tesseract and install the '{lang_code}' language data. "
                f"Error: {e}"
            )
            words = []

        return OCRResult(text=text, words=words, language=lang_code).as_dict()

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
