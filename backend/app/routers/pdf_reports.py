from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.exam_attempt import ExamAttempt
from app.models.ai_event import AIEvent
from app.utils.pdf_report import generate_pdf

router = APIRouter(
    prefix="/reports",
    tags=["PDF Reports"]
)


@router.get("/exam/{attempt_id}")
def download_exam_report(
    attempt_id: int,
    db: Session = Depends(get_db)
):

    attempt = (
        db.query(ExamAttempt)
        .filter(ExamAttempt.id == attempt_id)
        .first()
    )

    if not attempt:
        raise HTTPException(
            status_code=404,
            detail="Exam attempt not found."
        )

    ai_events = (
        db.query(AIEvent)
        .order_by(AIEvent.created_at)
        .all()
    )

    total_points = sum(event.points for event in ai_events)

    if total_points >= 70:
        risk_level = "High"
    elif total_points >= 30:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    pdf = generate_pdf(
        attempt,
        ai_events,
        risk_level
    )

    return StreamingResponse(
        pdf,
        media_type="application/pdf",
        headers={
            "Content-Disposition":
            f"attachment; filename=AI_Report_{attempt_id}.pdf"
        },
    )