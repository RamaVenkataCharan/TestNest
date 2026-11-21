from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.database import get_db

from app.auth import get_current_admin

from app.schemas.ranking import StudentRanking

from app.services.ranking_service import (
    get_student_rankings
)

from app.models.exam import Exam
from app.models.exam_attempt import ExamAttempt
from app.models.user import User
from app.models.question import Question


router = APIRouter(
    prefix="/ranking",
    tags=["Student Ranking"],
)


# =========================================================
# EXISTING OVERALL RANKING
# =========================================================

@router.get(
    "/",
    response_model=list[StudentRanking],
)
def ranking(
    db: Session = Depends(get_db),
    current_admin=Depends(
        get_current_admin
    ),
):

    return get_student_rankings(
        db
    )


# =========================================================
# GET EXAMS FOR EXAM-WISE LEADERBOARD
# =========================================================

@router.get("/exams")
def ranking_exams(
    db: Session = Depends(get_db),
    current_admin=Depends(
        get_current_admin
    ),
):

    rows = (

        db.query(

            Exam.id.label(
                "exam_id"
            ),

            Exam.title,

            Exam.subject,

            func.count(
                ExamAttempt.id
            ).label(
                "total_attempts"
            ),

            func.count(
                func.distinct(
                    ExamAttempt.student_id
                )
            ).label(
                "total_students"
            ),
        )

        .outerjoin(
            ExamAttempt,
            ExamAttempt.exam_id ==
            Exam.id,
        )

        .group_by(
            Exam.id,
            Exam.title,
            Exam.subject,
        )

        .order_by(
            Exam.title.asc()
        )

        .all()
    )


    return [

        {

            "exam_id":
                row.exam_id,

            "title":
                row.title,

            "subject":
                row.subject,

            "total_attempts":
                int(
                    row.total_attempts
                    or 0
                ),

            "total_students":
                int(
                    row.total_students
                    or 0
                ),
        }

        for row in rows
    ]


# =========================================================
# EXAM-WISE RANKING
# =========================================================

@router.get(
    "/exam/{exam_id}"
)
def exam_ranking(
    exam_id: int,
    db: Session = Depends(get_db),
    current_admin=Depends(
        get_current_admin
    ),
):

    # -----------------------------------------------------
    # FIND EXAM
    # -----------------------------------------------------

    exam = (

        db.query(Exam)

        .filter(
            Exam.id ==
            exam_id
        )

        .first()
    )


    if not exam:

        raise HTTPException(
            status_code=404,
            detail="Exam not found"
        )


    # -----------------------------------------------------
    # TOTAL QUESTIONS
    # -----------------------------------------------------

    total_questions = (

        db.query(
            func.count(
                Question.id
            )
        )

        .filter(
            Question.exam_id ==
            exam_id
        )

        .scalar()

    ) or 0


    # -----------------------------------------------------
    # GET ALL ATTEMPTS FOR SELECTED EXAM
    # -----------------------------------------------------

    attempts = (

        db.query(

            ExamAttempt.id.label(
                "attempt_id"
            ),

            ExamAttempt.student_id,

            ExamAttempt.score,

            User.full_name.label(
                "student_name"
            ),

            User.email.label(
                "student_email"
            ),
        )

        .join(
            User,
            User.id ==
            ExamAttempt.student_id,
        )

        .filter(
            ExamAttempt.exam_id ==
            exam_id
        )

        .order_by(

            # Highest score first
            ExamAttempt.score.desc(),

            # If same score,
            # older/lower attempt ID first
            ExamAttempt.id.asc(),
        )

        .all()
    )


    # -----------------------------------------------------
    # COUNT ATTEMPTS FOR EACH STUDENT
    # -----------------------------------------------------

    attempt_counts = {}


    for row in attempts:

        attempt_counts[
            row.student_id
        ] = (

            attempt_counts.get(
                row.student_id,
                0
            )
            +
            1
        )


    # -----------------------------------------------------
    # KEEP BEST ATTEMPT FOR EACH STUDENT
    # -----------------------------------------------------

    best_attempts = []

    seen_students = set()


    # Attempts are already sorted
    # highest score first.
    # First occurrence = best attempt.

    for row in attempts:

        if (
            row.student_id
            in seen_students
        ):

            continue


        seen_students.add(
            row.student_id
        )


        best_attempts.append(
            row
        )


    # -----------------------------------------------------
    # CREATE FINAL RANKING
    # -----------------------------------------------------

    rankings = []


    for index, row in enumerate(
        best_attempts,
        start=1
    ):

        raw_score = int(
            row.score or 0
        )

        # Prevent old/inconsistent attempts
        # from displaying more than the
        # current exam maximum.
        display_score = min(
            raw_score,
            total_questions
        )

        percentage = 0

        if total_questions > 0:

            percentage = round(
                (
                    display_score
                    /
                    total_questions
                )
                *
                100,
                2
            )


        rankings.append({

            "rank":
                index,

            "student_id":
                row.student_id,

            "student_name":
                row.student_name,

            "student_email":
                row.student_email,

            "attempt_id":
                row.attempt_id,

            "score":
                display_score,

            "max_score":
                total_questions,

            "total_marks":
                exam.total_marks,

            "percentage":
                percentage,

            "attempts_for_exam":
                attempt_counts.get(
                    row.student_id,
                    1
                ),
        })


    # -----------------------------------------------------
    # RETURN RESULT
    # -----------------------------------------------------

    return {

        "exam": {

            "id":
                exam.id,

            "title":
                exam.title,

            "subject":
                exam.subject,

            "total_marks":
                exam.total_marks,

            "total_questions":
                total_questions,
        },

        "total_ranked_students":
            len(
                rankings
            ),

        "topper":
            rankings[0]
            if rankings
            else None,

        "rankings":
            rankings,
    }