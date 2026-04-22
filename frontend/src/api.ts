import type { AnalysisResult, Domain } from "./types";

export async function analyzeImage(file: File, domain: Domain): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("domain", domain);

  const response = await fetch("/api/analyze", {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: "Analysis failed" }));
    throw new Error(body.detail ?? "Analysis failed");
  }

  return response.json();
}
