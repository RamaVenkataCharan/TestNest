from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from fastapi.responses import StreamingResponse

from sqlalchemy.orm import Session
from sqlalchemy import func

from io import BytesIO
import re

from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.styles import (
    getSampleStyleSheet,
    ParagraphStyle
)
from reportlab.lib.units import mm

from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak
)

from app.database.database import get_db

from app.models.ai_event import AIEvent
from app.models.user import User
from app.models.exam import Exam
from app.models.exam_attempt import ExamAttempt
from app.models.question import Question
from app.models.student_answer import StudentAnswer

from app.auth import get_current_admin

from app.utils.risk_calculator import calculate_risk


router = APIRouter(
    prefix="/ai-reports",
    tags=["AI Reports"]
)


# =========================================================
# HELPER - ATTEMPT RISK
# =========================================================

def get_attempt_risk(points: int):

    points = int(points or 0)

    if points >= 100:
        return "Critical"

    if points >= 80:
        return "High"

    if points >= 50:
        return "Medium"

    if points >= 30:
        return "Warning"

    return "Low"


# =========================================================
# HELPER - SAFE PDF TEXT
# =========================================================

def safe_text(value):

    if value is None:
        return ""

    return escape(str(value))


# =========================================================
# HELPER - FILE NAME
# =========================================================

def safe_filename(value):

    value = str(value or "report")

    value = re.sub(
        r"[^A-Za-z0-9_-]+",
        "_",
        value
    )

    return value.strip("_") or "report"


# =========================================================
# HELPER - ANSWER TEXT
# =========================================================

def get_answer_text(
    question,
    answer_letter
):

    if not answer_letter:

        return "Not Answered"


    answer_letter = (
        str(answer_letter)
        .strip()
        .upper()
    )


    options = {
        "A": question.option_a,
        "B": question.option_b,
        "C": question.option_c,
        "D": question.option_d
    }


    option_text = options.get(
        answer_letter
    )


    if option_text is None:

        return answer_letter


    return (
        f"{answer_letter}. "
        f"{option_text}"
    )


# =========================================================
# HELPER - BUILD COMPLETE ATTEMPT REPORT
# =========================================================

