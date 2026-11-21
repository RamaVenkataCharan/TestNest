from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.ai_event import AIEvent
from app.utils.ai_event_pdf import generate_ai_event_pdf


router = APIRouter(
    prefix="/ai-event-report",
    tags=["AI Event Report"]
)


@router.get("/{attempt_id}")
def download_ai_event_report(
    attempt_id: int,
    db: Session = Depends(get_db)
):
    event = (
        db.query(AIEvent)
        .filter(AIEvent.attempt_id == attempt_id)
        .order_by(AIEvent.id.desc())
        .first()
    )

    if not event:
        raise HTTPException(
            status_code=404,
            detail="No AI events found for this attempt."
        )

    pdf = generate_ai_event_pdf(event)

    return StreamingResponse(
        pdf,
        media_type="application/pdf",
        headers={
            "Content-Disposition":
            f"attachment; filename=AI_Report_Attempt_{attempt_id}.pdf"
        },
    )