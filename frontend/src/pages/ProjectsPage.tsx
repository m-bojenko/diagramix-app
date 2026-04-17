import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { deleteProject, getProjects, type Project } from '../services/api'

type CurrentUser = {
  id: number
}

function readCurrentUser() {
  const savedUser = localStorage.getItem('diagramix_user')

  if (!savedUser) {
    return null
  }

  try {
    return JSON.parse(savedUser) as CurrentUser
  } catch (error) {
    console.error('Не удалось прочитать пользователя из localStorage', error)
    return null
  }
}

function ProjectsPage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadProjects = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const currentUser = readCurrentUser()

      if (!currentUser) {
        navigate('/login')
        return
      }

      const loadedProjects = await getProjects(currentUser.id)
      setProjects(loadedProjects)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Ошибка при загрузке проектов')
    } finally {
      setIsLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

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

  const handleDeleteProject = async (project: Project) => {
    const shouldDelete = confirm('Удалить проект?')

    if (!shouldDelete) {
      return
    }

    try {
      await deleteProject(project.id)
      await loadProjects()
    } catch (deleteError) {
      console.error('Ошибка удаления проекта', deleteError)
      alert(deleteError instanceof Error ? deleteError.message : 'Ошибка при удалении проекта')
    }
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
              <span className="project-actions" role="cell">
                <button
                  className="open-project-button"
                  type="button"
                  onClick={() => handleOpenProject(project)}
                >
                  Открыть
                </button>
                <button
                  className="open-project-button"
                  type="button"
                  onClick={() => handleDeleteProject(project)}
                >
                  Удалить
                </button>
              </span>
            </div>
          ))}
      </div>
    </section>
  )
}

export default ProjectsPage
