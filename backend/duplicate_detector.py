from __future__ import annotations
import base64, io
import numpy as np
from PIL import Image


def _avg_hash(img: np.ndarray, size: int = 16) -> int:
    pil = Image.fromarray(img).convert("L").resize((size, size), Image.LANCZOS)
    arr = np.array(pil, dtype=np.float32)
    bits = (arr > arr.mean()).flatten()
    h = 0
    for b in bits:
        h = (h << 1) | int(b)
    return h


def hamming(a: int, b: int) -> int:
    return bin(a ^ b).count("1")


def phash_from_b64(b64: str, size: int = 16) -> int:
    data = base64.b64decode(b64.split(",", 1)[-1])
    img = np.array(Image.open(io.BytesIO(data)).convert("RGB"))
    return _avg_hash(img, size)


def phash_from_array(img: np.ndarray, size: int = 16) -> int:
    return _avg_hash(img, size)


def find_duplicates(new_hash: int, records: list[dict], threshold: int = 10) -> list[dict]:
    """Return records whose thumbnail hash is within `threshold` bits of new_hash."""
    matches = []
    for r in records:
        stored = r.get("phash")
        if stored is None:
            continue
        if hamming(new_hash, stored) <= threshold:
            matches.append({"id": r["id"], "distance": hamming(new_hash, stored)})
    return matches
