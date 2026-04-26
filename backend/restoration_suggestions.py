from __future__ import annotations


_SUGGESTIONS: dict[str, list[dict]] = {
    "crack": [
        {
            "technique": "Consolidant Injection",
            "description": "Inject low-viscosity consolidants (e.g. Paraloid B-72 in acetone) into cracks to stabilise loose material.",
            "urgency": "High",
            "specialist": True,
        },
        {
            "technique": "Crack Filling",
            "description": "Fill stable cracks with reversible fills (lime mortar for stone, Japanese tissue for manuscripts) to prevent further propagation.",
            "urgency": "Medium",
            "specialist": True,
        },
        {
            "technique": "Environmental Control",
            "description": "Reduce thermal and humidity cycling which causes crack expansion. Target ±5% RH stability.",
            "urgency": "Medium",
            "specialist": False,
        },
    ],
    "stain": [
        {
            "technique": "Dry Cleaning",
            "description": "Use soft erasers or brushes to remove surface deposits before attempting wet cleaning.",
            "urgency": "Low",
            "specialist": False,
        },
        {
            "technique": "Poultice Treatment",
            "description": "Apply absorbent poultice (sepiolite or attapulgite) to draw out soluble salts and staining agents.",
            "urgency": "Medium",
            "specialist": True,
        },
        {
            "technique": "Enzymatic Cleaning",
            "description": "Use enzyme solutions to break down organic stains (mould, biological growth) on manuscripts.",
            "urgency": "Medium",
            "specialist": True,
        },
    ],
    "fading": [
        {
            "technique": "Light Level Reduction",
            "description": "Limit exposure to below 50 lux for manuscripts, 150 lux for monuments. Use UV-filtering glazing.",
            "urgency": "High",
            "specialist": False,
        },
        {
            "technique": "Ink/Pigment Consolidation",
            "description": "Apply dilute consolidant (e.g. methyl cellulose) over faded ink areas to prevent further loss.",
            "urgency": "High",
            "specialist": True,
        },
        {
            "technique": "Digitisation",
            "description": "Create high-resolution multispectral scans to preserve legibility before further fading occurs.",
            "urgency": "Medium",
            "specialist": False,
        },
    ],
    "erosion": [
        {
            "technique": "Surface Consolidation",
            "description": "Apply penetrating consolidant (e.g. ethyl silicate for stone) to bind eroded surface particles.",
            "urgency": "High",
            "specialist": True,
        },
        {
            "technique": "Protective Coating",
            "description": "Apply reversible protective coating to shield surface from wind, rain, and pollutants.",
            "urgency": "Medium",
            "specialist": True,
        },
        {
            "technique": "Shelter Installation",
            "description": "Install protective canopy or enclosure to reduce direct weathering exposure.",
            "urgency": "Medium",
            "specialist": False,
        },
    ],
}

_GENERAL = [
    {
        "technique": "Condition Monitoring",
        "description": "Photograph and document the artifact at regular intervals (every 6–12 months) to track deterioration rate.",
        "urgency": "Low",
        "specialist": False,
    },
    {
        "technique": "Climate Control",
        "description": "Maintain stable temperature (15–18°C) and relative humidity (45–55%) in storage and display areas.",
        "urgency": "Low",
        "specialist": False,
    },
]


class RestorationSuggestionsEngine:
    def suggest(self, detections: list[dict], risk_level: str) -> dict:
        seen_labels = {d["label"] for d in detections}
        suggestions: list[dict] = []

        for label in ("crack", "stain", "fading", "erosion"):
            if label in seen_labels:
                suggestions.extend(_SUGGESTIONS[label])

        suggestions.extend(_GENERAL)

        if risk_level == "HIGH":
            priority_note = "Immediate professional conservation intervention is recommended."
        elif risk_level == "MEDIUM":
            priority_note = "Schedule a conservation assessment within the next 3–6 months."
        else:
            priority_note = "Continue routine monitoring. No urgent intervention required."

        return {
            "suggestions": suggestions,
            "priority_note": priority_note,
            "specialist_required": any(s["specialist"] for s in suggestions if s["urgency"] == "High"),
        }
