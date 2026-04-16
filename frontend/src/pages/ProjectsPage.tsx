import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { getProjects, type Project } from '../services/api'

function ProjectsPage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const loadedProjects = await getProjects()
        setProjects(loadedProjects)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Ошибка при загрузке проектов')
      } finally {
        setIsLoading(false)
      }
    }

    loadProjects()
  }, [])

  const handleOpenProject = (project: Project) => {
    localStorage.setItem(
      'diagramix_result',
      JSON.stringify({
        project_name: project.name,
        description: project.description,
        diagram_type: project.diagram_type,
        generated_code: project.generated_code,
        message: 'Проект загружен',
      }),
    )

    navigate('/result')
  }

  return (
    <section className="projects-page" aria-labelledby="projects-title">
      <header className="projects-header">
        <h1 id="projects-title">Мои проекты</h1>
        <button
          className="result-button result-button-primary new-project-button"
          type="button"
          onClick={() => navigate('/')}
        >
          Новый проект
        </button>
      </header>

      <div className="projects-list" role="table" aria-label="Список проектов">
        <div className="projects-row projects-row-head" role="row">
          <span role="columnheader">Название проекта</span>
          <span role="columnheader">Тип диаграммы</span>
          <span role="columnheader">Дата</span>
          <span role="columnheader">Действие</span>
        </div>

        {isLoading && <div className="projects-row">Загрузка...</div>}

        {error && !isLoading && <div className="projects-row">{error}</div>}

        {!error && !isLoading && projects.length === 0 && (
          <div className="projects-row">Проекты не найдены</div>
        )}

        {!error &&
          !isLoading &&
          projects.map((project) => (
            <div className="projects-row" role="row" key={project.id}>
              <span className="project-name" role="cell">
                {project.name}
              </span>
              <span role="cell">{project.diagram_type}</span>
              <span role="cell">{project.created_at}</span>
              <span role="cell">
                <button
                  className="open-project-button"
                  type="button"
                  onClick={() => handleOpenProject(project)}
                >
                  Открыть
                </button>
              </span>
            </div>
          ))}
      </div>
    </section>
  )
}

export default ProjectsPage
