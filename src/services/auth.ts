import axios, { type AxiosInstance } from 'axios'
import type {ApiResponse, AuthCredentials, AuthTokens, RegisterResponse} from '@/types'
import type { ApiError } from '@/services/http'

const DEFAULT_BASE_URL = `http://${import.meta.env.VITE_BACKEND_HOST || '127.0.0.1'}:${import.meta.env.VITE_BACKEND_PORT || 5000}`

class AuthService {
  private client: AxiosInstance
  private readonly TOKEN_KEY = 'access_token'
  private readonly REFRESH_TOKEN_KEY = 'refresh_token'

  constructor(baseURL: string = DEFAULT_BASE_URL) {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Интерцепторы для обработки ошибок
    this.client.interceptors.request.use(
      (config) => config,
      (error) => Promise.reject(error)
    )

    this.client.interceptors.response.use(
      (response) => response,
      (error) => Promise.reject(error)
    )
  }

  // Сохранение токенов в localStorage
  private saveTokens(tokens: AuthTokens): void {
    localStorage.setItem(this.TOKEN_KEY, tokens.access_token)
    localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refresh_token)
  }

  // Получение токена доступа
  getAccessToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY)
  }

  // Получение refresh токена
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY)
  }

  // Очистка токенов
  clearTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY)
    localStorage.removeItem(this.REFRESH_TOKEN_KEY)
  }


  // Проверка авторизации
  isAuthenticated(): boolean {
    return !!this.getAccessToken()
  }

  // Регистрация пользователя
  async register(credentials: AuthCredentials): Promise<RegisterResponse> {
    try {
      const response = await this.client.post<{ data: RegisterResponse }>(
          '/api/auth/register',
          credentials
      )
      return {status: true, message: response?.data.data.message}
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: RegisterResponse } }
      return errorObj.response?.data ?? { status: false, error: 'Ошибка регистрации', message: '' }
    }
  }

  // Логин пользователя
  async login(credentials: AuthCredentials): Promise<AuthTokens> {
    const response = await this.client.post<{data: AuthTokens}>(
      '/api/auth/login',
      credentials
    )
    const tokens = response.data.data

    this.saveTokens(tokens)
    return tokens
  }

  // Рефреш токена
  async refresh(refreshToken: string): Promise<AuthTokens> {
    const response = await this.client.post<{data: AuthTokens}>(
      '/api/auth/refresh',
      { refresh_token: refreshToken }
    )
    const tokens = response.data.data
    this.saveTokens(tokens)
    return tokens
  }

  // Логаут
  async logout(): Promise<void> {
    try {
      this.clearTokens()
    } catch (error) {
      this.clearTokens()
    }
  }
}

export const authService = new AuthService()
