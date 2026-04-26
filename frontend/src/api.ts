import type {
  AnalysisResult, ArtifactGroup, BatchResult, CompareResult,
  Domain, GeoResult, HistoryRecord, MapPin, OcrLanguage,
  TimelinePoint, TrendPoint
} from "./types";

const BASE = "/api";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(body.detail ?? "Request failed");
  }
  return res.json();
}

export async function analyzeImage(file: File, domain: Domain, language = "eng"): Promise<AnalysisResult> {
  const form = new FormData();
  form.append("file", file);
  form.append("domain", domain);
  form.append("language", language);
  return handleResponse(await fetch(`${BASE}/analyze`, { method: "POST", body: form }));
}

export async function analyzeBatch(files: File[], domain: Domain, language = "eng"): Promise<BatchResult> {
  const form = new FormData();
  files.forEach(f => form.append("files", f));
  form.append("domain", domain);
  form.append("language", language);
  return handleResponse(await fetch(`${BASE}/analyze/batch`, { method: "POST", body: form }));
}

export async function getLanguages(): Promise<OcrLanguage[]> {
  return handleResponse(await fetch(`${BASE}/languages`));
}

export async function geocode(place: string): Promise<{ results: GeoResult[] }> {
  return handleResponse(await fetch(`${BASE}/geocode?place=${encodeURIComponent(place)}`));
}

export async function setLocation(id: string, loc: GeoResult): Promise<void> {
  await fetch(`${BASE}/location/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(loc),
  });
}

export async function getMapPins(): Promise<MapPin[]> {
  return handleResponse(await fetch(`${BASE}/map/pins`));
}

export async function getHistory(): Promise<HistoryRecord[]> {
  return handleResponse(await fetch(`${BASE}/history`));
}

export async function getRecord(id: string): Promise<{ full: AnalysisResult }> {
  return handleResponse(await fetch(`${BASE}/history/${id}`));
}

export async function deleteRecord(id: string): Promise<void> {
  await fetch(`${BASE}/history/${id}`, { method: "DELETE" });
}

export async function getTrend(): Promise<TrendPoint[]> {
  return handleResponse(await fetch(`${BASE}/history/trend`));
}

export async function saveNotes(id: string, notes: string): Promise<void> {
  await fetch(`${BASE}/notes/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notes }),
  });
}

export async function compareRecords(idA: string, idB: string): Promise<CompareResult> {
  return handleResponse(await fetch(`${BASE}/compare/${idA}/${idB}`));
}

export async function getGroups(): Promise<ArtifactGroup[]> {
  return handleResponse(await fetch(`${BASE}/groups`));
}

export async function createGroup(name: string): Promise<ArtifactGroup> {
  return handleResponse(await fetch(`${BASE}/groups`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  }));
}

export async function deleteGroup(id: string): Promise<void> {
  await fetch(`${BASE}/groups/${id}`, { method: "DELETE" });
}

export async function addToGroup(groupId: string, recordId: string): Promise<void> {
  await fetch(`${BASE}/groups/${groupId}/add/${recordId}`, { method: "POST" });
}

export async function removeFromGroup(groupId: string, recordId: string): Promise<void> {
  await fetch(`${BASE}/groups/${groupId}/remove/${recordId}`, { method: "DELETE" });
}

export async function getGroupTimeline(groupId: string): Promise<TimelinePoint[]> {
  return handleResponse(await fetch(`${BASE}/groups/${groupId}/timeline`));
}

export async function getSettings(): Promise<{ alert_threshold: number }> {
  return handleResponse(await fetch(`${BASE}/settings`));
}

export async function updateSettings(settings: { alert_threshold: number }): Promise<void> {
  await fetch(`${BASE}/settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
}

export function getPdfUrl(id: string): string {
  return `${BASE}/report/${id}`;
}
