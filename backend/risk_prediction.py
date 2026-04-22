from __future__ import annotations

from dataclasses import dataclass


@dataclass
class RiskResult:
    score: float
    level: str
    reasons: list[str]

    def as_dict(self) -> dict:
        return {"score": self.score, "level": self.level, "reasons": self.reasons}


class RiskPredictionEngine:
    """Small interpretable regression-style risk model."""

    def predict(
        self,
        severity: float,
        restoration_improvement: float,
        num_detections: int,
        domain: str,
    ) -> dict:
        domain_weight = 1.05 if domain == "monument" else 1.0
        raw = (
            severity * 0.72
            + min(num_detections, 20) * 1.15
            - restoration_improvement * 0.18
        ) * domain_weight
        score = round(float(max(0, min(100, raw))), 2)

        if score < 35:
            level = "LOW"
        elif score < 70:
            level = "MEDIUM"
        else:
            level = "HIGH"

        reasons = [
            f"Detected damage severity contributed {severity:.1f}/100.",
            f"{num_detections} visible damaged region(s) were counted.",
            f"Enhancement improved visibility by {restoration_improvement:.1f}%, reducing uncertainty slightly.",
        ]
        return RiskResult(score=score, level=level, reasons=reasons).as_dict()
