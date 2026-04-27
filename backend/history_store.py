from __future__ import annotations

import json
import uuid
from datetime import datetime
from pathlib import Path

HISTORY_FILE   = Path(__file__).parent.parent / "outputs" / "history.json"
GROUPS_FILE    = Path(__file__).parent.parent / "outputs" / "groups.json"
SETTINGS_FILE  = Path(__file__).parent.parent / "outputs" / "settings.json"
CHECKLIST_FILE = Path(__file__).parent.parent / "outputs" / "checklists.json"


def _load() -> list[dict]:
    if not HISTORY_FILE.exists():
        return []
    try:
        return json.loads(HISTORY_FILE.read_text(encoding="utf-8"))
    except Exception:
        return []


def _save(records: list[dict]) -> None:
    HISTORY_FILE.parent.mkdir(parents=True, exist_ok=True)
    HISTORY_FILE.write_text(json.dumps(records, indent=2), encoding="utf-8")


def _load_groups() -> list[dict]:
    if not GROUPS_FILE.exists():
        return []
    try:
        return json.loads(GROUPS_FILE.read_text(encoding="utf-8"))
    except Exception:
        return []


def _save_groups(groups: list[dict]) -> None:
    GROUPS_FILE.parent.mkdir(parents=True, exist_ok=True)
    GROUPS_FILE.write_text(json.dumps(groups, indent=2), encoding="utf-8")


def _load_settings() -> dict:
    if not SETTINGS_FILE.exists():
        return {"alert_threshold": 70}
    try:
        return json.loads(SETTINGS_FILE.read_text(encoding="utf-8"))
    except Exception:
        return {"alert_threshold": 70}


def _save_settings(settings: dict) -> None:
    SETTINGS_FILE.parent.mkdir(parents=True, exist_ok=True)
    SETTINGS_FILE.write_text(json.dumps(settings, indent=2), encoding="utf-8")


# ── Records ───────────────────────────────────────────────────────────────────

def _load_checklists() -> dict:
    if not CHECKLIST_FILE.exists():
        return {}
    try:
        return json.loads(CHECKLIST_FILE.read_text(encoding="utf-8"))
    except Exception:
        return {}


def _save_checklists(data: dict) -> None:
    CHECKLIST_FILE.parent.mkdir(parents=True, exist_ok=True)
    CHECKLIST_FILE.write_text(json.dumps(data, indent=2), encoding="utf-8")


def save_record(result: dict, thumbnail_b64: str, location: dict | None = None, phash: int | None = None) -> str:
    records = _load()
    record_id = str(uuid.uuid4())
    records.append({
        "id":        record_id,
        "timestamp": datetime.utcnow().isoformat(),
        "domain":    result.get("domain", "unknown"),
        "thumbnail": thumbnail_b64,
        "severity":  result.get("detection", {}).get("severity", 0),
        "risk":      result.get("risk", {}),
        "age":       result.get("age", {}),
        "notes":     "",
        "location":  location,
        "phash":     phash,
        "full":      result,
    })
    _save(records)
    return record_id


def get_all(
    search: str = "",
    risk_level: str = "",
    domain: str = "",
    date_from: str = "",
    date_to: str = "",
) -> list[dict]:
    records   = _load()
    threshold = _load_settings().get("alert_threshold", 70)
    result = []
    for r in records:
        if search and search.lower() not in (r.get("notes", "") + r.get("domain", "")).lower():
            loc_name = (r.get("location") or {}).get("place_name", "")
            if search.lower() not in loc_name.lower():
                continue
        if risk_level and r.get("risk", {}).get("level", "") != risk_level:
            continue
        if domain and r.get("domain", "") != domain:
            continue
        if date_from and r["timestamp"] < date_from:
            continue
        if date_to and r["timestamp"] > date_to + "T23:59:59":
            continue
        result.append({
            "id":        r["id"],
            "timestamp": r["timestamp"],
            "domain":    r["domain"],
            "thumbnail": r["thumbnail"],
            "severity":  r["severity"],
            "risk":      r["risk"],
            "age":       r.get("age", {}),
            "notes":     r.get("notes", ""),
            "location":  r.get("location"),
            "alert":     r.get("risk", {}).get("score", 0) >= threshold,
        })
    return result


def get_record(record_id: str) -> dict | None:
    for r in _load():
        if r["id"] == record_id:
            return r
    return None


def get_trend(limit: int = 20) -> list[dict]:
    records = _load()[-limit:]
    return [
        {
            "id":         r["id"],
            "timestamp":  r["timestamp"],
            "domain":     r["domain"],
            "severity":   r["severity"],
            "risk_score": r.get("risk", {}).get("score", 0),
            "risk_level": r.get("risk", {}).get("level", "LOW"),
        }
        for r in records
    ]


