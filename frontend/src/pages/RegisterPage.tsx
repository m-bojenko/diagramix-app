import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../assets/logo_diagramix.png'
import { useAppMessage } from '../components/AppMessageContext'
import { registerUser } from '../services/api'

function RegisterPage() {
  const navigate = useNavigate()
  const { showMessage } = useAppMessage()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!name.trim() || !email.trim() || !password || !passwordConfirm) {
      showMessage({
        message: 'Заполните все поля',
        title: 'Не все поля заполнены',
      })
      return
    }

    if (password !== passwordConfirm) {
      showMessage({
        message: 'Пароли не совпадают',
        title: 'Проверьте пароль',
      })
      return
    }

    if (!termsAccepted) {
      showMessage({
        message: 'Примите условия использования и политику конфиденциальности',
        title: 'Требуется согласие',
      })
      return
    }

    try {
      const user = await registerUser({
        name: name.trim(),
        email: email.trim(),
        password,
      })

      localStorage.setItem('diagramix_user', JSON.stringify(user))
      navigate('/')
    } catch (error) {
      console.error('Ошибка регистрации', error)
      showMessage({
        message: error instanceof Error ? error.message : 'Ошибка при регистрации',
        title: 'Ошибка регистрации',
      })
    }
  }

  return (
    <main className="login-page">
      <section className="login-card register-card" aria-labelledby="register-title">
        <img className="login-logo" src={logo} alt="Diagramix" />

        <div className="login-heading">
          <h1 id="register-title">Регистрация в Diagramix</h1>
          <p>Создайте аккаунт для совместной работы</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Имя</span>
            <input
              type="text"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Иван Петров"
            />
          </label>

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
              placeholder="Не менее 8 символов"
            />
          </label>

          <label className="form-field">
            <span>Подтвердите пароль</span>
            <input
              type="password"
              name="passwordConfirm"
              value={passwordConfirm}
              onChange={(event) => setPasswordConfirm(event.target.value)}
              placeholder="Повторите пароль"
            />
          </label>

          <label className="checkbox-field">
            <input
              type="checkbox"
              name="terms"
              checked={termsAccepted}
              onChange={(event) => setTermsAccepted(event.target.checked)}
            />
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
