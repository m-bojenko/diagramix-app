import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import mermaid from 'mermaid'
import { useNavigate } from 'react-router-dom'

import { useAppMessage } from '../components/AppMessageContext'
import {
  createProject,
  exportDiagram,
  renderPlantUmlPreview,
  updateProject,
  type DiagramExportFormat,
} from '../services/api'

type DiagramixResult = {
  project_id?: number
  project_name: string
  description: string
  diagram_type: string
  diagram_language: string
  generated_code: string
  source?: 'generation' | 'project'
  user_id?: number
  message?: string
}

type DiagramixUser = {
  id: number
}

type DiagramPreviewState = {
  status: 'empty' | 'loading' | 'ready' | 'error'
  imageUrl?: string
  message?: string
}

type ExportOption = {
  label: string
  value: DiagramExportFormat
}

let mermaidInitialized = false
let mermaidPreviewCounter = 0

function readDiagramixResult() {
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
}

function readDiagramixUser() {
  const savedUser = localStorage.getItem('diagramix_user')

  if (!savedUser) {
    return null
  }

  try {
    return JSON.parse(savedUser) as DiagramixUser
  } catch (error) {
    console.error('Не удалось прочитать пользователя из localStorage', error)
    return null
  }
}

function initializeMermaid() {
  if (mermaidInitialized) {
    return
  }

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    htmlLabels: false,
    suppressErrorRendering: true,
  })

  mermaidInitialized = true
}

function getPreviewErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.name === 'AbortError') {
    return ''
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallback
}

function assertSvgDocument(svg: string) {
  const parsedDocument = new DOMParser().parseFromString(svg, 'image/svg+xml')
  const parserError = parsedDocument.querySelector('parsererror')
  const rootElement = parsedDocument.documentElement

  if (parserError || rootElement.tagName.toLowerCase() !== 'svg') {
    throw new Error('Сервер вернул не диаграмму. Попробуйте построить превью ещё раз.')
  }
}

