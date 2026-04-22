export type Domain = "auto" | "manuscript" | "monument";

export type Detection = {
  label: string;
  bbox: [number, number, number, number] | number[];
  area: number;
  severity: number;
};

export type SemanticResult = {
  text?: string;
  words?: Array<{
    word: string;
    confidence: number;
    bbox: number[];
  }>;
  labels?: Record<string, {
    count: number;
    max_severity: number;
    boxes: number[][];
  }>;
  json?: string;
};

export type AnalysisResult = {
  domain: "manuscript" | "monument";
  images: {
    original: string;
    detectionOverlay: string;
    enhanced: string;
    heatmap: string;
  };
  detection: {
    severity: number;
    detections: Detection[];
  };
  enhancement: {
    improvement: number;
  };
  semantic: SemanticResult;
  risk: {
    score: number;
    level: "LOW" | "MEDIUM" | "HIGH";
    reasons: string[];
  };
  explanation: {
    contributions: Record<string, number>;
    text: string;
  };
};
