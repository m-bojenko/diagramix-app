class MockAIProvider:
    name = "mock"
    is_mock = True

    def _diagram_label(self, value: str, max_length: int = 80) -> str:
        normalized = " ".join(value.split())
        trimmed = normalized[:max_length].strip()
        return trimmed.replace('"', "'") or "Описание предметной области"

    def _generate_mermaid(self, description: str, diagram_type: str) -> str:
        subject = self._diagram_label(description)

        if diagram_type == "Activity":
            return (
                "flowchart TD\n"
                f'    start(["{subject}: старт"]) --> analyze["Проанализировать описание"]\n'
                "    analyze --> decide{Данных достаточно?}\n"
                "    decide -- Да --> build[Построить шаги процесса]\n"
                "    decide -- Нет --> clarify[Уточнить требования]\n"
                "    clarify --> analyze\n"
                "    build --> finish([Готово])"
            )

        if diagram_type == "ER":
            return (
                "erDiagram\n"
                "    USER {\n"
                "        int id\n"
                "        string email\n"
                "    }\n"
                "    PROJECT {\n"
                "        int id\n"
                f'        string name "{subject}"\n'
                "    }\n"
                "    DIAGRAM {\n"
                "        int id\n"
                "        string code\n"
                "    }\n"
                "    USER ||--o{ PROJECT : owns\n"
                "    PROJECT ||--o{ DIAGRAM : contains"
            )

        if diagram_type == "Sequence":
            return (
                "sequenceDiagram\n"
                "    actor User as Пользователь\n"
                "    participant App as Система\n"
                "    participant AI as AI-модуль\n"
                "    User->>App: Отправить описание\n"
                "    App->>AI: Запросить диаграмму\n"
                "    AI-->>App: Вернуть код\n"
                "    App-->>User: Показать preview"
            )

        if diagram_type == "Class":
            return (
                "classDiagram\n"
                "    class User {\n"
                "        +int id\n"
                "        +string email\n"
                "    }\n"
                "    class Project {\n"
                "        +int id\n"
                "        +string name\n"
                "    }\n"
                "    class Diagram {\n"
                "        +string code\n"
                "    }\n"
                "    User \"1\" --> \"*\" Project\n"
                "    Project \"1\" --> \"1\" Diagram"
            )

        return (
            "flowchart LR\n"
            f'    user(["Пользователь"]) --> system["{subject}"]\n'
            '    system --> create["Создать запрос"]\n'
            '    system --> generate["Получить диаграмму"]\n'
            '    system --> export["Экспортировать результат"]'
        )

    def _generate_plantuml(self, description: str, diagram_type: str) -> str:
        subject = self._diagram_label(description)

        if diagram_type == "Activity":
            return (
                "@startuml\n"
                f"title {subject} - Activity\n"
                "start\n"
                ":Проанализировать описание;\n"
                "if (Данных достаточно?) then (да)\n"
                "  :Построить шаги процесса;\n"
                "else (нет)\n"
                "  :Уточнить требования;\n"
                "endif\n"
                "stop\n"
                "@enduml"
            )

        if diagram_type == "ER":
            return (
                "@startuml\n"
                f"title {subject} - ER\n"
                "entity User {\n"
                "  * id : int\n"
                "  --\n"
                "  email : string\n"
                "}\n"
                "entity Project {\n"
                "  * id : int\n"
                f"  name : {subject}\n"
                "}\n"
                "entity Diagram {\n"
                "  * id : int\n"
                "  code : text\n"
                "}\n"
                "User ||--o{ Project\n"
                "Project ||--o{ Diagram\n"
                "@enduml"
            )

        if diagram_type == "Sequence":
            return (
                "@startuml\n"
                f"title {subject} - Sequence\n"
                "actor Пользователь as User\n"
                "participant Система as App\n"
                "participant \"AI-модуль\" as AI\n"
                "User -> App : Отправить описание\n"
                "activate App\n"
                "App -> AI : Запросить диаграмму\n"
                "activate AI\n"
                "AI --> App : Вернуть код\n"
                "deactivate AI\n"
                "App --> User : Показать preview\n"
                "deactivate App\n"
                "@enduml"
            )

        if diagram_type == "Class":
            return (
                "@startuml\n"
                f"title {subject} - Class\n"
                "class User {\n"
                "  +id : int\n"
                "  +email : string\n"
                "}\n"
                "class Project {\n"
                "  +id : int\n"
                "  +name : string\n"
                "}\n"
                "class Diagram {\n"
                "  +code : text\n"
                "}\n"
                "User \"1\" --> \"*\" Project\n"
                "Project \"1\" --> \"1\" Diagram\n"
                "@enduml"
            )

        return (
            "@startuml\n"
            f"title {subject} - Use Case\n"
            "left to right direction\n"
            "actor Пользователь as User\n"
            f'rectangle "{subject}" {{\n'
            "  usecase \"Создать запрос\" as UC1\n"
            "  usecase \"Получить диаграмму\" as UC2\n"
            "  usecase \"Экспортировать результат\" as UC3\n"
            "}\n"
            "User --> UC1\n"
            "User --> UC2\n"
            "User --> UC3\n"
            "@enduml"
        )

    def generate_diagram_code(
        self,
        description: str,
        diagram_type: str,
        diagram_language: str,
    ) -> str:
        if diagram_language == "PlantUML":
            return self._generate_plantuml(description, diagram_type)

        return self._generate_mermaid(description, diagram_type)
