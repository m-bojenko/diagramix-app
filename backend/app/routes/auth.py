from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db

router = APIRouter()


@router.post("/register", response_model=schemas.UserResponse)
def register(user_data: schemas.UserRegisterRequest, db: Session = Depends(get_db)):
    existing_user = crud.get_user_by_email(db, user_data.email)

    if existing_user:
        raise HTTPException(status_code=400, detail="Пользователь с таким email уже существует")

    return crud.create_user(db, user_data)


@router.post("/login", response_model=schemas.UserResponse)
def login(user_data: schemas.UserLoginRequest, db: Session = Depends(get_db)):
    user = crud.verify_user(db, user_data.email, user_data.password)

    if not user:
        raise HTTPException(status_code=401, detail="Неверный email или пароль")

    return user


@router.put("/users/{user_id}", response_model=schemas.UserResponse)
def update_user(
    user_id: int,
    user_data: schemas.UserUpdateRequest,
    db: Session = Depends(get_db)
):
    user = crud.get_user_by_id(db, user_id)

    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    existing_user = crud.get_user_by_email(db, user_data.email)

    if existing_user and existing_user.id != user_id:
        raise HTTPException(status_code=400, detail="Пользователь с таким email уже существует")

    return crud.update_user(db, user_id, user_data)
