import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import AdminAuditTable from '../components/AdminAuditTable'
import { getAdminUsers, getAuditLogs, type AuditLog, type User } from '../services/api'

const limitOptions = [25, 50, 100]

function parseUserId(value: string) {
  const parsedValue = Number(value)

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : undefined
}

function AdminAuditPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [actionSearch, setActionSearch] = useState(searchParams.get('action') ?? '')
  const [entityType, setEntityType] = useState(searchParams.get('entityType') ?? '')
  const [userId, setUserId] = useState(searchParams.get('userId') ?? '')
  const [limit, setLimit] = useState(Number(searchParams.get('limit')) || 50)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const usersById = useMemo(() => {
    return users.reduce<Record<number, User>>((map, user) => {
      map[user.id] = user
      return map
    }, {})
  }, [users])

  const filteredLogs = useMemo(() => {
    const normalizedSearch = actionSearch.trim().toLowerCase()

    if (!normalizedSearch) {
      return logs
    }

    return logs.filter((log) => (log.action ?? '').toLowerCase().includes(normalizedSearch))
  }, [actionSearch, logs])

  const loadAudit = useCallback(async () => {
    try {
      setIsLoading(true)
      setError('')
      const [loadedLogs, loadedUsers] = await Promise.all([
        getAuditLogs({
          entityType: entityType || undefined,
          limit,
          userId: parseUserId(userId),
        }),
        getAdminUsers(),
      ])
      setLogs(loadedLogs)
      setUsers(loadedUsers)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить аудит')
    } finally {
      setIsLoading(false)
    }
  }, [entityType, limit, userId])

  useEffect(() => {
    void loadAudit()
  }, [loadAudit])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextParams = new URLSearchParams()

    if (actionSearch.trim()) {
      nextParams.set('action', actionSearch.trim())
    }

    if (entityType) {
      nextParams.set('entityType', entityType)
    }

    if (parseUserId(userId)) {
      nextParams.set('userId', userId)
    }

    nextParams.set('limit', String(limit))
    setSearchParams(nextParams)
    await loadAudit()
  }

  return (
    <section className="admin-page" aria-labelledby="admin-audit-title">
      <div className="admin-title-row">
        <h1 id="admin-audit-title">Администрирование / Аудит</h1>
      </div>

      <section className="admin-panel">
        <form className="admin-audit-toolbar" onSubmit={handleSubmit}>
          <label>
            <span>Поиск по action</span>
            <input
              type="search"
              value={actionSearch}
              onChange={(event) => setActionSearch(event.target.value)}
              placeholder="project_create"
            />
          </label>

          <label>
            <span>Тип сущности</span>
            <select value={entityType} onChange={(event) => setEntityType(event.target.value)}>
              <option value="">Все</option>
              <option value="auth">auth</option>
              <option value="project">project</option>
              <option value="user">user</option>
            </select>
          </label>

          <label>
            <span>ID пользователя</span>
            <input
              type="number"
              min="1"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              placeholder="Любой"
            />
          </label>

          <label>
            <span>Лимит</span>
            <select value={limit} onChange={(event) => setLimit(Number(event.target.value))}>
              {limitOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <button className="admin-button admin-button-primary" type="submit">
            Применить
          </button>
        </form>

        {isLoading ? <div className="admin-state">Загрузка...</div> : null}
        {error ? <div className="admin-state admin-state-error">{error}</div> : null}
        {!isLoading && !error ? <AdminAuditTable logs={filteredLogs} usersById={usersById} /> : null}
      </section>
    </section>
  )
}

export default AdminAuditPage
