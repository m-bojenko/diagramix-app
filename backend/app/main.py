from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.routes import projects, generate

Base.metadata.create_all(bind=engine)

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
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router, prefix="/projects", tags=["Projects"])
app.include_router(generate.router, prefix="/generate", tags=["Generate"])


@app.get("/")
def root():
    return {"message": "Diagramix backend is running"}
