import cv2
import mediapipe as mp
import time

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


LEFT_EYE = [
    33,
    133,
    159,
    145
]

RIGHT_EYE = [
    362,
    263,
    386,
    374
]


# Student must look away continuously
# for at least 3 seconds
LOOK_AWAY_THRESHOLD = 3


look_away_start = None


def track_eyes(frame):

    global look_away_start


    rgb = cv2.cvtColor(
        frame,
        cv2.COLOR_BGR2RGB
    )

    results = face_mesh.process(rgb)


    if results.multi_face_landmarks:

        for face_landmarks in (
            results.multi_face_landmarks
        ):

            nose = face_landmarks.landmark[1]


            # ======================================
            # LOOK AWAY DETECTION
            # ======================================

            if (
                nose.x < 0.35
                or nose.x > 0.65
            ):

                status.eye_status = (
                    "Looking Away"
                )


                if look_away_start is None:

                    look_away_start = (
                        time.time()
                    )


                duration = (
                    time.time()
                    - look_away_start
                )


                cv2.putText(
                    frame,
                    "LOOKING AWAY!",
                    (20, 100),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.8,
                    (0, 0, 255),
                    2
                )


                # ==================================
                # LOG ONLY AFTER 3 SECONDS
                # ==================================

                if (
                    duration
                    >= LOOK_AWAY_THRESHOLD
                ):

                    if not (
                        event_flags
                        .looking_away_logged
                    ):

                        log_event(
                            (
                                "Student looked away "
                                f"({duration:.1f}s)"
                            ),
                            2
                        )

                        event_flags.looking_away_logged = (
                            True
                        )


            else:

                status.eye_status = "Normal"

                look_away_start = None

                event_flags.looking_away_logged = (
                    False
                )


            # ======================================
            # DRAW EYE LANDMARKS
            # ======================================

            h, w, _ = frame.shape


            for idx in LEFT_EYE:

                landmark = (
                    face_landmarks
                    .landmark[idx]
                )

                cv2.circle(
                    frame,
                    (
                        int(
                            landmark.x * w
                        ),
                        int(
                            landmark.y * h
                        )
                    ),
                    2,
                    (0, 255, 0),
                    -1
                )


            for idx in RIGHT_EYE:

                landmark = (
                    face_landmarks
                    .landmark[idx]
                )

                cv2.circle(
                    frame,
                    (
                        int(
                            landmark.x * w
                        ),
                        int(
                            landmark.y * h
                        )
                    ),
                    2,
                    (0, 255, 0),
                    -1
                )


    else:

        status.eye_status = "No Face"

        look_away_start = None

        event_flags.looking_away_logged = False


    return frame