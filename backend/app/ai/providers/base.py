from typing import Protocol


class AIProvider(Protocol):
    name: str
    is_mock: bool

    def generate_diagram_code(
        self,
        description: str,
        diagram_type: str,
        diagram_language: str,
    ) -> str:
        ...


class AIProviderError(RuntimeError):
    pass


class AIProviderConfigurationError(AIProviderError):
    pass
