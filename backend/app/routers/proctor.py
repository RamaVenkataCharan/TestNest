from fastapi import (
    APIRouter,
    UploadFile,
    File,
    HTTPException,
)

from pydantic import BaseModel

from app.ai.suspicious_score import (
    get_score,
    log_event,
    get_attempt_score,
    get_attempt_event_points,
)


router = APIRouter(
    prefix="/proctor",
    tags=["AI Proctor"],
)


# ==========================================
# VIOLATION REQUEST
# ==========================================

class ViolationRequest(BaseModel):
    attempt_id: int
    violation_type: str


# ==========================================
# PROCTOR STATUS
# ==========================================

@router.get("/status")
def proctor_status():

    score = get_score()

    return {
        "suspicious_score": score,
        "terminate_exam": score >= 100,
    }


# ==========================================
# MANUAL/BROWSER VIOLATION
# ==========================================

@router.post("/violation")
async def proctor_violation(
    data: ViolationRequest
):

    # ==========================================
    # SELECT VIOLATION
    # ==========================================

    if data.violation_type == "tab_switch":

        event = "Tab Switching Detected"
        points = 5

    elif data.violation_type == "fullscreen_exit":

        event = "Fullscreen Exit Detected"
        points = 5

    else:

        raise HTTPException(
            status_code=400,
            detail="Invalid violation type",
        )


    # ==========================================
    # SAVE EVENT
    # ==========================================

    log_event(
        event=event,
        points=points,
        attempt_id=data.attempt_id,
    )


    # ==========================================
    # TOTAL ATTEMPT SCORE
    # ==========================================

    attempt_score = get_attempt_score(
        data.attempt_id
    )


    # ==========================================
    # TAB SWITCH SCORE
    # ==========================================

    tab_switch_points = (
        get_attempt_event_points(
            data.attempt_id,
            "Tab Switching Detected"
        )
    )


    tab_switch_count = (
        tab_switch_points // 5
    )


    # ==========================================
    # TERMINATION
    # ==========================================

    terminate_exam = False


    # 3 tab switches = terminate
    if tab_switch_count >= 3:

        terminate_exam = True


    # Overall suspicious score = 100
    if attempt_score >= 100:

        terminate_exam = True


    # ==========================================
    # WARNING LEVEL
    # ==========================================

    if attempt_score >= 100:

        warning_level = "terminate"

    elif attempt_score >= 80:

        warning_level = "critical"

    elif attempt_score >= 50:

        warning_level = "strong_warning"

    elif attempt_score >= 30:

        warning_level = "warning"

    else:

        warning_level = "normal"


    # ==========================================
    # RESPONSE
    # ==========================================

    return {
        "message": "Violation recorded",

        "event": event,

        "points": points,

        "suspicious_score":
            attempt_score,

        "tab_switch_points":
            tab_switch_points,

        "tab_switch_count":
            tab_switch_count,

        "warning_level":
            warning_level,

        "terminate_exam":
            terminate_exam,
    }

# ==========================================
# ANALYZE CAMERA FRAME
# ==========================================

@router.post("/analyze-frame")
async def analyze_frame(
    frame: UploadFile = File(...)
):

    try:

        contents = await frame.read()

        if not contents:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Empty camera frame "
                    "received"
                ),
            )


        # Heavy AI libraries are loaded
        # only when camera analysis starts.

        import cv2
        import numpy as np

        from app.ai.proctor_engine import (
            process_frame,
        )


        np_array = np.frombuffer(
            contents,
            np.uint8,
        )


        image = cv2.imdecode(
            np_array,
            cv2.IMREAD_COLOR,
        )


        if image is None:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Unable to decode "
                    "camera frame"
                ),
            )


        _, ai_result = process_frame(
            image
        )

        return ai_result


    except HTTPException:

        raise


    except Exception as error:

        print(
            "Frame analysis error:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "AI frame analysis failed"
            ),
        )