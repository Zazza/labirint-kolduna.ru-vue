import axios, { type AxiosInstance } from 'axios'
import type {ApiResponse, AuthCredentials, AuthTokens, RegisterResponse} from '@/types'

const DEFAULT_BASE_URL = `http://${import.meta.env.VITE_BACKEND_HOST || '127.0.0.1'}:${import.meta.env.VITE_BACKEND_PORT || 5000}`

class AuthService {
  private client: AxiosInstance
  private readonly TOKEN_KEY = 'access_token'
  private readonly REFRESH_TOKEN_KEY = 'refresh_token'
  private readonly CREDENTIALS_KEY = 'user_credentials'

  constructor(baseURL: string = DEFAULT_BASE_URL) {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Интерцепторы для логирования
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[Auth] ${config.method?.toUpperCase()} ${config.url}`)
        return config
      },
      (error) => {
        console.error('[Auth] Request error:', error)
        return Promise.reject(error)
      }
    )

    this.client.interceptors.response.use(
      (response) => {
        console.log(`[Auth] Response:`, response.data)
        return response
      },
      (error) => {
        console.error('[Auth] Response error:', error.response?.data || error.message)
        return Promise.reject(error)
      }
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
    localStorage.removeItem(this.CREDENTIALS_KEY)
  }

  // Сохранение учётных данных
  saveCredentials(credentials: AuthCredentials): void {
    localStorage.setItem(this.CREDENTIALS_KEY, JSON.stringify(credentials))
  }

  // Получение учётных данных
  getCredentials(): AuthCredentials | null {
    const data = localStorage.getItem(this.CREDENTIALS_KEY)
    return data ? JSON.parse(data) : null
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
    } catch (err: any) {
      return err.response?.data
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
    this.saveCredentials(credentials) // Сохраняем учётные данные
    return tokens
  }

  // Рефреш токена
  async refresh(refreshToken: string): Promise<AuthTokens> {
    const response = await this.client.post<{data: AuthTokens}>(
      '/api/auth/refresh',
      { refresh_token: refreshToken }
    )
    console.log('[AuthService] refresh response:', response.data)
    const tokens = response.data.data
    this.saveTokens(tokens)
    return tokens
  }

  // Логаут
  async logout(): Promise<void> {
    try {
      this.getAccessToken()
//      await this.client.post('/api/auth/logout', {}, {
//        headers: {
//          Authorization: `Bearer ${token}`
//        }
//      })
    } catch (error) {
      console.error('[Auth] Logout error:', error)
    } finally {
      this.clearTokens()
    }
  }
}

export const authService = new AuthService()
