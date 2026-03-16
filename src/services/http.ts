import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios'
import type {ActionResponse, ApiResponse, BonusDTO, Section, Profile, MapData, GameRequestData} from '@/types'
import { useAuthStore } from '@/stores/auth'
import {authService} from "@/services/auth.ts";
import {
  Bonus,
  BribeChoice,
  Choice,
  Meds,
  Move,
  RollTheDice,
  SetBattle,
  Sleep,
  SleepyChoice
} from "@/types/requestType.ts";

const DEFAULT_BASE_URL = `http://${import.meta.env.VITE_BACKEND_HOST || '127.0.0.1'}:${import.meta.env.VITE_BACKEND_PORT || 5000}`

export interface ApiError {
  error?: string;
  message?: string;
}

class HttpService {
  private readonly client: AxiosInstance
  private readonly TOKEN_KEY = 'access_token'
  private isRefreshing = false
  private refreshPromise: Promise<{ success: boolean }> | null = null
  private refreshRetryCount = 0
  private readonly MAX_REFRESH_RETRIES = 3

  constructor(baseURL: string = DEFAULT_BASE_URL) {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Интерцептор для обработки ошибок и обновления токена
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

        // Проверяем, что ошибка связана с токеном
        const isTokenError =
          error.response?.status === 401 ||
          (error.response?.data as ApiError)?.error === 'token not valid' ||
          (error.response?.data as ApiError)?.error?.toLowerCase()?.includes('token')

        // Если это ошибка токена и мы ещё не пробовали повторить запрос
        if (isTokenError && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            // Проверяем лимит попыток обновления
            if (this.refreshRetryCount >= this.MAX_REFRESH_RETRIES) {
              await useAuthStore().logout()
              window.location.href = '/auth'
              return Promise.reject(error)
            }

            // Получаем authStore
            const authStore = useAuthStore()

            // Если уже идёт обновление, ждём его завершения
            if (this.isRefreshing && this.refreshPromise) {
              await this.refreshPromise
            } else {
              this.isRefreshing = true
              this.refreshPromise = authStore.autoRefresh()
              await this.refreshPromise
              this.refreshPromise = null
              this.isRefreshing = false
            }

            // Получаем новый токен
            const newToken = this.getAccessToken()

            // Обновляем заголовок в оригинальном запросе
            if (newToken && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`
            }

            // Повторяем оригинальный запрос
            return this.client(originalRequest)
          } catch (refreshError) {
            this.refreshRetryCount++
            await useAuthStore().logout()
            window.location.href = '/auth'
            return Promise.reject(refreshError)
          }
        }

        return Promise.reject(error)
      }
    )
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY)
  }

  async getSection(): Promise<Section | null> {
    try {
      const token = this.getAccessToken()
      const response = await this.client.get('/api/game/get-section', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      return response.data.data ?? null
    } catch (error) {
      return null
    }
  }

  async getProfile(): Promise<Profile | null> {
    try {
      const token = this.getAccessToken()
      const response = await this.client.get<ApiResponse<Profile>>('/api/game/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      return response.data.data ?? null
    } catch (error) {
      return null
    }
  }

  async getMap(): Promise<MapData | null> {
    try {
      const token = this.getAccessToken()
      const response = await this.client.get<ApiResponse<MapData>>('/api/game/map', {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data.data ?? null
    } catch (error) {
      return null
    }
  }

  async setRequest(requestType: string, data: GameRequestData): Promise<ActionResponse | null> {
    try {
      const token = this.getAccessToken()
      let response: AxiosResponse<ApiResponse<ActionResponse>> | null = null;

      switch (requestType) {
        case Choice:
          response = await this.client.post('/api/game/choice', data, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
          break;
        case Move:
          response = await this.client.post('/api/game/move', data, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
          break;
        case SetBattle:
          response = await this.client.post('/api/game/battle', data, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
          break;
        case Meds:
          response = await this.client.post('/api/game/ability/meds', [], {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
          break;
        case Bonus: //data: BonusDTO
          response = await this.client.post('/api/game/ability/bonus', data, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
          break;
        case Sleep:
          response = await this.client.post('/api/game/ability/sleep', [], {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
          break;
        case SleepyChoice:
          response = await this.client.post('/api/game/ability/sleep/choice', [], {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
          break;
        case BribeChoice:
          response = await this.client.post('/api/game/ability/bribe', [], {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
          break;
        case RollTheDice:
          response = await this.client.get('/api/game/role-the-dice', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
          break;
      }

      return response?.data?.data ?? null
    } catch (error) {
        return null
      }
    }

  // Общий метод для POST запросов
  async post<T = any>(endpoint: string, data: any): Promise<T> {
    const response = await this.client.post<ApiResponse<T>>(endpoint, data)
    return response.data.data!
  }

  // Общий метод для GET запросов
  async get<T = any>(endpoint: string, params?: any): Promise<T> {
    const response = await this.client.get<ApiResponse<T>>(endpoint, { params })
    return response.data.data!
  }
}

export const httpService = new HttpService()