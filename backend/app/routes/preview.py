import html
import os
import re
import urllib.error
import urllib.request
import xml.etree.ElementTree as ElementTree
import zlib
from typing import Optional

from fastapi import APIRouter, HTTPException

from app import schemas

router = APIRouter()

PLANTUML_SERVER_URL = os.getenv(
    "PLANTUML_SERVER_URL",
    "https://www.plantuml.com/plantuml/svg",
).rstrip("/")

PLANTUML_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_"


def _encode_plantuml_chunk(chunk: bytes) -> str:
    if len(chunk) == 3:
        value = (chunk[0] << 16) + (chunk[1] << 8) + chunk[2]
        return (
            PLANTUML_ALPHABET[(value >> 18) & 0x3F]
            + PLANTUML_ALPHABET[(value >> 12) & 0x3F]
            + PLANTUML_ALPHABET[(value >> 6) & 0x3F]
            + PLANTUML_ALPHABET[value & 0x3F]
        )

    if len(chunk) == 2:
        value = (chunk[0] << 16) + (chunk[1] << 8)
        return (
            PLANTUML_ALPHABET[(value >> 18) & 0x3F]
            + PLANTUML_ALPHABET[(value >> 12) & 0x3F]
            + PLANTUML_ALPHABET[(value >> 6) & 0x3F]
        )

    value = chunk[0] << 16
    return (
        PLANTUML_ALPHABET[(value >> 18) & 0x3F]
        + PLANTUML_ALPHABET[(value >> 12) & 0x3F]
    )


def _encode_plantuml(code: str) -> str:
    compressor = zlib.compressobj(level=9, wbits=-15)
    compressed = compressor.compress(code.encode("utf-8")) + compressor.flush()
    return "".join(
        _encode_plantuml_chunk(compressed[index : index + 3])
        for index in range(0, len(compressed), 3)
    )


def _looks_like_plantuml_error(svg: str) -> bool:
    lowered = svg.lower()
    return "syntax error" in lowered or "error line" in lowered


def _is_svg_document(content: str) -> bool:
    stripped_content = content.lstrip()

    if not stripped_content.startswith("<"):
        return False

    try:
        root = ElementTree.fromstring(stripped_content)
    except ElementTree.ParseError:
        return False

    return root.tag.lower().endswith("svg")


def _svg_text(value: str) -> str:
    return html.escape(value, quote=True)


def _extract_title(code: str, fallback: str = "Диаграмма") -> str:
    match = re.search(r"^title\s+(.+)$", code, flags=re.MULTILINE)
    return match.group(1).strip() if match else fallback


def _wrap_svg(width: int, height: int, body: str) -> str:
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" '
        f'viewBox="0 0 {width} {height}" role="img">'
        "<defs>"
        '<marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" '
        'orient="auto" markerUnits="strokeWidth">'
        '<path d="M0,0 L0,6 L9,3 z" fill="#c95586" />'
        "</marker>"
        "</defs>"
        '<rect width="100%" height="100%" fill="#ffffff" />'
        f"{body}"
        "</svg>"
    )


def _text(x: int, y: int, value: str, size: int = 14, anchor: str = "middle") -> str:
    return (
        f'<text x="{x}" y="{y}" text-anchor="{anchor}" '
        f'font-family="Arial, sans-serif" font-size="{size}" fill="#171315">'
        f"{_svg_text(value)}</text>"
    )


