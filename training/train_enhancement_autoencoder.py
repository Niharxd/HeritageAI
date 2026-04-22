from __future__ import annotations

import argparse
from pathlib import Path

import torch
from torch import nn
from torch.utils.data import DataLoader, Dataset
from torchvision import transforms
from PIL import Image
from tqdm import tqdm


class PairedRestorationDataset(Dataset):
    """Expects damaged images in images/ and matching clean targets in clean/."""

    def __init__(self, root: str, image_size: int = 256):
        self.root = Path(root)
        self.images = sorted((self.root / "images").glob("*.png"))
        self.transform = transforms.Compose([transforms.Resize((image_size, image_size)), transforms.ToTensor()])

    def __len__(self) -> int:
        return len(self.images)

    def __getitem__(self, index: int):
        damaged_path = self.images[index]
        clean_path = self.root / "clean" / damaged_path.name
        damaged = Image.open(damaged_path).convert("RGB")
        clean = Image.open(clean_path).convert("RGB")
        return self.transform(damaged), self.transform(clean)


class SmallAutoencoder(nn.Module):
    def __init__(self):
        super().__init__()
        self.encoder = nn.Sequential(
            nn.Conv2d(3, 32, 3, padding=1),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2),
            nn.Conv2d(32, 64, 3, padding=1),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2),
        )
        self.decoder = nn.Sequential(
            nn.ConvTranspose2d(64, 32, 2, stride=2),
            nn.ReLU(inplace=True),
            nn.ConvTranspose2d(32, 16, 2, stride=2),
            nn.ReLU(inplace=True),
            nn.Conv2d(16, 3, 3, padding=1),
            nn.Sigmoid(),
        )

    def forward(self, x):
        return self.decoder(self.encoder(x))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", default="data/synthetic")
    parser.add_argument("--epochs", type=int, default=5)
    parser.add_argument("--batch-size", type=int, default=8)
    parser.add_argument("--out", default="models/enhancement_autoencoder.pt")
    args = parser.parse_args()

    dataset = PairedRestorationDataset(args.data)
    if not len(dataset):
        raise SystemExit("No paired images found. Run training/generate_synthetic_data.py first.")

    loader = DataLoader(dataset, batch_size=args.batch_size, shuffle=True)
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = SmallAutoencoder().to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3)
    criterion = nn.L1Loss()

    for epoch in range(args.epochs):
        total = 0.0
        for damaged, clean in tqdm(loader, desc=f"Epoch {epoch + 1}/{args.epochs}"):
            damaged, clean = damaged.to(device), clean.to(device)
            optimizer.zero_grad()
            restored = model(damaged)
            loss = criterion(restored, clean)
            loss.backward()
            optimizer.step()
            total += float(loss.item())
        print(f"epoch={epoch + 1} l1_loss={total / max(1, len(loader)):.4f}")

    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    torch.save(model.state_dict(), args.out)
    print(f"Saved {args.out}")


if __name__ == "__main__":
    main()
