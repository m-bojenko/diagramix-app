import { type FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAppMessage } from '../components/AppMessageContext'
import { getAdminProjects, updateUser, type User } from '../services/api'

function readCurrentUser() {
  const savedUser = localStorage.getItem('diagramix_user')

  if (!savedUser) {
    return null
  }

  try {
    return JSON.parse(savedUser) as User
  } catch (error) {
    console.error('Не удалось прочитать администратора из localStorage', error)
    return null
  }
}

function AdminProfilePage() {
  const navigate = useNavigate()
  const { showMessage } = useAppMessage()
  const [currentUser, setCurrentUser] = useState<User | null>(() => readCurrentUser())
  const [name, setName] = useState(() => currentUser?.name ?? '')
  const [email, setEmail] = useState(() => currentUser?.email ?? '')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [projectsCount, setProjectsCount] = useState(0)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const loadProjectsCount = async () => {
      try {
        const projects = await getAdminProjects()
        setProjectsCount(projects.length)
      } catch (error) {
        console.error('Не удалось загрузить количество проектов', error)
      }
    }

    loadProjectsCount()
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!currentUser || isSaving) {
      return
    }

    if (!name.trim() || !email.trim()) {
      await showMessage({ message: 'Заполните имя и email', title: 'Не все поля заполнены' })
      return
    }

    if (password || passwordConfirm) {
      if (password !== passwordConfirm) {
        await showMessage({ message: 'Пароли не совпадают', title: 'Проверьте пароль' })
        return
      }

      if (password.length < 8) {
        await showMessage({ message: 'Пароль должен быть не менее 8 символов', title: 'Проверьте пароль' })
        return
      }
    }

    try {
      setIsSaving(true)
      const updatedUser = await updateUser(currentUser.id, {
        email: email.trim(),
        name: name.trim(),
        password: password || undefined,
      })
      localStorage.setItem('diagramix_user', JSON.stringify(updatedUser))
      setCurrentUser(updatedUser)
      setPassword('')
      setPasswordConfirm('')
      await showMessage({ message: 'Изменения сохранены', title: 'Профиль обновлен' })
    } catch (error) {
      await showMessage({
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
    <section className="admin-page admin-profile-page" aria-labelledby="admin-profile-title">
      <h1 id="admin-profile-title">Профиль администратора</h1>

      <form className="admin-profile-form" onSubmit={handleSubmit}>
        <label>
          <span>Имя</span>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Имя" />
        </label>
        <label>
          <span>Email</span>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" />
        </label>
        <label>
          <span>Новый пароль</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Не менее 8 символов"
          />
        </label>
        <label>
          <span>Подтвердите пароль</span>
          <input
            type="password"
            value={passwordConfirm}
            onChange={(event) => setPasswordConfirm(event.target.value)}
            placeholder="Повторите пароль"
          />
        </label>

        <section className="admin-card admin-profile-info" aria-labelledby="admin-profile-info-title">
          <h2 id="admin-profile-info-title">Информация</h2>
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

        <div className="admin-profile-actions">
          <button className="admin-button admin-button-primary" type="submit" disabled={isSaving}>
            {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
          <button className="admin-button" type="button" onClick={() => navigate('/admin/projects')}>
            Назад
          </button>
        </div>

        <div className="admin-profile-logout">
          <button className="admin-button admin-button-danger" type="button" onClick={handleLogout}>
            Выйти из аккаунта
          </button>
        </div>
      </form>
    </section>
  )
}

export default AdminProfilePage

