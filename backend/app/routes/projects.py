from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db

router = APIRouter()


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
