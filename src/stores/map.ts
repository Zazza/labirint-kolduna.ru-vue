import {defineStore} from 'pinia'
import {computed, ref} from 'vue'
import {httpService} from '@/services/http'
import type {MapData, MapSection} from '@/types'
import {useGameStore} from '@/stores/game'

export const useMapStore = defineStore('map', () => {
  const mapData = ref<MapData | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const selectedNode = ref<MapSection | null>(null)
  const gameStore = useGameStore()

  const validateMapData = (data: MapData | null): boolean => {
    if (!data) return false
    if (!Array.isArray(data.sections) || data.sections.length === 0) return false
    if (!Array.isArray(data.transitions)) return false
    return true
  }

  const fetchMap = async (): Promise<{success: boolean, error?: string}> => {
    isLoading.value = true
    error.value = null

    try {
      const data = await httpService.getMap()

      if (!validateMapData(data)) {
        error.value = 'Неверный формат данных карты'
        mapData.value = null
        return {success: false, error: error.value}
      }

      mapData.value = data
      return {success: true}
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки карты'
      error.value = errorMessage
      return {success: false, error: errorMessage}
    } finally {
      isLoading.value = false
    }
  }

  const selectNode = (node: MapSection): void => {
    selectedNode.value = node
  }

  const clearSelection = (): void => {
    selectedNode.value = null
  }

  const clearError = (): void => {
    error.value = null
  }

  const currentSectionNumber = computed<number | null>(() => {
    if (!gameStore.section) return null
    return gameStore.section.section
  })

  const currentSectionData = computed<MapSection | null>(() => {
    if (!mapData.value) return null
    return mapData.value.sections.find(s => s.is_current) ?? null
  })

  const isMapAvailable = computed<boolean>(() => mapData.value !== null)

  return {
    mapData,
    isLoading,
    error,
    selectedNode,
    fetchMap,
    selectNode,
    clearSelection,
    clearError,
    currentSectionNumber,
    currentSectionData,
    isMapAvailable
  }
})
