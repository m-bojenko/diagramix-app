export type GenerateRequest = {
  project_name: string
  description: string
  diagram_type: string
  diagram_language: string
}

export type GenerateResponse = {
  project_name: string
  description: string
  diagram_type: string
  diagram_language: string
  generated_code: string
  message: string
}

export type DiagramPreviewRequest = {
  code: string
}

export type DiagramPreviewResponse = {
  svg: string
}

export type DiagramExportFormat = 'txt' | 'mmd' | 'puml' | 'svg'

export type DiagramExportRequest = {
  project_name: string
  diagram_language: string
  code: string
  format: DiagramExportFormat
  svg?: string
}

export type DiagramExportResponse = {
  blob: Blob
  filename: string
}

export type Project = {
  id: number
  name: string
  description: string
  diagram_type: string
  diagram_language: string
  generated_code?: string | null
  created_at: string
  user_id: number
}

export type ProjectFileInfo = {
  id: number
  project_id: number
  filename: string
  mime_type: string
  size: number
  uploaded_at: string
}

export type CreateProjectRequest = {
  name: string
  description: string
  diagram_type: string
  diagram_language: string
  generated_code?: string | null
  created_at: string
  user_id: number
}

export type UpdateProjectRequest = {
  name: string
  description: string
  diagram_type: string
  diagram_language: string
  generated_code?: string | null
}

export type User = {
  id: number
  name: string
  email: string
  role: string
  status: string
  created_at: string
}

export type RegisterUserRequest = {
  name: string
  email: string
  password: string
}

export type LoginUserRequest = {
  email: string
  password: string
}

export type UpdateUserRequest = {
  name: string
  email: string
  password?: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'

function getCurrentUserId() {
  const savedUser = localStorage.getItem('diagramix_user')

  if (!savedUser) {
    throw new Error('Пользователь не авторизован')
  }

  try {
    const user = JSON.parse(savedUser) as { id?: number }

    if (typeof user.id === 'number') {
      return user.id
    }
  } catch (error) {
    console.error('Не удалось прочитать пользователя из localStorage', error)
  }

  throw new Error('Пользователь не авторизован')
}

function withQueryParam(url: string, key: string, value: number) {
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}${key}=${value}`
}

function withCurrentUserId(url: string) {
  return withQueryParam(url, 'user_id', getCurrentUserId())
}

async function getApiErrorMessage(response: Response, fallbackMessage: string) {
  try {
    const data = await response.json()

    if (typeof data?.detail === 'string') {
      return data.detail
    }

    if (Array.isArray(data?.detail)) {
      return data.detail
        .map((error: { msg?: string }) => error.msg)
        .filter(Boolean)
        .join(', ')
    }

    if (typeof data?.message === 'string') {
      return data.message
    }
  } catch (error) {
    console.error('Не удалось прочитать ответ backend', error)
  }

  return `${fallbackMessage}. Статус: ${response.status}`
}

function getFilenameFromContentDisposition(value: string | null) {
  if (!value) {
    return null
  }

  const encodedFilenameMatch = value.match(/filename\*=UTF-8''([^;]+)/i)

  if (encodedFilenameMatch?.[1]) {
    return decodeURIComponent(encodedFilenameMatch[1])
  }

  const filenameMatch = value.match(/filename="([^"]+)"/i)

  return filenameMatch?.[1] ?? null
}

export async function generateDiagram(
  payload: GenerateRequest
): Promise<GenerateResponse> {
  const response = await fetch(`${API_BASE_URL}/generate/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, 'Ошибка при генерации диаграммы'))
  }

  return response.json()
}

export async function renderPlantUmlPreview(
  payload: DiagramPreviewRequest,
  options?: { signal?: AbortSignal }
): Promise<DiagramPreviewResponse> {
  const response = await fetch(`${API_BASE_URL}/preview/plantuml`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: options?.signal,
  })

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, 'Ошибка при построении превью PlantUML'))
  }

  return response.json()
}

export async function exportDiagram(payload: DiagramExportRequest): Promise<DiagramExportResponse> {
  const response = await fetch(`${API_BASE_URL}/export/diagram`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, 'Ошибка при экспорте диаграммы'))
  }

  const blob = await response.blob()
  const filename =
    getFilenameFromContentDisposition(response.headers.get('Content-Disposition')) ??
    `diagramix.${payload.format}`

  return { blob, filename }
}

export async function registerUser(payload: RegisterUserRequest): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, 'Ошибка при регистрации'))
  }

  return response.json()
}

export async function loginUser(payload: LoginUserRequest): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, 'Ошибка при входе'))
  }

  return response.json()
}

export async function updateUser(userId: number, payload: UpdateUserRequest): Promise<User> {
  const response = await fetch(
    withQueryParam(`${API_BASE_URL}/auth/users/${userId}`, 'current_user_id', getCurrentUserId()),
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  )

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, 'Ошибка при сохранении профиля'))
  }

  return response.json()
}

export async function createProject(
  payload: CreateProjectRequest
): Promise<Project> {
  const response = await fetch(withCurrentUserId(`${API_BASE_URL}/projects/`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, 'Ошибка при сохранении проекта'))
  }

  return response.json()
}

export async function updateProject(
  projectId: number,
  payload: UpdateProjectRequest
): Promise<Project> {
  const response = await fetch(withCurrentUserId(`${API_BASE_URL}/projects/${projectId}`), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, 'Ошибка при обновлении проекта'))
  }

  return response.json()
}

export async function getProjects(userId: number): Promise<Project[]> {
  const response = await fetch(`${API_BASE_URL}/projects/?user_id=${userId}`)

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, 'Ошибка при получении списка проектов'))
  }

  return response.json()
}

export async function deleteProject(projectId: number): Promise<{ message: string }> {
  const response = await fetch(withCurrentUserId(`${API_BASE_URL}/projects/${projectId}`), {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, 'Ошибка при удалении проекта'))
  }

  return response.json()
}

export async function uploadProjectFile(projectId: number, file: File): Promise<ProjectFileInfo> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(withCurrentUserId(`${API_BASE_URL}/projects/${projectId}/file`), {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, 'Ошибка при загрузке файла проекта'))
  }

  return response.json()
}

export async function getProjectFileInfo(projectId: number): Promise<ProjectFileInfo | null> {
  const response = await fetch(withCurrentUserId(`${API_BASE_URL}/projects/${projectId}/file`))

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, 'Ошибка при получении файла проекта'))
  }

  return response.json()
}

export async function downloadProjectFile(projectId: number): Promise<DiagramExportResponse> {
  const response = await fetch(withCurrentUserId(`${API_BASE_URL}/projects/${projectId}/file/download`))

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, 'Ошибка при скачивании файла проекта'))
  }

  const blob = await response.blob()
  const filename =
    getFilenameFromContentDisposition(response.headers.get('Content-Disposition')) ??
    'diagramix_file'

  return { blob, filename }
}

export async function getProjectById(projectId: number): Promise<Project> {
  const response = await fetch(withCurrentUserId(`${API_BASE_URL}/projects/${projectId}`))

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, 'Ошибка при получении проекта'))
  }

  return response.json()
}
