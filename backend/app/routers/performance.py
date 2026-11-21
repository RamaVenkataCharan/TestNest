from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.auth import get_current_admin

from app.schemas.performance import (
    PerformanceResponse,
    PerformanceSummary,
)

from app.services.performance_service import (
    get_performance_data,
    get_performance_summary,
)

router = APIRouter(
    prefix="/performance",
    tags=["Student Performance"],
)


@router.get(
    "/",
    response_model=list[PerformanceResponse],
)
def performance(
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    return get_performance_data(db)


@router.get(
    "/summary",
    response_model=PerformanceSummary,
)
def performance_summary(
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    return get_performance_summary(db)