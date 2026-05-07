from datetime import datetime, timezone
from urllib.parse import quote

from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile
from sqlalchemy.orm import Session

from app import crud, schemas
from app.auth_utils import get_current_user
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


def _ensure_project_access(project, current_user):
    if project.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Нет доступа к проекту")


@router.get("/", response_model=list[schemas.ProjectResponse])
def get_projects(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == "admin":
        return crud.get_projects(db)

    return crud.get_projects_by_user_id(db, current_user.id)


@router.get("/{project_id}", response_model=schemas.ProjectResponse)
def get_project(
    project_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = crud.get_project_by_id(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")

    _ensure_project_access(project, current_user)
    return project


@router.post("/", response_model=schemas.ProjectResponse)
def create_project(
    project: schemas.ProjectCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project.user_id = current_user.id
    created_project = crud.create_project(db, project)
    crud.create_audit_log(
        db=db,
        user_id=current_user.id,
        action="project_create",
        entity_type="project",
        entity_id=created_project.id,
        details={
            "name": created_project.name,
            "diagram_type": created_project.diagram_type,
            "diagram_language": created_project.diagram_language,
        },
    )
    return created_project


@router.put("/{project_id}", response_model=schemas.ProjectResponse)
def update_project(
    project_id: int,
    project: schemas.ProjectUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing_project = crud.get_project_by_id(db, project_id)

    if not existing_project:
        raise HTTPException(status_code=404, detail="Проект не найден")

    _ensure_project_access(existing_project, current_user)
    updated_project = crud.update_project(db, project_id, project)

    if not updated_project:
        raise HTTPException(status_code=404, detail="Проект не найден")

    return updated_project


@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing_project = crud.get_project_by_id(db, project_id)

    if not existing_project:
        raise HTTPException(status_code=404, detail="Проект не найден")

    _ensure_project_access(existing_project, current_user)
    deleted_project_details = {
        "name": existing_project.name,
        "owner_id": existing_project.user_id,
    }
    project = crud.delete_project(db, project_id)

    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")

    crud.create_audit_log(
        db=db,
        user_id=current_user.id,
        action="project_delete",
        entity_type="project",
        entity_id=project_id,
        details=deleted_project_details,
    )
    return {"message": "Проект успешно удалён"}


@router.post("/{project_id}/file", response_model=schemas.ProjectFileResponse)
async def upload_project_file(
    project_id: int,
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = crud.get_project_by_id(db, project_id)

    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")

    _ensure_project_access(project, current_user)

    if file.content_type not in SUPPORTED_PROJECT_FILE_TYPES:
        raise HTTPException(status_code=400, detail="Неподдерживаемый тип файла")

    content = await file.read()

    if not content:
        raise HTTPException(status_code=400, detail="Файл пустой")

    if len(content) > MAX_PROJECT_FILE_SIZE:
        raise HTTPException(status_code=413, detail="Файл слишком большой")

    project_file = crud.upsert_project_file(
        db=db,
        project_id=project_id,
        filename=file.filename or "project_file",
        mime_type=file.content_type or "application/octet-stream",
        size=len(content),
        content=content,
        uploaded_at=datetime.now(timezone.utc).date().isoformat(),
    )
    crud.create_audit_log(
        db=db,
        user_id=current_user.id,
        action="file_upload",
        entity_type="file",
        entity_id=project_file.id,
        details={
            "project_id": project_id,
            "filename": project_file.filename,
            "mime_type": project_file.mime_type,
            "size": project_file.size,
        },
    )
    return project_file


@router.get("/{project_id}/file", response_model=schemas.ProjectFileResponse)
def get_project_file(
    project_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = crud.get_project_by_id(db, project_id)

    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")

    _ensure_project_access(project, current_user)
    project_file = crud.get_project_file(db, project_id)

    if not project_file:
        raise HTTPException(status_code=404, detail="Файл не найден")

    return project_file


@router.get("/{project_id}/file/download")
def download_project_file(
    project_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = crud.get_project_by_id(db, project_id)

    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")

    _ensure_project_access(project, current_user)
    project_file = crud.get_project_file(db, project_id)

    if not project_file:
        raise HTTPException(status_code=404, detail="Файл не найден")

    return _file_download_response(project_file)
