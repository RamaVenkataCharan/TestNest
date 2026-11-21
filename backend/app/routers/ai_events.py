from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.ai_event import AIEvent

router = APIRouter(
    prefix="/ai-events",
    tags=["AI Events"]
)


@router.get("/")
def get_ai_events(db: Session = Depends(get_db)):

    events = (
        db.query(AIEvent)
        .order_by(AIEvent.id.desc())
        .all()
    )

    return events