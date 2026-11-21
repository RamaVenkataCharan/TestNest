from pydantic import BaseModel
from datetime import datetime


class AIEventSchema(BaseModel):
    id: int
    event: str
    points: int
    created_at: datetime

    class Config:
        from_attributes = True

class AttemptEvent(BaseModel):
    event: str
    points: int
    created_at: datetime


class AttemptDetails(BaseModel):
    attempt_id: int
    student_name: str
    exam_title: str
    score: int
    total_events: int
    total_points: int
    risk_level: str
    created_at: datetime
    events: list[AttemptEvent]