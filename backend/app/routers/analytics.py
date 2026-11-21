from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.database import get_db
from app.models.exam_attempt import ExamAttempt
from app.models.ai_event import AIEvent
from app.models.user import User
from app.models.exam import Exam

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"]
)


@router.get("/")
def get_analytics(db: Session = Depends(get_db)):

    results = (
        db.query(
            ExamAttempt.id.label("attempt_id"),
            User.full_name.label("student_name"),
            Exam.title.label("exam_title"),
            func.count(AIEvent.id).label("total_events"),
            func.coalesce(func.sum(AIEvent.points), 0).label("total_points"),
        )
        .join(User, ExamAttempt.student_id == User.id)
        .join(Exam, ExamAttempt.exam_id == Exam.id)
        .outerjoin(
            AIEvent,
            AIEvent.attempt_id == ExamAttempt.id
        )
        .group_by(
            ExamAttempt.id,
            User.full_name,
            Exam.title,
            Exam.id
        )
        .order_by(ExamAttempt.id.desc())
        .all()
    )

    analytics = []

    for row in results:

        if row.total_points >= 150:
            risk = "High"
        elif row.total_points >= 75:
            risk = "Medium"
        else:
            risk = "Low"

        analytics.append({
            "attempt_id": row.attempt_id,
            "student_name": row.student_name,
            "exam_title": row.exam_title,
            "total_events": row.total_events,
            "total_points": row.total_points,
            "risk_level": risk
        })

    return analytics