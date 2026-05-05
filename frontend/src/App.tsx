import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute, { AdminRoute, PublicRoute } from './components/ProtectedRoute'
import AdminLayout from './layouts/AdminLayout'
import MainLayout from './layouts/MainLayout'
import AdminProfilePage from './pages/AdminProfilePage'
import AdminProjectDetailsPage from './pages/AdminProjectDetailsPage'
import AdminProjectsPage from './pages/AdminProjectsPage'
import AdminUserDetailsPage from './pages/AdminUserDetailsPage'
import AdminUsersPage from './pages/AdminUsersPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import ProjectsPage from './pages/ProjectsPage'
import RegisterPage from './pages/RegisterPage'
import ResultPage from './pages/ResultPage'

function App() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<ProjectsPage />} />
          <Route path="/generate" element={<HomePage />} />
          <Route path="/result" element={<ResultPage />} />
          <Route path="/projects" element={<Navigate to="/" replace />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Navigate to="/admin/projects" replace />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/users/:id" element={<AdminUserDetailsPage />} />
          <Route path="/admin/projects" element={<AdminProjectsPage />} />
          <Route path="/admin/projects/:id" element={<AdminProjectDetailsPage />} />
          <Route path="/admin/profile" element={<AdminProfilePage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
