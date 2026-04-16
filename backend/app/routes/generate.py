from fastapi import APIRouter

from app import schemas

router = APIRouter()


def _mermaid_label(value: str, max_length: int = 120) -> str:
    normalized = " ".join(value.split())
    trimmed = normalized[:max_length]
    return trimmed.replace('"', "'")


@router.post("/", response_model=schemas.GenerateResponse)
def generate_diagram(data: schemas.GenerateRequest):
    project_name = _mermaid_label(data.project_name)
    description = _mermaid_label(data.description)
    diagram_type = _mermaid_label(data.diagram_type)

    generated_code = (
        f"graph TD\n"
        f'Project["{project_name}"] --> Type["{diagram_type}"]\n'
        f'Type --> Description["{description}"]\n'
        f'Description --> Result["Сгенерированная диаграмма"]'
    )

    return {
        "project_name": data.project_name,
        "description": data.description,
        "diagram_type": data.diagram_type,
        "generated_code": generated_code,
        "message": "Диаграмма успешно сгенерирована"
    }
