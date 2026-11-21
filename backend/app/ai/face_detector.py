import cv2
import mediapipe as mp

from app.ai import event_flags
from app.ai.suspicious_score import log_event
from app.ai import status


mp_face_detection = (
    mp.solutions.face_detection
)


face_detection = (
    mp_face_detection.FaceDetection(
        model_selection=0,
        min_detection_confidence=0.5
    )
)


def detect_faces(frame):

    rgb = cv2.cvtColor(
        frame,
        cv2.COLOR_BGR2RGB
    )


    results = face_detection.process(rgb)


    face_count = 0


    if results.detections:

        h, w, _ = frame.shape


        for detection in results.detections:

            face_count += 1


            bbox = (
                detection
                .location_data
                .relative_bounding_box
            )


            x = int(
                bbox.xmin * w
            )

            y = int(
                bbox.ymin * h
            )

            bw = int(
                bbox.width * w
            )

            bh = int(
                bbox.height * h
            )


            color = (
                0,
                255,
                0
            )


            if face_count > 1:

                color = (
                    0,
                    0,
                    255
                )


            cv2.rectangle(
                frame,
                (x, y),
                (
                    x + bw,
                    y + bh
                ),
                color,
                2
            )


    status.face_count = face_count


    # ==========================================
    # MULTIPLE FACE DETECTION
    # ==========================================

    if face_count > 1:

        cv2.putText(
            frame,
            "WARNING: Multiple Faces",
            (20, 80),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (0, 0, 255),
            2
        )


        if not (
            event_flags
            .multiple_faces_logged
        ):

            log_event(
                "Multiple Faces Detected",
                5
            )


            event_flags.multiple_faces_logged = (
                True
            )


    else:

        event_flags.multiple_faces_logged = (
            False
        )


    return frame