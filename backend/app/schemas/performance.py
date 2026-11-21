from pydantic import BaseModel
from datetime import datetime


class PerformanceResponse(BaseModel):
    student_name: str
    exam_title: str
    score: int
    result: str
    submitted_at: datetime

    class Config:
        from_attributes = True


class PerformanceSummary(BaseModel):
    total_students: int
    total_attempts: int
    average_score: float
    highest_score: int