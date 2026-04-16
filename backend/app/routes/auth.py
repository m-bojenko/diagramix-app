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
