import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:password@localhost:5432/task_manager"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
