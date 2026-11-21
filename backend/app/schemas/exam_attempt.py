from pydantic import BaseModel


class StartExamRequest(BaseModel):
    exam_id: int


class ExamAttemptResponse(BaseModel):
    id: int
    student_id: int
    exam_id: int
    score: int

    class Config:
        from_attributes = True


class ResultResponse(BaseModel):
    id: int
    student_id: int
    exam_id: int
    score: int

    class Config:
        from_attributes = True