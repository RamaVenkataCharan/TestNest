from pydantic import BaseModel
from typing import Optional


class ExamCreate(BaseModel):
    title: str
    subject: str
    description: Optional[str] = None
    duration: int
    total_marks: int


class ExamUpdate(BaseModel):
    title: Optional[str] = None
    subject: Optional[str] = None
    description: Optional[str] = None
    duration: Optional[int] = None
    total_marks: Optional[int] = None


class ExamResponse(ExamCreate):
    id: int

    class Config:
        from_attributes = True