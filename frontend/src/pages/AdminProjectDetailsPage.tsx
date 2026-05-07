import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import mermaid from 'mermaid'
import { Link, useNavigate, useParams } from 'react-router-dom'

import AdminAuditTable from '../components/AdminAuditTable'
import { useAppMessage } from '../components/AppMessageContext'
import {
  deleteAdminProject,
  downloadProjectFile,
  exportDiagram,
  getAuditLogs,
  getAdminProjectById,
  getAdminUsers,
  getProjectAudit,
  getProjectFileInfo,
  renderPlantUmlPreview,
  type AuditLog,
  type DiagramExportFormat,
  type Project,
  type ProjectFileInfo,
  type User,
} from '../services/api'

let adminMermaidInitialized = false
let adminPreviewCounter = 0

function initializeMermaid() {
  if (adminMermaidInitialized) {
    return
  }

  mermaid.initialize({
    htmlLabels: false,
    securityLevel: 'strict',
    startOnLoad: false,
    suppressErrorRendering: true,
  })
  adminMermaidInitialized = true
}

function downloadBlob(blob: Blob, filename: string) {
  const downloadUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = downloadUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(downloadUrl)
}

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} Б`
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} КБ`
  }

  return `${(size / (1024 * 1024)).toFixed(1)} МБ`
}

function AdminDiagramPreview({ project }: { project: Project }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [message, setMessage] = useState('Строим предпросмотр диаграммы...')
  const previewUrlRef = useRef<string | null>(null)

  const setSvgPreview = useCallback((svg: string) => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
    }

    const nextUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
    previewUrlRef.current = nextUrl
    setPreviewUrl(nextUrl)
  }, [])

  useEffect(() => {
    let isStale = false

    const renderPreview = async () => {
      const code = project.generated_code?.trim()

      if (!code) {
        setMessage('Код диаграммы отсутствует')
        return
      }

      try {
        if (project.diagram_language === 'PlantUML') {
          const result = await renderPlantUmlPreview({ code })

          if (!isStale) {
            setSvgPreview(result.svg)
          }

          return
        }

        initializeMermaid()
        await mermaid.parse(code)
        const { svg } = await mermaid.render(`admin-mermaid-preview-${adminPreviewCounter++}`, code)

        if (!isStale) {
          setSvgPreview(svg)
        }
      } catch (error) {
        console.error('Не удалось построить предпросмотр', error)
        if (!isStale) {
          setMessage('Предпросмотр недоступен')
        }
      }
    }

    renderPreview()

    return () => {
      isStale = true
    }
  }, [project, setSvgPreview])

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
      }
    }
  }, [])

  if (previewUrl) {
    return (
      <div className="admin-diagram-preview">
        <img src={previewUrl} alt="Предпросмотр диаграммы" />
      </div>
    )
  }

  return <div className="admin-diagram-preview admin-diagram-preview-empty">[ {message} ]</div>
}

function AdminProjectDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { confirmMessage, showMessage } = useAppMessage()
  const projectId = Number(id)
  const [project, setProject] = useState<Project | null>(null)
  const [owner, setOwner] = useState<User | null>(null)
  const [projectFile, setProjectFile] = useState<ProjectFileInfo | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [exportFormat, setExportFormat] = useState<DiagramExportFormat>('txt')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [auditError, setAuditError] = useState('')

  const exportOptions = useMemo(() => {
    const sourceOption =
      project?.diagram_language === 'PlantUML'
        ? { label: 'PlantUML (.puml)', value: 'puml' as DiagramExportFormat }
        : { label: 'Mermaid (.mmd)', value: 'mmd' as DiagramExportFormat }

    return [
      { label: 'Текст (.txt)', value: 'txt' as DiagramExportFormat },
      sourceOption,
      { label: 'SVG (.svg)', value: 'svg' as DiagramExportFormat },
    ]
  }, [project?.diagram_language])

  useEffect(() => {
    const loadProject = async () => {
      if (!Number.isFinite(projectId)) {
        setError('Некорректный ID проекта')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const [loadedProject, users] = await Promise.all([getAdminProjectById(projectId), getAdminUsers()])
        setProject(loadedProject)
        setOwner(users.find((user) => user.id === loadedProject.user_id) ?? null)
        setProjectFile(await getProjectFileInfo(loadedProject.id))
        try {
          const [projectAudit, exportAudit] = await Promise.all([
            getProjectAudit(loadedProject.id),
            getAuditLogs({ entityType: 'export', limit: 100 }),
          ])
          const projectExportAudit = exportAudit.filter((log) => {
            try {
              const details = log.details ? (JSON.parse(log.details) as { project_name?: string }) : null

              return details?.project_name === loadedProject.name
            } catch {
              return false
            }
          })
          setAuditLogs([...projectAudit, ...projectExportAudit].sort((a, b) => b.id - a.id).slice(0, 10))
          setAuditError('')
        } catch (auditLoadError) {
          setAuditError(auditLoadError instanceof Error ? auditLoadError.message : 'Не удалось загрузить аудит')
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить проект')
      } finally {
        setIsLoading(false)
      }
    }

    loadProject()
  }, [projectId])

  const handleDownloadProjectFile = async () => {
    if (!project) {
      return
    }

    try {
      const downloadedFile = await downloadProjectFile(project.id)
      downloadBlob(downloadedFile.blob, downloadedFile.filename)
    } catch (downloadError) {
      await showMessage({
        message: downloadError instanceof Error ? downloadError.message : 'Не удалось скачать файл',
        title: 'Ошибка скачивания',
      })
    }
  }

  const handleExport = async () => {
    if (!project || !project.generated_code?.trim()) {
      await showMessage({ message: 'Нет кода диаграммы для экспорта', title: 'Нет данных' })
      return
    }

    try {
      let svg: string | undefined

      if (exportFormat === 'svg' && project.diagram_language === 'Mermaid') {
        initializeMermaid()
        const { svg: renderedSvg } = await mermaid.render(
          `admin-mermaid-export-${adminPreviewCounter++}`,
          project.generated_code,
        )
        svg = renderedSvg
      }

      const exportedFile = await exportDiagram({
        code: project.generated_code,
        diagram_language: project.diagram_language,
        format: exportFormat,
        project_name: project.name,
        svg,
      })
      downloadBlob(exportedFile.blob, exportedFile.filename)
      try {
        const [projectAudit, exportAudit] = await Promise.all([
          getProjectAudit(project.id),
          getAuditLogs({ entityType: 'export', limit: 100 }),
        ])
        const projectExportAudit = exportAudit.filter((log) => {
          try {
            const details = log.details ? (JSON.parse(log.details) as { project_name?: string }) : null

            return details?.project_name === project.name
          } catch {
            return false
          }
        })
        setAuditLogs([...projectAudit, ...projectExportAudit].sort((a, b) => b.id - a.id).slice(0, 10))
      } catch (auditLoadError) {
        console.error('Не удалось обновить аудит проекта', auditLoadError)
      }
    } catch (exportError) {
      await showMessage({
        message: exportError instanceof Error ? exportError.message : 'Не удалось экспортировать диаграмму',
        title: 'Ошибка экспорта',
      })
    }
  }

  const handleDelete = async () => {
    if (!project) {
      return
    }

    const confirmed = await confirmMessage({
      cancelLabel: 'Отмена',
      confirmLabel: 'Удалить',
      message: `Удалить проект "${project.name}"?`,
      title: 'Удаление проекта',
    })

    if (!confirmed) {
      return
    }

    try {
      await deleteAdminProject(project.id)
      navigate('/admin/projects')
    } catch (deleteError) {
      await showMessage({
        message: deleteError instanceof Error ? deleteError.message : 'Не удалось удалить проект',
        title: 'Ошибка удаления',
      })
    }
  }

  if (isLoading) {
    return <div className="admin-state">Загрузка...</div>
  }

  if (error || !project) {
    return <div className="admin-state admin-state-error">{error || 'Проект не найден'}</div>
  }

  return (
    <section className="admin-page" aria-labelledby="admin-project-title">
      <h1 id="admin-project-title">Карточка проекта</h1>

      <section className="admin-card">
        <h2>Основная информация</h2>
        <dl className="admin-project-info-grid">
          <div>
            <dt>ID проекта</dt>
            <dd>{project.id}</dd>
          </div>
          <div>
            <dt>Название проекта</dt>
            <dd>{project.name}</dd>
          </div>
          <div>
            <dt>Владелец</dt>
            <dd>
              {owner ? (
                <Link className="admin-inline-link" to={`/admin/users/${owner.id}`}>
                  {owner.name}
                </Link>
              ) : (
                `ID ${project.user_id}`
              )}
            </dd>
          </div>
          <div>
            <dt>Email владельца</dt>
            <dd>
              {owner ? (
                <Link className="admin-inline-link" to={`/admin/users/${owner.id}`}>
                  {owner.email}
                </Link>
              ) : (
                'Неизвестно'
              )}
            </dd>
          </div>
          <div>
            <dt>Тип диаграммы</dt>
            <dd>{project.diagram_type}</dd>
          </div>
          <div>
            <dt>Дата создания</dt>
            <dd>{project.created_at}</dd>
          </div>
          <div>
            <dt>Дата изменения</dt>
            <dd>{project.updated_at ?? project.created_at}</dd>
          </div>
          <div>
            <dt>Язык</dt>
            <dd>{project.diagram_language}</dd>
          </div>
        </dl>
      </section>

      <section className="admin-card admin-project-content">
        <h2>Содержимое проекта</h2>
        <h3>Краткое описание</h3>
        <div className="admin-readonly-box">{project.description}</div>
        <h3>Область предпросмотра диаграммы</h3>
        <AdminDiagramPreview project={project} />
        <h3>Загруженный файл</h3>
        <div className="admin-file-row">
          <span>{projectFile ? projectFile.filename : 'Файл не загружен'}</span>
          <span>{projectFile ? formatFileSize(projectFile.size) : ''}</span>
          {projectFile ? (
            <button className="admin-small-button" type="button" onClick={handleDownloadProjectFile}>
              Скачать файл
            </button>
          ) : null}
        </div>
        <h3>Блок кода / данных</h3>
        <pre className="admin-code-box">{project.generated_code || 'Код отсутствует'}</pre>
        <h3>История версий</h3>
        <div className="admin-version-placeholder">История версий пока не подключена</div>
        <div className="admin-export-row">
          <label>
            <span>Формат экспорта:</span>
            <select value={exportFormat} onChange={(event) => setExportFormat(event.target.value as DiagramExportFormat)}>
              {exportOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button className="admin-button admin-button-primary" type="button" onClick={handleExport}>
            Экспорт
          </button>
        </div>
      </section>

      <section className="admin-card admin-audit-card">
        <h2>История действий</h2>
        {auditError ? <div className="admin-state admin-state-error">{auditError}</div> : null}
        <AdminAuditTable compact logs={auditLogs} />
      </section>

      <div className="admin-actions-row">
        <button className="admin-button admin-button-danger" type="button" onClick={handleDelete}>
          Удалить проект
        </button>
        <button className="admin-button" type="button" onClick={() => navigate('/admin/projects')}>
          Назад
        </button>
      </div>
    </section>
  )
}

export default AdminProjectDetailsPage
