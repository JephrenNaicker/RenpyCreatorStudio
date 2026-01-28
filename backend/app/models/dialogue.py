from sqlalchemy import Column, String, ForeignKey, Integer, Text
from app.database import Base
import uuid

class DialogueLine(Base):
    __tablename__ = "dialogue_lines"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id"))
    character_id = Column(String, ForeignKey("characters.id"), nullable=True)
    text = Column(Text, nullable=False)
    expression = Column(String, nullable=True)  # Which expression to use
    position = Column(String, default="left")  # "left", "right", "center"
    order = Column(Integer, nullable=False)  # For sequencing
    
    # Store additional metadata as JSON
    metadata = Column(JSON, default={})