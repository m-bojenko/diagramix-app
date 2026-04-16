from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db

router = APIRouter()


@router.get("/", response_model=list[schemas.ProjectResponse])
def get_projects(db: Session = Depends(get_db)):
    return crud.get_projects(db)


@router.get("/{project_id}", response_model=schemas.ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db)):
    project = crud.get_project_by_id(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")
    return project


@router.post("/", response_model=schemas.ProjectResponse)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db)):
    return crud.create_project(db, project)