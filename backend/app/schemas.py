from pydantic import BaseModel
from typing import Optional


class ProjectBase(BaseModel):
    name: str
    description: str
    diagram_type: str
    diagram_language: str


class ProjectCreate(ProjectBase):
    generated_code: Optional[str] = None
    created_at: str
    user_id: int


class ProjectUpdate(ProjectBase):
    generated_code: Optional[str] = None


class ProjectResponse(ProjectBase):
    id: int
    generated_code: Optional[str] = None
    created_at: str
    user_id: int

    class Config:
        from_attributes = True


class GenerateRequest(BaseModel):
    project_name: str
    description: str
    diagram_type: str
    diagram_language: str


class GenerateResponse(GenerateRequest):
    generated_code: str
    message: str


class DiagramPreviewRequest(BaseModel):
    code: str


class DiagramPreviewResponse(BaseModel):
    svg: str


class UserRegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class UserLoginRequest(BaseModel):
    email: str
    password: str


class UserUpdateRequest(BaseModel):
    name: str
    email: str
    password: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    created_at: str

    class Config:
        from_attributes = True
