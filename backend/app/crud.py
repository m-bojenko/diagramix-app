from datetime import datetime, timezone

from passlib.context import CryptContext
from sqlalchemy.orm import Session
from app import models, schemas

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str):
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str):
    return pwd_context.verify(password, password_hash)


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

    db.delete(project)
    db.commit()
    return project


def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()


def get_user_by_id(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()


def create_user(db: Session, user_data: schemas.UserRegisterRequest):
    db_user = models.User(
        name=user_data.name,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        role="user",
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
