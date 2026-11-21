from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.user import User
from app.models.exam import Exam
from app.models.exam_attempt import ExamAttempt


def get_performance_data(db: Session):
    attempts = (
        db.query(
            User.full_name.label("student_name"),
            Exam.title.label("exam_title"),
            ExamAttempt.score,
            ExamAttempt.submitted_at,
        )
        .join(ExamAttempt, User.id == ExamAttempt.student_id)
        .join(Exam, Exam.id == ExamAttempt.exam_id)
        .order_by(ExamAttempt.submitted_at.desc())
        .all()
    )

    results = []

    for attempt in attempts:
        results.append({
            "student_name": attempt.student_name,
            "exam_title": attempt.exam_title,
            "score": attempt.score,
            "result": "Pass" if attempt.score >= 5 else "Fail",
            "submitted_at": attempt.submitted_at,
        })

    return results


def get_performance_summary(db: Session):
    total_students = (
        db.query(func.count(User.id))
        .filter(User.role == "student")
        .scalar()
    )

    total_attempts = (
        db.query(func.count(ExamAttempt.id))
        .scalar()
    )

    average_score = (
        db.query(func.avg(ExamAttempt.score))
        .scalar() or 0
    )

    highest_score = (
        db.query(func.max(ExamAttempt.score))
        .scalar() or 0
    )

    return {
        "total_students": total_students,
        "total_attempts": total_attempts,
        "average_score": round(float(average_score), 2),
        "highest_score": highest_score,
    }