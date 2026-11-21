import cv2
import time

start_time = time.time()


def draw_dashboard(
    frame,
    face_count=0,
    eye_status="Normal",
    head_status="Straight",
    phone_detected=False,
    score=0,
):
    elapsed = int(time.time() - start_time)

    minutes = elapsed // 60
    seconds = elapsed % 60

    # Background panel
    cv2.rectangle(
        frame,
        (10, 10),
        (340, 240),
        (40, 40, 40),
        -1
    )

    cv2.putText(
        frame,
        "AI PROCTOR DASHBOARD",
        (20, 35),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (0, 255, 255),
        2
    )

    cv2.putText(
        frame,
        f"Faces: {face_count}",
        (20, 70),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.6,
        (255, 255, 255),
        2
    )

    cv2.putText(
        frame,
        f"Eyes: {eye_status}",
        (20, 100),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.6,
        (255, 255, 255),
        2
    )

    cv2.putText(
        frame,
        f"Head: {head_status}",
        (20, 130),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.6,
        (255, 255, 255),
        2
    )

    phone = "YES" if phone_detected else "NO"

    color = (0, 0, 255) if phone_detected else (0, 255, 0)

    cv2.putText(
        frame,
        f"Phone: {phone}",
        (20, 160),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.6,
        color,
        2
    )

    cv2.putText(
        frame,
        f"Score: {score}",
        (20, 190),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.6,
        (0, 255, 255),
        2
    )

    cv2.putText(
        frame,
        f"Time: {minutes:02}:{seconds:02}",
        (20, 220),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.6,
        (255, 255, 255),
        2
    )

    return frame