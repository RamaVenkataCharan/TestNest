from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database.database import Base


class AIEvent(Base):
    __tablename__ = "ai_events"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    attempt_id = Column(
        Integer,
        ForeignKey("exam_attempts.id", ondelete="CASCADE"),
        nullable=False
    )

    event = Column(
        String,
        nullable=False
    )

    points = Column(
        Integer,
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    attempt = relationship(
        "ExamAttempt",
        back_populates="ai_events"
    )