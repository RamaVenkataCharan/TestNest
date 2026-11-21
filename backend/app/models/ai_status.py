from sqlalchemy import Column, Integer, String, Boolean
from app.database.database import Base


class AIStatus(Base):
    __tablename__ = "ai_status"

    id = Column(Integer, primary_key=True, index=True)

    face_count = Column(Integer, default=0)

    eye_status = Column(String, default="Normal")

    head_status = Column(String, default="Straight")

    phone_detected = Column(Boolean, default=False)

    suspicious_score = Column(Integer, default=0)

    latest_event = Column(String, default="None")