def build_attempt_report(
    attempt_id: int,
    db: Session
):

    # -----------------------------------------------------
    # GET ATTEMPT
    # -----------------------------------------------------

    attempt = (
        db.query(ExamAttempt)
        .filter(
            ExamAttempt.id ==
            attempt_id
        )
        .first()
    )


    if not attempt:

        raise HTTPException(
            status_code=404,
            detail="Exam attempt not found"
        )


    # -----------------------------------------------------
    # GET STUDENT
    # -----------------------------------------------------

    student = (
        db.query(User)
        .filter(
            User.id ==
            attempt.student_id
        )
        .first()
    )


    if not student:

        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )


    # -----------------------------------------------------
    # GET EXAM
    # -----------------------------------------------------

    exam = (
        db.query(Exam)
        .filter(
            Exam.id ==
            attempt.exam_id
        )
        .first()
    )


    if not exam:

        raise HTTPException(
            status_code=404,
            detail="Exam not found"
        )


    # -----------------------------------------------------
    # GET ALL QUESTIONS OF EXAM
    # -----------------------------------------------------

    questions = (
        db.query(Question)
        .filter(
            Question.exam_id ==
            exam.id
        )
        .order_by(
            Question.id.asc()
        )
        .all()
    )


    # -----------------------------------------------------
    # GET STUDENT ANSWERS
    # -----------------------------------------------------

    student_answers = (
        db.query(StudentAnswer)
        .filter(
            StudentAnswer.attempt_id ==
            attempt.id
        )
        .all()
    )


    answer_map = {
        answer.question_id:
            answer
        for answer
        in student_answers
    }


    # -----------------------------------------------------
    # BUILD QUESTION REPORT
    # -----------------------------------------------------

    question_report = []


    for index, question in enumerate(
        questions,
        start=1
    ):

        student_answer = (
            answer_map.get(
                question.id
            )
        )


        selected_letter = None


        if student_answer:

            selected_letter = (
                student_answer
                .selected_answer
                .upper()
            )


        correct_letter = (
            question
            .correct_answer
            .upper()
        )


        if selected_letter is None:

            answer_status = (
                "Not Answered"
            )

            is_correct = False

        elif (
            selected_letter ==
            correct_letter
        ):

            answer_status = "Correct"

            is_correct = True

        else:

            answer_status = "Wrong"

            is_correct = False


        question_report.append({

            "question_number":
                index,

            "question_id":
                question.id,

            "question":
                question.question,

            "option_a":
                question.option_a,

            "option_b":
                question.option_b,

            "option_c":
                question.option_c,

            "option_d":
                question.option_d,

            "selected_answer_letter":
                selected_letter,

            "selected_answer":
                get_answer_text(
                    question,
                    selected_letter
                ),

            "correct_answer_letter":
                correct_letter,

            "correct_answer":
                get_answer_text(
                    question,
                    correct_letter
                ),

            "is_correct":
                is_correct,

            "status":
                answer_status
        })


    # -----------------------------------------------------
    # AI EVENTS
    # -----------------------------------------------------

    ai_events = (
        db.query(AIEvent)
        .filter(
            AIEvent.attempt_id ==
            attempt.id
        )
        .order_by(
            AIEvent.created_at.asc()
        )
        .all()
    )


    total_ai_events = len(
        ai_events
    )


    total_ai_points = sum(
        int(event.points or 0)
        for event in ai_events
    )


    tab_switch_count = sum(
        1
        for event in ai_events
        if event.event ==
        "Tab Switching Detected"
    )


    ai_event_report = []


    for event in ai_events:

        ai_event_report.append({

            "id":
                event.id,

            "event":
                event.event,

            "points":
                event.points,

            "created_at":
                event.created_at
        })


    # -----------------------------------------------------
    # FINAL REPORT OBJECT
    # -----------------------------------------------------

    return {

        "attempt_id":
            attempt.id,

        "student": {

            "id":
                student.id,

            "name":
                student.full_name,

            "email":
                student.email
        },

        "exam": {

            "id":
                exam.id,

            "title":
                exam.title,

            "subject":
                exam.subject,

            "description":
                exam.description,

            "duration":
                exam.duration,

            "total_marks":
                exam.total_marks
        },

        "score":
            attempt.score or 0,

        "submitted_at":
            attempt.submitted_at,

        "questions":
            question_report,

        "ai_summary": {

            "total_events":
                total_ai_events,

            "total_points":
                total_ai_points,

            "tab_switch_count":
                tab_switch_count,

            "risk_level":
                get_attempt_risk(
                    total_ai_points
                )
        },

        "ai_events":
            ai_event_report
    }


# =========================================================
# ALL AI EVENTS
# =========================================================

@router.get("/")
def get_ai_reports(
    db: Session = Depends(get_db),
    current_admin=Depends(
        get_current_admin
    )
):

    events = (
        db.query(AIEvent)
        .order_by(
            AIEvent.created_at.desc()
        )
        .all()
    )


    return [

        {
            "id":
                event.id,

            "attempt_id":
                event.attempt_id,

            "event":
                event.event,

            "points":
                event.points,

            "created_at":
                event.created_at,

            "risk":
                calculate_risk(
                    event.points
                )
        }

        for event in events
    ]


# =========================================================
# GLOBAL AI SUMMARY
# =========================================================

@router.get("/summary")
def get_ai_report_summary(
    db: Session = Depends(get_db),
    current_admin=Depends(
        get_current_admin
    )
):

    events = (
        db.query(AIEvent)
        .order_by(
            AIEvent.created_at.desc()
        )
        .all()
    )


    total_events = len(
        events
    )


    total_points = sum(
        int(event.points or 0)
        for event in events
    )


    latest_event = None
    latest_time = None


    if events:

        latest_event = (
            events[0].event
        )

        latest_time = (
            events[0].created_at
        )


    return {

        "total_events":
            total_events,

        "total_points":
            total_points,

        "latest_event":
            latest_event,

        "latest_time":
            latest_time
    }


# =========================================================
# STUDENT AI SUMMARY
# =========================================================

