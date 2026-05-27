from io import BytesIO

from docx import Document
from pypdf import PdfReader

PDF_MIME_TYPE = "application/pdf"
DOCX_MIME_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
DOC_MIME_TYPE = "application/msword"

def extract_text_from_file(content: bytes, mime_type: str) -> str:
    if mime_type == PDF_MIME_TYPE:
        return _extract_pdf_text(content)

    if mime_type == DOCX_MIME_TYPE:
        return _extract_docx_text(content)

    if mime_type == DOC_MIME_TYPE:
        return ""
    
    return ""

def _extract_pdf_text(content: bytes) -> str:
    reader = PdfReader(BytesIO(content))
    parts: list[str] = []

    for page in reader.pages:
        page_text = page.extract_text() or ""
        if page_text.strip():
            parts.append(page_text.strip())

    return "\n\n".join(parts).strip()

def _extract_docx_text(content: bytes) -> str:
    document = Document(BytesIO(content))
    paragraphs = [
        paragraph.text.strip()
        for paragraph in document.paragraphs
        if paragraph.text.strip()
    ]

    return "\n".join(paragraphs).strip()