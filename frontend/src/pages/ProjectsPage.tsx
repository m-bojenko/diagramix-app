import { Link } from 'react-router-dom'

const projects = [
  {
    id: 1,
    name: 'Проект интернет-магазина',
    type: 'Use Case',
    date: '15.04.2026',
  },
  {
    id: 2,
    name: 'Система управления заказами',
    type: 'Activity',
    date: '14.04.2026',
  },
  {
    id: 3,
    name: 'База данных сотрудников',
    type: 'ER',
    date: '13.04.2026',
  },
]

function ProjectsPage() {
  return (
    <section className="projects-page" aria-labelledby="projects-title">
      <header className="projects-header">
        <h1 id="projects-title">Мои проекты</h1>
        <Link className="result-button result-button-primary new-project-button" to="/">
          Новый проект
        </Link>
      </header>

      <div className="projects-list" role="table" aria-label="Список проектов">
        <div className="projects-row projects-row-head" role="row">
          <span role="columnheader">Название проекта</span>
          <span role="columnheader">Тип диаграммы</span>
          <span role="columnheader">Дата</span>
          <span role="columnheader">Действие</span>
        </div>

        {projects.map((project) => (
          <div className="projects-row" role="row" key={project.id}>
            <span className="project-name" role="cell">
              {project.name}
            </span>
            <span role="cell">{project.type}</span>
            <span role="cell">{project.date}</span>
            <span role="cell">
              <Link className="open-project-button" to="/result">
                Открыть
              </Link>
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

export default ProjectsPage
