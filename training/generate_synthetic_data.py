from __future__ import annotations

import argparse
import random
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from tqdm import tqdm


def make_clean_canvas(size: int = 256, domain: str = "manuscript") -> np.ndarray:
    if domain == "manuscript":
        image = Image.new("RGB", (size, size), (224, 211, 176))
        draw = ImageDraw.Draw(image)
        try:
            font = ImageFont.truetype("arial.ttf", 18)
        except OSError:
            font = ImageFont.load_default()
        for y in range(20, size - 20, 26):
            draw.text((18, y), "ancient text sample", fill=(55, 43, 32), font=font)
        return np.array(image)

    base = np.full((size, size, 3), (135, 130, 118), dtype=np.uint8)
    noise = np.random.normal(0, 14, base.shape).astype(np.int16)
    return np.clip(base.astype(np.int16) + noise, 0, 255).astype(np.uint8)


def add_damage(image: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    damaged = image.copy()
    mask = np.zeros(image.shape[:2], dtype=np.uint8)
    h, w = mask.shape

    for _ in range(random.randint(1, 5)):
        kind = random.choice(["crack", "stain", "fade"])
        if kind == "crack":
            points = []
            x = random.randint(0, w - 1)
            for y in range(random.randint(0, h // 4), h, random.randint(18, 35)):
                x = int(np.clip(x + random.randint(-25, 25), 0, w - 1))
                points.append((x, y))
            cv2.polylines(damaged, [np.array(points)], False, (20, 20, 20), random.randint(1, 3))
            cv2.polylines(mask, [np.array(points)], False, 255, 5)
        elif kind == "stain":
            center = (random.randint(25, w - 25), random.randint(25, h - 25))
            radius = random.randint(14, 46)
            color = (random.randint(85, 145), random.randint(55, 100), random.randint(25, 70))
            cv2.circle(damaged, center, radius, color, -1)
            cv2.circle(mask, center, radius, 255, -1)
        else:
            x1, y1 = random.randint(0, w // 2), random.randint(0, h // 2)
            x2, y2 = min(w, x1 + random.randint(50, 130)), min(h, y1 + random.randint(35, 110))
            damaged[y1:y2, x1:x2] = np.clip(damaged[y1:y2, x1:x2] + random.randint(30, 70), 0, 255)
            mask[y1:y2, x1:x2] = 255

    return damaged, mask


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", default="data/synthetic")
    parser.add_argument("--count", type=int, default=200)
    parser.add_argument("--size", type=int, default=256)
    args = parser.parse_args()

    out = Path(args.out)
    for split in ["images", "masks", "clean"]:
        (out / split).mkdir(parents=True, exist_ok=True)

    for i in tqdm(range(args.count), desc="Generating synthetic heritage damage"):
        domain = random.choice(["manuscript", "monument"])
        clean = make_clean_canvas(args.size, domain)
        damaged, mask = add_damage(clean)
        stem = f"{i:05d}_{domain}"
        Image.fromarray(clean).save(out / "clean" / f"{stem}.png")
        Image.fromarray(damaged).save(out / "images" / f"{stem}.png")
        Image.fromarray(mask).save(out / "masks" / f"{stem}.png")


if __name__ == "__main__":
    main()
