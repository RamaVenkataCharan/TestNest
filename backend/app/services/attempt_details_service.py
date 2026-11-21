from sqlalchemy.orm import Session

from app.models.exam_attempt import ExamAttempt
from app.models.ai_event import AIEvent
from app.models.user import User
from app.models.exam import Exam


def get_attempt_details(db: Session, attempt_id: int):

    attempt = (
        db.query(ExamAttempt)
        .filter(ExamAttempt.id == attempt_id)
        .first()
    )

    if not attempt:
        return None

    student = (
        db.query(User)
        .filter(User.id == attempt.student_id)
        .first()
    )

    exam = (
        db.query(Exam)
        .filter(Exam.id == attempt.exam_id)
        .first()
    )

    events = (
        db.query(AIEvent)
        .filter(AIEvent.attempt_id == attempt.id)
        .all()
    )

    # --------------------------------
    # Basic AI statistics
    # --------------------------------

    total_events = len(events)

    total_points = sum(
        event.points for event in events
    )

    # --------------------------------
    # Overall attempt risk
    # --------------------------------

    if total_points >= 100:
        risk = "High"

    elif total_points >= 40:
        risk = "Medium"

    else:
        risk = "Low"

    # --------------------------------
    # Event risk breakdown
    # --------------------------------

    high_risk_events = sum(
        1
        for event in events
        if event.points >= 15
    )

    medium_risk_events = sum(
        1
        for event in events
        if 8 <= event.points < 15
    )

    low_risk_events = sum(
        1
        for event in events
        if event.points < 8
    )

    # --------------------------------
    # Most common AI event
    # --------------------------------

    event_counts = {}

    for event in events:

        event_name = event.event

        event_counts[event_name] = (
            event_counts.get(event_name, 0) + 1
        )

    most_common_event = (
        max(
            event_counts,
            key=event_counts.get
        )
        if event_counts
        else "No Events"
    )

    # --------------------------------
    # Average event points
    # --------------------------------

    average_event_points = (
        total_points / total_events
        if total_events > 0
        else 0
    )

    # --------------------------------
    # Return response
    # --------------------------------

    return {

        "attempt_id": attempt.id,

        "student_name": (
            student.full_name
            if student
            else "Unknown Student"
        ),

        "exam_title": (
            exam.title
            if exam
            else "Unknown Exam"
        ),

        "score": attempt.score,

        "total_events": total_events,

        "total_points": total_points,

        "risk_level": risk,

        "high_risk_events": high_risk_events,

        "medium_risk_events": medium_risk_events,

        "low_risk_events": low_risk_events,

        "most_common_event": most_common_event,

        "average_event_points": round(
            average_event_points,
            2
        ),

        "created_at": attempt.submitted_at,

        "events": [

            {
                "event": event.event,

                "points": event.points,

                "created_at": event.created_at,

            }

            for event in attempt.ai_events

        ],

    }