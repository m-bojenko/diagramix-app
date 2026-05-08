SUPPORTED_DIAGRAM_TYPES = {
    "activity": "Activity",
    "class": "Class",
    "class diagram": "Class",
    "class_diagram": "Class",
    "er": "ER",
    "erd": "ER",
    "entity relationship": "ER",
    "entity_relationship": "ER",
    "sequence": "Sequence",
    "sequence diagram": "Sequence",
    "sequence_diagram": "Sequence",
    "use case": "Use Case",
    "use_case": "Use Case",
    "usecase": "Use Case",
}

SUPPORTED_DIAGRAM_LANGUAGES = {
    "mermaid": "Mermaid",
    "plantuml": "PlantUML",
}

BASE_RULES = (
    "Return only diagram source code. Do not include explanations, Markdown fences, "
    "comments outside the diagram, or any text before or after the code."
)

PROMPT_RULES = {
    ("Use Case", "PlantUML"): (
        "Generate a PlantUML Use Case diagram.\n"
        "Required syntax: actor declarations, usecase declarations, rectangle system boundary, "
        "and relations like Actor --> UseCase.\n"
        "Forbidden syntax: participant, activate, deactivate, sequence messages.\n"
        "The answer must start with @startuml and end with @enduml."
    ),
    ("Activity", "PlantUML"): (
        "Generate a PlantUML Activity diagram.\n"
        "Required syntax: start, action lines like :Action;, decisions if needed, and stop.\n"
        "Forbidden syntax: participant, actor/usecase declarations, rectangle use-case boundary.\n"
        "The answer must start with @startuml and end with @enduml."
    ),
    ("Sequence", "PlantUML"): (
        "Generate a PlantUML Sequence diagram.\n"
        "Required syntax: actor or participant declarations and messages like A -> B : message.\n"
        "activate and deactivate are allowed.\n"
        "The answer must start with @startuml and end with @enduml."
    ),
    ("Class", "PlantUML"): (
        "Generate a PlantUML Class diagram.\n"
        "Required syntax: class, interface, enum, or abstract class declarations and relations if useful.\n"
        "Forbidden syntax: participant, activate, deactivate, usecase.\n"
        "The answer must start with @startuml and end with @enduml."
    ),
    ("ER", "PlantUML"): (
        "Generate a PlantUML ER/entity diagram.\n"
        "Required syntax: entity declarations with fields and relations between entities.\n"
        "Forbidden syntax: participant, activate, deactivate, usecase.\n"
        "The answer must start with @startuml and end with @enduml."
    ),
    ("Use Case", "Mermaid"): (
        "Generate a Mermaid flowchart that imitates a Use Case diagram, because Mermaid has no full Use Case syntax.\n"
        "The first line must be flowchart LR or graph LR.\n"
        "Represent actors as nodes, use cases as rounded nodes, and relations as arrows."
    ),
    ("Activity", "Mermaid"): (
        "Generate a Mermaid Activity-style flowchart.\n"
        "The first line must be flowchart TD or graph TD.\n"
        "Use process nodes, decision nodes, and arrows to show activity flow."
    ),
    ("Sequence", "Mermaid"): (
        "Generate a Mermaid Sequence diagram.\n"
        "The first line must be sequenceDiagram.\n"
        "Use participants/actors and messages like A->>B: message."
    ),
    ("Class", "Mermaid"): (
        "Generate a Mermaid Class diagram.\n"
        "The first line must be classDiagram.\n"
        "Use class declarations, fields/methods, and class relations."
    ),
    ("ER", "Mermaid"): (
        "Generate a Mermaid ER diagram.\n"
        "The first line must be erDiagram.\n"
        "Use entity declarations with fields and entity relationships."
    ),
}


def build_diagram_prompt(description: str, diagram_type: str, diagram_language: str) -> str:
    rules = PROMPT_RULES[(diagram_type, diagram_language)]

    return (
        f"{rules}\n"
        f"Subject description: {description}\n"
        f"{BASE_RULES}"
    )
