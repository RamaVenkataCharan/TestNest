from pydantic import BaseModel, ConfigDict
from typing import Optional


class QuestionCreate(BaseModel):
    exam_id: int
    question: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_answer: str


class QuestionUpdate(BaseModel):
    question: Optional[str] = None
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    correct_answer: Optional[str] = None


class QuestionResponse(BaseModel):
    id: int
    exam_id: int
    question: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_answer: str

    model_config = ConfigDict(from_attributes=True)


class StudentQuestionResponse(BaseModel):
    id: int
    exam_id: int
    question: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str

    model_config = ConfigDict(from_attributes=True)