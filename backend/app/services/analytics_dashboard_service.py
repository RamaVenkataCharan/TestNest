from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.ai_event import AIEvent


def get_dashboard_summary(db: Session):

    total_events = db.query(AIEvent).count()

    total_points = (
        db.query(func.sum(AIEvent.points))
        .scalar()
        or 0
    )

    average_events = round(total_events / 50, 2)

    # -------------------------
    # Risk Level
    # -------------------------

    if total_points >= 300:
        risk_level = "High"
    elif total_points >= 100:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    # -------------------------
    # Event Summary
    # -------------------------

    events = (
        db.query(
            AIEvent.event,
            func.count(AIEvent.id).label("count"),
            func.sum(AIEvent.points).label("points"),
        )
        .group_by(AIEvent.event)
        .all()
    )

    return {
        "total_events": total_events,
        "total_points": total_points,
        "risk_level": risk_level,
        "average_events": average_events,
        "events": [
            {
                "event": e.event,
                "count": e.count,
                "points": e.points,
            }
            for e in events
        ],
    }