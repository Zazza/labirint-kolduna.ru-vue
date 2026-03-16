import {defineStore} from 'pinia'
import {computed, ref} from 'vue'
import {httpService} from '@/services/http'
import {authService} from "@/services/auth.ts";
import type {Section, ActionResponse, BonusDTO, GameRequestData} from '@/types'
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

export const useGameStore = defineStore('game', () => {
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const section = ref<Section | null>(null)
  const action = ref<ActionResponse | null>(null)

  const clearError = () => {
    error.value = null
  }

  const getSection = async () => {
    isLoading.value = true
    if (authService.isAuthenticated()) {
      try {
        section.value = await httpService.getSection()

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
        case Choice:
          action.value = await httpService.setRequest(Choice, data)
          break;
        case Move:
          action.value = await httpService.setRequest(Move, data)
          break;
        case SetBattle:
          action.value = await httpService.setRequest(SetBattle, data)
          break;
        case SleepyChoice:
          action.value = await httpService.setRequest(SleepyChoice, {})
          break;
        case BribeChoice:
          action.value = await httpService.setRequest(BribeChoice, {})
          break;
        case RollTheDice:
          action.value = await httpService.setRequest(RollTheDice, {})
          break;
      }
    }
  }

  return {
    // Состояние
    isLoading,
    error,
    section,
    action,

    // Действия
    clearError,
    getSection,
    setRequest,
  }
})