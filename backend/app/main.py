from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database.connection import engine, Base, SessionLocal
from app.database.seed_data import seed_exercises, seed_food_items, seed_demo_user
from app.rag.vector_store import vector_store

# Import routers
from app.api.auth import router as auth_router
from app.api.profile import router as profile_router
from app.api.workouts import router as workouts_router
from app.api.progress import router as progress_router
from app.api.nutrition import router as nutrition_router
from app.api.recovery import router as recovery_router
from app.api.sports import router as sports_router
from app.api.exercises import router as exercises_router
from app.api.chat import router as chat_router
from app.api.recommendations import router as recommendations_router
from app.api.goals import router as goals_router
from app.api.reports import router as reports_router
from app.api.calisthenics import router as calisthenics_router
from app.api.hyrox import router as hyrox_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables and seed data
    from app.database.connection import init_db
    init_db()
    db = SessionLocal()
    try:
        seed_exercises(db)
        seed_food_items(db)
        seed_demo_user(db)
    finally:
        db.close()
    
    # Initialize RAG vector store
    if not vector_store.is_initialized:
        vector_store.build_index()
    print("[OK] KRIDA Engine Initialized: Database, Exercise Catalog, Food Catalog, Demo User & RAG Vector Store Ready.")
    yield
    # Shutdown

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production-ready Generative AI & RAG Fitness & Sports Performance Engine",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router, prefix=settings.API_PREFIX)
app.include_router(profile_router, prefix=settings.API_PREFIX)
app.include_router(workouts_router, prefix=settings.API_PREFIX)
app.include_router(progress_router, prefix=settings.API_PREFIX)
app.include_router(nutrition_router, prefix=settings.API_PREFIX)
app.include_router(recovery_router, prefix=settings.API_PREFIX)
app.include_router(sports_router, prefix=settings.API_PREFIX)
app.include_router(exercises_router, prefix=settings.API_PREFIX)
app.include_router(chat_router, prefix=settings.API_PREFIX)
app.include_router(recommendations_router, prefix=settings.API_PREFIX)
app.include_router(goals_router, prefix=settings.API_PREFIX)
app.include_router(reports_router, prefix=settings.API_PREFIX)
app.include_router(calisthenics_router, prefix=settings.API_PREFIX)
app.include_router(hyrox_router, prefix=settings.API_PREFIX)

@app.get("/")
def root():
    return {
        "app": "KRIDA",
        "tagline": "Your AI-Powered Personal Fitness & Sports Coach",
        "status": "online",
        "version": settings.VERSION,
        "docs": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "vector_store_chunks": len(vector_store.chunks),
        "ai_mode": "gemini" if settings.GEMINI_API_KEY else ("openai" if settings.OPENAI_API_KEY else "intelligent_local"),
        "version": settings.VERSION
    }