def delete_record(record_id: str) -> bool:
    records = _load()
    new_records = [r for r in records if r["id"] != record_id]
    if len(new_records) == len(records):
        return False
    _save(new_records)
    return True


# ── Notes ─────────────────────────────────────────────────────────────────────

def update_notes(record_id: str, notes: str) -> bool:
    records = _load()
    for r in records:
        if r["id"] == record_id:
            r["notes"] = notes
            _save(records)
            return True
    return False


def update_location(record_id: str, location: dict) -> bool:
    records = _load()
    for r in records:
        if r["id"] == record_id:
            r["location"] = location
            _save(records)
            return True
    return False


def get_map_pins() -> list[dict]:
    records = _load()
    pins = []
    for r in records:
        loc = r.get("location")
        if loc and loc.get("lat") and loc.get("lng"):
            pins.append({
                "id":          r["id"],
                "lat":         loc["lat"],
                "lng":         loc["lng"],
                "place_name":  loc.get("place_name", ""),
                "domain":      r["domain"],
                "severity":    r["severity"],
                "risk":        r.get("risk", {}),
                "thumbnail":   r["thumbnail"],
                "timestamp":   r["timestamp"],
            })
    return pins


# ── Artifact Groups ───────────────────────────────────────────────────────────

def get_groups() -> list[dict]:
    return _load_groups()


def create_group(name: str) -> dict:
    groups = _load_groups()
    group = {"id": str(uuid.uuid4()), "name": name, "record_ids": []}
    groups.append(group)
    _save_groups(groups)
    return group


def add_to_group(group_id: str, record_id: str) -> bool:
    groups = _load_groups()
    for g in groups:
        if g["id"] == group_id:
            if record_id not in g["record_ids"]:
                g["record_ids"].append(record_id)
            _save_groups(groups)
            return True
    return False


def remove_from_group(group_id: str, record_id: str) -> bool:
    groups = _load_groups()
    for g in groups:
        if g["id"] == group_id:
            g["record_ids"] = [r for r in g["record_ids"] if r != record_id]
            _save_groups(groups)
            return True
    return False


def delete_group(group_id: str) -> bool:
    groups = _load_groups()
    new_groups = [g for g in groups if g["id"] != group_id]
    if len(new_groups) == len(groups):
        return False
    _save_groups(new_groups)
    return True


def get_group_timeline(group_id: str) -> list[dict]:
    groups = _load_groups()
    group  = next((g for g in groups if g["id"] == group_id), None)
    if not group:
        return []
    records = _load()
    record_map = {r["id"]: r for r in records}
    timeline = []
    for rid in group["record_ids"]:
        r = record_map.get(rid)
        if r:
            timeline.append({
                "id":         r["id"],
                "timestamp":  r["timestamp"],
                "severity":   r["severity"],
                "risk_score": r.get("risk", {}).get("score", 0),
                "risk_level": r.get("risk", {}).get("level", "LOW"),
                "thumbnail":  r["thumbnail"],
            })
    return sorted(timeline, key=lambda x: x["timestamp"])


# ── Urgency Queue ─────────────────────────────────────────────────────────────

def get_urgency_queue() -> list[dict]:
    records   = _load()
    threshold = _load_settings().get("alert_threshold", 70)
    high = [
        {
            "id":        r["id"],
            "timestamp": r["timestamp"],
            "domain":    r["domain"],
            "thumbnail": r["thumbnail"],
            "severity":  r["severity"],
            "risk":      r["risk"],
            "age":       r.get("age", {}),
            "location":  r.get("location"),
            "alert":     r.get("risk", {}).get("score", 0) >= threshold,
        }
        for r in records
        if r.get("risk", {}).get("level") == "HIGH"
    ]
    return sorted(high, key=lambda x: x["risk"].get("score", 0), reverse=True)


# ── Checklist ─────────────────────────────────────────────────────────────────

DEFAULT_TASKS = [
    "Photograph reverse side",
    "Apply consolidant",
    "Document damage extent",
    "Consult specialist",
    "Schedule follow-up analysis",
]


def get_checklist(record_id: str) -> list[dict]:
    data = _load_checklists()
    if record_id not in data:
        data[record_id] = [{"task": t, "done": False} for t in DEFAULT_TASKS]
        _save_checklists(data)
    return data[record_id]


def update_checklist(record_id: str, tasks: list[dict]) -> list[dict]:
    data = _load_checklists()
    data[record_id] = tasks
    _save_checklists(data)
    return tasks


# ── Duplicate Detection ────────────────────────────────────────────────────────

def get_all_phashes() -> list[dict]:
    return [{"id": r["id"], "phash": r.get("phash")} for r in _load() if r.get("phash") is not None]


# ── Settings ──────────────────────────────────────────────────────────────────

def get_settings() -> dict:
    return _load_settings()


def update_settings(settings: dict) -> dict:
    current = _load_settings()
    current.update(settings)
    _save_settings(current)
    return current
