import { Navigate, Outlet } from 'react-router-dom'
import type { User } from '../services/api'

function hasCurrentUser() {
  return Boolean(localStorage.getItem('diagramix_user'))
}

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

export function PublicRoute() {
  if (hasCurrentUser()) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export function AdminRoute() {
  const currentUser = readCurrentUser()

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  if (currentUser.role !== 'admin') {
    return (
      <main className="admin-forbidden-page">
        <h1>Доступ запрещён</h1>
        <p>Административный раздел доступен только пользователям с ролью администратора.</p>
      </main>
    )
  }

  return <Outlet />
}

function ProtectedRoute() {
  if (!hasCurrentUser()) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
