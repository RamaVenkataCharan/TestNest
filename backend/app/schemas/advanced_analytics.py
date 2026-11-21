from pydantic import BaseModel


class AdvancedAnalytics(BaseModel):
    attempt_id: int
    student_name: str
    exam_title: str
    score: float
    total_events: int
    total_points: int
    risk_level: str

    class Config:
        from_attributes = True