from pydantic import BaseModel


class EventCount(BaseModel):
    event: str
    count: int
    points: int


class DashboardSummary(BaseModel):
    total_events: int
    total_points: int
    risk_level: str
    average_events: float
    events: list[EventCount]