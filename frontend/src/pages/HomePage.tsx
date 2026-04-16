import { type ChangeEvent, type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function HomePage() {
  const navigate = useNavigate()
  const [projectName, setProjectName] = useState('')
  const [description, setDescription] = useState('')
  const [diagramType, setDiagramType] = useState('Use Case')
  const [fileName, setFileName] = useState('Файл не выбран')

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setFileName(file ? file.name : 'Файл не выбран')
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    navigate('/result')
  }

  return (
    <section className="generate-page" aria-labelledby="generate-title">
      <h1 id="generate-title" className="visually-hidden">
        Генерация диаграммы
      </h1>

      <form className="generate-form" onSubmit={handleSubmit}>
        <label className="form-field generate-field">
          <span>Название проекта</span>
          <input
            type="text"
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
            placeholder="Введите название"
          />
        </label>

        <label className="form-field generate-field">
          <span>Описание предметной области</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Опишите систему, роли, процессы и сущности"
            rows={8}
          />
        </label>

        <div className="file-field">
          <span className="field-label">И/или загрузите файл (PDF, Word)</span>
          <div className="file-control">
            <label className="file-button">
              Загрузить файл
              <input
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
              />
            </label>
            <span className="file-name">{fileName}</span>
          </div>
        </div>

        <label className="form-field generate-field">
          <span>Тип диаграммы</span>
          <select value={diagramType} onChange={(event) => setDiagramType(event.target.value)}>
            <option>Use Case</option>
            <option>Activity</option>
            <option>ER</option>
          </select>
        </label>

        <button className="login-button generate-button" type="submit">
          Сгенерировать
        </button>
      </form>
    </section>
  )
}

export default HomePage
