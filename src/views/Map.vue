<script setup lang="ts">
import {computed, nextTick, onMounted, onUnmounted, ref, watch} from 'vue'
import {useMapStore} from '@/stores/map'
import {useGameStore} from '@/stores/game'
import {useRouter} from 'vue-router'
import type {MapSection, MapTransition} from '@/types'

interface NodeWithPosition {
  number: number
  title: string
  x: number
  y: number
  is_visited: boolean
  is_virtual: boolean
  depth: number
  parent: number | null
  children: number[]
}

interface EdgeWithPositions {
  from: number
  to: number
  from_x: number
  from_y: number
  to_x: number
  to_y: number
  is_available: boolean
}

const mapStore = useMapStore()
const gameStore = useGameStore()
const router = useRouter()

const NODE_RADIUS = 15
const LEVEL_HEIGHT = 80
const PADDING_X = 50
const PADDING_Y = 30
const MIN_NODE_SPACING = 60

const canvasRef = ref<HTMLCanvasElement | null>(null)

const mapData = computed(() => mapStore.mapData)
const isLoading = computed(() => mapStore.isLoading)
const error = computed(() => mapStore.error)
const selectedNode = computed(() => mapStore.selectedNode)
const currentSectionData = computed(() => mapStore.currentSectionData)

const selectedNodeData = computed(() => {
  if (!mapData.value || selectedNode.value === null) return null
  return mapData.value.sections.find(s => s.number === selectedNode.value?.number) ?? null
})

const goHome = () => {
  router.push('/')
}

const handleLogout = async () => {
  await router.push('/auth')
}

