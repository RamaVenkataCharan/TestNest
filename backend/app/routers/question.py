from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models import Question, Exam
from app.schemas import (
    QuestionCreate,
    QuestionUpdate,
    QuestionResponse,
    StudentQuestionResponse,
)
from app.auth import (
    get_current_admin,
    get_current_user
)

router = APIRouter(
    prefix="/questions",
    tags=["Questions"]
)


# -------------------------
# Create Question (Admin Only)
# -------------------------
@router.post(
    "/",
    response_model=QuestionResponse,
    status_code=status.HTTP_201_CREATED
)
def create_question(
    question: QuestionCreate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):
    exam = db.query(Exam).filter(
        Exam.id == question.exam_id
    ).first()

    if not exam:
        raise HTTPException(
            status_code=404,
            detail="Exam not found"
        )

    new_question = Question(
        exam_id=question.exam_id,
        question=question.question,
        option_a=question.option_a,
        option_b=question.option_b,
        option_c=question.option_c,
        option_d=question.option_d,
        correct_answer=question.correct_answer
    )

    db.add(new_question)
    db.commit()
    db.refresh(new_question)

    return new_question

# -------------------------
# Get All Questions
# -------------------------
@router.get("/", response_model=list[QuestionResponse])
def get_all_questions(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return db.query(Question).all()

# -------------------------
# Get Questions By Exam
# -------------------------
@router.get(
    "/exam/{exam_id}",
    response_model=list[StudentQuestionResponse]
)
def get_exam_questions(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    exam = db.query(Exam).filter(
        Exam.id == exam_id
    ).first()

    if not exam:
        raise HTTPException(
            status_code=404,
            detail="Exam not found"
        )

    return db.query(Question).filter(
        Question.exam_id == exam_id
    ).all()

# -------------------------
# Get Question By ID
# -------------------------
@router.get("/{question_id}", response_model=QuestionResponse)
def get_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    question = db.query(Question).filter(
        Question.id == question_id
    ).first()

    if not question:
        raise HTTPException(
            status_code=404,
            detail="Question not found"
        )

    return question

# -------------------------
# Update Question (Admin Only)
# -------------------------
@router.put("/{question_id}", response_model=QuestionResponse)
def update_question(
    question_id: int,
    updated_question: QuestionUpdate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):
    question = db.query(Question).filter(
        Question.id == question_id
    ).first()

    if not question:
        raise HTTPException(
            status_code=404,
            detail="Question not found"
        )

    update_data = updated_question.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(question, key, value)

    db.commit()
    db.refresh(question)

    return question

# -------------------------
# Delete Question (Admin Only)
# -------------------------
@router.delete("/{question_id}")
def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):
    question = db.query(Question).filter(
        Question.id == question_id
    ).first()

    if not question:
        raise HTTPException(
            status_code=404,
            detail="Question not found"
        )

    db.delete(question)
    db.commit()

    return {
        "message": "Question deleted successfully"
    }

@router.get(
    "/admin/exam/{exam_id}",
    response_model=list[QuestionResponse]
)
def get_exam_questions_admin(
    exam_id: int,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):
    exam = db.query(Exam).filter(
        Exam.id == exam_id
    ).first()

    if not exam:
        raise HTTPException(
            status_code=404,
            detail="Exam not found"
        )

    return db.query(Question).filter(
        Question.exam_id == exam_id
    ).all()