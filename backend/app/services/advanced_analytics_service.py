from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.exam_attempt import ExamAttempt
from app.models.user import User
from app.models.exam import Exam
from app.models.ai_event import AIEvent


def get_advanced_analytics(db: Session):

    # ------------------------------------------
    # Aggregate AI events only once
    # ------------------------------------------

    ai_stats = (
        db.query(
            AIEvent.attempt_id.label("attempt_id"),
            func.count(AIEvent.id).label("total_events"),
            func.coalesce(
                func.sum(AIEvent.points),
                0
            ).label("total_points"),
        )
        .group_by(AIEvent.attempt_id)
        .subquery()
    )


    # ------------------------------------------
    # Get attempts + student + exam + AI stats
    # in ONE query
    # ------------------------------------------

    rows = (
        db.query(
            ExamAttempt.id.label("attempt_id"),

            User.full_name.label(
                "student_name"
            ),

            Exam.title.label(
                "exam_title"
            ),

            ExamAttempt.score.label(
                "score"
            ),

            ExamAttempt.submitted_at.label(
                "created_at"
            ),

            func.coalesce(
                ai_stats.c.total_events,
                0
            ).label("total_events"),

            func.coalesce(
                ai_stats.c.total_points,
                0
            ).label("total_points"),
        )

        .outerjoin(
            User,
            User.id ==
            ExamAttempt.student_id
        )

        .outerjoin(
            Exam,
            Exam.id ==
            ExamAttempt.exam_id
        )

        .outerjoin(
            ai_stats,
            ai_stats.c.attempt_id ==
            ExamAttempt.id
        )

        .order_by(
            ExamAttempt.id.desc()
        )

        .all()
    )


    # ------------------------------------------
    # Prepare response
    # ------------------------------------------

    results = []


    for row in rows:

        total_points = int(
            row.total_points or 0
        )

        total_events = int(
            row.total_events or 0
        )


        # Risk calculation

        if total_points >= 300:

            risk = "High"

        elif total_points >= 100:

            risk = "Medium"

        else:

            risk = "Low"


        results.append(
            {
                "attempt_id":
                    row.attempt_id,

                "student_name":
                    row.student_name
                    or "Unknown",

                "exam_title":
                    row.exam_title
                    or "Unknown",

                "score":
                    row.score or 0,

                "total_events":
                    total_events,

                "total_points":
                    total_points,

                "risk_level":
                    risk,

                "created_at":
                    row.created_at,
            }
        )


    return results