from app import schemas
from app.ai.config import get_ai_settings
from app.ai.postprocess import AIPostProcessingError, postprocess_diagram_code, validate_diagram_code
from app.ai.prompts import SUPPORTED_DIAGRAM_LANGUAGES, SUPPORTED_DIAGRAM_TYPES
from app.ai.providers.base import AIProvider, AIProviderConfigurationError, AIProviderError
from app.ai.providers.gigachat_provider import GigaChatProvider
from app.ai.providers.mock_provider import MockAIProvider


class AIGenerationValidationError(ValueError):
    pass


class AIGenerationProviderError(RuntimeError):
    pass


def _normalize_key(value: str) -> str:
    return " ".join(value.strip().lower().replace("-", " ").split())


def _normalize_diagram_type(value: str) -> str:
    normalized_value = _normalize_key(value)

    if normalized_value in SUPPORTED_DIAGRAM_TYPES:
        return SUPPORTED_DIAGRAM_TYPES[normalized_value]

    raise AIGenerationValidationError("Неподдерживаемый тип диаграммы")


def _normalize_diagram_language(value: str) -> str:
    normalized_value = _normalize_key(value)

    if normalized_value in SUPPORTED_DIAGRAM_LANGUAGES:
        return SUPPORTED_DIAGRAM_LANGUAGES[normalized_value]

    raise AIGenerationValidationError("Неподдерживаемый язык диаграммы")


def _get_provider() -> AIProvider:
    settings = get_ai_settings()

    if settings.provider == "gigachat":
        return GigaChatProvider(settings)

    return MockAIProvider()


def generate_diagram_code(request: schemas.AIGenerateRequest) -> schemas.AIGenerateResponse:
    description = request.description.strip()

    if not description:
        raise AIGenerationValidationError("Описание не должно быть пустым")

    diagram_type = _normalize_diagram_type(request.diagram_type)
    diagram_language = _normalize_diagram_language(request.diagram_language)
    provider = _get_provider()

    try:
        raw_code = provider.generate_diagram_code(description, diagram_type, diagram_language)
        diagram_code = postprocess_diagram_code(raw_code, diagram_language)
        validate_diagram_code(diagram_type, diagram_language, diagram_code)
    except AIProviderConfigurationError as error:
        raise AIGenerationProviderError(str(error)) from error
    except (AIPostProcessingError, AIProviderError) as error:
        raise AIGenerationProviderError(str(error)) from error

    return schemas.AIGenerateResponse(
        diagram_code=diagram_code,
        diagram_type=diagram_type,
        diagram_language=diagram_language,
        provider=provider.name,
        is_mock=provider.is_mock,
    )
