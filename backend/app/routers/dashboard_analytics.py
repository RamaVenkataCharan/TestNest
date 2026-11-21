from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.auth import get_current_admin

from app.schemas.dashboard_analytics import DashboardSummary
from app.services.analytics_dashboard_service import (
    get_dashboard_summary,
)

router = APIRouter(
    prefix="/dashboard-analytics",
    tags=["Dashboard Analytics"],
)


@router.get("/", response_model=DashboardSummary)
def dashboard_summary(
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    return get_dashboard_summary(db)