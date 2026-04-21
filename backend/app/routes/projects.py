from datetime import datetime, timezone
from urllib.parse import quote

from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db

router = APIRouter()

MAX_PROJECT_FILE_SIZE = 10 * 1024 * 1024
SUPPORTED_PROJECT_FILE_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


def _file_download_response(project_file):
    encoded_filename = quote(project_file.filename)
    ascii_filename = (
        project_file.filename.encode("ascii", errors="ignore").decode("ascii")
        or "diagramix_file"
    )

    return Response(
        content=project_file.content,
        media_type=project_file.mime_type,
        headers={
            "Content-Disposition": (
                f"attachment; filename=\"{ascii_filename}\"; "
                f"filename*=UTF-8''{encoded_filename}"
            )
        },
    )


@router.get("/", response_model=list[schemas.ProjectResponse])
def get_projects(user_id: int, db: Session = Depends(get_db)):
    return crud.get_projects_by_user_id(db, user_id)


@router.get("/{project_id}", response_model=schemas.ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db)):
    project = crud.get_project_by_id(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")
    return project


@router.post("/", response_model=schemas.ProjectResponse)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db)):
    return crud.create_project(db, project)


@router.put("/{project_id}", response_model=schemas.ProjectResponse)
def update_project(
    project_id: int,
    project: schemas.ProjectUpdate,
    db: Session = Depends(get_db)
):
    updated_project = crud.update_project(db, project_id, project)

    if not updated_project:
        raise HTTPException(status_code=404, detail="Проект не найден")

    return updated_project


@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    project = crud.delete_project(db, project_id)

    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")

    return {"message": "Проект успешно удалён"}


@router.post("/{project_id}/file", response_model=schemas.ProjectFileResponse)
async def upload_project_file(
    project_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    project = crud.get_project_by_id(db, project_id)

    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")

    if file.content_type not in SUPPORTED_PROJECT_FILE_TYPES:
        raise HTTPException(status_code=400, detail="Неподдерживаемый тип файла")

    content = await file.read()

    if not content:
        raise HTTPException(status_code=400, detail="Файл пустой")

    if len(content) > MAX_PROJECT_FILE_SIZE:
        raise HTTPException(status_code=413, detail="Файл слишком большой")

    return crud.upsert_project_file(
        db=db,
        project_id=project_id,
        filename=file.filename or "project_file",
        mime_type=file.content_type or "application/octet-stream",
        size=len(content),
        content=content,
        uploaded_at=datetime.now(timezone.utc).date().isoformat(),
    )


@router.get("/{project_id}/file", response_model=schemas.ProjectFileResponse)
def get_project_file(project_id: int, db: Session = Depends(get_db)):
    project_file = crud.get_project_file(db, project_id)

    if not project_file:
        raise HTTPException(status_code=404, detail="Файл не найден")

    return project_file


@router.get("/{project_id}/file/download")
def download_project_file(project_id: int, db: Session = Depends(get_db)):
    project_file = crud.get_project_file(db, project_id)

    if not project_file:
        raise HTTPException(status_code=404, detail="Файл не найден")

    return _file_download_response(project_file)
