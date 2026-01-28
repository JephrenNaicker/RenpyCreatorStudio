from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ExpressionBase(BaseModel):
    name: str
    image_path: str
    thumbnail: Optional[str] = None

class CharacterBase(BaseModel):
    name: str
    color: Optional[str] = "#FFFFFF"
    voice_tag: Optional[str] = None
    bio: Optional[str] = None

class CharacterCreate(CharacterBase):
    project_id: str
    expressions: List[ExpressionBase] = []

class CharacterUpdate(CharacterBase):
    expressions: Optional[List[ExpressionBase]] = None

class Character(CharacterBase):
    id: str
    project_id: str
    expressions: List[ExpressionBase]
    created_at: datetime
    
    class Config:
        from_attributes = True