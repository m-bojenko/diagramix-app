import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function ProfilePage() {
  const navigate = useNavigate()
  const [name, setName] = useState('Иван Петров')
  const [email, setEmail] = useState('ivan@diagramix.ru')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    alert('Изменения сохранены')
  }

  return (
    <section className="profile-page" aria-labelledby="profile-title">
      <h1 id="profile-title">Профиль пользователя</h1>

      <form className="profile-form" onSubmit={handleSubmit}>
        <label className="form-field generate-field">
          <span>Имя</span>
          <input type="text" value={name} onChange={(event) => setName(event.target.value)} />
        </label>

        <label className="form-field generate-field">
          <span>Email</span>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>

        <label className="form-field generate-field">
          <span>Новый пароль</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Не менее 8 символов"
          />
        </label>

        <label className="form-field generate-field">
          <span>Подтвердите пароль</span>
          <input
            type="password"
            value={passwordConfirm}
            onChange={(event) => setPasswordConfirm(event.target.value)}
            placeholder="Повторите пароль"
          />
        </label>

        <section className="profile-info" aria-labelledby="profile-info-title">
          <h2 id="profile-info-title">Информация</h2>
          <dl>
            <div>
              <dt>Дата регистрации</dt>
              <dd>10.04.2026</dd>
            </div>
            <div>
              <dt>Количество проектов</dt>
              <dd>3</dd>
            </div>
          </dl>
        </section>

        <div className="profile-actions">
          <button className="result-button result-button-primary" type="submit">
            Сохранить изменения
          </button>
          <button className="result-button result-button-primary" type="button" onClick={() => navigate(-1)}>
            Назад
          </button>
        </div>

        <div className="profile-logout">
          <Link className="result-button logout-button" to="/login">
            Выйти из аккаунта
          </Link>
        </div>
      </form>
    </section>
  )
}

export default ProfilePage
