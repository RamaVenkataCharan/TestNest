from pydantic import BaseModel


class StudentRanking(BaseModel):
    rank: int
    student_name: str
    average_score: float
    attempts: int