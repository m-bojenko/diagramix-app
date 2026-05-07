import type { AuditLog, User } from '../services/api'

const actionLabels: Record<string, string> = {
  admin_project_delete: 'Удаление проекта',
  admin_user_delete: 'Удаление пользователя',
  admin_user_update: 'Изменение пользователя',
  diagram_export: 'Экспорт',
  login_success: 'Вход',
  project_create: 'Создание проекта',
  project_delete: 'Удаление проекта',
  project_update: 'Изменение проекта',
  user_block: 'Блокировка',
}

function formatAuditDate(value?: string | null) {
  if (!value) {
    return 'Неизвестно'
  }

  const normalizedValue = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value
  const date = new Date(normalizedValue)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

function formatActionLabel(action?: string | null) {
  if (!action) {
    return 'Неизвестно'
  }

  return actionLabels[action] ?? action
}

function formatAuditDetails(details?: string | null) {
  if (!details) {
    return 'Нет деталей'
  }

  try {
    const parsedDetails = JSON.parse(details) as unknown

    if (parsedDetails && typeof parsedDetails === 'object') {
      return JSON.stringify(parsedDetails, null, 2)
    }
  } catch {
    return details
  }

  return details
}

function getUserLabel(userId: number | null | undefined, usersById?: Record<number, User>) {
  if (!userId) {
    return 'Система'
  }

  const user = usersById?.[userId]

  if (!user) {
    return `ID ${userId}`
  }

  return `${user.name} (${user.email})`
}

type AdminAuditTableProps = {
  compact?: boolean
  logs: AuditLog[]
  usersById?: Record<number, User>
}

function AdminAuditTable({ compact = false, logs, usersById }: AdminAuditTableProps) {
  if (logs.length === 0) {
    return <div className="admin-audit-empty">Действия отсутствуют</div>
  }

  return (
    <div className="admin-table-wrap admin-audit-table-wrap">
      <table className={`admin-table admin-audit-table${compact ? ' admin-audit-table-compact' : ''}`}>
        <thead>
          <tr>
            <th className="admin-date-column">Дата/время</th>
            {!compact ? <th>Пользователь</th> : null}
            <th>Действие</th>
            {!compact ? <th>Тип сущности</th> : null}
            {!compact ? <th>entity_id</th> : null}
            <th>details</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td className="admin-date-column">{formatAuditDate(log.created_at)}</td>
              {!compact ? <td>{getUserLabel(log.user_id, usersById)}</td> : null}
              <td>
                <span className="admin-action-chip">{formatActionLabel(log.action)}</span>
              </td>
              {!compact ? <td>{log.entity_type || 'Неизвестно'}</td> : null}
              {!compact ? <td>{log.entity_id ?? '-'}</td> : null}
              <td>
                <pre className="admin-audit-details">{formatAuditDetails(log.details)}</pre>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default AdminAuditTable
