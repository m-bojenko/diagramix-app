import { Link } from 'react-router-dom'

function RegisterPage() {
  return (
    <main className="auth-page">
      <h1>Register Page</h1>
      <Link to="/login">Войти</Link>
    </main>
  )
}

export default RegisterPage
