from datetime import datetime
import asyncio

from sqlalchemy import func

from app.ai.websocket_manager import broadcast
from app.database.database import SessionLocal
from app.models.ai_event import AIEvent
from app.ai import status
from app.ai.status_db import update_status
import app.ai.current_attempt as current_attempt


suspicious_events = []
suspicious_score = 0


# ==========================================
# GET SCORE FOR A PARTICULAR ATTEMPT
# ==========================================

def get_attempt_score(attempt_id: int):

    db = SessionLocal()

    try:
        total = (
            db.query(
                func.coalesce(
                    func.sum(AIEvent.points),
                    0
                )
            )
            .filter(
                AIEvent.attempt_id == attempt_id
            )
            .scalar()
        )

        return int(total or 0)

    finally:
        db.close()


# ==========================================
# LOG SUSPICIOUS EVENT
# ==========================================

def log_event(
    event: str,
    points: int = 2,
    attempt_id: int | None = None
):
    global suspicious_score

    # If attempt ID is explicitly provided,
    # use it. Otherwise use existing
    # current-attempt system.
    target_attempt_id = (
        attempt_id
        if attempt_id is not None
        else current_attempt.current_attempt_id
    )

    print("=" * 50)
    print("log_event() called")
    print("Attempt:", target_attempt_id)
    print("Event:", event)
    print("Points:", points)
    print("=" * 50)

    suspicious_events.append({
        "time": datetime.now().strftime(
            "%H:%M:%S"
        ),
        "event": event,
        "points": points,
    })

    suspicious_score += points


    # ======================================
    # UPDATE LIVE STATUS
    # ======================================

    update_status(
        face_count=status.face_count,
        eye_status=status.eye_status,
        head_status=status.head_status,
        phone_detected=status.phone_detected,
        suspicious_score=suspicious_score,
        latest_event=event,
    )


    message = {
        "face_count": status.face_count,
        "eye_status": status.eye_status,
        "head_status": status.head_status,
        "phone_detected":
            status.phone_detected,
        "suspicious_score":
            suspicious_score,
        "latest_event": event,
        "points": points,
        "time": datetime.now().strftime(
            "%H:%M:%S"
        ),
    }


    # ======================================
    # WEBSOCKET BROADCAST
    # ======================================

    try:
        asyncio.create_task(
            broadcast(message)
        )
    except RuntimeError:
        pass


    # ======================================
    # SAVE EVENT TO POSTGRESQL
    # ======================================

    db = SessionLocal()

    try:

        if target_attempt_id is not None:

            ai_event = AIEvent(
                attempt_id=target_attempt_id,
                event=event,
                points=points,
            )

            db.add(ai_event)

            db.commit()

            db.refresh(ai_event)

            print(
                "AIEvent saved successfully!"
            )

    except Exception as error:

        db.rollback()

        print(
            "Failed to save AI event:",
            error
        )

    finally:
        db.close()


# ==========================================
# GET EVENTS
# ==========================================

def get_events():
    return suspicious_events


# ==========================================
# GET GLOBAL SCORE
# ==========================================

def get_score():
    return suspicious_score


# ==========================================
# RESET SCORE
# ==========================================

def reset_score():
    global suspicious_score

    suspicious_events.clear()

    suspicious_score = 0

    # Reset live AI status
    status.face_count = 0
    status.eye_status = "Normal"
    status.head_status = "Straight"
    status.phone_detected = False

    update_status(
        face_count=0,
        eye_status="Normal",
        head_status="Straight",
        phone_detected=False,
        suspicious_score=0,
        latest_event="None"
    )

    print("AI suspicious score reset to 0")

def get_attempt_event_points(
    attempt_id: int,
    event_name: str
):
    from sqlalchemy import func

    db = SessionLocal()

    try:

        total = (
            db.query(
                func.coalesce(
                    func.sum(AIEvent.points),
                    0
                )
            )
            .filter(
                AIEvent.attempt_id == attempt_id,
                AIEvent.event == event_name
            )
            .scalar()
        )

        return int(total or 0)

    finally:

        db.close()