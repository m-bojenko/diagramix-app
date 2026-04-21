import re
from urllib.parse import quote

from fastapi import APIRouter, HTTPException, Response

from app import schemas
from app.routes.preview import _is_svg_document, _render_local_plantuml_preview

router = APIRouter()

SOURCE_FORMATS = {"txt", "mmd", "puml"}
SUPPORTED_FORMATS = SOURCE_FORMATS | {"svg"}


def _safe_filename(value: str, fallback: str = "diagramix") -> str:
    normalized = re.sub(r"\s+", "_", value.strip().lower())
    safe_value = re.sub(r"[^a-zа-яё0-9_-]+", "", normalized, flags=re.IGNORECASE)
    return safe_value[:80] or fallback


def _download_response(content: str, filename: str, media_type: str) -> Response:
    encoded_filename = quote(filename)
    ascii_filename = filename.encode("ascii", errors="ignore").decode("ascii") or "diagramix.txt"

    return Response(
        content=content.encode("utf-8"),
        media_type=media_type,
        headers={
            "Content-Disposition": (
                f"attachment; filename=\"{ascii_filename}\"; filename*=UTF-8''{encoded_filename}"
            )
        },
    )


def _normalize_language(value: str) -> str:
    return value.strip().lower()


@router.post("/diagram")
def export_diagram(data: schemas.DiagramExportRequest):
    export_format = data.format.strip().lower()
    language = _normalize_language(data.diagram_language)
    code = data.code.strip()
    filename_base = _safe_filename(data.project_name)

    if export_format not in SUPPORTED_FORMATS:
        raise HTTPException(status_code=400, detail="Неподдерживаемый формат экспорта")

    if not code and export_format != "svg":
        raise HTTPException(status_code=400, detail="Нет кода диаграммы для экспорта")

    if export_format == "mmd" and language != "mermaid":
        raise HTTPException(status_code=400, detail="Формат .mmd доступен только для Mermaid")

    if export_format == "puml" and language != "plantuml":
        raise HTTPException(status_code=400, detail="Формат .puml доступен только для PlantUML")

    if export_format == "txt":
        return _download_response(
            content=code,
            filename=f"{filename_base}.txt",
            media_type="text/plain; charset=utf-8",
        )

    if export_format == "mmd":
        return _download_response(
            content=code,
            filename=f"{filename_base}.mmd",
            media_type="text/vnd.mermaid; charset=utf-8",
        )

    if export_format == "puml":
        return _download_response(
            content=code,
            filename=f"{filename_base}.puml",
            media_type="text/x-plantuml; charset=utf-8",
        )

    svg = (data.svg or "").strip()

    if not svg and language == "plantuml":
        svg = _render_local_plantuml_preview(code)

    if not svg:
        raise HTTPException(status_code=400, detail="Нет SVG-данных для экспорта")

    if not _is_svg_document(svg):
        raise HTTPException(status_code=422, detail="Невозможно экспортировать некорректный SVG")

    return _download_response(
        content=svg,
        filename=f"{filename_base}.svg",
        media_type="image/svg+xml; charset=utf-8",
    )
