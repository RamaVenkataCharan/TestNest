from app.database.database import SessionLocal
from app.models.ai_status import AIStatus


def update_status(
    face_count,
    eye_status,
    head_status,
    phone_detected,
    suspicious_score,
    latest_event
):
    db = SessionLocal()

    try:
        status = db.query(AIStatus).first()

        if status is None:
            status = AIStatus(
                face_count=face_count,
                eye_status=eye_status,
                head_status=head_status,
                phone_detected=phone_detected,
                suspicious_score=suspicious_score,
                latest_event=latest_event
            )

            db.add(status)

        else:
            status.face_count = face_count
            status.eye_status = eye_status
            status.head_status = head_status
            status.phone_detected = phone_detected
            status.suspicious_score = suspicious_score
            status.latest_event = latest_event

        db.commit()

    finally:
        db.close()