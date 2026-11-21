from pydantic import BaseModel


class AnswerItem(BaseModel):
    question_id: int
    selected_answer: str


class SubmitExamRequest(BaseModel):
    attempt_id: int
    answers: list[AnswerItem]