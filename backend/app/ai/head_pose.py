import cv2
import mediapipe as mp

from app.ai import event_flags
from app.ai.suspicious_score import log_event
from app.ai import status


mp_face_mesh = mp.solutions.face_mesh


face_mesh = mp_face_mesh.FaceMesh(
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)


def detect_head_pose(frame):

    rgb = cv2.cvtColor(
        frame,
        cv2.COLOR_BGR2RGB
    )

    results = face_mesh.process(rgb)

    direction = "Straight"


    if results.multi_face_landmarks:

        face = results.multi_face_landmarks[0]

        nose = face.landmark[1]


        # ==========================================
        # DETECT HEAD DIRECTION
        # ==========================================

        if nose.x < 0.40:

            direction = "Looking Left"

        elif nose.x > 0.60:

            direction = "Looking Right"

        elif nose.y < 0.40:

            direction = "Looking Up"

        elif nose.y > 0.60:

            direction = "Looking Down"


        status.head_status = direction


        # ==========================================
        # SUSPICIOUS HEAD MOVEMENT
        # ==========================================

        color = (0, 255, 0)


        if direction != "Straight":

            color = (0, 0, 255)


            if not event_flags.head_direction_logged:

                log_event(
                    direction,
                    2
                )

                event_flags.head_direction_logged = True


        else:

            color = (0, 255, 0)

            event_flags.head_direction_logged = False


        # ==========================================
        # DISPLAY DIRECTION
        # ==========================================

        cv2.putText(
            frame,
            direction,
            (20, 130),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            color,
            2
        )


    else:

        status.head_status = "No Face"


    return frame