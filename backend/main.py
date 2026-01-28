from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

# Routers will be imported here
from app.routers import projects, characters, dialogue, export

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting Ren'Py Visual Editor API...")
    # Initialize database
    from app.database import init_db
    await init_db()
    yield
    # Shutdown
    print("Shutting down...")

app = FastAPI(
    title="Ren'Py Visual Editor API",
    version="0.1.0",
    lifespan=lifespan
)

# Configure CORS for Vue frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(characters.router, prefix="/api/characters", tags=["characters"])
app.include_router(dialogue.router, prefix="/api/dialogue", tags=["dialogue"])
app.include_router(export.router, prefix="/api/export", tags=["export"])

@app.get("/")
async def root():
    return {"message": "Ren'Py Visual Editor API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}