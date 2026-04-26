export type Domain = "auto" | "manuscript" | "monument";

export type Detection = {
  label: string;
  bbox: [number, number, number, number] | number[];
  area: number;
  severity: number;
};

export type SemanticResult = {
  text?: string;
  words?: Array<{ word: string; confidence: number; bbox: number[] }>;
  labels?: Record<string, { count: number; max_severity: number; boxes: number[][] }>;
  json?: string;
};

export type AgeResult = {
  degradation_index: number;
  estimated_age: string;
  year_range: string;
  min_age_years: number;
  max_age_years: number;
  confidence: string;
  note: string;
  factors: Record<string, number>;
};

export type Suggestion = {
  technique: string;
  description: string;
  urgency: "High" | "Medium" | "Low";
  specialist: boolean;
};

export type SuggestionsResult = {
  suggestions: Suggestion[];
  priority_note: string;
  specialist_required: boolean;
};

export type AnalysisResult = {
  id: string;
  domain: "manuscript" | "monument";
  images: {
    original: string;
    detectionOverlay: string;
    enhanced: string;
    heatmap: string;
  };
  detection: { severity: number; detections: Detection[] };
  enhancement: { improvement: number };
  semantic: SemanticResult;
  risk: { score: number; level: "LOW" | "MEDIUM" | "HIGH"; reasons: string[] };
  age: AgeResult;
  suggestions: SuggestionsResult;
  explanation: { contributions: Record<string, number>; text: string };
};

export type HistoryRecord = {
  id: string;
  timestamp: string;
  domain: string;
  thumbnail: string;
  severity: number;
  risk: { score: number; level: "LOW" | "MEDIUM" | "HIGH" };
  age: Partial<AgeResult>;
  notes: string;
  alert: boolean;
};

export type TrendPoint = {
  id: string;
  timestamp: string;
  domain: string;
  severity: number;
  risk_score: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
};

export type CompareResult = {
  a: CompareItem;
  b: CompareItem;
  diff: { severity_change: number; risk_score_change: number };
};

export type CompareItem = {
  id: string;
  timestamp: string;
  domain: string;
  severity: number;
  risk: { score: number; level: "LOW" | "MEDIUM" | "HIGH" };
  age: Partial<AgeResult>;
  images: { original: string; detectionOverlay: string; enhanced: string; heatmap: string };
};

export type BatchResultItem = {
  filename: string;
  id: string;
  domain: string;
  severity: number;
  risk: { score: number; level: "LOW" | "MEDIUM" | "HIGH" };
  age: Partial<AgeResult>;
  thumbnail: string;
};

export type BatchResult = {
  results: BatchResultItem[];
  errors: { filename: string; error: string }[];
  total: number;
};

export type ArtifactGroup = {
  id: string;
  name: string;
  record_ids: string[];
};

export type TimelinePoint = {
  id: string;
  timestamp: string;
  severity: number;
  risk_score: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  thumbnail: string;
};

export type Annotation = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  note: string;
  color: string;
};

export type OcrLanguage = {
  name: string;
  code: string;
};

export type GeoResult = {
  place_name: string;
  lat: number;
  lng: number;
};

export type MapPin = {
  id: string;
  lat: number;
  lng: number;
  place_name: string;
  domain: string;
  severity: number;
  risk: { score: number; level: "LOW" | "MEDIUM" | "HIGH" };
  thumbnail: string;
  timestamp: string;
};
