import cv2

import os

from app.ai import status
from app.ai.face_detector import detect_faces
from app.ai.eye_tracker import track_eyes
from app.ai.head_pose import detect_head_pose

from app.ai.dashboard_overlay import draw_dashboard
from app.ai.suspicious_score import (
    get_score,
    get_events,
)


def get_latest_event():
    """
    Return the latest suspicious event safely.
    """

    try:
        events = get_events()

        if not events:
            return "None"

        latest = events[-1]

        if isinstance(latest, dict):
            return (
                latest.get("event")
                or latest.get("event_type")
                or latest.get("type")
                or "None"
            )

        return str(latest)

    except Exception:
        return "None"


def process_frame(frame):

    # ----------------------------
    # Lightweight AI modules
    # ----------------------------

    frame = detect_faces(frame)
    frame = track_eyes(frame)
    frame = detect_head_pose(frame)

    # ----------------------------
    # Optional YOLO phone detector
    # ----------------------------

    enable_phone_detection = (
        os.getenv(
            "ENABLE_PHONE_DETECTION",
            "false"
        ).lower() == "true"
    )

    if enable_phone_detection:

        # Import YOLO only when explicitly enabled.
        # Prevents PyTorch/Ultralytics from consuming
        # Render Free memory during normal proctoring.
        from app.ai.object_detector import detect_objects

        frame = detect_objects(frame)

    else:

        status.phone_detected = False

    result = {
        "face_count": getattr(
            status,
            "face_count",
            0
        ),

        "eye_status": getattr(
            status,
            "eye_status",
            "Normal"
        ),

        "head_status": getattr(
            status,
            "head_status",
            "Straight"
        ),

        "phone_detected": getattr(
            status,
            "phone_detected",
            False
        ),

        "suspicious_score": get_score(),

        "latest_event": get_latest_event(),
    }

    return frame, result

def run_proctor():
    """
    Local webcam version.

    This can still be used when running the backend
    directly on your laptop.
    """

    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("Unable to access webcam.")
        return

    print("===================================")
    print(" AI Exam Proctor Engine Started")
    print(" Press Q or ESC to Quit")
    print("===================================")

    while True:

        success, frame = cap.read()

        if not success:
            break

        # Process through the same AI pipeline
        frame, result = process_frame(frame)

        # Dashboard overlay
        frame = draw_dashboard(
            frame,
            face_count=result["face_count"],
            eye_status=result["eye_status"],
            head_status=result["head_status"],
            phone_detected=result["phone_detected"],
            score=result["suspicious_score"],
        )

        cv2.putText(
            frame,
            "AI Exam Proctoring System",
            (20, 270),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (0, 255, 0),
            2,
        )

        cv2.imshow(
            "AI Proctor Engine",
            frame
        )

        key = cv2.waitKey(1) & 0xFF

        if key == ord("q") or key == 27:
            break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    run_proctor()