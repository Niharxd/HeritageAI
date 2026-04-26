from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np

from backend.preprocessing import normalize_image, to_gray

MODEL_PATH = Path(__file__).parent.parent / "models" / "material_resnet18.pt"
CONFIDENCE_THRESH = 0.70
STONE_BOOST       = 0.12
MATERIAL_CLASSES  = ["ceramic", "metal", "stone", "wood"]


# ── CNN-based prediction (used when model exists) ─────────────────────────────

def _load_model():
    try:
        import torch
        from torchvision import models
        from torch import nn
        checkpoint = torch.load(str(MODEL_PATH), map_location="cpu", weights_only=True)
        classes    = checkpoint.get("classes", MATERIAL_CLASSES)
        m = models.resnet18(weights=None)
        m.fc = nn.Linear(m.fc.in_features, len(classes))
        m.load_state_dict(checkpoint["model"])
        m.eval()
        return m, classes
    except Exception:
        return None, MATERIAL_CLASSES


_model, _classes = (None, MATERIAL_CLASSES)
if MODEL_PATH.exists():
    _model, _classes = _load_model()


def _is_monument_like(image: np.ndarray) -> bool:
    """Point 6: large uniform grey/brown lower half → likely a monument."""
    h, w = image.shape[:2]
    bottom = image[h // 2:, :, :]
    sat  = float(np.std(bottom, axis=2).mean())
    edge = float(np.abs(np.diff(bottom.mean(axis=2), axis=0)).mean())
    return sat < 35 and edge > 3


def _predict_with_model(image: np.ndarray) -> dict | None:
    if _model is None:
        return None
    try:
        import torch
        import torch.nn.functional as F
        from torchvision import transforms
        from PIL import Image as PILImage

        tf = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ])
        pil = PILImage.fromarray(image)
        tensor = tf(pil).unsqueeze(0)

        with torch.no_grad():
            probs = F.softmax(_model(tensor), dim=1).squeeze().tolist()

        prob_dict = {cls: round(p, 4) for cls, p in zip(_classes, probs)}

        # Point 6: monument context boost
        if "stone" in prob_dict and _is_monument_like(image):
            prob_dict["stone"] = min(1.0, prob_dict["stone"] + STONE_BOOST)
            total = sum(prob_dict.values())
            prob_dict = {k: round(v / total, 4) for k, v in prob_dict.items()}

        sorted_probs = sorted(prob_dict.items(), key=lambda x: x[1], reverse=True)
        top_label, top_conf = sorted_probs[0]

        # Point 7: debug output
        print(f"[material] predicted={top_label} conf={top_conf:.1%} "
              f"top2={sorted_probs[0][0]}={sorted_probs[0][1]:.1%},"
              f"{sorted_probs[1][0]}={sorted_probs[1][1]:.1%}")

        # Point 5: confidence filter
        label = top_label if top_conf >= CONFIDENCE_THRESH else "uncertain"

        return {
            "material":     label,
            "probabilities": {k: round(v * 100, 1) for k, v in prob_dict.items()},
            "confidence":   "High" if top_conf > 0.85 else "Medium" if top_conf > CONFIDENCE_THRESH else "Low",
            "top_score":    round(top_conf * 100, 1),
            "source":       "cnn_model",
        }
    except Exception as e:
        print(f"[material] model inference failed: {e}")
        return None


# ── Heuristic fallback ────────────────────────────────────────────────────────

