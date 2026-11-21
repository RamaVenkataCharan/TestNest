from io import BytesIO
from reportlab.platypus import SimpleDocTemplate, Paragraph
from reportlab.lib.styles import getSampleStyleSheet


def generate_pdf(attempt, ai_events, risk_level):
    buffer = BytesIO()

    doc = SimpleDocTemplate(buffer)

    styles = getSampleStyleSheet()

    elements = []

    elements.append(
        Paragraph("<b>AI Exam Proctoring Report</b>", styles["Title"])
    )

    elements.append(
        Paragraph(f"<b>Attempt ID:</b> {attempt.id}", styles["Normal"])
    )

    elements.append(
        Paragraph(f"<b>Student ID:</b> {attempt.student_id}", styles["Normal"])
    )

    elements.append(
        Paragraph(f"<b>Exam ID:</b> {attempt.exam_id}", styles["Normal"])
    )

    elements.append(
        Paragraph(f"<b>Score:</b> {attempt.score}", styles["Normal"])
    )

    elements.append(
        Paragraph(f"<b>Submitted:</b> {attempt.submitted_at}", styles["Normal"])
    )

    elements.append(
        Paragraph(f"<b>Risk Level:</b> {risk_level}", styles["Heading2"])
    )

    elements.append(
        Paragraph("<b>AI Events</b>", styles["Heading2"])
    )

    if len(ai_events) == 0:
        elements.append(
            Paragraph("No suspicious events.", styles["Normal"])
        )

    for event in ai_events:
        elements.append(
            Paragraph(
                f"{event.created_at} - {event.event} ({event.points} pts)",
                styles["Normal"],
            )
        )

    doc.build(elements)

    buffer.seek(0)

    return buffer