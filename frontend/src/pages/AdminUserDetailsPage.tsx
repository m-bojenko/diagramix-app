import { type FormEvent, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { useAppMessage } from '../components/AppMessageContext'
import {
  deleteAdminUser,
  getAdminProjects,
  getAdminUserById,
  updateAdminUser,
  type User,
} from '../services/api'

function formatRole(role: string) {
  return role === 'admin' ? 'Администратор' : 'Пользователь'
}

function formatStatus(status: string) {
  if (status === 'blocked') {
    return 'Заблокирован'
  }

  if (status === 'inactive') {
    return 'Неактивен'
  }

  return 'Активен'
}

function AdminUserDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { confirmMessage, showMessage } = useAppMessage()
  const userId = Number(id)
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState('user')
  const [status, setStatus] = useState('active')
  const [projectsCount, setProjectsCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadUser = async () => {
      if (!Number.isFinite(userId)) {
        setError('Некорректный ID пользователя')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const [loadedUser, projects] = await Promise.all([getAdminUserById(userId), getAdminProjects()])
        setUser(loadedUser)
        setRole(loadedUser.role)
        setStatus(loadedUser.status)
        setProjectsCount(projects.filter((project) => project.user_id === loadedUser.id).length)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить пользователя')
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [userId])

  const saveUser = async () => {
    if (!user || isSaving) {
      return
    }

    try {
      setIsSaving(true)
      const updatedUser = await updateAdminUser(user.id, {
        role,
      })
      setUser(updatedUser)
      setRole(updatedUser.role)
      await showMessage({ message: 'Роль пользователя сохранена', title: 'Сохранено' })
    } catch (saveError) {
      await showMessage({
        message: saveError instanceof Error ? saveError.message : 'Не удалось сохранить пользователя',
        title: 'Ошибка сохранения',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await saveUser()
  }

  const handleToggleBlocked = async () => {
    if (!user) {
      return
    }

    const nextStatus = status === 'blocked' ? 'active' : 'blocked'
    const actionLabel = nextStatus === 'blocked' ? 'заблокировать' : 'разблокировать'
    const confirmed = await confirmMessage({
      cancelLabel: 'Отмена',
      confirmLabel: nextStatus === 'blocked' ? 'Заблокировать' : 'Разблокировать',
      message: `Вы точно хотите ${actionLabel} пользователя ${user.email}?`,
      title: nextStatus === 'blocked' ? 'Блокировка пользователя' : 'Разблокировка пользователя',
    })

    if (!confirmed) {
      return
    }

    try {
      const updatedUser = await updateAdminUser(user.id, { status: nextStatus })
      setUser(updatedUser)
      setStatus(updatedUser.status)
    } catch (error) {
      await showMessage({
        message: error instanceof Error ? error.message : 'Не удалось изменить статус пользователя',
        title: 'Ошибка сохранения',
      })
    }
  }

  const handleDelete = async () => {
    if (!user) {
      return
    }

    const confirmed = await confirmMessage({
      cancelLabel: 'Отмена',
      confirmLabel: 'Удалить',
      message: `Вы точно хотите удалить пользователя ${user.email}?`,
      title: 'Удаление пользователя',
    })

    if (!confirmed) {
      return
    }

    try {
      await deleteAdminUser(user.id)
      navigate('/admin/users')
    } catch (deleteError) {
      await showMessage({
        message: deleteError instanceof Error ? deleteError.message : 'Не удалось удалить пользователя',
        title: 'Ошибка удаления',
      })
    }
  }

  if (isLoading) {
    return <div className="admin-state">Загрузка...</div>
  }

  if (error || !user) {
    return <div className="admin-state admin-state-error">{error || 'Пользователь не найден'}</div>
  }

  return (
    <section className="admin-page" aria-labelledby="admin-user-title">
      <h1 id="admin-user-title">Карточка пользователя</h1>

      <div className="admin-details-grid">
        <section className="admin-card">
          <h2>Основная информация</h2>
          <dl className="admin-info-list">
            <div>
              <dt>ID</dt>
              <dd>{user.id}</dd>
            </div>
            <div>
              <dt>Имя</dt>
              <dd>{user.name}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>Роль</dt>
              <dd>{formatRole(user.role)}</dd>
            </div>
            <div>
              <dt>Статус</dt>
              <dd>{formatStatus(user.status)}</dd>
            </div>
            <div>
              <dt>Дата регистрации</dt>
              <dd>{user.created_at}</dd>
            </div>
            <div>
              <dt>Количество проектов</dt>
              <dd>{projectsCount}</dd>
            </div>
          </dl>
        </section>

        <form className="admin-card admin-edit-form" onSubmit={handleSubmit}>
          <h2>Редактирование</h2>
          <label>
            <span>Изменить роль</span>
            <select value={role} onChange={(event) => setRole(event.target.value)}>
              <option value="user">Пользователь</option>
              <option value="admin">Администратор</option>
            </select>
          </label>
          <div className="admin-edit-actions">
            <button className="admin-button admin-button-primary" type="submit" disabled={isSaving}>
              {isSaving ? 'Сохранение...' : 'Сохранить роль'}
            </button>
            <button className="admin-button" type="button" onClick={handleToggleBlocked}>
              {status === 'blocked' ? 'Разблокировать' : 'Заблокировать'}
            </button>
            <button className="admin-button admin-button-danger" type="button" onClick={handleDelete}>
              Удалить пользователя
            </button>
          </div>
        </form>
      </div>

      <div className="admin-actions-row">
        <button className="admin-button" type="button" onClick={() => navigate('/admin/users')}>
          Назад
        </button>
      </div>
    </section>
  )
}

export default AdminUserDetailsPage