class MaterialDetectionEngine:
    def detect(self, image: np.ndarray, domain: str) -> dict:
        image = normalize_image(image)

        # Try CNN model first
        cnn = _predict_with_model(image)
        if cnn is not None:
            material = cnn["material"]
            return {
                "material":          material,
                "probabilities":     cnn["probabilities"],
                "confidence":        cnn["confidence"],
                "top_score":         cnn["top_score"],
                "description":       self._describe(material),
                "conservation_note": self._conservation_note(material),
                "disclaimer": (
                    "Material identified using a trained CNN classifier. "
                    "Spectroscopic or physical analysis is recommended for confirmation."
                    if material != "uncertain" else
                    "Model confidence too low to make a reliable prediction. "
                    "Please provide a clearer image or use physical analysis."
                ),
                "source": "cnn_model",
            }

        # Heuristic fallback
        gray = to_gray(image)
        hsv  = cv2.cvtColor(image, cv2.COLOR_RGB2HSV)

        scores = {
            "parchment": self._score_parchment(image, hsv, gray),
            "stone":     self._score_stone(image, hsv, gray),
            "wood":      self._score_wood(hsv, gray),
            "metal":     self._score_metal(image, hsv, gray),
            "papyrus":   self._score_papyrus(hsv, gray),
            "ceramic":   self._score_ceramic(image, hsv, gray),
        }

        if domain == "manuscript":
            scores["stone"]     *= 0.2
            scores["metal"]     *= 0.2
            scores["parchment"] *= 1.5
            scores["papyrus"]   *= 1.4
        else:
            scores["parchment"] *= 0.2
            scores["papyrus"]   *= 0.25
            scores["stone"]     *= 1.5
            scores["ceramic"]   *= 1.2

        # Point 6: monument context boost for heuristics too
        if _is_monument_like(image) and domain != "manuscript":
            scores["stone"] = scores.get("stone", 0) * (1 + STONE_BOOST)

        total = sum(scores.values()) or 1.0
        probabilities = {k: round(v / total * 100, 1) for k, v in scores.items()}
        material = max(probabilities, key=lambda k: probabilities[k])
        top_score = probabilities[material]

        sorted_scores = sorted(probabilities.values(), reverse=True)
        margin = sorted_scores[0] - sorted_scores[1]
        confidence = "Medium" if margin > 20 else "Low"

        return {
            "material":          material,
            "probabilities":     probabilities,
            "confidence":        confidence,
            "top_score":         top_score,
            "description":       self._describe(material),
            "conservation_note": self._conservation_note(material),
            "disclaimer": (
                "No trained model found. Material estimated from colour and texture heuristics only — "
                "results may be inaccurate. Train the model with: "
                "python training/train_material_classifier.py --data data/material"
            ),
            "source": "heuristic",
        }

    def _score_parchment(self, img, hsv, gray) -> float:
        h, s, v = hsv[:, :, 0], hsv[:, :, 1], hsv[:, :, 2]
        warm_cream = float(np.mean((h < 30) & (s < 70) & (v > 160)))
        smoothness = 1.0 / (1.0 + float(np.std(gray)) / 25.0)
        lap = cv2.Laplacian(gray, cv2.CV_64F)
        fine_grain = float(np.clip(1.0 - abs(np.std(lap) - 15) / 30.0, 0, 1))
        return warm_cream * 50 + smoothness * 30 + fine_grain * 20

    def _score_stone(self, img, hsv, gray) -> float:
        s, v = hsv[:, :, 1], hsv[:, :, 2]
        low_sat    = float(np.mean(s < 45))
        mid_bright = float(np.mean((v > 60) & (v < 210)))
        lap = cv2.Laplacian(gray, cv2.CV_64F)
        roughness  = float(np.clip(np.std(lap) / 8.0, 0, 1))
        sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        directionality = float(np.clip(abs(np.std(sobelx) - np.std(sobely)) / 20.0, 0, 1))
        return low_sat * 35 + mid_bright * 20 + roughness * 30 + directionality * 15

    def _score_wood(self, hsv, gray) -> float:
        h, s, v = hsv[:, :, 0], hsv[:, :, 1], hsv[:, :, 2]
        warm_brown = float(np.mean((h > 5) & (h < 28) & (s > 35) & (s < 180) & (v < 210)))
        sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        grain  = float(np.clip(np.std(sobelx) / (np.std(sobely) + 1e-5), 0, 3)) / 3.0
        return warm_brown * 65 + grain * 35

    def _score_metal(self, img, hsv, gray) -> float:
        s, v = hsv[:, :, 1], hsv[:, :, 2]
        low_sat   = float(np.mean(s < 25))
        extreme_v = float(np.mean((v > 190) | (v < 50)))
        local_std = float(np.std(
            cv2.GaussianBlur(gray, (0, 0), 3).astype(np.float32) - gray.astype(np.float32)))
        specular  = float(np.clip(local_std / 15.0, 0, 1))
        return low_sat * 40 + extreme_v * 35 + specular * 25

    def _score_papyrus(self, hsv, gray) -> float:
        h, s, v = hsv[:, :, 0], hsv[:, :, 1], hsv[:, :, 2]
        yellow_brown = float(np.mean((h > 15) & (h < 42) & (s > 25) & (s < 160) & (v > 90)))
        sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        fibrous = float(np.clip(np.std(sobely) / (np.std(sobelx) + 1e-5), 0, 3)) / 3.0
        return yellow_brown * 70 + fibrous * 30

    def _score_ceramic(self, img, hsv, gray) -> float:
        s = hsv[:, :, 1]
        smoothness    = 1.0 / (1.0 + float(np.std(gray)) / 18.0)
        color_variety = float(np.clip(np.std(s) / 45.0, 0, 1))
        mid_sat       = float(np.mean((s > 20) & (s < 160)))
        return smoothness * 40 + color_variety * 35 + mid_sat * 25

    def _describe(self, material: str) -> str:
        return {
            "parchment": "Animal skin prepared for writing; common in medieval manuscripts.",
            "stone":     "Mineral-based surface; typical of monuments, inscriptions, and carvings.",
            "wood":      "Organic cellulose material; used in panels, tablets, and architectural elements.",
            "metal":     "Metallic substrate; found in coins, plaques, and decorative artifacts.",
            "papyrus":   "Reed-based writing surface; characteristic of ancient Egyptian documents.",
            "ceramic":   "Fired clay material; common in pottery, tiles, and inscribed tablets.",
            "uncertain": "Confidence too low to identify material reliably.",
        }.get(material, "Unknown material.")

    def _conservation_note(self, material: str) -> str:
        return {
            "parchment": "Store at 45–55% RH, 13–18°C. Avoid rapid humidity changes.",
            "stone":     "Clean with soft brushes only. Avoid acidic solutions. Monitor for salt efflorescence.",
            "wood":      "Maintain stable humidity. Watch for insect activity and fungal growth.",
            "metal":     "Keep dry to prevent oxidation. Use microcrystalline wax for surface protection.",
            "papyrus":   "Store flat in acid-free enclosures. Avoid light exposure above 50 lux.",
            "ceramic":   "Handle with cotton gloves. Avoid thermal shock. Store padded.",
            "uncertain": "Cannot provide specific conservation advice without confirmed material identification.",
        }.get(material, "Follow standard conservation protocols.")
