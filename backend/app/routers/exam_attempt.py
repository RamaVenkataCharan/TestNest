from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status
)

from sqlalchemy.orm import Session

from app.database.database import get_db

from app.models import (
    Exam,
    ExamAttempt,
    Question,
    StudentAnswer
)

from app.schemas import (
    StartExamRequest,
    ExamAttemptResponse,
    SubmitExamRequest,
    ResultResponse
)

from app.auth import (
    get_current_student,
    get_current_admin
)

# AI proctoring
import app.ai.current_attempt as current_attempt

from app.ai.suspicious_score import (
    reset_score
)

from app.ai.event_flags import (
    reset_flags
)


router = APIRouter(
    prefix="/attempts",
    tags=["Exam Attempts"]
)


# ==========================================
# START EXAM
# ==========================================

@router.post(
    "/start",
    response_model=ExamAttemptResponse,
    status_code=status.HTTP_201_CREATED
)
def start_exam(
    request: StartExamRequest,
    db: Session = Depends(get_db),
    current_student=Depends(
        get_current_student
    )
):

    # ------------------------------------------
    # CHECK EXAM
    # ------------------------------------------

    exam = (
        db.query(Exam)
        .filter(
            Exam.id == request.exam_id
        )
        .first()
    )


    if not exam:

        raise HTTPException(
            status_code=404,
            detail="Exam not found"
        )


    # ------------------------------------------
    # CREATE NEW ATTEMPT
    # ------------------------------------------

    attempt = ExamAttempt(
        student_id=
            current_student["id"],

        exam_id=
            request.exam_id
    )


    db.add(attempt)

    db.commit()

    db.refresh(attempt)


    # ==========================================
    # RESET AI PROCTORING
    # ==========================================

    # Every new exam attempt must begin
    # with suspicious score = 0
    reset_score()


    # Reset AI event duplicate flags
    reset_flags()


    # Set current attempt AFTER reset
    current_attempt.current_attempt_id = (
        attempt.id
    )


    print(
        "New exam started."
    )

    print(
        "Current Attempt ID:",
        current_attempt.current_attempt_id
    )

    print(
        "Suspicious score reset to 0."
    )


    return attempt


# ==========================================
# SUBMIT EXAM
# ==========================================

@router.post("/submit")
def submit_exam(
    request: SubmitExamRequest,
    db: Session = Depends(get_db),
    current_student=Depends(
        get_current_student
    )
):

    attempt = (
        db.query(ExamAttempt)
        .filter(
            ExamAttempt.id ==
                request.attempt_id,

            ExamAttempt.student_id ==
                current_student["id"]
        )
        .first()
    )


    if not attempt:

        raise HTTPException(
            status_code=404,
            detail="Exam attempt not found"
        )


    score = 0


    # ------------------------------------------
    # SAVE STUDENT ANSWERS
    # ------------------------------------------

    for answer in request.answers:

        question = (
            db.query(Question)
            .filter(
                Question.id ==
                    answer.question_id
            )
            .first()
        )


        if not question:

            continue


        student_answer = StudentAnswer(

            attempt_id=
                attempt.id,

            question_id=
                answer.question_id,

            selected_answer=
                answer.selected_answer
        )


        db.add(
            student_answer
        )


        # --------------------------------------
        # CALCULATE EXAM SCORE
        # --------------------------------------

        if (
            answer.selected_answer.upper()
            ==
            question.correct_answer.upper()
        ):

            score += 1


    # ------------------------------------------
    # SAVE FINAL SCORE
    # ------------------------------------------

    attempt.score = score


    db.commit()


    # ------------------------------------------
    # REMOVE ACTIVE ATTEMPT
    # ------------------------------------------

    current_attempt.current_attempt_id = (
        None
    )


    print(
        "Exam submitted."
    )

    print(
        "Final Exam Score:",
        score
    )


    return {
        "message":
            "Exam submitted successfully",

        "score":
            score
    }


# ==========================================
# STUDENT VIEW RESULT
# ==========================================

@router.get(
    "/result/{attempt_id}",
    response_model=ResultResponse
)
def get_result(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_student=Depends(
        get_current_student
    )
):

    attempt = (
        db.query(ExamAttempt)
        .filter(
            ExamAttempt.id ==
                attempt_id,

            ExamAttempt.student_id ==
                current_student["id"]
        )
        .first()
    )


    if not attempt:

        raise HTTPException(
            status_code=404,
            detail="Result not found"
        )


    return attempt


# ==========================================
# STUDENT REVIEW EXAM
# ==========================================

@router.get("/review/{attempt_id}")
def review_exam(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_student=Depends(get_current_student)
):

    # ==========================================
    # FIND ATTEMPT
    # ==========================================

    attempt = (
        db.query(ExamAttempt)
        .filter(
            ExamAttempt.id == attempt_id,
            ExamAttempt.student_id ==
            current_student["id"]
        )
        .first()
    )

    if not attempt:
        raise HTTPException(
            status_code=404,
            detail="Attempt not found"
        )


    # ==========================================
    # GET ALL QUESTIONS FROM THE EXAM
    # ==========================================

    questions = (
        db.query(Question)
        .filter(
            Question.exam_id ==
            attempt.exam_id
        )
        .order_by(
            Question.id.asc()
        )
        .all()
    )


    # ==========================================
    # GET ANSWERS SUBMITTED BY STUDENT
    # ==========================================

    student_answers = (
        db.query(StudentAnswer)
        .filter(
            StudentAnswer.attempt_id ==
            attempt_id
        )
        .all()
    )


    # Create:
    # question_id -> StudentAnswer
    answer_map = {
        answer.question_id: answer
        for answer in student_answers
    }


    # ==========================================
    # BUILD REVIEW FOR ALL QUESTIONS
    # ==========================================

    result = []


    for question in questions:

        student_answer = answer_map.get(
            question.id
        )


        if student_answer:

            selected_answer = (
                student_answer
                .selected_answer
                .upper()
            )

            is_correct = (
                selected_answer ==
                question
                .correct_answer
                .upper()
            )

        else:

            # Student did not answer this question
            selected_answer = "Not Answered"

            is_correct = False


        result.append({

            "question_id":
                question.id,

            "question":
                question.question,

            "selected_answer":
                selected_answer,

            "correct_answer":
                question.correct_answer,

            "is_correct":
                is_correct
        })


    return result

# ==========================================
# ADMIN VIEW ALL ATTEMPTS
# ==========================================

@router.get(
    "/all",
    response_model=
        list[ResultResponse]
)
def get_all_attempts(
    db: Session = Depends(get_db),
    current_admin=Depends(
        get_current_admin
    )
):

    return (
        db.query(
            ExamAttempt
        )
        .all()
    )