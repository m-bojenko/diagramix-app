import re


MERMAID_START_KEYWORDS = (
    "flowchart",
    "graph",
    "sequenceDiagram",
    "classDiagram",
    "stateDiagram",
    "stateDiagram-v2",
    "erDiagram",
)
PLANTUML_ALLOWED_AT_DIRECTIVES = (
    "@startuml",
    "@enduml",
    "@start",
    "@end",
    "@enduml",
    "@startjson",
    "@endjson",
)
DIAGRAM_TYPE_MISMATCH_MESSAGE = (
    "Сгенерированный код не соответствует выбранному типу диаграммы. "
    "Попробуйте повторить генерацию."
)


class AIPostProcessingError(ValueError):
    pass


def _strip_markdown_fence(text: str) -> str:
    stripped_text = text.strip()
    fence_match = re.search(
        r"```(?:mermaid|plantuml|puml)?\s*(.*?)```",
        stripped_text,
        flags=re.IGNORECASE | re.DOTALL,
    )

    if fence_match:
        return fence_match.group(1).strip()

    return stripped_text


def _clean_extra_at_symbols(code: str) -> str:
    cleaned_lines = []

    for line in code.splitlines():
        stripped_line = line.lstrip()

        if stripped_line.startswith("@") and not stripped_line.startswith(PLANTUML_ALLOWED_AT_DIRECTIVES):
            prefix_length = len(line) - len(stripped_line)
            line = f"{line[:prefix_length]}{stripped_line.lstrip('@')}"

        cleaned_lines.append(line.rstrip())

    return "\n".join(cleaned_lines).strip()


def _trim_plantuml(text: str) -> str:
    start_index = text.find("@startuml")
    end_index = text.rfind("@enduml")

    if start_index == -1 or end_index == -1:
        raise AIPostProcessingError("AI provider вернул некорректный PlantUML-код")

    return _clean_extra_at_symbols(text[start_index:end_index + len("@enduml")])


def _trim_mermaid(text: str) -> str:
    lines = [line.rstrip() for line in text.strip().splitlines()]
    start_index = None

    for index, line in enumerate(lines):
        stripped_line = line.strip()

        if any(stripped_line.startswith(keyword) for keyword in MERMAID_START_KEYWORDS):
            start_index = index
            break

    if start_index is None:
        raise AIPostProcessingError("AI provider вернул некорректный Mermaid-код")

    return "\n".join(lines[start_index:]).strip()


def postprocess_diagram_code(text: str, diagram_language: str) -> str:
    code = _strip_markdown_fence(text)

    if diagram_language == "PlantUML":
        return _trim_plantuml(code)

    return _trim_mermaid(code)


def _body_without_plantuml_wrappers(code: str) -> str:
    return (
        code.replace("@startuml", "")
        .replace("@enduml", "")
        .strip()
    )


def _has_plantuml_message_arrow(body: str) -> bool:
    return bool(re.search(r"\b[A-Za-zА-Яа-я0-9_]+(?:\s*[-.]+[>x]|(?:\s*)<-+)\s*[A-Za-zА-Яа-я0-9_]+", body))


def _validate_plantuml(diagram_type: str, code: str) -> bool:
    stripped_code = code.strip()

    if not stripped_code.startswith("@startuml") or not stripped_code.endswith("@enduml"):
        return False

    body = _body_without_plantuml_wrappers(stripped_code)
    lowered_body = body.lower()

    if diagram_type == "Use Case":
        return (
            "actor " in lowered_body
            and "usecase " in lowered_body
            and "rectangle " in lowered_body
            and "-->" in body
            and "participant " not in lowered_body
            and "activate " not in lowered_body
            and "deactivate " not in lowered_body
        )

    if diagram_type == "Sequence":
        return (
            ("participant " in lowered_body or "actor " in lowered_body)
            and _has_plantuml_message_arrow(body)
        )

    if diagram_type == "Activity":
        return (
            re.search(r"(^|\n)\s*start\s*(\n|$)", lowered_body) is not None
            and re.search(r"(^|\n)\s*stop\s*(\n|$)", lowered_body) is not None
            and re.search(r":[^;\n]+;", body) is not None
            and "participant " not in lowered_body
            and "usecase " not in lowered_body
        )

    if diagram_type == "Class":
        return bool(re.search(r"\b(class|interface|enum|abstract class)\s+", lowered_body))

    if diagram_type == "ER":
        return "entity " in lowered_body

    return False


def _first_mermaid_line(code: str) -> str:
    for line in code.splitlines():
        stripped_line = line.strip()

        if stripped_line:
            return stripped_line

    return ""


def _validate_mermaid(diagram_type: str, code: str) -> bool:
    first_line = _first_mermaid_line(code)

    if diagram_type == "Use Case":
        return first_line.startswith(("flowchart LR", "graph LR", "flowchart", "graph"))

    if diagram_type == "Activity":
        return first_line.startswith(("flowchart TD", "graph TD"))

    if diagram_type == "Sequence":
        return first_line.startswith("sequenceDiagram")

    if diagram_type == "Class":
        return first_line.startswith("classDiagram")

    if diagram_type == "ER":
        return first_line.startswith("erDiagram")

    return False


def validate_diagram_code(diagram_type: str, diagram_language: str, code: str) -> None:
    is_valid = (
        _validate_plantuml(diagram_type, code)
        if diagram_language == "PlantUML"
        else _validate_mermaid(diagram_type, code)
    )

    if not is_valid:
        raise AIPostProcessingError(DIAGRAM_TYPE_MISMATCH_MESSAGE)
