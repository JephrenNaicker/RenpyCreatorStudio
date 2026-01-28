from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.database import get_db
from app.models.character import Character as CharacterModel
from app.schemas.character import Character, CharacterCreate, CharacterUpdate

router = APIRouter()

@router.post("/", response_model=Character)
async def create_character(
    character: CharacterCreate, 
    db: AsyncSession = Depends(get_db)
):
    db_character = CharacterModel(**character.dict())
    db.add(db_character)
    await db.commit()
    await db.refresh(db_character)
    return db_character

@router.get("/{project_id}", response_model=List[Character])
async def get_project_characters(
    project_id: str, 
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(CharacterModel).where(CharacterModel.project_id == project_id)
    )
    characters = result.scalars().all()
    return characters

@router.get("/character/{character_id}", response_model=Character)
async def get_character(
    character_id: str, 
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(CharacterModel).where(CharacterModel.id == character_id)
    )
    character = result.scalar_one_or_none()
    
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")
    
    return character