from sqlalchemy import Column, Integer, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database.database import Base


class ExamAttempt(Base):
    __tablename__ = "exam_attempts"

    id = Column(Integer, primary_key=True, index=True)

    student_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    exam_id = Column(
        Integer,
        ForeignKey("exams.id", ondelete="CASCADE"),
        nullable=False
    )

    score = Column(Integer, default=0)

    submitted_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    student = relationship("User")
    exam = relationship("Exam")

    ai_events = relationship(
    "AIEvent",
    back_populates="attempt",
    cascade="all, delete-orphan"
)

    