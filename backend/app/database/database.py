from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import declarative_base, sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# SQLite for development (switch to PostgreSQL later if needed)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./renpy_editor.db")

engine = create_async_engine(DATABASE_URL, echo=True)
AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db():
    async with engine.begin() as conn:
        # Create all tables
        from app.models import Project, Character, DialogueLine
        await conn.run_sync(Base.metadata.create_all)