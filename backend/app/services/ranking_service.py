from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.exam_attempt import ExamAttempt
from app.models.user import User


def get_student_rankings(db: Session):
    rankings = (
        db.query(
            User.id,
            User.full_name.label("student_name"),
            func.avg(ExamAttempt.score).label("average_score"),
            func.count(ExamAttempt.id).label("attempts"),
        )
        .join(User, User.id == ExamAttempt.student_id)
        .group_by(User.id, User.full_name)
        .order_by(func.avg(ExamAttempt.score).desc())
        .all()
    )

    results = []

    rank = 1

    for student in rankings:
        results.append(
            {
                "rank": rank,
                "student_name": student.student_name,
                "average_score": round(student.average_score, 2),
                "attempts": student.attempts,
            }
        )

        rank += 1

    return results