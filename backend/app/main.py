import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.database.database import Base, engine

from app.models import (
    User,
    Exam,
    Question,
    ExamAttempt,
    StudentAnswer
)

from app.models.ai_event import AIEvent
from app.models.ai_status import AIStatus

from app.routers import websocket
from app.routers import ai
from app.routers import dashboard
from app.routers import ai_status
from app.routers import ai_events
from app.routers import ai_reports
from app.routers import performance
from app.routers import student_performance

from app.routers import (
    user,
    exam,
    question,
    exam_attempt
)

from app.routers import export_reports
from app.routers import proctor
from app.routers import student_history
from app.routers import ai_event_report
from app.routers import ranking
from app.routers import dashboard_analytics
from app.routers import advanced_analytics
from app.routers import attempt_details

from app.routers.analytics import router as analytics_router
from app.routers.pdf_reports import router as pdf_reports_router

load_dotenv()

cors_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173"
)

allowed_origins = [
    origin.strip()
    for origin in cors_origins.split(",")
    if origin.strip()
]

Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="AI Exam Proctoring API",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# ROUTERS
# =========================

app.include_router(user.router)
app.include_router(exam.router)
app.include_router(question.router)
app.include_router(exam_attempt.router)

app.include_router(websocket.router)

app.include_router(ai.router)
app.include_router(ai_status.router)
app.include_router(ai_events.router)
app.include_router(ai_reports.router)

app.include_router(dashboard.router)
app.include_router(dashboard_analytics.router)

app.include_router(export_reports.router)
app.include_router(pdf_reports_router)
app.include_router(ai_event_report.router)

app.include_router(proctor.router)

app.include_router(student_history.router)
app.include_router(performance.router)
app.include_router(student_performance.router)
app.include_router(ranking.router)

app.include_router(analytics_router)
app.include_router(advanced_analytics.router)
app.include_router(attempt_details.router)


@app.get("/")
def root():
    return {
        "message": "AI Exam Proctoring API is Running"
    }