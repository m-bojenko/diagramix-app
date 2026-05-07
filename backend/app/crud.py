import json
from datetime import datetime, timezone
from typing import Optional

from passlib.context import CryptContext
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app import models, schemas

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _utc_now_iso():
    return datetime.now(timezone.utc).isoformat()


def _json_details(details):
    if details is None:
        return None

    if isinstance(details, str):
        return details

    return json.dumps(details, ensure_ascii=False)


def hash_password(password: str):
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str):
    return pwd_context.verify(password, password_hash)


def create_audit_log(
    db: Session,
    user_id: Optional[int],
    action: str,
    entity_type: str,
    entity_id: Optional[int] = None,
    details=None,
):
    audit_log = models.AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=_json_details(details),
        created_at=_utc_now_iso(),
    )
    db.add(audit_log)
    db.commit()
    db.refresh(audit_log)
    return audit_log


def get_audit_logs(
    db: Session,
    user_id: Optional[int] = None,
    entity_type: Optional[str] = None,
    action: Optional[str] = None,
    entity_id: Optional[int] = None,
    limit: int = 50,
):
    query = db.query(models.AuditLog)

    if user_id is not None:
        query = query.filter(models.AuditLog.user_id == user_id)

    if entity_type is not None:
        query = query.filter(models.AuditLog.entity_type == entity_type)

    if action is not None:
        query = query.filter(models.AuditLog.action == action)

    if entity_id is not None:
        query = query.filter(models.AuditLog.entity_id == entity_id)

    return (
        query
        .order_by(models.AuditLog.id.desc())
        .limit(limit)
        .all()
    )


def get_user_audit_logs(db: Session, user_id: int, limit: int = 100):
    return (
        db.query(models.AuditLog)
        .filter(
            or_(
                models.AuditLog.user_id == user_id,
                (
                    (models.AuditLog.entity_type == "user") &
                    (models.AuditLog.entity_id == user_id)
                ),
            )
        )
        .order_by(models.AuditLog.id.desc())
        .limit(limit)
        .all()
    )


def create_project(db: Session, project: schemas.ProjectCreate):
    db_project = models.Project(
        name=project.name,
        description=project.description,
        diagram_type=project.diagram_type,
        diagram_language=project.diagram_language,
        generated_code=project.generated_code,
        created_at=project.created_at,
        user_id=project.user_id
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project


def get_projects(db: Session):
    return db.query(models.Project).all()


def get_projects_by_user_id(db: Session, user_id: int):
    return db.query(models.Project).filter(models.Project.user_id == user_id).all()


def get_project_by_id(db: Session, project_id: int):
    return db.query(models.Project).filter(models.Project.id == project_id).first()


def update_project(db: Session, project_id: int, project_data: schemas.ProjectUpdate):
    project = get_project_by_id(db, project_id)

    if not project:
        return None

    project.name = project_data.name
    project.description = project_data.description
    project.diagram_type = project_data.diagram_type
    project.diagram_language = project_data.diagram_language
    project.generated_code = project_data.generated_code
    db.commit()
    db.refresh(project)
    return project


def delete_project(db: Session, project_id: int):
    project = get_project_by_id(db, project_id)

    if not project:
        return None

    delete_project_file(db, project_id, commit=False)
    db.delete(project)
    db.commit()
    return project


def get_project_file(db: Session, project_id: int):
    return (
        db.query(models.ProjectFile)
        .filter(models.ProjectFile.project_id == project_id)
        .first()
    )


def upsert_project_file(
    db: Session,
    project_id: int,
    filename: str,
    mime_type: str,
    size: int,
    content: bytes,
    uploaded_at: str,
):
    project_file = get_project_file(db, project_id)

    if project_file:
        project_file.filename = filename
        project_file.mime_type = mime_type
        project_file.size = size
        project_file.content = content
        project_file.uploaded_at = uploaded_at
    else:
        project_file = models.ProjectFile(
            project_id=project_id,
            filename=filename,
            mime_type=mime_type,
            size=size,
            content=content,
            uploaded_at=uploaded_at,
        )
        db.add(project_file)

    db.commit()
    db.refresh(project_file)
    return project_file


def delete_project_file(db: Session, project_id: int, commit: bool = True):
    project_file = get_project_file(db, project_id)

    if not project_file:
        return None

    db.delete(project_file)

    if commit:
        db.commit()

    return project_file


def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()


def get_user_by_id(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_users(db: Session):
    return db.query(models.User).all()


def create_user(db: Session, user_data: schemas.UserRegisterRequest):
    db_user = models.User(
        name=user_data.name,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        role="user",
        status="active",
        created_at=datetime.now(timezone.utc).date().isoformat()
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def verify_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)

    if not user:
        return None

    if not verify_password(password, user.password_hash):
        return None

    return user


def update_user(db: Session, user_id: int, user_data: schemas.UserUpdateRequest):
    user = get_user_by_id(db, user_id)

    if not user:
        return None

    user.name = user_data.name
    user.email = user_data.email

    if user_data.password:
        user.password_hash = hash_password(user_data.password)

    db.commit()
    db.refresh(user)
    return user


def update_user_by_admin(db: Session, user_id: int, user_data: schemas.AdminUserUpdateRequest):
    user = get_user_by_id(db, user_id)

    if not user:
        return None

    if user_data.name is not None:
        user.name = user_data.name

    if user_data.email is not None:
        user.email = user_data.email

    if user_data.role is not None:
        user.role = user_data.role

    if user_data.status is not None:
        user.status = user_data.status

    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user_id: int):
    user = get_user_by_id(db, user_id)

    if not user:
        return None

    db.delete(user)
    db.commit()
    return user
