import { Link } from 'react-router-dom'
import logo from '../assets/logo_diagramix.png'

function RegisterPage() {
  return (
    <main className="login-page">
      <section className="login-card register-card" aria-labelledby="register-title">
        <img className="login-logo" src={logo} alt="Diagramix" />

        <div className="login-heading">
          <h1 id="register-title">Регистрация в Diagramix</h1>
          <p>Создайте аккаунт для совместной работы</p>
        </div>

        <form className="login-form">
          <label className="form-field">
            <span>Имя</span>
            <input type="text" name="name" placeholder="Иван Петров" />
          </label>

          <label className="form-field">
            <span>Email</span>
            <input type="email" name="email" placeholder="name@company.ru" />
          </label>

          <label className="form-field">
            <span>Пароль</span>
            <input type="password" name="password" placeholder="Не менее 8 символов" />
          </label>

          <label className="form-field">
            <span>Подтвердите пароль</span>
            <input type="password" name="passwordConfirm" placeholder="Повторите пароль" />
          </label>

          <label className="checkbox-field">
            <input type="checkbox" name="terms" />
            <span>Я принимаю условия использования и политику конфиденциальности</span>
          </label>

          <button className="login-button" type="submit">
            Создать аккаунт
          </button>
        </form>

        <p className="register-prompt">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </section>
    </main>
  )
}

export default RegisterPage
