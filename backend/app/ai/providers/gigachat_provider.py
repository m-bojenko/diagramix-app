import json
import ssl
import time
import uuid
from typing import Optional
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from app.ai.config import AISettings
from app.ai.prompts import build_diagram_prompt
from app.ai.providers.base import AIProviderConfigurationError, AIProviderError


GIGACHAT_OAUTH_URL = "https://ngw.devices.sberbank.ru:9443/api/v2/oauth"
GIGACHAT_COMPLETIONS_URL = "https://gigachat.devices.sberbank.ru/api/v1/chat/completions"
TOKEN_EXPIRATION_SAFETY_SECONDS = 60

_cached_access_token: Optional[str] = None
_cached_expires_at: float = 0


class GigaChatProvider:
    name = "gigachat"
    is_mock = False

    def __init__(self, settings: AISettings):
        self.settings = settings

    def _ssl_context(self):
        if self.settings.gigachat_verify_ssl:
            return None

        return ssl._create_unverified_context()

    def _require_auth_key(self) -> str:
        if not self.settings.gigachat_auth_key:
            raise AIProviderConfigurationError("GIGACHAT_AUTH_KEY не задан для provider gigachat")

        return self.settings.gigachat_auth_key

    def _read_json_response(self, request: Request):
        try:
            with urlopen(request, timeout=60, context=self._ssl_context()) as response:
                return json.loads(response.read().decode("utf-8"))
        except HTTPError as error:
            try:
                error_body = error.read().decode("utf-8")
            except Exception:
                error_body = ""

            message = f"GigaChat API вернул ошибку: {error.code}"

            if error_body:
                message = f"{message}. {error_body[:500]}"

            raise AIProviderError(message) from error
        except URLError as error:
            raise AIProviderError("Не удалось подключиться к GigaChat API") from error

    def _normalize_expires_at(self, expires_at) -> float:
        try:
            numeric_expires_at = float(expires_at)
        except (TypeError, ValueError):
            return time.time() + 60 * 20

        if numeric_expires_at > 10_000_000_000:
            numeric_expires_at = numeric_expires_at / 1000

        return numeric_expires_at

    def _get_access_token(self) -> str:
        global _cached_access_token, _cached_expires_at

        now = time.time()

        if _cached_access_token and _cached_expires_at - TOKEN_EXPIRATION_SAFETY_SECONDS > now:
            return _cached_access_token

        auth_key = self._require_auth_key()
        payload = urlencode({"scope": self.settings.gigachat_scope}).encode("utf-8")
        request = Request(
            GIGACHAT_OAUTH_URL,
            data=payload,
            headers={
                "Authorization": f"Basic {auth_key}",
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json",
                "RqUID": str(uuid.uuid4()),
            },
            method="POST",
        )
        data = self._read_json_response(request)
        access_token = data.get("access_token")

        if not access_token:
            raise AIProviderError("GigaChat OAuth вернул ответ без access_token")

        _cached_access_token = access_token
        _cached_expires_at = self._normalize_expires_at(data.get("expires_at"))

        return access_token

    def generate_diagram_code(
        self,
        description: str,
        diagram_type: str,
        diagram_language: str,
    ) -> str:
        access_token = self._get_access_token()
        prompt = build_diagram_prompt(description, diagram_type, diagram_language)
        payload = {
            "model": self.settings.gigachat_model,
            "messages": [
                {
                    "role": "system",
                    "content": "Ты генератор кода диаграмм. Возвращай только исходный код диаграммы.",
                },
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.1,
        }
        request = Request(
            GIGACHAT_COMPLETIONS_URL,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
                "Accept": "application/json",
                "RqUID": str(uuid.uuid4()),
            },
            method="POST",
        )
        data = self._read_json_response(request)

        try:
            return data["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as error:
            raise AIProviderError("GigaChat API вернул неожиданный формат ответа") from error
