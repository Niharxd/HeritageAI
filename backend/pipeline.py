from __future__ import annotations

import numpy as np

from backend.damage_detection import DamageDetectionEngine
from backend.enhancement import RestorationEnhancementEngine
from backend.explainability import ExplainabilityEngine
from backend.ocr_engine import DigitizationSemanticEngine
from backend.preprocessing import estimate_domain
from backend.risk_prediction import RiskPredictionEngine


class CulturalHeritagePipeline:
    def __init__(self):
        self.detector = DamageDetectionEngine()
        self.enhancer = RestorationEnhancementEngine()
        self.digitizer = DigitizationSemanticEngine()
        self.risk = RiskPredictionEngine()
        self.explainer = ExplainabilityEngine()

    def run(self, image: np.ndarray, domain: str = "auto") -> dict:
        selected_domain = estimate_domain(image) if domain == "auto" else domain
        detection = self.detector.detect(image, domain=selected_domain)
        enhancement = self.enhancer.enhance(image, domain=selected_domain)
        semantic = self.digitizer.extract(
            enhancement["image"],
            domain=selected_domain,
            detections=detection["detections"],
        )
        risk = self.risk.predict(
            severity=detection["severity"],
            restoration_improvement=enhancement["improvement"],
            num_detections=len(detection["detections"]),
            domain=selected_domain,
        )
        detection_explanation = self.explainer.explain_detection(image, detection["mask"])
        risk_explanation = self.explainer.explain_risk(
            detection["severity"],
            enhancement["improvement"],
            len(detection["detections"]),
        )
        return {
            "domain": selected_domain,
            "detection": detection,
            "enhancement": enhancement,
            "semantic": semantic,
            "risk": risk,
            "explanation": {
                "detection": detection_explanation,
                "risk": risk_explanation,
            },
        }
