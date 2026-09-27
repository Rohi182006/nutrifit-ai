from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.seeds.seed_data import seed_database
from app.routers import (
    auth, clients, foods, recommendations, workouts,
    activity, nutrition, goals, analytics, coaches, admin, assistant, diet_plans
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    Base.metadata.create_all(bind=engine)
    # Seed database with verified nutrition data, demo users, rules, exercises
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Intelligent Fitness, Nutrition & Protein Food Recommendation Platform with Hybrid AI Engine",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all during dev/demo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Versioned API Routers (/api/v1/)
api_prefix = settings.API_V1_STR
app.include_router(auth.router, prefix=api_prefix)
app.include_router(clients.router, prefix=api_prefix)
app.include_router(foods.router, prefix=api_prefix)
app.include_router(recommendations.router, prefix=api_prefix)
app.include_router(workouts.router, prefix=api_prefix)
app.include_router(activity.router, prefix=api_prefix)
app.include_router(nutrition.router, prefix=api_prefix)
app.include_router(goals.router, prefix=api_prefix)
app.include_router(analytics.router, prefix=api_prefix)
app.include_router(coaches.router, prefix=api_prefix)
app.include_router(admin.router, prefix=api_prefix)
app.include_router(assistant.router, prefix=api_prefix)
app.include_router(diet_plans.router, prefix=api_prefix)

@app.get("/health")

@app.get(f"{settings.API_V1_STR}/health")
def health_check():
    return {
        "status": "healthy",
        "platform": settings.PROJECT_NAME,
        "version": "1.0.0",
        "api_prefix": settings.API_V1_STR
    }

# SPA Frontend & Static Asset Serving (Enables 1-click cloud hosting)
import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))

if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/", include_in_schema=False)
    async def serve_index():
        index_path = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return {"name": settings.PROJECT_NAME, "message": "NutriFit AI Backend is active."}

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa_fallback(full_path: str):
        # Do not intercept API, docs, or health endpoints
        if full_path.startswith("api") or full_path.startswith("docs") or full_path == "openapi.json":
            return {"detail": "Not Found"}
        target = os.path.join(frontend_dist, full_path)
        if full_path and os.path.isfile(target):
            return FileResponse(target)
        index_path = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return {"detail": "File not found"}
else:
    @app.get("/")
    def root():
        return {
            "name": settings.PROJECT_NAME,
            "docs_url": "/docs",
            "api_v1": settings.API_V1_STR,
            "message": "NutriFit AI Backend is active and running."
        }

