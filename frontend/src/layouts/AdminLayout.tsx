import { Link, NavLink, Outlet } from 'react-router-dom'
import logo from '../assets/logo_diagramix.png'

function AdminLayout() {
  return (
    <div className="admin-layout">
      <header className="admin-header">
        <Link className="admin-logo" to="/admin/projects" aria-label="Diagramix admin">
          <img src={logo} alt="Diagramix" />
        </Link>

        <nav className="admin-nav" aria-label="Администрирование">
          <NavLink to="/admin/projects">Все проекты</NavLink>
          <NavLink to="/admin/users">Пользователи</NavLink>
        </nav>

        <Link className="admin-profile-link" to="/admin/profile" aria-label="Профиль администратора">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
            <path d="M5 20a7 7 0 0 1 14 0" />
          </svg>
        </Link>
      </header>

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout
