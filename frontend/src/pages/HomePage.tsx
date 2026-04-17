import { type ChangeEvent, type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAppMessage } from '../components/AppMessageContext'
import { generateDiagram } from '../services/api'

type GenerationFormDraft = {
  project_name: string
  description: string
  diagram_type: string
  diagram_language: string
}

function readGenerationFormDraft() {
  const savedDraft = localStorage.getItem('diagramix_generation_form')

  if (!savedDraft) {
    return null
  }

  try {
    return JSON.parse(savedDraft) as GenerationFormDraft
  } catch (error) {
    console.error('Не удалось прочитать данные формы генерации из localStorage', error)
    return null
  }
}

function HomePage() {
  const navigate = useNavigate()
  const { showMessage } = useAppMessage()
  const [draft] = useState(() => readGenerationFormDraft())
  const [projectName, setProjectName] = useState(() => draft?.project_name ?? '')
  const [description, setDescription] = useState(() => draft?.description ?? '')
  const [diagramType, setDiagramType] = useState(() => draft?.diagram_type ?? 'Use Case')
  const [diagramLanguage, setDiagramLanguage] = useState(() => draft?.diagram_language ?? 'Mermaid')
  const [fileName, setFileName] = useState('Файл не выбран')

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setFileName(file ? file.name : 'Файл не выбран')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!projectName.trim() || !description.trim()) {
      showMessage({
        message: 'Заполните все обязательные поля',
        title: 'Не все поля заполнены',
      })
      return
    }

    const requestPayload = {
      project_name: projectName.trim(),
      description: description.trim(),
      diagram_type: diagramType,
      diagram_language: diagramLanguage,
    }

    try {
      localStorage.setItem('diagramix_generation_form', JSON.stringify(requestPayload))

      const result = await generateDiagram(requestPayload)

      localStorage.setItem(
        'diagramix_result',
        JSON.stringify({
          project_name: result.project_name,
          description: result.description,
          diagram_type: result.diagram_type,
          diagram_language: result.diagram_language,
          generated_code: result.generated_code,
          source: 'generation',
          message: result.message,
        }),
      )

      navigate('/result')
    } catch (error) {
      console.error('Ошибка генерации диаграммы', {
        error,
        payload: requestPayload,
      })
      showMessage({
        message: error instanceof Error ? error.message : 'Ошибка при генерации',
        title: 'Ошибка генерации',
      })
    }
  }

  return (
    <section className="generate-page" aria-labelledby="generate-title">
      <h1 id="generate-title" className="visually-hidden">
        Генерация диаграммы
      </h1>

      <form className="generate-form" onSubmit={handleSubmit}>
        <label className="form-field generate-field">
          <span>
            Название проекта <span className="required-star" aria-hidden="true">*</span>
          </span>
          <input
            type="text"
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
            placeholder="Введите название"
          />
        </label>

        <label className="form-field generate-field">
          <span>
            Описание предметной области <span className="required-star" aria-hidden="true">*</span>
          </span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Опишите систему, роли, процессы и сущности"
            rows={8}
          />
        </label>

        <div className="file-field">
          <span className="field-label">Загрузите файл (PDF, Word)</span>
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

        <div className="language-toggle" role="group" aria-label="Язык описания диаграммы">
          <span className="field-label">Язык описания диаграммы</span>
          <div className="language-toggle-options">
            <button
              className={diagramLanguage === 'Mermaid' ? 'language-toggle-button active' : 'language-toggle-button'}
              type="button"
              onClick={() => setDiagramLanguage('Mermaid')}
            >
              Mermaid
            </button>
            <button
              className={diagramLanguage === 'PlantUML' ? 'language-toggle-button active' : 'language-toggle-button'}
              type="button"
              onClick={() => setDiagramLanguage('PlantUML')}
            >
              PlantUML
            </button>
          </div>
        </div>

        <button className="login-button generate-button" type="submit">
          Сгенерировать
        </button>
      </form>
    </section>
  )
}

export default HomePage
