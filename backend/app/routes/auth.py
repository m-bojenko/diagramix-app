from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import crud, schemas
from app.auth_utils import get_current_user
from app.database import get_db

router = APIRouter()


@router.post("/register", response_model=schemas.UserResponse)
def register(user_data: schemas.UserRegisterRequest, db: Session = Depends(get_db)):
    existing_user = crud.get_user_by_email(db, user_data.email)

    if existing_user:
        raise HTTPException(status_code=400, detail="Пользователь с таким email уже существует")

    user = crud.create_user(db, user_data)
    crud.create_audit_log(
        db=db,
        user_id=user.id,
        action="register",
        entity_type="auth",
        entity_id=user.id,
        details={"email": user.email},
    )
    return user


@router.post("/login", response_model=schemas.UserResponse)
def login(user_data: schemas.UserLoginRequest, db: Session = Depends(get_db)):
    user = crud.verify_user(db, user_data.email, user_data.password)

    if not user:
        raise HTTPException(status_code=401, detail="Неверный email или пароль")

    crud.create_audit_log(
        db=db,
        user_id=user.id,
        action="login_success",
        entity_type="auth",
        entity_id=user.id,
        details={"email": user.email},
    )
    return user


@router.put("/users/{user_id}", response_model=schemas.UserResponse)
def update_user(
    user_id: int,
    user_data: schemas.UserUpdateRequest,
    current_user_id: int = Query(..., description="ID текущего пользователя"),
    db: Session = Depends(get_db)
):
    current_user = get_current_user(user_id=current_user_id, db=db)

    if current_user.id != user_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Можно редактировать только свой профиль")

    user = crud.get_user_by_id(db, user_id)

    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    existing_user = crud.get_user_by_email(db, user_data.email)

    if existing_user and existing_user.id != user_id:
        raise HTTPException(status_code=400, detail="Пользователь с таким email уже существует")

    return crud.update_user(db, user_id, user_data)
