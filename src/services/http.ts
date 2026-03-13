import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type {ActionResponse, ApiResponse, BonusDTO, Section, Profile, MapData} from '@/types'
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

class HttpService {
  private client: AxiosInstance
  private readonly TOKEN_KEY = 'access_token'
  private isRefreshing = false
  private refreshPromise: Promise<any> | null = null

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
        console.log(`[HTTP] ${config.method?.toUpperCase()} ${config.url}`)
        return config
      },
      (error) => {
        console.error('[HTTP] Request error:', error)
        return Promise.reject(error)
      }
    )

    this.client.interceptors.response.use(
      (response) => {
        console.log(`[HTTP] Response:`, response.data)
        return response
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

        // Проверяем, что ошибка связана с токеном
        const isTokenError =
          error.response?.status === 401 ||
          (error.response?.data as any)?.error === 'token not valid' ||
          (error.response?.data as any)?.error?.toLowerCase()?.includes('token')

        console.log('[HTTP] Response error, isTokenError:', isTokenError, 'status:', error.response?.status, 'data:', error.response?.data)

        // Если это ошибка токена и мы ещё не пробовали повторить запрос
        if (isTokenError && !originalRequest._retry) {
          console.log('[HTTP] Token error, trying refresh...')
          originalRequest._retry = true

          try {
            // Получаем authStore
            const authStore = useAuthStore()
            console.log('[HTTP] authStore credentials:', authStore)

            // Если уже идёт обновление, ждём его завершения
            if (this.isRefreshing && this.refreshPromise) {
              console.log('[HTTP] Already refreshing, waiting...')
              await this.refreshPromise
            } else {
              console.log('[HTTP] Starting refresh...')
              this.isRefreshing = true
              this.refreshPromise = authStore.autoRefresh()
              await this.refreshPromise
              this.refreshPromise = null
              this.isRefreshing = false
            }

            // Получаем новый токен
            const newToken = this.getAccessToken()
            console.log('[HTTP] New token after refresh:', newToken ? 'exists' : 'null')

            // Обновляем заголовок в оригинальном запросе
            if (newToken && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`
            }

            // Повторяем оригинальный запрос
            return this.client(originalRequest)
          } catch (refreshError) {
            // Если refresh не удался, редиректим на страницу логина
            console.log('[HTTP] Token refresh failed:', refreshError)
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
      console.log('[HTTP] getCurrentSection error:', error)
      return null
    }
  }

  async getProfile(): Promise<Profile | null> {
    try {
      const token = this.getAccessToken()
      console.log('[HTTP] getProfile token:', token ? 'exists' : 'null')
      const response = await this.client.get<ApiResponse<Profile>>('/api/game/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      return response.data.data ?? null
    } catch (error: any) {
      console.log('[HTTP] getProfile error:', error.response?.status, error.response?.data || error.message)
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
    } catch (error: any) {
      const status = error.response?.status
      const data = error.response?.data

      if (status === 401) {
        console.log('[HTTP] getMap error: Unauthorized')
      } else if (status === 403) {
        console.log('[HTTP] getMap error: Forbidden')
      } else if (status === 404) {
        console.log('[HTTP] getMap error: Not Found')
      } else if (data?.message) {
        console.log('[HTTP] getMap error:', data.message)
      } else {
        console.log('[HTTP] getMap error:', error.message || 'Unknown error')
      }

      return null
    }
  }

  async setRequest(requestType: string, data: any): Promise<ActionResponse | null> {
    try {
      const token = this.getAccessToken()
      let response: any = null;

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
        console.error('Server responded:', error);
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