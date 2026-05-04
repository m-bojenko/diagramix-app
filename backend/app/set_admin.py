import argparse

from app.database import SessionLocal
from app.models import User


def parse_args():
    parser = argparse.ArgumentParser(description="Назначить пользователя администратором")
    parser.add_argument("email", nargs="?", help="Email пользователя")
    return parser.parse_args()


def main():
    args = parse_args()
    email = args.email or input("Email пользователя: ").strip()

    if not email:
        print("Ошибка: email не указан")
        return

    db = SessionLocal()

    try:
        user = db.query(User).filter(User.email == email).first()

        if not user:
            print(f"Ошибка: пользователь с email {email} не найден")
            return

        user.role = "admin"
        db.commit()
        print(f"Пользователь {user.email} назначен администратором")
    finally:
        db.close()


if __name__ == "__main__":
    main()