@router.get("/students")
def get_student_ai_summary(
    db: Session = Depends(get_db),
    current_admin=Depends(
        get_current_admin
    )
):

    results = (
        db.query(

            User.id.label(
                "student_id"
            ),

            User.full_name.label(
                "student_name"
            ),

            func.count(
                AIEvent.id
            ).label(
                "total_events"
            ),

            func.coalesce(
                func.sum(
                    AIEvent.points
                ),
                0
            ).label(
                "total_points"
            )
        )

        .outerjoin(
            ExamAttempt,
            ExamAttempt.student_id ==
            User.id
        )

        .outerjoin(
            AIEvent,
            AIEvent.attempt_id ==
            ExamAttempt.id
        )

        .filter(
            User.role ==
            "student"
        )

        .group_by(
            User.id,
            User.full_name
        )

        .order_by(
            func.coalesce(
                func.sum(
                    AIEvent.points
                ),
                0
            ).desc()
        )

        .all()
    )


    return [

        {
            "student_id":
                row.student_id,

            "student_name":
                row.student_name,

            "total_events":
                int(
                    row.total_events or 0
                ),

            "total_points":
                int(
                    row.total_points or 0
                )
        }

        for row in results
    ]


# =========================================================
# EXAMS AVAILABLE IN REPORTS
# =========================================================

@router.get("/exams")
def get_report_exams(
    db: Session = Depends(get_db),
    current_admin=Depends(
        get_current_admin
    )
):

    results = (
        db.query(

            Exam.id,

            Exam.title,

            Exam.subject,

            Exam.total_marks,

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
            )
        )

        .outerjoin(
            ExamAttempt,
            ExamAttempt.exam_id ==
            Exam.id
        )

        .group_by(
            Exam.id,
            Exam.title,
            Exam.subject,
            Exam.total_marks
        )

        .order_by(
            Exam.title.asc()
        )

        .all()
    )


    return [

        {
            "exam_id":
                row.id,

            "title":
                row.title,

            "subject":
                row.subject,

            "total_marks":
                row.total_marks,

            "total_attempts":
                int(
                    row.total_attempts or 0
                ),

            "total_students":
                int(
                    row.total_students or 0
                )
        }

        for row in results
    ]


# =========================================================
# STUDENTS / ATTEMPTS FOR PARTICULAR EXAM
# =========================================================

@router.get(
    "/exam/{exam_id}/students"
)
def get_exam_student_reports(
    exam_id: int,
    db: Session = Depends(get_db),
    current_admin=Depends(
        get_current_admin
    )
):

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


    rows = (
        db.query(

            ExamAttempt.id.label(
                "attempt_id"
            ),

            ExamAttempt.student_id,

            User.full_name.label(
                "student_name"
            ),

            User.email.label(
                "student_email"
            ),

            ExamAttempt.score,

            ExamAttempt.submitted_at,

            func.count(
                AIEvent.id
            ).label(
                "total_ai_events"
            ),

            func.coalesce(
                func.sum(
                    AIEvent.points
                ),
                0
            ).label(
                "total_ai_points"
            )
        )

        .join(
            User,
            User.id ==
            ExamAttempt.student_id
        )

        .outerjoin(
            AIEvent,
            AIEvent.attempt_id ==
            ExamAttempt.id
        )

        .filter(
            ExamAttempt.exam_id ==
            exam_id
        )

        .group_by(
            ExamAttempt.id,
            ExamAttempt.student_id,
            User.full_name,
            User.email,
            ExamAttempt.score,
            ExamAttempt.submitted_at
        )

        .order_by(
            ExamAttempt.score.desc(),
            ExamAttempt.submitted_at.desc()
        )

        .all()
    )


    students = []


    for row in rows:

        total_points = int(
            row.total_ai_points or 0
        )


        tab_switch_count = (
            db.query(
                func.count(
                    AIEvent.id
                )
            )

            .filter(
                AIEvent.attempt_id ==
                row.attempt_id,

                AIEvent.event ==
                "Tab Switching Detected"
            )

            .scalar()
        )


        students.append({

            "attempt_id":
                row.attempt_id,

            "student_id":
                row.student_id,

            "student_name":
                row.student_name,

            "student_email":
                row.student_email,

            "score":
                row.score or 0,

            "total_marks":
                exam.total_marks,

            "submitted_at":
                row.submitted_at,

            "total_ai_events":
                int(
                    row.total_ai_events or 0
                ),

            "total_ai_points":
                total_points,

            "tab_switch_count":
                int(
                    tab_switch_count or 0
                ),

            "risk_level":
                get_attempt_risk(
                    total_points
                ),

            "pdf_url":
                (
                    f"/ai-reports/"
                    f"attempt/"
                    f"{row.attempt_id}/pdf"
                )
        })


    return {

        "exam": {

            "id":
                exam.id,

            "title":
                exam.title,

            "subject":
                exam.subject,

            "total_marks":
                exam.total_marks
        },

        "total_attempts":
            len(students),

        "students":
            students
    }


