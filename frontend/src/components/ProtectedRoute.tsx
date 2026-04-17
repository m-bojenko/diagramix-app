import { Navigate, Outlet } from 'react-router-dom'

function hasCurrentUser() {
  return Boolean(localStorage.getItem('diagramix_user'))
}

export function PublicRoute() {
  if (hasCurrentUser()) {
    return <Navigate to="/" replace />
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
