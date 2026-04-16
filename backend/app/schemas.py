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


class GenerateRequest(BaseModel):
    project_name: str
    description: str
    diagram_type: str


class GenerateResponse(GenerateRequest):
    generated_code: str
    message: str
