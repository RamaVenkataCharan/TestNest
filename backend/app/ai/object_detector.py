import cv2

from ultralytics import YOLO
from app.ai import event_flags
from app.ai.suspicious_score import log_event
from app.ai import status

model = YOLO("yolov8n.pt")

PHONE_CLASS_ID = 67
LAPTOP_CLASS_ID = 63
PERSON_CLASS_ID = 0

phone_logged = False


def detect_objects(frame):

    global phone_logged

    results = model(frame, verbose=False)

    phone_detected = False

    for result in results:

        for box in result.boxes:

            cls = int(box.cls[0])
            conf = float(box.conf[0])

            if conf < 0.5:
                continue

            x1, y1, x2, y2 = map(int, box.xyxy[0])

            label = model.names[cls]
            color = (0, 255, 0)

            if cls == PHONE_CLASS_ID:

                label = "Mobile Phone"

                color = (0, 0, 255)

                phone_detected = True

            elif cls == LAPTOP_CLASS_ID:

                color = (255, 0, 0)

            elif cls == PERSON_CLASS_ID:

                color = (0, 255, 255)

            cv2.rectangle(
                frame,
                (x1, y1),
                (x2, y2),
                color,
                2
            )

            cv2.putText(
                frame,
                f"{label} {conf:.2f}",
                (x1, y1 - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                color,
                2
            )

    status.phone_detected = phone_detected

    if phone_detected:

        if not event_flags.phone_logged:
            log_event("Mobile Phone Detected", 40)
            event_flags.phone_logged = True

    else:
        event_flags.phone_logged = False

    return frame