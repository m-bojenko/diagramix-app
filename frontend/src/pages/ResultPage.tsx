import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import { createProject } from '../services/api'

type DiagramixResult = {
  project_name: string
  description: string
  diagram_type: string
  generated_code: string
  message?: string
}

function ResultPage() {
  const navigate = useNavigate()

  const result = useMemo<DiagramixResult | null>(() => {
    const savedResult = localStorage.getItem('diagramix_result')

    if (!savedResult) {
      return null
    }

    try {
      return JSON.parse(savedResult) as DiagramixResult
    } catch (error) {
      console.error('Не удалось прочитать результат генерации из localStorage', error)
      return null
    }
  }, [])

  const handleSave = async () => {
    if (!result) {
      return
    }

    try {
      await createProject({
        name: result.project_name,
        description: result.description ?? '',
        diagram_type: result.diagram_type,
        generated_code: result.generated_code,
        created_at: new Date().toISOString().slice(0, 10),
      })

      alert('Проект сохранён')
    } catch (error) {
      console.error('Ошибка сохранения проекта', {
        error,
        result,
      })
      alert(error instanceof Error ? error.message : 'Ошибка при сохранении проекта')
    }
  }

  if (!result) {
    return (
      <section className="result-page" aria-labelledby="result-title">
        <header className="result-header">
          <h1 id="result-title">Результат генерации</h1>
          <p>Нет данных для отображения</p>
        </header>

        <div className="result-actions">
          <button className="result-button" type="button" onClick={() => navigate('/')}>
            Назад
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="result-page" aria-labelledby="result-title">
      <header className="result-header">
        <h1 id="result-title">Результат генерации</h1>
        <p>
          <strong>Название проекта:</strong> {result.project_name}
        </p>
        <p>
          <strong>Тип диаграммы:</strong> {result.diagram_type}
        </p>
        <p>
          <strong>Описание:</strong> {result.description}
        </p>
        {result.message ? <p>{result.message}</p> : null}
      </header>

      <section className="result-section" aria-labelledby="diagram-title">
        <h2 id="diagram-title">Сгенерированная диаграмма</h2>
        <div className="diagram-preview">
          <span>Здесь будет отображаться сгенерированная диаграмма</span>
        </div>
      </section>

      <section className="result-section" aria-labelledby="code-title">
        <h2 id="code-title">Сгенерированный код</h2>
        <textarea className="code-output" value={result.generated_code} readOnly rows={6} />
      </section>

      <div className="result-actions">
        <button className="result-button result-button-primary" type="button" onClick={handleSave}>
          Сохранить
        </button>
        <button className="result-button" type="button" onClick={() => navigate('/')}>
          Назад
        </button>
        <button className="result-button result-button-primary" type="button" onClick={() => navigate('/')}>
          Сгенерировать заново
        </button>
      </div>
    </section>
  )
}

export default ResultPage
