import {defineStore} from 'pinia'
import {computed, ref} from 'vue'
import {httpService} from '@/services/http'
import {authService} from '@/services/auth'
import type {Profile, GameRequestData} from '@/types'
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
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const profile = ref<Profile | null>(null)

  const clearError = () => {
    error.value = null
  }

  const getProfile = async () => {
    isLoading.value = true
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

  const setRequest = async (requestType: string, data: GameRequestData) => {
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
    isLoading,
    error,
    profile,

    // Действия
    clearError,
    getProfile,
    setRequest,
  }
})