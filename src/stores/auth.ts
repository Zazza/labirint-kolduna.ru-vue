import {defineStore} from 'pinia'
import {computed, ref} from 'vue'
import type {AuthCredentials, AuthUser} from '@/types'
import {authService} from '@/services/auth'

export const useAuthStore = defineStore('auth', () => {
  // Состояние
  const user = ref<AuthUser | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const credentials = ref<AuthCredentials | null>(null) // Храним учётные данные для refresh
  let isRefreshing = false // Флаг для предотвращения множественных запросов refresh
  let refreshPromise: Promise<any> | null = null // Promise для refresh запроса

  // Вычисляемые свойства
  const isAuthenticated = computed(() => authService.isAuthenticated())
  const userName = computed(() => user.value?.name || null)

  // Действия
  const register = async (credentials: AuthCredentials) => {
    isLoading.value = true
    error.value = null

    try {
      const responseResult = await authService.register(credentials)
      if (!responseResult.status) {
        return { success: false, error: responseResult.error }
      }
      return await login(credentials)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка регистрации'
      error.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      isLoading.value = false
    }
  }

  const login = async (creds: AuthCredentials) => {
    isLoading.value = true
    error.value = null

    try {
      await authService.login(creds)
      credentials.value = creds
      user.value = {
        name: creds.name,
        isAuthenticated: true
      }
      return { success: true }
    } catch (err) {
      return { success: false, error: err?.response.data.error }
    } finally {
      isLoading.value = false
    }
  }

  const refresh = async (credentials: AuthCredentials) => {
    isLoading.value = true
    error.value = null

    try {
      await authService.refresh(credentials)
      user.value = {
        name: credentials.name,
        isAuthenticated: true
      }
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка обновления токена'
      error.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    isLoading.value = true
    error.value = null

    try {
      await authService.logout()
      user.value = null
      credentials.value = null // Очищаем учётные данные
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка выхода'
      error.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      isLoading.value = false
    }
  }

  // Проверка состояния при загрузке приложения
  const checkAuth = () => {
    if (authService.isAuthenticated()) {
      const token = authService.getAccessToken()
      const savedCredentials = authService.getCredentials()

      console.log('[Auth] checkAuth - token:', token ? 'exists' : 'null')
      console.log('[Auth] checkAuth - savedCredentials:', savedCredentials)

      // Восстанавливаем сохранённые учётные данные
      if (savedCredentials) {
        credentials.value = savedCredentials
        console.log('[Auth] credentials restored')
      }

      // В реальном приложении здесь можно декодировать JWT для получения имени
      user.value = {
        name: 'User',
        isAuthenticated: true
      }
    }
  }

  const clearError = () => {
    error.value = null
  }

  // Автоматическое обновление токена
  const autoRefresh = async () => {
    console.log('[Auth] autoRefresh start, credentials:', credentials.value)

    // Если уже идёт обновление, возвращаем существующий promise
    if (isRefreshing && refreshPromise) {
      console.log('[Auth] already refreshing')
      return refreshPromise
    }

    // Если нет учётных данных, не можем обновить токен
    if (!credentials.value) {
      console.log('[Auth] no credentials!')
      await logout()
      throw new Error('Нет учётных данных для обновления токена')
    }

    isRefreshing = true
    const refreshToken = authService.getRefreshToken()
    console.log('[Auth] refreshToken from storage:', refreshToken)
    refreshPromise = (async () => {
      try {
        console.log('[Auth] calling refresh API with token:', refreshToken)
        await authService.refresh(refreshToken!)
        console.log('[Auth] refresh OK')
        return { success: true }
      } catch (err) {
        console.log('[Auth] refresh error:', err)
        await logout()
        throw err
      } finally {
        isRefreshing = false
        refreshPromise = null
      }
    })()

    return refreshPromise
  }

  return {
    // Состояние
    user,
    isLoading,
    error,

    // Вычисляемые свойства
    isAuthenticated,
    userName,

    // Действия
    register,
    login,
    refresh,
    logout,
    checkAuth,
    clearError,
    autoRefresh
  }
})
