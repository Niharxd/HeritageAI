from __future__ import annotations

import cv2
import numpy as np

from backend.preprocessing import apply_clahe_rgb, normalize_image, to_gray


class RestorationEnhancementEngine:
    """Non-hallucinating restoration support.

    The engine improves visibility with denoising and contrast correction. It
    does not generate missing text, carvings, or surface geometry.
    """

    def enhance(self, image: np.ndarray, domain: str = "manuscript") -> dict:
        image = normalize_image(image)
        if domain == "manuscript":
            enhanced = self._enhance_manuscript(image)
        else:
            enhanced = self._enhance_monument(image)
        improvement = self._contrast_improvement(image, enhanced)
        return {"image": enhanced, "improvement": improvement}

    def _enhance_manuscript(self, image: np.ndarray) -> np.ndarray:
        denoised = cv2.fastNlMeansDenoisingColored(image, None, 7, 7, 7, 21)
        gray = to_gray(denoised)
        binary = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 11
        )
        sharpened = cv2.cvtColor(binary, cv2.COLOR_GRAY2RGB)
        return cv2.addWeighted(denoised, 0.45, sharpened, 0.55, 0)

    def _enhance_monument(self, image: np.ndarray) -> np.ndarray:
        denoised = cv2.bilateralFilter(image, d=7, sigmaColor=55, sigmaSpace=55)
        contrast = apply_clahe_rgb(denoised, clip_limit=2.3)
        blur = cv2.GaussianBlur(contrast, (0, 0), 1.2)
        return cv2.addWeighted(contrast, 1.35, blur, -0.35, 0)

    def _contrast_improvement(self, original: np.ndarray, enhanced: np.ndarray) -> float:
        before = float(np.std(to_gray(original)))
        after = float(np.std(to_gray(enhanced)))
        if before < 1:
            return 0.0
        return round(float(np.clip(((after - before) / before) * 100, 0, 100)), 2)
