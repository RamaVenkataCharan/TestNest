from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.auth import get_current_admin

from app.schemas.attempt_details import AttemptDetails
from app.services.attempt_details_service import (
    get_attempt_details,
)

router = APIRouter(
    prefix="/attempt-details",
    tags=["Attempt Details"],
)


@router.get(
    "/{attempt_id}",
    response_model=AttemptDetails,
)
def attempt_details(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    return get_attempt_details(db, attempt_id)