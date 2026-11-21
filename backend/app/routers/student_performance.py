from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.database import get_db
from app.models.exam_attempt import ExamAttempt
from app.models.user import User
from app.models.exam import Exam
from app.models.question import Question

router = APIRouter(
    prefix="/student-performance",
    tags=["Student Performance"]
)

@router.get("/")
def get_student_performance(db: Session = Depends(get_db)):

    attempts = (
        db.query(
            ExamAttempt.id.label("attempt_id"),
            User.full_name.label("student_name"),
            Exam.title.label("exam_title"),
            ExamAttempt.exam_id,
            ExamAttempt.score,
        )
        .join(User, User.id == ExamAttempt.student_id)
        .join(Exam, Exam.id == ExamAttempt.exam_id)
        .order_by(ExamAttempt.id.desc())
        .all()
    )

    results = []

    for attempt in attempts:

        total_questions = (
            db.query(func.count(Question.id))
            .filter(Question.exam_id == attempt.exam_id)
            .scalar()
        )

        total_questions = total_questions or 1

        percentage = round(
            (attempt.score / total_questions) * 100,
            2
        )

        status = "Pass" if percentage >= 40 else "Fail"

        results.append(
            {
                "attempt_id": attempt.attempt_id,
                "student_name": attempt.student_name,
                "exam_title": attempt.exam_title,
                "score": attempt.score,
                "percentage": percentage,
                "status": status,
            }
        )

    return results