const calculateLayout = (sections: MapSection[], transitions: MapTransition[], currentSectionNumber: number | null, width: number): {
  nodes: NodeWithPosition[]
  edges: EdgeWithPositions[]
  requiredHeight: number
} => {
  // Защита от undefined/null
  const safeSections = sections ?? []
  const safeTransitions = transitions ?? []

  // Если нет секций, возвращаем пустой результат
  if (safeSections.length === 0) {
    return { nodes: [], edges: [], requiredHeight: PADDING_Y * 2 + LEVEL_HEIGHT }
  }

  const sortedSections = [...safeSections].sort((a, b) => a.number - b.number)

  const nodeMap = new Map<number, NodeWithPosition>()

  sortedSections.forEach(section => {
    nodeMap.set(section.number, {
      number: section.number,
      title: section.title,
      x: 0,
      y: 0,
      is_visited: section.is_visited,
      is_virtual: false,
      depth: 0,
      parent: null,
      children: []
    })
  })

  // Находим виртуальные секции (на которые есть переход, но которых нет в sections)
  const existingSectionNumbers = new Set(sections.map(s => s.number))
  const virtualSectionNumbers = new Set<number>()

  transitions.forEach(transition => {
    if (!existingSectionNumbers.has(transition.to_section)) {
      virtualSectionNumbers.add(transition.to_section)
    }
  })

  // Добавляем виртуальные секции
  // Они должны быть на один уровень ниже текущей позиции игрока
  const currentNode = currentSectionNumber !== null ? nodeMap.get(currentSectionNumber) : null
  const currentDepth = currentNode?.depth ?? 0

  virtualSectionNumbers.forEach(num => {
    nodeMap.set(num, {
      number: num,
      title: `Секция ${num}`,
      x: 0,
      y: 0,
      is_visited: false,
      is_virtual: true,
      depth: currentDepth + 1, // На один уровень ниже текущей позиции
      parent: null,
      children: []
    })
  })

  const transitionMap = new Map<number, number[]>()

  safeTransitions.forEach(transition => {
    if (transition.from_section === 9 || transition.to_section === 9) {
      return
    }

    if (!transitionMap.has(transition.from_section)) {
      transitionMap.set(transition.from_section, [])
    }
    transitionMap.get(transition.from_section)?.push(transition.to_section)
  })

  // Если нет transitions, используем сеточную раскладку
  if (safeTransitions.length === 0) {
    const nodesPerRow = Math.ceil(Math.sqrt(safeSections.length))
    let index = 0
    sortedSections.forEach(section => {
      const node = nodeMap.get(section.number)
      if (node) {
        const row = Math.floor(index / nodesPerRow)
        const col = index % nodesPerRow
        const levelWidth = width - 2 * PADDING_X
        const spacing = Math.max(MIN_NODE_SPACING, levelWidth / Math.max(1, nodesPerRow - 1))
        node.x = PADDING_X + col * spacing
        node.y = PADDING_Y + row * LEVEL_HEIGHT
        index++
      }
    })
    const rows = Math.ceil(safeSections.length / nodesPerRow)
    const newRequiredHeight = PADDING_Y * 2 + rows * LEVEL_HEIGHT
    return { nodes: Array.from(nodeMap.values()), edges: [], requiredHeight: newRequiredHeight }
  }

  // Находим корневые секции (на которые нет входящих переходов)
  const targetSections = new Set(safeTransitions.map(t => t.to_section))
  const rootCandidates = safeSections.filter(s => !targetSections.has(s.number))

  // Находим минимальный номер секции
  const minNumber = Math.min(...safeSections.map(s => s.number))

  // Используем первую корневую секцию или секцию с минимальным номером
  const rootNumber = rootCandidates.length > 0 ? rootCandidates[0]?.number ?? minNumber : minNumber

  const calculateDepth = (nodeNumber: number, depth: number, visited: Set<number>): void => {
    if (visited.has(nodeNumber)) return
    visited.add(nodeNumber)

    const node = nodeMap.get(nodeNumber)
    if (node) {
      node.depth = depth
    }

    const children = transitionMap.get(nodeNumber) || []
    children.forEach(child => {
      if (child !== nodeNumber) {
        const childNode = nodeMap.get(child)
        if (childNode && childNode.parent === null) {
          childNode.parent = nodeNumber
          node?.children.push(child)
          calculateDepth(child, depth + 1, visited)
        }
      }
    })
  }

  // Запускаем обход от корня
  calculateDepth(rootNumber, 0, new Set())

  // Находим все узлы, которые не были посещены (не связаны с корнем)
  const unvisitedNodes: NodeWithPosition[] = []
  nodeMap.forEach(node => {
    if (node.depth === 0 && node.number !== rootNumber) {
      unvisitedNodes.push(node)
    }
  })

  // Для несвязанных узлов назначаем глубину на основе их минимального номера
  if (unvisitedNodes.length > 0) {
    const maxDepth = Math.max(...Array.from(nodeMap.values()).map(n => n.depth))
    unvisitedNodes.forEach((node, idx) => {
      node.depth = maxDepth + 1 + Math.floor(idx / 10)
    })
  }

  const levelMap = new Map<number, NodeWithPosition[]>()

  nodeMap.forEach(node => {
    if (!levelMap.has(node.depth)) {
      levelMap.set(node.depth, [])
    }
    levelMap.get(node.depth)?.push(node)
  })

  // Если все узлы на одной глубине (нет связей), используем сеточную раскладку
  const depths = Array.from(levelMap.keys())
  if (depths.length === 1 && depths[0] === 0 && nodeMap.size > 1) {
    // Все узлы на depth=0, значит нет transitions - строим сетку
    const nodesPerRow = Math.ceil(Math.sqrt(nodeMap.size))
    let index = 0
    nodeMap.forEach(node => {
      const row = Math.floor(index / nodesPerRow)
      const col = index % nodesPerRow
      const levelWidth = width - 2 * PADDING_X
      const spacing = Math.max(MIN_NODE_SPACING, levelWidth / Math.max(1, nodesPerRow - 1))

      node.x = PADDING_X + col * spacing
      node.y = PADDING_Y + row * LEVEL_HEIGHT
      index++
    })

    // Пересчитываем requiredHeight для сетки
    const rows = Math.ceil(nodeMap.size / nodesPerRow)
    const newRequiredHeight = PADDING_Y * 2 + rows * LEVEL_HEIGHT
    return { nodes: Array.from(nodeMap.values()), edges: [], requiredHeight: newRequiredHeight }
  }

  const maxDepth = Math.max(...Array.from(levelMap.keys()))
  const requiredHeight = PADDING_Y * 2 + (maxDepth + 1) * LEVEL_HEIGHT

  levelMap.forEach((nodes, depth) => {
    const levelWidth = width - 2 * PADDING_X
    const nodeCount = nodes.length
    const spacing = Math.max(MIN_NODE_SPACING, levelWidth / Math.max(1, nodeCount - 1))

    nodes.sort((a, b) => a.number - b.number)

    nodes.forEach((node, index) => {
      if (nodeCount === 1) {
        node.x = width / 2
      } else {
        node.x = PADDING_X + index * spacing
      }
      node.y = PADDING_Y + depth * LEVEL_HEIGHT
    })
  })

  const edges = safeTransitions.map(transition => {
    const fromNode = nodeMap.get(transition.from_section)
    const toNode = nodeMap.get(transition.to_section)

    return {
      from: transition.from_section,
      to: transition.to_section,
      from_x: fromNode?.x || 0,
      from_y: fromNode?.y || 0,
      to_x: toNode?.x || 0,
      to_y: toNode?.y || 0,
      is_available: transition.is_available
    }
  })

  return { nodes: Array.from(nodeMap.values()), edges, requiredHeight }
}

