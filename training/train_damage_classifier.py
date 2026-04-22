from __future__ import annotations

import argparse
from pathlib import Path

import torch
from torch import nn
from torch.utils.data import DataLoader, Dataset
from torchvision import models, transforms
from PIL import Image
from tqdm import tqdm


class DamageFolderDataset(Dataset):
    """Expects data/class_name/*.jpg or *.png."""

    def __init__(self, root: str, image_size: int = 224):
        self.root = Path(root)
        self.classes = sorted([p.name for p in self.root.iterdir() if p.is_dir()])
        self.samples = []
        for idx, cls in enumerate(self.classes):
            for path in (self.root / cls).glob("*.*"):
                if path.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}:
                    self.samples.append((path, idx))
        self.transform = transforms.Compose(
            [
                transforms.Resize((image_size, image_size)),
                transforms.ToTensor(),
                transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
            ]
        )

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, index: int):
        path, label = self.samples[index]
        image = Image.open(path).convert("RGB")
        return self.transform(image), label


def build_model(num_classes: int) -> nn.Module:
    weights = models.ResNet18_Weights.DEFAULT
    model = models.resnet18(weights=weights)
    model.fc = nn.Linear(model.fc.in_features, num_classes)
    return model


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", default="data/classification")
    parser.add_argument("--epochs", type=int, default=3)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--out", default="models/damage_resnet18.pt")
    args = parser.parse_args()

    dataset = DamageFolderDataset(args.data)
    if not dataset.samples:
        raise SystemExit("No images found. Put data in data/classification/class_name/image.png")

    loader = DataLoader(dataset, batch_size=args.batch_size, shuffle=True)
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = build_model(len(dataset.classes)).to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-4)
    criterion = nn.CrossEntropyLoss()

    model.train()
    for epoch in range(args.epochs):
        total_loss = 0.0
        for images, labels in tqdm(loader, desc=f"Epoch {epoch + 1}/{args.epochs}"):
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            loss = criterion(model(images), labels)
            loss.backward()
            optimizer.step()
            total_loss += float(loss.item())
        print(f"epoch={epoch + 1} loss={total_loss / max(1, len(loader)):.4f}")

    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    torch.save({"model": model.state_dict(), "classes": dataset.classes}, args.out)
    print(f"Saved {args.out}")


if __name__ == "__main__":
    main()
