from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.exam_attempt import ExamAttempt
from app.auth.dependencies import get_current_student

router = APIRouter(
    prefix="/student-history",
    tags=["Student History"]
)


@router.get("/")
def get_student_history(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_student)
):
    attempts = (
        db.query(ExamAttempt)
        .filter(
            ExamAttempt.student_id == current_user["id"]
        )
        .order_by(ExamAttempt.id.desc())
        .all()
    )

    return [
        {
            "id": attempt.id,
            "exam_id": attempt.exam_id,
            "score": attempt.score,
            "submitted_at": attempt.submitted_at,
        }
        for attempt in attempts
    ]