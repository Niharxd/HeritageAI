from __future__ import annotations

import base64
import io
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    Image as RLImage,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

_GOLD  = colors.HexColor("#b8860b")
_DARK  = colors.HexColor("#2b1d0e")
_LIGHT = colors.HexColor("#fdf6e8")
_SEPIA = colors.HexColor("#8b5e3c")
_RED   = colors.HexColor("#8b1a1a")
_GREEN = colors.HexColor("#2d5a27")


def _b64_to_image(b64: str, width: float, height: float) -> RLImage | None:
    try:
        data = b64.split(",", 1)[-1]
        raw  = base64.b64decode(data)
        return RLImage(io.BytesIO(raw), width=width, height=height)
    except Exception:
        return None


def generate_pdf(record: dict) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("HTitle", parent=styles["Title"],
        textColor=_DARK, fontSize=20, spaceAfter=4)
    h2_style = ParagraphStyle("HH2", parent=styles["Heading2"],
        textColor=_GOLD, fontSize=13, spaceBefore=14, spaceAfter=4)
    body_style = ParagraphStyle("HBody", parent=styles["Normal"],
        fontSize=10, leading=14, textColor=_DARK)
    small_style = ParagraphStyle("HSmall", parent=styles["Normal"],
        fontSize=9, textColor=_SEPIA)

    full   = record.get("full", record)
    risk   = full.get("risk", {})
    det    = full.get("detection", {})
    age    = full.get("age", {})
    sugg   = full.get("suggestions", {})
    images = full.get("images", {})

    risk_color = {"HIGH": _RED, "MEDIUM": _GOLD, "LOW": _GREEN}.get(
        risk.get("level", "LOW"), _DARK)

    story = []

    # ── Header ──
    story.append(Paragraph("Heritage AI - Conservation Report", title_style))
    story.append(Paragraph(
        "Generated: " + datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC") +
        "  |  Domain: " + full.get("domain", "unknown").upper() +
        "  |  Record ID: " + record.get("id", "N/A"),
        small_style,
    ))
    story.append(Spacer(1, 0.4*cm))

    # ── Executive summary ──
    story.append(Paragraph("Executive Summary", h2_style))
    risk_level_para = Paragraph(
        "<b>" + risk.get("level", "N/A") + "</b>",
        ParagraphStyle("RL", parent=body_style, textColor=risk_color, fontSize=12),
    )
    summary_data = [
        ["Risk Level",       risk_level_para],
        ["Risk Score",       str(round(risk.get("score", 0), 1)) + " / 100"],
        ["Damage Severity",  str(round(det.get("severity", 0), 1)) + " / 100"],
        ["Detected Regions", str(len(det.get("detections", [])))],
        ["Estimated Age",    age.get("estimated_age", "N/A")],
        ["Year Range",       age.get("year_range", "N/A")],
    ]
    t = Table(summary_data, colWidths=[5*cm, 11*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND",     (0, 0), (0, -1), _LIGHT),
        ("TEXTCOLOR",      (0, 0), (0, -1), _SEPIA),
        ("FONTNAME",       (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE",       (0, 0), (-1, -1), 10),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [_LIGHT, colors.white]),
        ("GRID",           (0, 0), (-1, -1), 0.5, colors.HexColor("#c8a96e")),
        ("VALIGN",         (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING",     (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING",  (0, 0), (-1, -1), 6),
    ]))
    story.append(t)
    story.append(Spacer(1, 0.3*cm))

    # ── Risk reasons ──
    if risk.get("reasons"):
        story.append(Paragraph("Risk Factors", h2_style))
        for reason in risk["reasons"]:
            story.append(Paragraph("- " + reason, body_style))

    # ── Images ──
    story.append(Paragraph("Analysis Images", h2_style))
    for key, label in [
        ("original",         "Original Image"),
        ("detectionOverlay", "Damage Detection Overlay"),
        ("enhanced",         "Enhanced Output"),
        ("heatmap",          "Explanation Heatmap"),
    ]:
        b64 = images.get(key, "")
        img = _b64_to_image(b64, 14*cm, 10*cm) if b64 else None
        story.append(Paragraph(label, small_style))
        story.append(img if img else Paragraph("Image unavailable", small_style))
        story.append(Spacer(1, 0.3*cm))

    # ── Detections table ──
    detections = det.get("detections", [])
    if detections:
        story.append(Paragraph("Detected Damage Regions", h2_style))
        rows = [["Type", "Severity", "Bounding Box"]]
        for d in detections[:20]:
            rows.append([
                d.get("label", ""),
                str(round(d.get("severity", 0), 1)),
                str(d.get("bbox", [])),
            ])
        t2 = Table(rows, colWidths=[4*cm, 4*cm, 8*cm])
        t2.setStyle(TableStyle([
            ("BACKGROUND",     (0, 0), (-1, 0), _DARK),
            ("TEXTCOLOR",      (0, 0), (-1, 0), _GOLD),
            ("FONTNAME",       (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE",       (0, 0), (-1, -1), 9),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, _LIGHT]),
            ("GRID",           (0, 0), (-1, -1), 0.5, colors.HexColor("#c8a96e")),
            ("TOPPADDING",     (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING",  (0, 0), (-1, -1), 5),
        ]))
        story.append(t2)

    # ── Age ──
    story.append(Paragraph("Degradation-Based Age Estimate", h2_style))
    story.append(Paragraph(
        "Note: Age estimate is based on visual degradation only, not scientific dating.",
        small_style,
    ))
    story.append(Spacer(1, 0.2*cm))
    age_data = [
        ["Estimated Age",     age.get("estimated_age", "N/A")],
        ["Year Range",        age.get("year_range", "N/A")],
        ["Confidence",        age.get("confidence", "N/A")],
        ["Degradation Index", str(round(age.get("degradation_index", 0), 1))],
    ]
    t3 = Table(age_data, colWidths=[5*cm, 11*cm])
    t3.setStyle(TableStyle([
        ("BACKGROUND",     (0, 0), (0, -1), _LIGHT),
        ("TEXTCOLOR",      (0, 0), (0, -1), _SEPIA),
        ("FONTNAME",       (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE",       (0, 0), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [_LIGHT, colors.white]),
        ("GRID",           (0, 0), (-1, -1), 0.5, colors.HexColor("#c8a96e")),
        ("TOPPADDING",     (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING",  (0, 0), (-1, -1), 5),
    ]))
    story.append(t3)

    # ── Restoration suggestions ──
    suggestions = sugg.get("suggestions", [])
    if suggestions:
        story.append(Paragraph("Restoration Recommendations", h2_style))
        if sugg.get("priority_note"):
            story.append(Paragraph(sugg["priority_note"], body_style))
            story.append(Spacer(1, 0.2*cm))
        for s in suggestions:
            story.append(Paragraph(
                "<b>" + s["technique"] + "</b> [" + s.get("urgency", "?") + " urgency]",
                body_style,
            ))
            story.append(Paragraph(s.get("description", ""), small_style))
            story.append(Spacer(1, 0.15*cm))

    doc.build(story)
    return buf.getvalue()
