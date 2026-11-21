from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.auth import get_current_admin

from app.schemas.advanced_analytics import AdvancedAnalytics
from app.services.advanced_analytics_service import (
    get_advanced_analytics,
)

router = APIRouter(
    prefix="/advanced-analytics",
    tags=["Advanced Analytics"],
)


@router.get(
    "/",
    response_model=list[AdvancedAnalytics],
)
def advanced_analytics(
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    return get_advanced_analytics(db)