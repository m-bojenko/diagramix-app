from fastapi import APIRouter

from app import schemas

router = APIRouter()


def _diagram_label(value: str, max_length: int = 120) -> str:
    normalized = " ".join(value.split())
    trimmed = normalized[:max_length]
    return trimmed.replace('"', "'")


def _generate_mermaid(project_name: str, diagram_type: str):
    if diagram_type == "Activity":
        return (
            "flowchart TD\n"
            f'    start(["{project_name}: старт"]) --> describe["Описать процесс"]\n'
            "    describe --> decide{Данные полные?}\n"
            "    decide -- Да --> build[Сформировать диаграмму]\n"
            "    decide -- Нет --> refine[Уточнить описание]\n"
            "    refine --> describe\n"
            "    build --> finish([Готово])"
        )

    if diagram_type == "ER":
        return (
            "erDiagram\n"
            f"    PROJECT {{\n"
            f"        int id\n"
            f"        string name \"{project_name}\"\n"
            f"    }}\n"
            "    USER {\n"
            "        int id\n"
            "        string email\n"
            "    }\n"
            "    DIAGRAM {\n"
            "        int id\n"
            "        string type\n"
            "    }\n"
            "    USER ||--o{ PROJECT : owns\n"
            "    PROJECT ||--o{ DIAGRAM : contains"
        )

    return (
        "flowchart LR\n"
        f'    user(["Пользователь"]) --> system["{project_name}"]\n'
        f'    system --> generate(["Сгенерировать диаграмму"])\n'
        f'    system --> save(["Сохранить проект"])\n'
        f'    system --> open(["Открыть проект"])'
    )


def _generate_plantuml(project_name: str, diagram_type: str):
    if diagram_type == "Activity":
        return (
            "@startuml\n"
            f"title {project_name} - Activity\n"
            "start\n"
            ":Описать процесс;\n"
            "if (Данные полные?) then (да)\n"
            "  :Сформировать диаграмму;\n"
            "else (нет)\n"
            "  :Уточнить описание;\n"
            "endif\n"
            "stop\n"
            "@enduml"
        )

    if diagram_type == "ER":
        return (
            "@startuml\n"
            f"title {project_name} - ER\n"
            "entity User {\n"
            "  * id : int\n"
            "  --\n"
            "  email : string\n"
            "}\n"
            "entity Project {\n"
            "  * id : int\n"
            f"  name : {project_name}\n"
            "}\n"
            "entity Diagram {\n"
            "  * id : int\n"
            "  type : string\n"
            "}\n"
            "User ||--o{ Project\n"
            "Project ||--o{ Diagram\n"
            "@enduml"
        )

    return (
        "@startuml\n"
        f"title {project_name} - Use Case\n"
        "left to right direction\n"
        "actor Пользователь as User\n"
        f'rectangle "{project_name}" {{\n'
        "  usecase \"Сгенерировать диаграмму\" as UC1\n"
        "  usecase \"Сохранить проект\" as UC2\n"
        "  usecase \"Открыть проект\" as UC3\n"
        "}\n"
        "User --> UC1\n"
        "User --> UC2\n"
        "User --> UC3\n"
        "@enduml"
    )


def _generate_template(project_name: str, diagram_type: str, diagram_language: str):
    if diagram_language == "PlantUML":
        return _generate_plantuml(project_name, diagram_type)

    return _generate_mermaid(project_name, diagram_type)


@router.post("/", response_model=schemas.GenerateResponse)
def generate_diagram(data: schemas.GenerateRequest):
    project_name = _diagram_label(data.project_name)
    diagram_type = _diagram_label(data.diagram_type)
    diagram_language = _diagram_label(data.diagram_language)
    generated_code = _generate_template(project_name, diagram_type, diagram_language)

    return {
        "project_name": data.project_name,
        "description": data.description,
        "diagram_type": data.diagram_type,
        "diagram_language": data.diagram_language,
        "generated_code": generated_code,
        "message": "Диаграмма успешно сгенерирована"
    }
