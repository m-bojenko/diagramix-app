from pydantic import BaseModel
from typing import Optional


class ProjectBase(BaseModel):
    name: str
    description: str
    diagram_type: str


class ProjectCreate(ProjectBase):
    generated_code: Optional[str] = None
    created_at: str


class ProjectResponse(ProjectBase):
    id: int
    generated_code: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True