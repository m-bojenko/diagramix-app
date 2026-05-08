from fastapi import APIRouter, HTTPException

from app import schemas
from app.ai.service import (
    AIGenerationProviderError,
    AIGenerationValidationError,
    generate_diagram_code,
)

router = APIRouter()


@router.post("/generate", response_model=schemas.AIGenerateResponse)
def generate_ai_diagram(data: schemas.AIGenerateRequest):
    try:
        return generate_diagram_code(data)
    except AIGenerationValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except AIGenerationProviderError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error
