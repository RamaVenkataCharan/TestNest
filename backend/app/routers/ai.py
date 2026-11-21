from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.ai import status
from app.ai.suspicious_score import get_score, reset_score
from app.models.ai_event import AIEvent
from app.models.ai_status import AIStatus
from sqlalchemy import func

router = APIRouter(
    prefix="/ai",
    tags=["AI"]
)


@router.get("/status")
def get_ai_status(db: Session = Depends(get_db)):

    ai_status = db.query(AIStatus).first()

    if ai_status is None:
        return {
            "face_count": 0,
            "eye_status": "Normal",
            "head_status": "Straight",
            "phone_detected": False,
            "suspicious_score": 0,
            "latest_event": "None"
        }

    return {
        "face_count": ai_status.face_count,
        "eye_status": ai_status.eye_status,
        "head_status": ai_status.head_status,
        "phone_detected": ai_status.phone_detected,
        "suspicious_score": ai_status.suspicious_score,
        "latest_event": ai_status.latest_event
    }

@router.get("/events")
def get_ai_events(db: Session = Depends(get_db)):

    events = db.query(AIEvent).order_by(
        AIEvent.id.desc()
    ).limit(50).all()

    return [
        {
            "id": event.id,
            "event": event.event,
            "points": event.points,
            "created_at": event.created_at
        }
        for event in events
    ]

@router.get("/analytics")
def get_ai_analytics(db: Session = Depends(get_db)):

    events = db.query(AIEvent).all()

    total_events = len(events)

    total_score = db.query(
        func.coalesce(func.sum(AIEvent.points), 0)
    ).scalar()

    phone_count = db.query(AIEvent).filter(
        AIEvent.event.ilike("%phone%")
    ).count()

    multiple_faces = db.query(AIEvent).filter(
        AIEvent.event.ilike("%multiple%")
    ).count()

    looking_away = db.query(AIEvent).filter(
        AIEvent.event.ilike("%away%")
    ).count()

    head_movements = db.query(AIEvent).filter(
        AIEvent.event.in_([
            "Looking Left",
            "Looking Right",
            "Looking Up",
            "Looking Down"
        ])
    ).count()

    return {
        "total_events": total_events,
        "total_suspicious_score": total_score,
        "mobile_phone_events": phone_count,
        "multiple_face_events": multiple_faces,
        "looking_away_events": looking_away,
        "head_movement_events": head_movements
    }

@router.post("/reset")
def reset_ai():

    reset_score()

    status.face_count = 0
    status.eye_status = "Normal"
    status.head_status = "Straight"
    status.phone_detected = False

    return {
        "message": "AI status reset successfully"
    }

@router.get("/dashboard")
def get_dashboard(db: Session = Depends(get_db)):

    status = db.query(AIStatus).first()

    events = (
        db.query(AIEvent)
        .order_by(AIEvent.id.desc())
        .limit(10)
        .all()
    )

    total_events = db.query(AIEvent).count()

    total_score = (
        db.query(func.coalesce(func.sum(AIEvent.points), 0))
        .scalar()
    )

    phone_events = (
        db.query(AIEvent)
        .filter(AIEvent.event.ilike("%phone%"))
        .count()
    )

    multiple_faces = (
        db.query(AIEvent)
        .filter(AIEvent.event.ilike("%multiple%"))
        .count()
    )

    looking_away = (
        db.query(AIEvent)
        .filter(AIEvent.event.ilike("%away%"))
        .count()
    )

    head_movements = (
        db.query(AIEvent)
        .filter(
            AIEvent.event.in_([
                "Looking Left",
                "Looking Right",
                "Looking Up",
                "Looking Down"
            ])
        )
        .count()
    )

    score = total_score

    if score >= 150:
        risk_level = "High"
    elif score >= 75:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    return {
        "status": {
            "face_count": status.face_count if status else 0,
            "eye_status": status.eye_status if status else "Normal",
            "head_status": status.head_status if status else "Straight",
            "phone_detected": status.phone_detected if status else False,
            "suspicious_score": status.suspicious_score if status else 0,
            "latest_event": status.latest_event if status else "None"
        },

        "analytics": {
            "total_events": total_events,
            "total_suspicious_score": total_score,
            "mobile_phone_events": phone_events,
            "multiple_face_events": multiple_faces,
            "looking_away_events": looking_away,
            "head_movement_events": head_movements,
            "risk_level": risk_level
        },

        "recent_events": [
            {
                "id": event.id,
                "event": event.event,
                "points": event.points,
                "created_at": event.created_at
            }
            for event in events
        ]
    }