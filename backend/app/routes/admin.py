from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import crud, schemas
from app.auth_utils import get_current_user, require_admin
from app.database import get_db

router = APIRouter()


@router.get("/users", response_model=list[schemas.UserResponse])
def get_users(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    require_admin(current_user)
    return crud.get_users(db)


@router.get("/users/{id}", response_model=schemas.UserResponse)
def get_user(id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    require_admin(current_user)
    user = crud.get_user_by_id(db, id)

    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    return user


@router.patch("/users/{id}", response_model=schemas.UserResponse)
def update_user(
    id: int,
    user_data: schemas.AdminUserUpdateRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_admin(current_user)

    if user_data.email is not None:
        existing_user = crud.get_user_by_email(db, user_data.email)

        if existing_user and existing_user.id != id:
            raise HTTPException(status_code=400, detail="Пользователь с таким email уже существует")

    user = crud.update_user_by_admin(db, id, user_data)

    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    return user


@router.delete("/users/{id}")
def delete_user(id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    require_admin(current_user)
    user = crud.delete_user(db, id)

    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    return {"message": "Пользователь удалён"}


@router.get("/projects", response_model=list[schemas.ProjectResponse])
def get_projects(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    require_admin(current_user)
    return crud.get_projects(db)


@router.get("/projects/{id}", response_model=schemas.ProjectResponse)
def get_project(id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    require_admin(current_user)
    project = crud.get_project_by_id(db, id)

    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")

    return project


@router.delete("/projects/{id}")
def delete_project(id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    require_admin(current_user)
    project = crud.delete_project(db, id)

    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")

    return {"message": "Проект удалён"}
