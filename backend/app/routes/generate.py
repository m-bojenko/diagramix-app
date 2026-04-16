from fastapi import APIRouter
from pydantic import BaseModel


router = APIRouter()


class GenerateRequest(BaseModel):
    project_name: str
    description: str
    diagram_type: str


@router.post("/")
def generate_diagram(data: GenerateRequest):
    return {
        "project_name": data.project_name,
        "diagram_type": data.diagram_type,
        "generated_code": "graph TD\nA[Пользователь] --> B[Система]\nB --> C[Диаграмма]",
        "message": "Диаграмма успешно сгенерирована"
    }