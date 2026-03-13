import {defineStore} from 'pinia'
import {computed, ref} from 'vue'
import {httpService} from '@/services/http'
import {authService} from '@/services/auth'
import type {Profile} from '@/types'
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

export const useProfileStore = defineStore('profile', () => {
  const isConnected = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const backendStatus = ref<'unknown' | 'online' | 'offline'>('unknown')
  const profile = ref<Profile | null>(null)

  // Действия
  const initializeBackend = async () => {
    isLoading.value = true
    error.value = null
  }

  const disconnect = () => {
    isConnected.value = false
    backendStatus.value = 'unknown'
  }

  const clearError = () => {
    error.value = null
  }

  const getProfile = async () => {
    if (authService.isAuthenticated()) {
      try {
        profile.value = await httpService.getProfile()

        return { success: true }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Ошибка'
        error.value = errorMessage

        return { success: false, error: errorMessage }
      } finally {
        isLoading.value = false
      }
    }
  }

  const setRequest = async (requestType: string, data: any) => {
    if (authService.isAuthenticated()) {
      switch (requestType) {
        case Meds:
          return await httpService.setRequest(Meds, {})
        case Bonus: //data: BonusDTO
          return await httpService.setRequest(Bonus, data)
        case Sleep:
          return  httpService.setRequest(Sleep, {})
      }
    }
  }

  return {
    // Состояние
    isConnected,
    isLoading,
    error,
    backendStatus,
    profile,

    // Действия
    initializeBackend,
    disconnect,
    clearError,
    getProfile,
    setRequest,
  }
})