async function renderMermaidSvg(code: string) {
  initializeMermaid()
  await mermaid.parse(code)

  const previewId = `diagramix-mermaid-preview-${mermaidPreviewCounter++}`
  const { svg } = await mermaid.render(previewId, code)
  assertSvgDocument(svg)

  return svg
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

function DiagramPreview({
  code,
  language,
  onSvgChange,
}: {
  code: string
  language: string
  onSvgChange: (svg: string | null) => void
}) {
  const [preview, setPreview] = useState<DiagramPreviewState>({ status: 'empty' })
  const imageUrlRef = useRef<string | null>(null)

  const setPreviewImage = useCallback(
    (svg: string) => {
      assertSvgDocument(svg)

      if (imageUrlRef.current) {
        URL.revokeObjectURL(imageUrlRef.current)
      }

      const nextImageUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
      imageUrlRef.current = nextImageUrl
      onSvgChange(svg)
      setPreview({ imageUrl: nextImageUrl, status: 'ready' })
    },
    [onSvgChange],
  )

  const clearPreviewImage = useCallback(() => {
    if (imageUrlRef.current) {
      URL.revokeObjectURL(imageUrlRef.current)
      imageUrlRef.current = null
    }

    onSvgChange(null)
  }, [onSvgChange])

  useEffect(() => {
    return () => {
      clearPreviewImage()
    }
  }, [clearPreviewImage])

  useEffect(() => {
    const trimmedCode = code.trim()

    if (!trimmedCode) {
      clearPreviewImage()
      const emptyPreviewTimer = window.setTimeout(() => {
        setPreview({ message: 'Код диаграммы пустой', status: 'empty' })
      }, 0)

      return () => {
        window.clearTimeout(emptyPreviewTimer)
      }
    }

    const abortController = new AbortController()
    let isStale = false

    clearPreviewImage()
    const loadingTimer = window.setTimeout(() => {
      setPreview({ message: 'Строим превью диаграммы...', status: 'loading' })
    }, 0)

    const renderTimer = window.setTimeout(async () => {
      try {
        if (language === 'PlantUML') {
          const result = await renderPlantUmlPreview(
            { code: trimmedCode },
            { signal: abortController.signal },
          )

          if (!isStale) {
            setPreviewImage(result.svg)
          }

          return
        }

        const svg = await renderMermaidSvg(trimmedCode)

        if (!isStale) {
          setPreviewImage(svg)
        }
      } catch (error) {
        if (isStale || abortController.signal.aborted) {
          return
        }

        console.error('Ошибка построения превью диаграммы', {
          error,
          language,
        })

        setPreview({
          message:
            language === 'PlantUML'
              ? getPreviewErrorMessage(error, 'В PlantUML коде есть синтаксическая ошибка')
              : 'В Mermaid коде есть синтаксическая ошибка',
          status: 'error',
        })
      }
    }, 250)

    return () => {
      isStale = true
      abortController.abort()
      window.clearTimeout(loadingTimer)
      window.clearTimeout(renderTimer)
    }
  }, [clearPreviewImage, code, language, setPreviewImage])

  if (preview.status === 'ready' && preview.imageUrl) {
    return (
      <div className="diagram-preview diagram-preview-rendered">
        <img src={preview.imageUrl} alt="Превью диаграммы" />
      </div>
    )
  }

  return (
    <div className={`diagram-preview diagram-preview-${preview.status}`}>
      <span>
        {preview.message ??
          (preview.status === 'error'
            ? 'В коде диаграммы есть синтаксическая ошибка'
            : 'Здесь будет отображаться сгенерированная диаграмма')}
      </span>
    </div>
  )
}

function ResultPage() {
  const navigate = useNavigate()
  const { confirmMessage, showMessage } = useAppMessage()

  const result = useMemo<DiagramixResult | null>(() => readDiagramixResult(), [])
  const [projectId, setProjectId] = useState(() => result?.project_id)
  const [projectName, setProjectName] = useState(() => result?.project_name ?? '')
  const [generatedCode, setGeneratedCode] = useState(() => result?.generated_code ?? '')
  const [savedProjectName, setSavedProjectName] = useState(() => result?.project_name ?? '')
  const [savedGeneratedCode, setSavedGeneratedCode] = useState(() => result?.generated_code ?? '')
  const [isSaved, setIsSaved] = useState(() => Boolean(result?.project_id))
  const [renderedSvg, setRenderedSvg] = useState<string | null>(null)
  const [exportFormat, setExportFormat] = useState<DiagramExportFormat>('txt')
  const hasUnsavedChanges =
    Boolean(result) &&
    (!isSaved || projectName !== savedProjectName || generatedCode !== savedGeneratedCode)
  const diagramLanguage = result?.diagram_language ?? 'Mermaid'
  const exportOptions = useMemo<ExportOption[]>(() => {
    const sourceOption: ExportOption =
      diagramLanguage === 'PlantUML'
        ? { label: 'PlantUML (.puml)', value: 'puml' }
        : { label: 'Mermaid (.mmd)', value: 'mmd' }

    return [
      { label: 'Текст (.txt)', value: 'txt' },
      sourceOption,
      { label: 'SVG (.svg)', value: 'svg' },
    ]
  }, [diagramLanguage])
  const selectedExportFormat = exportOptions.some((option) => option.value === exportFormat)
    ? exportFormat
    : 'txt'
  const returnButtonLabel = result?.source === 'generation' ? 'Назад' : 'Вернуться к проектам'
  const returnButtonPath = result?.source === 'generation' ? '/generate' : '/'

  const completeNavigation = useCallback(
    (path: string, options?: { clearGenerationDraft?: boolean }) => {
      if (options?.clearGenerationDraft) {
        localStorage.removeItem('diagramix_generation_form')
        localStorage.removeItem('diagramix_result')
      }

      navigate(path)
    },
    [navigate],
  )

  const navigateWithUnsavedCheck = useCallback(
    async (path: string, options?: { clearGenerationDraft?: boolean }) => {
      if (hasUnsavedChanges) {
        const shouldLeave = await confirmMessage({
          cancelLabel: 'Остаться',
          confirmLabel: 'Да, все равно покинуть',
          message:
            'В проекте есть несохраненные изменения. Все равно хотите покинуть страницу без сохранения?',
          title: 'Несохраненные изменения',
        })

        if (!shouldLeave) {
          return
        }
      }

      completeNavigation(path, options)
    },
    [completeNavigation, confirmMessage, hasUnsavedChanges],
  )

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) {
        return
      }

      event.preventDefault()
      event.returnValue =
        'В проекте есть несохраненные изменения. Все равно хотите покинуть страницу без сохранения?'
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [hasUnsavedChanges])

  useEffect(() => {
    const handleDocumentClick = async (event: MouseEvent) => {
      if (!hasUnsavedChanges) {
        return
      }

      const target = event.target

      if (!(target instanceof Element)) {
        return
      }

      const link = target.closest('a[href]')

      if (!(link instanceof HTMLAnchorElement) || link.target === '_blank') {
        return
      }

      const nextUrl = new URL(link.href)

      if (nextUrl.origin !== window.location.origin) {
        return
      }

      const nextPath = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`
      const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`

      if (nextPath === currentPath) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      await navigateWithUnsavedCheck(nextPath)
    }

    document.addEventListener('click', handleDocumentClick, true)

    return () => {
      document.removeEventListener('click', handleDocumentClick, true)
    }
  }, [hasUnsavedChanges, navigateWithUnsavedCheck])

  const handleSave = async () => {
    const currentUser = readDiagramixUser()

    if (!currentUser) {
      showMessage({
        message: 'Пользователь не авторизован',
        title: 'Нет доступа',
      })
      return
    }

    const currentResult = readDiagramixResult()

    if (!currentResult) {
      showMessage({
        message: 'Нет данных для сохранения',
        title: 'Нет данных',
      })
      return
    }

    if (!projectName.trim()) {
      showMessage({
        message: 'Введите название проекта',
        title: 'Не все поля заполнены',
      })
      return
    }

    try {
      const savedProject = projectId
        ? await updateProject(projectId, {
            name: projectName.trim(),
            description: currentResult.description,
            diagram_type: currentResult.diagram_type,
            diagram_language: currentResult.diagram_language ?? 'Mermaid',
            generated_code: generatedCode,
          })
        : await createProject({
            name: projectName.trim(),
            description: currentResult.description,
            diagram_type: currentResult.diagram_type,
            diagram_language: currentResult.diagram_language ?? 'Mermaid',
            generated_code: generatedCode,
            created_at: new Date().toISOString().slice(0, 10),
            user_id: currentUser.id,
          })

      const savedResult = {
        ...currentResult,
        project_id: savedProject.id,
        project_name: savedProject.name,
        diagram_language: savedProject.diagram_language,
        generated_code: savedProject.generated_code ?? '',
        user_id: savedProject.user_id,
        message: 'Проект сохранён',
      }

      localStorage.setItem('diagramix_result', JSON.stringify(savedResult))
      setProjectId(savedProject.id)
      setProjectName(savedProject.name)
      setGeneratedCode(savedProject.generated_code ?? '')
      setSavedProjectName(savedProject.name)
      setSavedGeneratedCode(savedProject.generated_code ?? '')
      setIsSaved(true)

      showMessage({
        message: 'Проект сохранён',
        title: 'Сохранено',
      })
    } catch (error) {
      console.error('Ошибка сохранения проекта', {
        error,
        result: currentResult,
        user: currentUser,
      })
      showMessage({
        message: error instanceof Error ? error.message : 'Ошибка при сохранении проекта',
        title: 'Ошибка сохранения',
      })
    }
  }

  const handleExport = async () => {
    if (!result) {
      showMessage({
        message: 'Нет данных для экспорта',
        title: 'Нет данных',
      })
      return
    }

    if (!generatedCode.trim()) {
      showMessage({
        message: 'Нет кода диаграммы для экспорта',
        title: 'Нет данных',
      })
      return
    }

    try {
      let svg = renderedSvg ?? undefined

      if (selectedExportFormat === 'svg' && diagramLanguage === 'Mermaid' && !svg) {
        svg = await renderMermaidSvg(generatedCode.trim())
      }

      const exportedFile = await exportDiagram({
        code: generatedCode,
        diagram_language: diagramLanguage,
        format: selectedExportFormat,
        project_name: projectName.trim() || result.project_name,
        svg: selectedExportFormat === 'svg' ? svg : undefined,
      })

      downloadBlob(exportedFile.blob, exportedFile.filename)
    } catch (error) {
      console.error('Ошибка экспорта диаграммы', {
        error,
        exportFormat: selectedExportFormat,
        language: diagramLanguage,
      })
      showMessage({
        message: error instanceof Error ? error.message : 'Не удалось экспортировать диаграмму',
        title: 'Ошибка экспорта',
      })
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
        <div className="result-title-row">
          <h1 id="result-title">Результат генерации</h1>
          <button
            className="result-button result-top-button"
            type="button"
            onClick={() => navigateWithUnsavedCheck(returnButtonPath)}
          >
            {returnButtonLabel}
          </button>
        </div>
        <p>
          <strong>Название проекта:</strong>
        </p>
        <label className="form-field generate-field">
          <span className="visually-hidden">Название проекта</span>
          <input
            type="text"
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
          />
        </label>
        <p>
          <strong>Тип диаграммы:</strong> {result.diagram_type}
          <span> · </span>
          <strong>Язык:</strong> {diagramLanguage}
        </p>
        <p>
          <strong>Описание:</strong> {result.description}
        </p>
        {result.message ? <p>{result.message}</p> : null}
      </header>

      <section className="result-section" aria-labelledby="diagram-title">
        <h2 id="diagram-title">Сгенерированная диаграмма</h2>
        <DiagramPreview code={generatedCode} language={diagramLanguage} onSvgChange={setRenderedSvg} />
      </section>

      <section className="result-section" aria-labelledby="code-title">
        <h2 id="code-title">Сгенерированный код</h2>
        <textarea
          className="code-output"
          value={generatedCode}
          onChange={(event) => setGeneratedCode(event.target.value)}
          rows={6}
        />
      </section>

      <div className="result-actions">
        <button className="result-button result-button-primary" type="button" onClick={handleSave}>
          Сохранить
        </button>
        <button
          className="result-button"
          type="button"
          onClick={() => navigateWithUnsavedCheck('/generate', { clearGenerationDraft: true })}
        >
          Сгенерировать заново
        </button>
      </div>

      <section className="export-panel" aria-labelledby="export-title">
        <div>
          <h2 id="export-title">Экспорт</h2>
          <p>Скачайте код диаграммы или текущий SVG-превью.</p>
        </div>
        <label className="export-control">
          <span>Формат</span>
          <select
            value={selectedExportFormat}
            onChange={(event) => setExportFormat(event.target.value as DiagramExportFormat)}
          >
            {exportOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button className="result-button" type="button" onClick={handleExport}>
          Экспорт
        </button>
      </section>

    </section>
  )
}

export default ResultPage
