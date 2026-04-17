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
  const response = await fetch(`${API_BASE_URL}/auth/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, 'Ошибка при сохранении профиля'))
  }

  return response.json()
}

export async function createProject(
  payload: CreateProjectRequest
): Promise<Project> {
  const response = await fetch(`${API_BASE_URL}/projects/`, {
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
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
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
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, 'Ошибка при удалении проекта'))
  }

  return response.json()
}

export async function getProjectById(projectId: number): Promise<Project> {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}`)

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, 'Ошибка при получении проекта'))
  }

  return response.json()
}
