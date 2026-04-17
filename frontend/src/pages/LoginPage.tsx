import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../assets/logo_diagramix.png'
import { useAppMessage } from '../components/AppMessageContext'
import { loginUser } from '../services/api'

function LoginPage() {
  const navigate = useNavigate()
  const { showMessage } = useAppMessage()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!email.trim() || !password) {
      showMessage({
        message: 'Введите email и пароль',
        title: 'Не все поля заполнены',
      })
      return
    }

    try {
      const user = await loginUser({
        email: email.trim(),
        password,
      })

      localStorage.setItem('diagramix_user', JSON.stringify(user))
      navigate('/')
    } catch (error) {
      console.error('Ошибка входа', error)
      showMessage({
        message: error instanceof Error ? error.message : 'Ошибка при входе',
        title: 'Ошибка входа',
      })
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <img className="login-logo" src={logo} alt="Diagramix" />

        <div className="login-heading">
          <h1 id="login-title">Вход в Diagramix</h1>
          <p>Продолжите работу с диаграммами</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@company.ru"
            />
          </label>

          <label className="form-field">
            <span>Пароль</span>
            <input
              type="password"
              name="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Введите пароль"
            />
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
