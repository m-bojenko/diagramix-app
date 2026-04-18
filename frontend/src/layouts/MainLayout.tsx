import { Link, Outlet, useLocation } from 'react-router-dom'
import logo from '../assets/logo_diagramix.png'

function MainLayout() {
  const location = useLocation()
  const isProfilePage = location.pathname === '/profile'

  return (
    <div className="app-layout">
      <header className="app-header">
        <Link className="logo" to="/">
          <img src={logo} alt="Diagramix" />
        </Link>

        <nav className="main-nav" aria-label="Основная навигация">
          <Link to="/">Главная</Link>
        </nav>

        {!isProfilePage ? (
          <Link className="profile-link" to="/profile" aria-label="Профиль">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
              <path d="M5 20a7 7 0 0 1 14 0" />
            </svg>
          </Link>
        ) : null}
      </header>

      <main className="page-content">
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout
