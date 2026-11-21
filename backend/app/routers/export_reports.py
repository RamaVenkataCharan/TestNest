from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from io import StringIO
import csv

from app.database.database import get_db
from app.models.ai_event import AIEvent
from app.auth import get_current_admin

router = APIRouter(
    prefix="/export",
    tags=["Export Reports"]
)


@router.get("/ai-events")
def export_ai_events(
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):
    events = (
        db.query(AIEvent)
        .order_by(AIEvent.created_at.desc())
        .all()
    )

    output = StringIO()

    writer = csv.writer(output)

    writer.writerow([
        "ID",
        "Event",
        "Points",
        "Created At"
    ])

    for event in events:
        writer.writerow([
            event.id,
            event.event,
            event.points,
            event.created_at
        ])

    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition":
            "attachment; filename=ai_events_report.csv"
        }
    )