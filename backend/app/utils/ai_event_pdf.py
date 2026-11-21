from io import BytesIO

from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
)


def generate_ai_event_pdf(event):
    buffer = BytesIO()

    doc = SimpleDocTemplate(buffer)

    styles = getSampleStyleSheet()

    story = []

    story.append(
        Paragraph(
            "<b>AI Event Report</b>",
            styles["Title"],
        )
    )

    story.append(
        Paragraph(
            f"<b>Event ID:</b> {event.id}",
            styles["Normal"],
        )
    )

    story.append(
        Paragraph(
            f"<b>Event:</b> {event.event}",
            styles["Normal"],
        )
    )

    story.append(
        Paragraph(
            f"<b>Points:</b> {event.points}",
            styles["Normal"],
        )
    )

    story.append(
        Paragraph(
            f"<b>Created At:</b> {event.created_at}",
            styles["Normal"],
        )
    )

    if event.points >= 70:
        risk = "High"
    elif event.points >= 30:
        risk = "Medium"
    else:
        risk = "Low"

    story.append(
        Paragraph(
            f"<b>Risk Level:</b> {risk}",
            styles["Normal"],
        )
    )

    doc.build(story)

    buffer.seek(0)

    return buffer