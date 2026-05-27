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
)
PLANTUML_MONOCHROME_STYLE = (
    "skinparam monochrome true",
    "skinparam shadowing false",
    "skinparam backgroundColor white",
    "skinparam defaultFontName Arial",
    "skinparam defaultFontSize 12",
)
ACTIVITY_INVALID_MESSAGE = "Сгенерированный код Activity-диаграммы некорректен. Попробуйте повторить генерацию."
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


def _fix_activity_action_endings(code: str) -> str:
    return re.sub(r":([^;\n]*?):;", r":\1;", code)


def _ensure_plantuml_wrappers(text: str) -> str:
    stripped_text = text.strip()

    if "@startuml" in stripped_text and "@enduml" in stripped_text:
        start_index = stripped_text.find("@startuml")
        end_index = stripped_text.rfind("@enduml")
        return stripped_text[start_index:end_index + len("@enduml")]

    if stripped_text.startswith("@startuml"):
        return f"{stripped_text}\n@enduml"

    if stripped_text.endswith("@enduml"):
        return f"@startuml\n{stripped_text}"

    return f"@startuml\n{stripped_text}\n@enduml"


def _ensure_plantuml_monochrome_style(code: str) -> str:
    lines = code.splitlines()

    if not lines:
        return code

    existing_lines = {line.strip().lower() for line in lines}
    style_lines = [
        style_line
        for style_line in PLANTUML_MONOCHROME_STYLE
        if style_line.lower() not in existing_lines
    ]

    if not style_lines:
        return code

    for index, line in enumerate(lines):
        if line.strip() == "@startuml":
            return "\n".join(lines[:index + 1] + style_lines + lines[index + 1:]).strip()

    return code


def _trim_plantuml(text: str) -> str:
    code = _ensure_plantuml_wrappers(text)
    code = _clean_extra_at_symbols(code)
    code = _fix_activity_action_endings(code)
    return _ensure_plantuml_monochrome_style(code)


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
        has_if = re.search(r"(^|\n)\s*if\s*\(", lowered_body) is not None
        has_then = " then " in f" {lowered_body} "
        has_else = re.search(r"(^|\n)\s*else\b", lowered_body) is not None
        has_endif = re.search(r"(^|\n)\s*endif\s*(\n|$)", lowered_body) is not None

        if has_if and (not has_then or not has_endif):
            raise AIPostProcessingError(ACTIVITY_INVALID_MESSAGE)

        if has_else and not has_if:
            raise AIPostProcessingError(ACTIVITY_INVALID_MESSAGE)

        return (
            re.search(r"(^|\n)\s*start\s*(\n|$)", lowered_body) is not None
            and re.search(r"(^|\n)\s*stop\s*(\n|$)", lowered_body) is not None
            and re.search(r":[^;\n]+;", body) is not None
            and "participant " not in lowered_body
            and "activate " not in lowered_body
            and "deactivate " not in lowered_body
            and "usecase " not in lowered_body
            and not re.search(r"\b[A-Za-zА-Яа-я0-9_]+\s*[-.]+[>x]\s*[A-Za-zА-Яа-я0-9_]+", body)
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
    try:
        is_valid = (
            _validate_plantuml(diagram_type, code)
            if diagram_language == "PlantUML"
            else _validate_mermaid(diagram_type, code)
        )
    except AIPostProcessingError:
        raise

    if not is_valid:
        if diagram_type == "Activity":
            raise AIPostProcessingError(ACTIVITY_INVALID_MESSAGE)

        raise AIPostProcessingError(DIAGRAM_TYPE_MISMATCH_MESSAGE)
