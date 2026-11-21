from app.database.database import Base, engine

# Import all models
from app.models.user import User
from app.models.exam import Exam
from app.models.question import Question
from app.models.exam_attempt import ExamAttempt
from app.models.student_answer import StudentAnswer
from app.models.ai_event import AIEvent

Base.metadata.create_all(bind=engine)

print("Tables created successfully.")