def _box(x: int, y: int, width: int, height: int, label: str, fill: str = "#fff5fa") -> str:
    return (
        f'<rect x="{x}" y="{y}" width="{width}" height="{height}" rx="8" '
        f'fill="{fill}" stroke="#de8fb2" stroke-width="1.5" />'
        + _text(x + width // 2, y + height // 2 + 5, label)
    )


def _line(x1: int, y1: int, x2: int, y2: int) -> str:
    return (
        f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" '
        'stroke="#c95586" stroke-width="1.7" marker-end="url(#arrow)" />'
    )


def _render_local_usecase(code: str) -> Optional[str]:
    usecases = re.findall(r'usecase\s+"([^"]+)"\s+as\s+([A-Za-z0-9_]+)', code)

    if not usecases:
        return None

    title = _extract_title(code, "Use Case")
    width = 760
    height = max(360, 170 + len(usecases) * 72)
    actor_x = 100
    actor_y = height // 2 - 45
    system_x = 230
    system_y = 95
    system_width = 450
    system_height = height - 135
    body = [
        _text(width // 2, 34, title, 18),
        f'<circle cx="{actor_x}" cy="{actor_y}" r="18" fill="#ffffff" stroke="#c95586" stroke-width="1.8" />',
        f'<line x1="{actor_x}" y1="{actor_y + 18}" x2="{actor_x}" y2="{actor_y + 78}" stroke="#c95586" stroke-width="1.8" />',
        f'<line x1="{actor_x - 32}" y1="{actor_y + 42}" x2="{actor_x + 32}" y2="{actor_y + 42}" stroke="#c95586" stroke-width="1.8" />',
        f'<line x1="{actor_x}" y1="{actor_y + 78}" x2="{actor_x - 28}" y2="{actor_y + 118}" stroke="#c95586" stroke-width="1.8" />',
        f'<line x1="{actor_x}" y1="{actor_y + 78}" x2="{actor_x + 28}" y2="{actor_y + 118}" stroke="#c95586" stroke-width="1.8" />',
        _text(actor_x, actor_y + 148, "Пользователь"),
        f'<rect x="{system_x}" y="{system_y}" width="{system_width}" height="{system_height}" rx="8" fill="#ffffff" stroke="#ead7e2" stroke-width="1.5" />',
    ]

    for index, (label, _) in enumerate(usecases):
        cy = system_y + 65 + index * 72
        body.append(
            f'<ellipse cx="{system_x + 245}" cy="{cy}" rx="145" ry="28" '
            'fill="#fff5fa" stroke="#de8fb2" stroke-width="1.5" />'
        )
        body.append(_text(system_x + 245, cy + 5, label))
        body.append(_line(actor_x + 34, actor_y + 42, system_x + 100, cy))

    return _wrap_svg(width, height, "".join(body))


def _render_local_activity(code: str) -> Optional[str]:
    actions = re.findall(r"^\s*:([^;]+);", code, flags=re.MULTILINE)

    if not actions:
        return None

    title = _extract_title(code, "Activity")
    width = 620
    height = 180 + len(actions) * 78
    center_x = width // 2
    y = 78
    body = [
        _text(center_x, 34, title, 18),
        f'<circle cx="{center_x}" cy="{y}" r="13" fill="#c95586" />',
    ]

    previous_y = y + 13

    for action in actions:
        y += 72
        body.append(_line(center_x, previous_y, center_x, y - 25))
        body.append(_box(center_x - 145, y - 25, 290, 50, action.strip()))
        previous_y = y + 25

    y += 72
    body.append(_line(center_x, previous_y, center_x, y - 16))
    body.append(f'<circle cx="{center_x}" cy="{y}" r="16" fill="#ffffff" stroke="#c95586" stroke-width="2" />')
    body.append(f'<circle cx="{center_x}" cy="{y}" r="9" fill="#c95586" />')

    return _wrap_svg(width, height, "".join(body))


def _render_local_er(code: str) -> Optional[str]:
    entity_matches = list(re.finditer(r"entity\s+([A-Za-z0-9_]+)\s*\{([^}]*)\}", code, flags=re.DOTALL))

    if not entity_matches:
        return None

    title = _extract_title(code, "ER")
    entities = [
        (
            match.group(1),
            [
                field.strip()
                for field in match.group(2).splitlines()
                if field.strip() and field.strip() != "--"
            ],
        )
        for match in entity_matches
    ]
    width = max(760, 260 * len(entities) + 80)
    height = 360
    body = [_text(width // 2, 34, title, 18)]
    positions: dict[str, tuple[int, int, int, int]] = {}

    for index, (name, fields) in enumerate(entities):
        x = 55 + index * 250
        y = 105
        box_height = max(130, 66 + len(fields) * 24)
        positions[name] = (x, y, 190, box_height)
        body.append(
            f'<rect x="{x}" y="{y}" width="190" height="{box_height}" rx="8" '
            'fill="#ffffff" stroke="#de8fb2" stroke-width="1.5" />'
        )
        body.append(
            f'<rect x="{x}" y="{y}" width="190" height="42" rx="8" '
            'fill="#fff5fa" stroke="#de8fb2" stroke-width="1.5" />'
        )
        body.append(_text(x + 95, y + 27, name, 15))

        for field_index, field in enumerate(fields):
            body.append(_text(x + 16, y + 68 + field_index * 24, field, 13, "start"))

    for left, right in re.findall(r"^([A-Za-z0-9_]+)\s+\|\|--o\{\s+([A-Za-z0-9_]+)", code, flags=re.MULTILINE):
        if left not in positions or right not in positions:
            continue

        left_x, left_y, left_width, left_height = positions[left]
        right_x, right_y, _, right_height = positions[right]
        body.append(
            f'<line x1="{left_x + left_width}" y1="{left_y + left_height // 2}" '
            f'x2="{right_x}" y2="{right_y + right_height // 2}" '
            'stroke="#c95586" stroke-width="1.7" />'
        )

    return _wrap_svg(width, height, "".join(body))


def _render_local_plantuml_preview(code: str) -> str:
    lowered = code.lower()

    if "@startuml" not in lowered or "@enduml" not in lowered:
        raise HTTPException(status_code=422, detail="В PlantUML коде есть синтаксическая ошибка")

    svg = (
        _render_local_usecase(code)
        or _render_local_activity(code)
        or _render_local_er(code)
    )

    if not svg:
        raise HTTPException(status_code=422, detail="В PlantUML коде есть синтаксическая ошибка")

    return svg


@router.post("/plantuml", response_model=schemas.DiagramPreviewResponse)
def render_plantuml_preview(data: schemas.DiagramPreviewRequest):
    code = data.code.strip()

    if not code:
        raise HTTPException(status_code=400, detail="Код диаграммы пустой")

    if len(code) > 20000:
        raise HTTPException(status_code=400, detail="Код диаграммы слишком большой")

    preview_url = f"{PLANTUML_SERVER_URL}/{_encode_plantuml(code)}"
    request = urllib.request.Request(
        preview_url,
        headers={"Accept": "image/svg+xml"},
        method="GET",
    )

    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            content_type = response.headers.get("Content-Type", "")
            svg = response.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as error:
        try:
            return {"svg": _render_local_plantuml_preview(code)}
        except HTTPException as local_error:
            raise local_error from error
    except urllib.error.URLError as error:
        return {"svg": _render_local_plantuml_preview(code)}

    if "svg" not in content_type.lower() or not _is_svg_document(svg):
        return {"svg": _render_local_plantuml_preview(code)}

    if _looks_like_plantuml_error(svg):
        return {"svg": _render_local_plantuml_preview(code)}

    return {"svg": svg}