const layoutData = ref<{nodes: NodeWithPosition[], edges: EdgeWithPositions[], requiredHeight: number}>({ nodes: [], edges: [], requiredHeight: 0 })

const getContainerWidth = (): number => {
  // На мобильных устройствах фиксированная ширина
  if (window.innerWidth < 768) {
    return 550
  }
  // На десктопе: max-width(700) - padding(80*2) = 540px
  return 540
}

const updateLayout = () => {
  if (!mapData.value) {
    layoutData.value = { nodes: [], edges: [], requiredHeight: 0 }
    return
  }
  const canvasWidth = getContainerWidth()
  layoutData.value = calculateLayout(
    mapData.value.sections ?? [],
    mapData.value.transitions ?? [],
    mapStore.currentSectionNumber,
    canvasWidth
  )
}

watch(mapData, () => {
  ensureCanvasSize()
  updateLayout()
  nextTick(() => drawMap())
})

const ensureCanvasSize = () => {
  if (!canvasRef.value) return
  if (!layoutData.value || layoutData.value.requiredHeight === 0) return

  const dpr = window.devicePixelRatio || 1
  const containerWidth = getContainerWidth()
  const width = Math.floor(containerWidth * dpr)
  const requiredHeight = layoutData.value.requiredHeight || 600
  const height = Math.max(Math.floor(600 * dpr), requiredHeight * dpr)

  // Не пересчитываем при каждом построении - только при явном изменении размеров
  if (canvasRef.value.width !== width || canvasRef.value.height !== height) {
    canvasRef.value.width = width
    canvasRef.value.height = height

    const ctx = canvasRef.value.getContext('2d')
    if (ctx) {
      ctx.scale(dpr, dpr)
    }
  }
}

const handleCanvasClick = (event: MouseEvent) => {
  if (!canvasRef.value || !mapData.value) return

  const rect = canvasRef.value.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1

  // Учитываем dpr для правильного масштабирования координат
  const x = (event.clientX - rect.left)
  const y = (event.clientY - rect.top)

  for (const node of layoutData.value.nodes) {
    const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2)

    if (distance <= NODE_RADIUS) {
      const mapNode: MapSection = {
        id: `${node.number}`,
        number: node.number,
        title: node.title,
        is_visited: node.is_visited,
        is_current: node.is_virtual
      }
      mapStore.selectNode(mapNode)
      break
    }
  }
}

const drawMap = () => {
  if (!canvasRef.value || !mapData.value) return

  const ctx = canvasRef.value.getContext('2d')
  if (!ctx) return

  ensureCanvasSize()

  const width = getContainerWidth()
  const height = 600

  ctx.clearRect(0, 0, width, height)

  const {nodes, edges} = layoutData.value
  const currentSectionData = mapStore.currentSectionData
  const currentSectionNumber = currentSectionData?.number ?? null

  for (const edge of edges) {
    const toNode = nodes.find(n => n.number === edge.to)
    const isVirtualEdge = toNode?.is_virtual

    if (edge.to === 9 || edge.from === 9) {
      continue;
    }

    ctx.beginPath()
    ctx.moveTo(edge.from_x, edge.from_y)
    ctx.lineTo(edge.to_x, edge.to_y)

    if (isVirtualEdge) {
      // Ребро к виртуальной секции - серое
      ctx.strokeStyle = '#d4c4a8'
      ctx.lineWidth = 1
    } else if (edge.is_available) {
      ctx.strokeStyle = '#8b4513'
      ctx.lineWidth = 2
    } else {
      ctx.strokeStyle = '#d4c4a8'
      ctx.lineWidth = 1
    }

    ctx.stroke()
  }

  for (const node of nodes) {
    if (node.number === 9) {
      continue
    }

    const isCurrent = currentSectionData !== null && currentSectionData.number === node.number
    const isSelected = selectedNode.value !== null && selectedNode.value.number === node.number
    const isVirtual = node.is_virtual

    ctx.beginPath()
    ctx.arc(node.x, node.y, NODE_RADIUS, 0, 2 * Math.PI)

    if (isCurrent) {
      ctx.fillStyle = '#e74c3c'
    } else if (isSelected) {
      ctx.fillStyle = '#f39c12'
    } else if (isVirtual) {
      // Виртуальные секции - серый фон
      ctx.fillStyle = '#d4c4a8'
    } else if (node.is_visited) {
      ctx.fillStyle = '#8b4513'
    } else {
      ctx.fillStyle = '#d4c4a8'
    }

    ctx.fill()

    if (isSelected) {
      ctx.strokeStyle = '#f39c12'
      ctx.lineWidth = 3
      ctx.stroke()
    }

    ctx.font = 'bold 10px Arial'
    ctx.fillStyle = '#fffef9'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(node.number.toString(), node.x, node.y)
  }
}

