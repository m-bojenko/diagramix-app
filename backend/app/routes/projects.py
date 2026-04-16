from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def get_projects():
    return {
        "projects": [
            {
                "id": 1,
                "name": "Проект интернет-магазина",
                "diagram_type": "Use Case",
                "created_at": "2026-04-15"
            },
            {
                "id": 2,
                "name": "Система управления заказами",
                "diagram_type": "Activity",
                "created_at": "2026-04-14"
            }
        ]
    }