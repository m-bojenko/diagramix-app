import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { getAdminProjects, getAdminUsers, type Project, type User } from '../services/api'

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

function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [lastUpdated, setLastUpdated] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const projectCountByUser = useMemo(() => {
    return projects.reduce<Record<number, number>>((counts, project) => {
      counts[project.user_id] = (counts[project.user_id] ?? 0) + 1
      return counts
    }, {})
  }, [projects])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const [loadedUsers, loadedProjects] = await Promise.all([getAdminUsers(), getAdminProjects()])
      setUsers(loadedUsers)
      setProjects(loadedProjects)
      setLastUpdated(new Date().toLocaleString('ru-RU'))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить пользователей')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  return (
    <section className="admin-page" aria-labelledby="admin-users-title">
      <div className="admin-title-row">
        <h1 id="admin-users-title">Администрирование / Пользователи</h1>
      </div>

      <section className="admin-panel">
        <div className="admin-list-toolbar">
          <strong>Последнее обновление списка: {lastUpdated || '...'}</strong>
          <button className="admin-link-button" type="button" onClick={loadData}>
            Обновить
          </button>
        </div>

        {isLoading ? <div className="admin-state">Загрузка...</div> : null}
        {error ? <div className="admin-state admin-state-error">{error}</div> : null}

        {!isLoading && !error ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Имя</th>
                  <th>Email</th>
                  <th>Роль</th>
                  <th>Статус</th>
                  <th>Дата регистрации</th>
                  <th>Кол-во проектов</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>
                      <Link className="admin-table-action" to={`/admin/users/${user.id}`}>
                        {user.name}
                      </Link>
                    </td>
                    <td>
                      <Link className="admin-table-action" to={`/admin/users/${user.id}`}>
                        {user.email}
                      </Link>
                    </td>
                    <td>{formatRole(user.role)}</td>
                    <td>{formatStatus(user.status)}</td>
                    <td>{user.created_at}</td>
                    <td>{projectCountByUser[user.id] ?? 0}</td>
                    <td>
                      <Link className="admin-table-action" to={`/admin/users/${user.id}`}>
                        Открыть
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <p className="admin-total">Всего учетных записей: {users.length}</p>
    </section>
  )
}

export default AdminUsersPage
