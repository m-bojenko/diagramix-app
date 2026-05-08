import os
from dataclasses import dataclass
from pathlib import Path
from typing import Optional


SUPPORTED_AI_PROVIDERS = {"mock", "gigachat"}


def _load_dotenv():
    env_path = Path(__file__).resolve().parents[2] / ".env"

    if not env_path.exists():
        return

    for line in env_path.read_text(encoding="utf-8").splitlines():
        stripped_line = line.strip()

        if not stripped_line or stripped_line.startswith("#") or "=" not in stripped_line:
            continue

        key, value = stripped_line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


@dataclass(frozen=True)
class AISettings:
    provider: str
    gigachat_auth_key: Optional[str]
    gigachat_model: str
    gigachat_scope: str
    gigachat_verify_ssl: bool


def _parse_bool(value: Optional[str], default: bool = True) -> bool:
    if value is None:
        return default

    return value.strip().lower() in {"1", "true", "yes", "on"}


def get_ai_settings() -> AISettings:
    _load_dotenv()
    provider = os.getenv("AI_PROVIDER", "mock").strip().lower() or "mock"

    if provider not in SUPPORTED_AI_PROVIDERS:
        provider = "mock"

    return AISettings(
        provider=provider,
        gigachat_auth_key=os.getenv("GIGACHAT_AUTH_KEY"),
        gigachat_model=os.getenv("GIGACHAT_MODEL", "GigaChat"),
        gigachat_scope=os.getenv("GIGACHAT_SCOPE", "GIGACHAT_API_PERS"),
        gigachat_verify_ssl=_parse_bool(os.getenv("GIGACHAT_VERIFY_SSL"), default=True),
    )
