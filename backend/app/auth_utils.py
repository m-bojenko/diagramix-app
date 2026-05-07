from typing import Optional

from fastapi import Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import crud, models
from app.database import get_db


def get_current_user(
    user_id: Optional[int] = Query(None, description="ID текущего пользователя"),
    current_user_id: Optional[int] = Query(None, description="ID текущего пользователя"),
    db: Session = Depends(get_db),
) -> models.User:
    resolved_user_id = current_user_id if current_user_id is not None else user_id

    if resolved_user_id is None:
        raise HTTPException(status_code=422, detail="ID текущего пользователя обязателен")

    user = crud.get_user_by_id(db, resolved_user_id)

    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    if user.status == "blocked":
        raise HTTPException(status_code=403, detail="User is blocked")

    return user


def require_admin(user: models.User) -> models.User:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Требуются права администратора")

    return user
