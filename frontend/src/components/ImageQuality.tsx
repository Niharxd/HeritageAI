export type QualityResult = {
  ok: boolean;
  warnings: string[];
};

export function checkImageQuality(file: File): Promise<QualityResult> {
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const warnings: string[] = [];
      const { naturalWidth: w, naturalHeight: h } = img;

      if (w < 200 || h < 200)
        warnings.push("Image is very small (under 200×200px). Detection accuracy may be low.");
      if (file.size < 15_000)
        warnings.push("File size is very small. The image may be too compressed for reliable analysis.");

      // Check brightness/blur via canvas
      const canvas = document.createElement("canvas");
      const scale  = Math.min(1, 200 / Math.max(w, h));
      canvas.width  = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

      let sum = 0, sumSq = 0, n = data.length / 4;
      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
        sum   += gray;
        sumSq += gray * gray;
      }
      const mean = sum / n;
      const std  = Math.sqrt(sumSq / n - mean * mean);

      if (mean < 30)
        warnings.push("Image appears very dark. Consider improving lighting before analysis.");
      if (mean > 230)
        warnings.push("Image appears overexposed. Detail may be lost in bright areas.");
      if (std < 15)
        warnings.push("Image has very low contrast. Results may be less accurate.");

      resolve({ ok: warnings.length === 0, warnings });
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve({ ok: true, warnings: [] }); };
    img.src = url;
  });
}

export function QualityWarnings({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) return null;
  return (
    <div className="qualityWarnings">
      {warnings.map(w => (
        <div key={w} className="qualityWarning">
          <span>⚠</span> {w}
        </div>
      ))}
    </div>
  );
}