watch(selectedNode, () => {
  drawMap()
})

watch(canvasRef, () => {
  if (canvasRef.value) {
    nextTick(() => {
      updateLayout()
      ensureCanvasSize()
      drawMap()
    })
  }
}, { flush: 'post' })

const handleResize = () => {
  if (canvasRef.value) {
    ensureCanvasSize()
    updateLayout()
    drawMap()
  }
}

onMounted(() => {
  nextTick(() => {
    ensureCanvasSize()
    updateLayout()
    drawMap()
  })
  window.addEventListener('resize', handleResize)
  mapStore.fetchMap()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  canvasRef.value = null
})

const retryLoad = () => {
  mapStore.clearError()
  mapStore.fetchMap()
}
</script>

<template>
  <div class="book-container">
    <div class="book-page">
      <div class="player-bar">
        <div class="player-stats">
          <span class="stat" @click="goHome">← Назад к игре</span>
        </div>
      </div>

      <div class="chapter-header">
        <span class="chapter-number">Карта игры</span>
      </div>

      <div class="map-legend">
        <div class="legend-item">
          <span class="legend-color current"></span>
          <span class="legend-text">Текущая позиция</span>
        </div>
        <div class="legend-item">
          <span class="legend-color selected"></span>
          <span class="legend-text">Выбранная секция</span>
        </div>
        <div class="legend-item">
          <span class="legend-color visited"></span>
          <span class="legend-text">Посещенные секции</span>
        </div>
        <div class="legend-item">
          <span class="legend-color unvisited"></span>
          <span class="legend-text">Не посещенные секции</span>
        </div>
      </div>

      <div v-if="isLoading" class="loading">
        Загрузка карты...
      </div>

      <div v-else-if="error" class="error">
        <p>{{ error }}</p>
        <button class="btn btn-primary" @click="retryLoad">Повторить</button>
      </div>

      <div v-else-if="mapData" class="map-container">
        <div class="canvas-wrapper">
          <canvas
            ref="canvasRef"
            @click="handleCanvasClick"
            class="map-canvas"
          ></canvas>
        </div>

        <div v-if="selectedNode" class="selected-node-info">
          <span class="selected-node-label">Секция {{ selectedNode.number }}</span>
          <span class="selected-node-value" v-if="selectedNodeData?.is_visited">{{ selectedNode.title }}</span>
        </div>
      </div>

      <div v-else class="no-map">
        <p>Карта недоступна для текущей локации</p>
        <button class="btn btn-primary" @click="goHome">Вернуться к игре</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.loading, .error, .no-map {
  text-align: center;
  padding: 40px;
  color: #5a4a3a;
}

.error {
  color: #a52a2a;
}

.map-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.canvas-wrapper {
  width: 100%;
  max-width: 540px;
  margin: 0 auto 24px;
  overflow-y: auto;
}

.map-canvas {
  display: block;
  width: 100%;
  height: auto;
  cursor: pointer;
}

.current-node-info, .selected-node-info {
  margin-bottom: 16px;
  padding: 12px 16px;
  border-radius: 4px;
  text-align: justify;
}

.current-node-label, .selected-node-label {
  display: block;
  font-size: 14px;
  color: #5a4a3a;
  text-align: center;
  margin-bottom: 4px;
}

.current-node-value, .selected-node-value {
  font-size: 12px;
  color: #2c1810;
}

.selected-node-status {
  display: block;
  text-align: center;
  font-size: 14px;
  color: #d4c4a8;
}

.selected-node-status.visited {
  color: #8b4513;
}

.map-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: center;
  padding: 16px;
  border-radius: 4px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid #c4b49a;
}

.legend-color.current {
  background: #e74c3c;
}

.legend-color.selected {
  background: #f39c12;
}

.legend-color.visited {
  background: #8b4513;
}

.legend-color.unvisited {
  background: #d4c4a8;
}

.legend-color.virtual {
  background: #d4c4a8;
  border: 2px dashed #8b4513;
}

.legend-text {
  font-size: 13px;
  color: #5a4a3a;
}

.btn {
  padding: 12px 28px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background: #8b4513;
  color: #fffef9;
}

.btn-primary:hover {
  background: #a0522d;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 69, 19, 0.3);
}
</style>
