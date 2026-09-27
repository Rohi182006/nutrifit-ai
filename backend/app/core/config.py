import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "NutriFit AI — Intelligent Fitness & Nutrition Recommendation Platform"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "nutrifit_ai_super_secret_jwt_key_2026_fitness_health_secure")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Defaults to SQLite for immediate local plug-and-play, supports PostgreSQL via env
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./nutrifit.db")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
