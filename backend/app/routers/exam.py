from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models import Exam
from app.schemas import ExamCreate,ExamUpdate,ExamResponse
from app.auth import get_current_admin, get_current_user

router = APIRouter(
    prefix="/exams",
    tags=["Exams"]
)


# -------------------------
# Create Exam (Admin Only)
# -------------------------
@router.post(
    "/",
    response_model=ExamResponse,
    status_code=status.HTTP_201_CREATED
)
def create_exam(
    exam: ExamCreate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):
    new_exam = Exam(
        title=exam.title,
        subject=exam.subject,
        description=exam.description,
        duration=exam.duration,
        total_marks=exam.total_marks
    )

    db.add(new_exam)
    db.commit()
    db.refresh(new_exam)

    return new_exam

# -------------------------
# Get All Exams
# -------------------------
@router.get("/", response_model=list[ExamResponse])
def get_all_exams(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    exams = db.query(Exam).all()
    return exams

# -------------------------
# Get Exam By ID
# -------------------------
@router.get("/{exam_id}", response_model=ExamResponse)
def get_exam(
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

    return exam

# -------------------------
# Update Exam (Admin Only)
# -------------------------
@router.put("/{exam_id}", response_model=ExamResponse)
def update_exam(
    exam_id: int,
    updated_exam: ExamUpdate,
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

    update_data = updated_exam.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(exam, key, value)

    db.commit()
    db.refresh(exam)

    return exam

# -------------------------
# Delete Exam (Admin Only)
# -------------------------
@router.delete("/{exam_id}")
def delete_exam(
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

    db.delete(exam)
    db.commit()

    return {
        "message": "Exam deleted successfully"
    }