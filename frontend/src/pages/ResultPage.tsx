import { Link } from 'react-router-dom'

const generatedCode = `graph TD
A[Пользователь] --> B[Система]
B --> C[Диаграмма]`

function ResultPage() {
  const handleSave = () => {
    alert('Результат сохранен')
  }

  return (
    <section className="result-page" aria-labelledby="result-title">
      <header className="result-header">
        <h1 id="result-title">Результат генерации</h1>
        <p>
          <strong>Название проекта:</strong> Проект 1
        </p>
        <p>
          <strong>Тип диаграммы:</strong> Use Case
        </p>
      </header>

      <section className="result-section" aria-labelledby="diagram-title">
        <h2 id="diagram-title">Сгенерированная диаграмма</h2>
        <div className="diagram-preview">
          <span>Здесь будет отображаться сгенерированная диаграмма</span>
        </div>
      </section>

      <section className="result-section" aria-labelledby="code-title">
        <h2 id="code-title">Сгенерированный код</h2>
        <textarea className="code-output" value={generatedCode} readOnly rows={6} />
      </section>

      <div className="result-actions">
        <button className="result-button result-button-primary" type="button" onClick={handleSave}>
          Сохранить
        </button>
        <Link className="result-button" to="/">
          Назад
        </Link>
        <Link className="result-button result-button-primary" to="/">
          Сгенерировать заново
        </Link>
      </div>
    </section>
  )
}

export default ResultPage
