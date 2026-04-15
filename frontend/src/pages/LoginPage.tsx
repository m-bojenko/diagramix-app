import { Link } from 'react-router-dom'
import logo from '../assets/logo_diagramix.png'

function LoginPage() {
  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <img className="login-logo" src={logo} alt="Diagramix" />

        <div className="login-heading">
          <h1 id="login-title">Вход в Diagramix</h1>
          <p>Продолжите работу с диаграммами</p>
        </div>

        <form className="login-form">
          <label className="form-field">
            <span>Email</span>
            <input type="email" name="email" placeholder="name@company.ru" />
          </label>

          <label className="form-field">
            <span>Пароль</span>
            <input type="password" name="password" placeholder="Введите пароль" />
          </label>

          <Link className="forgot-password-link" to="/login">
            Забыли пароль?
          </Link>

          <button className="login-button" type="submit">
            Войти
          </button>
        </form>

        <p className="register-prompt">
          Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </p>
      </section>
    </main>
  )
}

export default LoginPage
