from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import crud, schemas
from app.auth_utils import get_current_user, require_admin
from app.database import get_db

router = APIRouter()


def _user_details(user):
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "status": user.status,
    }


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

    old_user = crud.get_user_by_id(db, id)

    if not old_user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    old_details = _user_details(old_user)
    user = crud.update_user_by_admin(db, id, user_data)

    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    new_details = _user_details(user)
    crud.create_audit_log(
        db=db,
        user_id=current_user.id,
        action="admin_user_update",
        entity_type="user",
        entity_id=user.id,
        details={
            "before": old_details,
            "after": new_details,
        },
    )

    if old_details["status"] != "blocked" and user.status == "blocked":
        crud.create_audit_log(
            db=db,
            user_id=current_user.id,
            action="user_block",
            entity_type="user",
            entity_id=user.id,
            details={
                "email": user.email,
                "previous_status": old_details["status"],
                "status": user.status,
            },
        )

    return user


@router.delete("/users/{id}")
def delete_user(id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    require_admin(current_user)
    actor_id = current_user.id
    user = crud.get_user_by_id(db, id)

    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    deleted_user_details = _user_details(user)
    user = crud.delete_user(db, id)

    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    crud.create_audit_log(
        db=db,
        user_id=actor_id,
        action="admin_user_delete",
        entity_type="user",
        entity_id=id,
        details=deleted_user_details,
    )
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
    actor_id = current_user.id
    project = crud.get_project_by_id(db, id)

    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")

    deleted_project_details = {
        "id": project.id,
        "name": project.name,
        "owner_id": project.user_id,
        "diagram_type": project.diagram_type,
        "diagram_language": project.diagram_language,
    }
    project = crud.delete_project(db, id)

    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")

    crud.create_audit_log(
        db=db,
        user_id=actor_id,
        action="admin_project_delete",
        entity_type="project",
        entity_id=id,
        details=deleted_project_details,
    )
    return {"message": "Проект удалён"}


@router.get("/audit", response_model=list[schemas.AuditLogResponse])
def get_audit_logs(
    user_id: Optional[int] = None,
    entity_type: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = Query(50, ge=1, le=500),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_admin(current_user)
    return crud.get_audit_logs(
        db=db,
        user_id=user_id,
        entity_type=entity_type,
        action=action,
        limit=limit,
    )


@router.get("/users/{id}/audit", response_model=list[schemas.AuditLogResponse])
def get_user_audit_logs(
    id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_admin(current_user)
    return crud.get_user_audit_logs(db=db, user_id=id, limit=100)


@router.get("/projects/{id}/audit", response_model=list[schemas.AuditLogResponse])
def get_project_audit_logs(
    id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_admin(current_user)
    return crud.get_audit_logs(db=db, entity_type="project", entity_id=id, limit=100)
