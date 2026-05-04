from fastapi import Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import crud, models
from app.database import get_db


def get_current_user(
    user_id: int = Query(..., description="ID текущего пользователя"),
    db: Session = Depends(get_db),
) -> models.User:
    user = crud.get_user_by_id(db, user_id)

    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    if user.status == "blocked":
        raise HTTPException(status_code=403, detail="User is blocked")

    return user


def require_admin(user: models.User) -> models.User:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Требуются права администратора")

    return user
