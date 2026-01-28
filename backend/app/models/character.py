from sqlalchemy import Column, String, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base
import uuid

class Character(Base):
    __tablename__ = "characters"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id"))
    name = Column(String, nullable=False)
    color = Column(String, default="#FFFFFF")  # Dialogue color
    voice_tag = Column(String, nullable=True)
    bio = Column(String, nullable=True)
    
    # Store expressions as JSON: [{"name": "happy", "image_path": "...", ...}]
    expressions = Column(JSON, default=[])
    
    # Relationships
    project = relationship("Project", backref="characters")