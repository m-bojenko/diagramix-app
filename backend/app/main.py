from fastapi import FastAPI
from app.database import Base, engine
from app.routes import projects, generate

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Diagramix API",
    description="Backend API для сервиса генерации диаграмм Diagramix",
    version="0.1.0"
)

app.include_router(projects.router, prefix="/projects", tags=["Projects"])
app.include_router(generate.router, prefix="/generate", tags=["Generate"])


@app.get("/")
def root():
    return {"message": "Diagramix backend is running"}