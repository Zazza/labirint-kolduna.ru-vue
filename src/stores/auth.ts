import {defineStore} from 'pinia'
import {computed, ref} from 'vue'
import type {AuthCredentials, AuthUser} from '@/types'
import {authService} from '@/services/auth'

export const useAuthStore = defineStore('auth', () => {
  // Состояние
  const user = ref<AuthUser | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const isRefreshing = ref(false)
  const refreshPromise = ref<Promise<{ success: boolean }> | null>(null)

  // Вычисляемые свойства
  const isAuthenticated = computed(() => authService.isAuthenticated())

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
      user.value = {
        isAuthenticated: true
      }
      return { success: true }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: string } } }
      return { success: false, error: errorObj?.response?.data?.error ?? 'Ошибка входа' }
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
      // В реальном приложении здесь можно декодировать JWT для получения имени
      user.value = {
        isAuthenticated: true
      }
    }
  }

  const clearError = () => {
    error.value = null
  }

  // Автоматическое обновление токена
  const autoRefresh = async () => {
    // Если уже идёт обновление, возвращаем существующий promise
    if (isRefreshing.value && refreshPromise.value) {
      return refreshPromise.value
    }

    isRefreshing.value = true
    const refreshToken = authService.getRefreshToken()
    refreshPromise.value = (async () => {
      try {
        await authService.refresh(refreshToken!)
        return { success: true }
      } catch (err) {
        await logout()
        throw err
      } finally {
        isRefreshing.value = false
        refreshPromise.value = null
      }
    })()

    return refreshPromise.value
  }

  return {
    // Состояние
    user,
    isLoading,
    error,

    // Вычисляемые свойства
    isAuthenticated,

    // Действия
    register,
    login,
    logout,
    checkAuth,
    clearError,
    autoRefresh
  }
})
