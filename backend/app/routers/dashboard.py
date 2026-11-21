from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.models.exam import Exam
from app.models.question import Question
from app.models.exam_attempt import ExamAttempt

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):

    total_users = db.query(User).count()

    total_students = db.query(User).filter(
        User.role == "student"
    ).count()

    total_admins = db.query(User).filter(
        User.role == "admin"
    ).count()

    total_exams = db.query(Exam).count()

    total_questions = db.query(Question).count()

    total_attempts = db.query(ExamAttempt).count()

    return {
        "total_users": total_users,
        "total_students": total_students,
        "total_admins": total_admins,
        "total_exams": total_exams,
        "total_questions": total_questions,
        "total_attempts": total_attempts
    }

@router.get("/recent-attempts")
def get_recent_attempts(
    db: Session = Depends(get_db)
):
    attempts = (
        db.query(ExamAttempt)
        .order_by(ExamAttempt.submitted_at.desc())
        .limit(20)
        .all()
    )

    return [
        {
            "attempt_id": attempt.id,
            "student_id": attempt.student_id,
            "exam_id": attempt.exam_id,
            "score": attempt.score,
            "submitted_at": attempt.submitted_at,
        }
        for attempt in attempts
    ]