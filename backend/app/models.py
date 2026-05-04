from sqlalchemy import Column, ForeignKey, Integer, LargeBinary, String, Text
from sqlalchemy.orm import relationship
from app.database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    diagram_type = Column(String, nullable=False)
    diagram_language = Column(String, nullable=False, default="Mermaid")
    generated_code = Column(Text, nullable=True)
    created_at = Column(String, nullable=False)
    user_id = Column(Integer, nullable=False)
    file = relationship(
        "ProjectFile",
        back_populates="project",
        cascade="all, delete-orphan",
        uselist=False,
    )


class ProjectFile(Base):
    __tablename__ = "project_files"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), unique=True, nullable=False, index=True)
    filename = Column(String, nullable=False)
    mime_type = Column(String, nullable=False)
    size = Column(Integer, nullable=False)
    content = Column(LargeBinary, nullable=False)
    uploaded_at = Column(String, nullable=False)
    project = relationship("Project", back_populates="file")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False, default="user")
    status = Column(String, nullable=False, default="active")
    created_at = Column(String, nullable=False)