# =========================================================
# COMPLETE ATTEMPT REPORT JSON
# =========================================================

@router.get(
    "/attempt/{attempt_id}"
)
def get_attempt_report(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_admin=Depends(
        get_current_admin
    )
):

    return build_attempt_report(
        attempt_id,
        db
    )


# =========================================================
# GENERATE INDIVIDUAL STUDENT EXAM PDF
# =========================================================

@router.get(
    "/attempt/{attempt_id}/pdf"
)
def download_attempt_pdf(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_admin=Depends(
        get_current_admin
    )
):

    report = (
        build_attempt_report(
            attempt_id,
            db
        )
    )


    student = report["student"]

    exam = report["exam"]

    ai_summary = (
        report["ai_summary"]
    )


    # =====================================================
    # CREATE PDF
    # =====================================================

    buffer = BytesIO()


    document = SimpleDocTemplate(

        buffer,

        pagesize=A4,

        rightMargin=15 * mm,

        leftMargin=15 * mm,

        topMargin=15 * mm,

        bottomMargin=15 * mm
    )


    styles = (
        getSampleStyleSheet()
    )


    title_style = ParagraphStyle(

        "ReportTitle",

        parent=styles[
            "Title"
        ],

        alignment=TA_CENTER,

        fontSize=18,

        leading=22,

        spaceAfter=10
    )


    heading_style = ParagraphStyle(

        "SectionHeading",

        parent=styles[
            "Heading2"
        ],

        fontSize=13,

        leading=16,

        spaceBefore=8,

        spaceAfter=8
    )


    normal_style = (
        styles["BodyText"]
    )


    story = []


    # =====================================================
    # TITLE
    # =====================================================

    story.append(

        Paragraph(
            "AI EXAM PROCTORING SYSTEM",
            title_style
        )
    )


    story.append(

        Paragraph(
            "Individual Student Exam Report",
            styles["Heading2"]
        )
    )


    story.append(
        Spacer(
            1,
            8
        )
    )


    # =====================================================
    # STUDENT DETAILS
    # =====================================================

    story.append(

        Paragraph(
            "Student Details",
            heading_style
        )
    )


    student_data = [

        [
            "Student Name",
            safe_text(
                student["name"]
            )
        ],

        [
            "Email",
            safe_text(
                student["email"]
            )
        ],

        [
            "Student ID",
            str(
                student["id"]
            )
        ],

        [
            "Attempt ID",
            str(
                report["attempt_id"]
            )
        ]
    ]


    student_table = Table(

        student_data,

        colWidths=[
            45 * mm,
            120 * mm
        ]
    )


    student_table.setStyle(

        TableStyle([

            (
                "GRID",
                (0, 0),
                (-1, -1),
                0.5,
                colors.grey
            ),

            (
                "BACKGROUND",
                (0, 0),
                (0, -1),
                colors.lightgrey
            ),

            (
                "VALIGN",
                (0, 0),
                (-1, -1),
                "TOP"
            ),

            (
                "PADDING",
                (0, 0),
                (-1, -1),
                6
            )
        ])
    )


    story.append(
        student_table
    )


    story.append(
        Spacer(
            1,
            10
        )
    )


    # =====================================================
    # EXAM DETAILS
    # =====================================================

    story.append(

        Paragraph(
            "Exam Details",
            heading_style
        )
    )


    submitted_text = "-"


    if report["submitted_at"]:

        try:

            submitted_text = (
                report[
                    "submitted_at"
                ].strftime(
                    "%d-%m-%Y %H:%M:%S"
                )
            )

        except Exception:

            submitted_text = str(
                report[
                    "submitted_at"
                ]
            )


    exam_data = [

        [
            "Exam",
            safe_text(
                exam["title"]
            )
        ],

        [
            "Subject",
            safe_text(
                exam["subject"]
            )
        ],

        [
            "Duration",
            (
                f"{exam['duration']} "
                f"minutes"
            )
        ],

        [
            "Score",
            (
                f"{report['score']} / "
                f"{exam['total_marks']}"
            )
        ],

        [
            "Attempt Date",
            submitted_text
        ]
    ]


    exam_table = Table(

        exam_data,

        colWidths=[
            45 * mm,
            120 * mm
        ]
    )


    exam_table.setStyle(

        TableStyle([

            (
                "GRID",
                (0, 0),
                (-1, -1),
                0.5,
                colors.grey
            ),

            (
                "BACKGROUND",
                (0, 0),
                (0, -1),
                colors.lightgrey
            ),

            (
                "VALIGN",
                (0, 0),
                (-1, -1),
                "TOP"
            ),

            (
                "PADDING",
                (0, 0),
                (-1, -1),
                6
            )
        ])
    )


    story.append(
        exam_table
    )


    story.append(
        Spacer(
            1,
            10
        )
    )


    # =====================================================
    # AI SUMMARY
    # =====================================================

    story.append(

        Paragraph(
            "AI Proctoring Summary",
            heading_style
        )
    )


    ai_data = [

        [
            "Total AI Events",
            str(
                ai_summary[
                    "total_events"
                ]
            )
        ],

        [
            "Suspicious Points",
            str(
                ai_summary[
                    "total_points"
                ]
            )
        ],

        [
            "Tab Switches",
            str(
                ai_summary[
                    "tab_switch_count"
                ]
            )
        ],

        [
            "Risk Level",
            safe_text(
                ai_summary[
                    "risk_level"
                ]
            )
        ]
    ]


    ai_table = Table(

        ai_data,

        colWidths=[
            45 * mm,
            120 * mm
        ]
    )


    ai_table.setStyle(

        TableStyle([

            (
                "GRID",
                (0, 0),
                (-1, -1),
                0.5,
                colors.grey
            ),

            (
                "BACKGROUND",
                (0, 0),
                (0, -1),
                colors.lightgrey
            ),

            (
                "VALIGN",
                (0, 0),
                (-1, -1),
                "TOP"
            ),

            (
                "PADDING",
                (0, 0),
                (-1, -1),
                6
            )
        ])
    )


    story.append(
        ai_table
    )


    story.append(
        Spacer(
            1,
            15
        )
    )


    # =====================================================
    # QUESTION REPORT
    # =====================================================

    story.append(

        Paragraph(
            "Question and Answer Report",
            heading_style
        )
    )


    if not report["questions"]:

        story.append(

            Paragraph(
                "No questions found for this exam.",
                normal_style
            )
        )


    for item in report["questions"]:

        story.append(
            Spacer(
                1,
                6
            )
        )


        story.append(

            Paragraph(

                (
                    f"<b>Question "
                    f"{item['question_number']}:</b> "
                    f"{safe_text(item['question'])}"
                ),

                normal_style
            )
        )


        story.append(
            Spacer(
                1,
                4
            )
        )


        options_data = [

            [
                "A",
                Paragraph(
                    safe_text(
                        item[
                            "option_a"
                        ]
                    ),
                    normal_style
                )
            ],

            [
                "B",
                Paragraph(
                    safe_text(
                        item[
                            "option_b"
                        ]
                    ),
                    normal_style
                )
            ],

            [
                "C",
                Paragraph(
                    safe_text(
                        item[
                            "option_c"
                        ]
                    ),
                    normal_style
                )
            ],

            [
                "D",
                Paragraph(
                    safe_text(
                        item[
                            "option_d"
                        ]
                    ),
                    normal_style
                )
            ]
        ]


        options_table = Table(

            options_data,

            colWidths=[
                12 * mm,
                153 * mm
            ]
        )


        options_table.setStyle(

            TableStyle([

                (
                    "GRID",
                    (0, 0),
                    (-1, -1),
                    0.3,
                    colors.lightgrey
                ),

                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "TOP"
                ),

                (
                    "PADDING",
                    (0, 0),
                    (-1, -1),
                    4
                )
            ])
        )


        story.append(
            options_table
        )


        story.append(
            Spacer(
                1,
                4
            )
        )


        answer_data = [

            [
                "Student Answer",

                Paragraph(
                    safe_text(
                        item[
                            "selected_answer"
                        ]
                    ),
                    normal_style
                )
            ],

            [
                "Correct Answer",

                Paragraph(
                    safe_text(
                        item[
                            "correct_answer"
                        ]
                    ),
                    normal_style
                )
            ],

            [
                "Result",
                item["status"]
            ]
        ]


        answer_table = Table(

            answer_data,

            colWidths=[
                40 * mm,
                125 * mm
            ]
        )


        answer_table.setStyle(

            TableStyle([

                (
                    "GRID",
                    (0, 0),
                    (-1, -1),
                    0.5,
                    colors.grey
                ),

                (
                    "BACKGROUND",
                    (0, 0),
                    (0, -1),
                    colors.lightgrey
                ),

                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "TOP"
                ),

                (
                    "PADDING",
                    (0, 0),
                    (-1, -1),
                    5
                )
            ])
        )


        story.append(
            answer_table
        )


        story.append(
            Spacer(
                1,
                10
            )
        )


    # =====================================================
    # PAGE BREAK BEFORE AI EVENTS
    # =====================================================

    story.append(
        PageBreak()
    )


    # =====================================================
    # AI EVENT HISTORY
    # =====================================================

    story.append(

        Paragraph(
            "Suspicious Activity History",
            heading_style
        )
    )


    event_rows = [

        [
            "S.No",
            "Event",
            "Points",
            "Time"
        ]
    ]


    for index, event in enumerate(
        report["ai_events"],
        start=1
    ):

        event_time = "-"


        if event["created_at"]:

            try:

                event_time = (
                    event[
                        "created_at"
                    ].strftime(
                        "%d-%m-%Y %H:%M:%S"
                    )
                )

            except Exception:

                event_time = str(
                    event[
                        "created_at"
                    ]
                )


        event_rows.append([

            str(index),

            Paragraph(
                safe_text(
                    event["event"]
                ),
                normal_style
            ),

            str(
                event["points"]
            ),

            event_time
        ])


    if len(event_rows) == 1:

        event_rows.append([

            "-",

            "No suspicious events recorded",

            "0",

            "-"
        ])


    event_table = Table(

        event_rows,

        repeatRows=1,

        colWidths=[
            15 * mm,
            85 * mm,
            20 * mm,
            45 * mm
        ]
    )


    event_table.setStyle(

        TableStyle([

            (
                "BACKGROUND",
                (0, 0),
                (-1, 0),
                colors.lightgrey
            ),

            (
                "GRID",
                (0, 0),
                (-1, -1),
                0.5,
                colors.grey
            ),

            (
                "VALIGN",
                (0, 0),
                (-1, -1),
                "TOP"
            ),

            (
                "PADDING",
                (0, 0),
                (-1, -1),
                5
            )
        ])
    )


    story.append(
        event_table
    )


    story.append(
        Spacer(
            1,
            15
        )
    )


    story.append(

        Paragraph(
            (
                "<b>Final Suspicious Points:</b> "
                f"{ai_summary['total_points']}"
            ),
            normal_style
        )
    )


    story.append(

        Paragraph(
            (
                "<b>Final Risk Level:</b> "
                f"{safe_text(ai_summary['risk_level'])}"
            ),
            normal_style
        )
    )


    # =====================================================
    # BUILD PDF
    # =====================================================

    document.build(
        story
    )


    buffer.seek(0)


    file_name = (

        f"{safe_filename(student['name'])}_"
        f"{safe_filename(exam['title'])}_"
        f"Attempt_{report['attempt_id']}.pdf"
    )


    return StreamingResponse(

        buffer,

        media_type=
            "application/pdf",

        headers={

            "Content-Disposition":
                (
                    f'attachment; '
                    f'filename="{file_name}"'
                )
        }
    )