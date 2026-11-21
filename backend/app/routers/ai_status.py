from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.ai_status import AIStatus

router = APIRouter(
    prefix="/ai-status",
    tags=["AI Status"]
)


@router.get("/")
def get_ai_status(db: Session = Depends(get_db)):
    status = db.query(AIStatus).first()

    if not status:
        return {
            "face_count": 0,
            "eye_status": "Unknown",
            "head_status": "Unknown",
            "phone_detected": False,
            "suspicious_score": 0,
            "latest_event": "No Events"
        }

    return {
        "face_count": status.face_count,
        "eye_status": status.eye_status,
        "head_status": status.head_status,
        "phone_detected": status.phone_detected,
        "suspicious_score": status.suspicious_score,
        "latest_event": status.latest_event
    }