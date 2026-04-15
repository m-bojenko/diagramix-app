import { Link, Outlet } from 'react-router-dom'

function MainLayout() {
  return (
    <div className="app-layout">
      <header className="app-header">
        <Link className="logo" to="/">
          Diagramix
        </Link>

        <nav className="main-nav" aria-label="Основная навигация">
          <Link to="/">Главная</Link>
          <Link to="/result">Результат</Link>
          <Link to="/projects">Проекты</Link>
        </nav>

        <Link className="profile-link" to="/profile">
          Профиль
        </Link>
      </header>

      <main className="page-content">
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout
