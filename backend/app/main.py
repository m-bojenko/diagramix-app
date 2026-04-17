from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from app.database import Base, engine
from app.routes import auth, projects, generate

Base.metadata.create_all(bind=engine)


def ensure_project_user_id_column():
    inspector = inspect(engine)

    if not inspector.has_table("projects"):
        return

    columns = {column["name"] for column in inspector.get_columns("projects")}

    if "user_id" not in columns:
        with engine.begin() as connection:
            connection.execute(
                text("ALTER TABLE projects ADD COLUMN user_id INTEGER NOT NULL DEFAULT 1")
            )


ensure_project_user_id_column()

app = FastAPI(
    title="Diagramix API",
    description="Backend API для сервиса генерации диаграмм Diagramix",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router, prefix="/projects", tags=["Projects"])
app.include_router(generate.router, prefix="/generate", tags=["Generate"])
app.include_router(auth.router, prefix="/auth", tags=["Auth"])


@app.get("/")
def root():
    return {"message": "Diagramix backend is running"}
