import { type FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAppMessage } from '../components/AppMessageContext'
import { getProjects, updateUser, type User } from '../services/api'

function readCurrentUser() {
  const savedUser = localStorage.getItem('diagramix_user')

  if (!savedUser) {
    return null
  }

  try {
    return JSON.parse(savedUser) as User
  } catch (error) {
    console.error('Не удалось прочитать пользователя из localStorage', error)
    return null
  }
}

function ProfilePage() {
  const navigate = useNavigate()
  const { showMessage } = useAppMessage()
  const [currentUser, setCurrentUser] = useState<User | null>(() => readCurrentUser())
  const [name, setName] = useState(() => currentUser?.name ?? '')
  const [email, setEmail] = useState(() => currentUser?.email ?? '')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [projectsCount, setProjectsCount] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const hasProfileChanges =
    Boolean(currentUser) &&
    (name.trim() !== currentUser?.name ||
      email.trim() !== currentUser?.email ||
      Boolean(password) ||
      Boolean(passwordConfirm))

  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { replace: true })
      return
    }

    const loadProjectsCount = async () => {
      try {
        const projects = await getProjects(currentUser.id)
        setProjectsCount(projects.length)
      } catch (error) {
        console.error('Не удалось загрузить количество проектов', error)
      }
    }

    loadProjectsCount()
  }, [currentUser, navigate])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!currentUser) {
      showMessage({
        message: 'Пользователь не авторизован',
        title: 'Нет доступа',
      })
      navigate('/login', { replace: true })
      return
    }

    if (!hasProfileChanges || isSaving) {
      return
    }

    if (!name.trim() || !email.trim()) {
      showMessage({
        message: 'Заполните имя и email',
        title: 'Не все поля заполнены',
      })
      return
    }

    if (password || passwordConfirm) {
      if (password !== passwordConfirm) {
        showMessage({
          message: 'Пароли не совпадают',
          title: 'Проверьте пароль',
        })
        return
      }

      if (password.length < 8) {
        showMessage({
          message: 'Пароль должен быть не менее 8 символов',
          title: 'Проверьте пароль',
        })
        return
      }
    }

    try {
      setIsSaving(true)
      const updatedUser = await updateUser(currentUser.id, {
        name: name.trim(),
        email: email.trim(),
        password: password || undefined,
      })

      localStorage.setItem('diagramix_user', JSON.stringify(updatedUser))
      setCurrentUser(updatedUser)
      setName(updatedUser.name)
      setEmail(updatedUser.email)
      setPassword('')
      setPasswordConfirm('')
      showMessage({
        message: 'Изменения сохранены',
        title: 'Профиль обновлен',
      })
    } catch (error) {
      console.error('Ошибка сохранения профиля', error)
      showMessage({
        message: error instanceof Error ? error.message : 'Ошибка при сохранении профиля',
        title: 'Ошибка сохранения',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('diagramix_user')
    navigate('/login', { replace: true })
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
              <dd>{currentUser?.created_at ?? 'Неизвестно'}</dd>
            </div>
            <div>
              <dt>Количество проектов</dt>
              <dd>{projectsCount}</dd>
            </div>
          </dl>
        </section>

        <div className="profile-actions">
          <button
            className="result-button result-button-primary"
            type="submit"
            disabled={!hasProfileChanges || isSaving}
          >
            {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
          <button className="result-button result-button-primary" type="button" onClick={() => navigate(-1)}>
            Назад
          </button>
        </div>

        <div className="profile-logout">
          <button className="result-button logout-button" type="button" onClick={handleLogout}>
            Выйти из аккаунта
          </button>
        </div>
      </form>
    </section>
  )
}

export default ProfilePage
