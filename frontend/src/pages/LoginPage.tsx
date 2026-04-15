import { Link } from 'react-router-dom'

function LoginPage() {
  return (
    <main className="auth-page">
      <h1>Login Page</h1>
      <Link to="/register">Регистрация</Link>
    </main>
  )
}

export default LoginPage
