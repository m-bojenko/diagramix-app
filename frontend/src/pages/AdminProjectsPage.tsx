import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { getAdminProjects, getAdminUsers, type Project, type User } from '../services/api'

function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [lastUpdated, setLastUpdated] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const userById = useMemo(() => {
    return users.reduce<Record<number, User>>((map, user) => {
      map[user.id] = user
      return map
    }, {})
  }, [users])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const [loadedProjects, loadedUsers] = await Promise.all([getAdminProjects(), getAdminUsers()])
      setProjects(loadedProjects)
      setUsers(loadedUsers)
      setLastUpdated(new Date().toLocaleString('ru-RU'))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить проекты')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  return (
    <section className="admin-page" aria-labelledby="admin-projects-title">
      <div className="admin-title-row">
        <h1 id="admin-projects-title">Администрирование / Все проекты</h1>
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
                  <th>Название проекта</th>
                  <th>Владелец</th>
                  <th>Тип диаграммы</th>
                  <th className="admin-date-column">Дата создания</th>
                  <th>Дата изменения</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => {
                  const owner = userById[project.user_id]

                  return (
                    <tr key={project.id}>
                      <td>{project.id}</td>
                      <td>
                        <Link className="admin-table-action" to={`/admin/projects/${project.id}`}>
                          {project.name}
                        </Link>
                      </td>
                      <td>
                        {owner ? (
                          <Link className="admin-table-action" to={`/admin/users/${owner.id}`}>
                            {owner.email}
                          </Link>
                        ) : (
                          `ID ${project.user_id}`
                        )}
                      </td>
                      <td>{project.diagram_type}</td>
                      <td className="admin-date-column">{project.created_at}</td>
                      <td>{project.updated_at ?? project.created_at}</td>
                      <td>
                        <Link className="admin-table-action" to={`/admin/projects/${project.id}`}>
                          Открыть
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <p className="admin-total">Всего проектов: {projects.length}</p>
    </section>
  )
}

export default AdminProjectsPage
