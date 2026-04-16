from sqlalchemy.orm import Session
from app import models, schemas


def create_project(db: Session, project: schemas.ProjectCreate):
    db_project = models.Project(
        name=project.name,
        description=project.description,
        diagram_type=project.diagram_type,
        generated_code=project.generated_code,
        created_at=project.created_at
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project


def get_projects(db: Session):
    return db.query(models.Project).all()


def get_project_by_id(db: Session, project_id: int):
    return db.query(models.Project).filter(models.Project.id == project_id).first()