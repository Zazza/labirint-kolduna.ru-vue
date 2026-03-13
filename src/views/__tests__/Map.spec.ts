import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Map from '../Map.vue'
import { useMapStore } from '@/stores/map'
import { useGameStore } from '@/stores/game'
import type { MapSection, MapTransition } from '@/types'

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    currentRoute: { value: { path: '/map' } }
  }),
  useRoute: () => ({ path: '/map', params: {}, query: {} })
}))

vi.mock('@/stores/game', () => ({
  useGameStore: () => ({
    section: { section: 0 }
  })
}))

describe('Map', () => {
  let pinia: any
  let wrapper: any
  let mapStore: any
  let mockCtx: any

  beforeEach(() => {
    mockCtx = {
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      fillText: vi.fn(),
      font: '',
      fillStyle: '',
      textAlign: '',
      textBaseline: ''
    }

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(mockCtx)
  })

  const mockSections: MapSection[] = [
    { id: '0', number: 0, title: 'Start', is_visited: true },
    { id: '1', number: 1, title: 'Room 1', is_visited: true },
    { id: '2', number: 2, title: 'Room 2', is_visited: false },
    { id: '3', number: 3, title: 'Room 3', is_visited: false },
    { id: '4', number: 4, title: 'Room 4', is_visited: false }
  ]

  const mockTransitions: MapTransition[] = [
    { from_section: 0, to_section: 1, text: 'Go right', is_available: true },
    { from_section: 0, to_section: 2, text: 'Go left', is_available: true },
    { from_section: 1, to_section: 3, text: 'Continue', is_available: false },
    { from_section: 2, to_section: 4, text: 'Move forward', is_available: true }
  ]

  const mockMapData = {
    sections: mockSections,
    transitions: mockTransitions
  }

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)

    mapStore = useMapStore()
    mapStore.mapData = mockMapData
    mapStore.isLoading = false
    mapStore.error = null
    mapStore.selectedNode = null

    global.HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCanvasRef.getContext())
  })

  describe('calculateLayout', () => {
    it('should build tree structure with section 0 at the root', () => {
      wrapper = mount(Map, {
        global: {
          plugins: [pinia],
          stubs: {
            'router-link': true
          }
        }
      })

      const { nodes } = wrapper.vm.layoutData

      expect(nodes).toBeDefined()
      expect(nodes.length).toBeGreaterThan(0)

      const rootNode = nodes.find((node: any) => node.number === 0)
      expect(rootNode).toBeDefined()
      expect(rootNode.parent).toBeNull()
      expect(rootNode.depth).toBe(0)
    })

    it('should correctly assign parent-child relationships', () => {
      wrapper = mount(Map, {
        global: {
          plugins: [pinia],
          stubs: {
            'router-link': true
          }
        }
      })

      const { nodes } = wrapper.vm.layoutData

      const node0 = nodes.find((node: any) => node.number === 0)
      const node1 = nodes.find((node: any) => node.number === 1)
      const node2 = nodes.find((node: any) => node.number === 2)

      expect(node0.children).toContain(1)
      expect(node0.children).toContain(2)
      expect(node1.parent).toBe(0)
      expect(node2.parent).toBe(0)
    })

    it('should calculate correct depth for each node', () => {
      wrapper = mount(Map, {
        global: {
          plugins: [pinia],
          stubs: {
            'router-link': true
          }
        }
      })

      const { nodes } = wrapper.vm.layoutData

      const node0 = nodes.find((node: any) => node.number === 0)
      const node1 = nodes.find((node: any) => node.number === 1)
      const node2 = nodes.find((node: any) => node.number === 2)
      const node3 = nodes.find((node: any) => node.number === 3)
      const node4 = nodes.find((node: any) => node.number === 4)

      expect(node0.depth).toBe(0)
      expect(node1.depth).toBe(1)
      expect(node2.depth).toBe(1)
      expect(node3.depth).toBe(2)
      expect(node4.depth).toBe(2)
    })

    it('should remove text from edges (edge.text field should not be in layout)', () => {
      wrapper = mount(Map, {
        global: {
          plugins: [pinia],
          stubs: {
            'router-link': true
          }
        }
      })

      const { edges } = wrapper.vm.layoutData

      expect(edges).toBeDefined()
      expect(edges.length).toBeGreaterThan(0)

      edges.forEach((edge: any) => {
        expect(edge.text).toBeUndefined()
        expect(edge.from).toBeDefined()
        expect(edge.to).toBeDefined()
        expect(edge.from_x).toBeDefined()
        expect(edge.from_y).toBeDefined()
        expect(edge.to_x).toBeDefined()
        expect(edge.to_y).toBeDefined()
        expect(edge.is_available).toBeDefined()
      })
    })

    it('should calculate edge positions correctly', () => {
      wrapper = mount(Map, {
        global: {
          plugins: [pinia],
          stubs: {
            'router-link': true
          }
        }
      })

      const { edges, nodes } = wrapper.vm.layoutData

      const edge = edges.find((e: any) => e.from === 0 && e.to === 1)
      expect(edge).toBeDefined()

      const node0 = nodes.find((node: any) => node.number === 0)
      const node1 = nodes.find((node: any) => node.number === 1)

      expect(edge.from_x).toBe(node0.x)
      expect(edge.from_y).toBe(node0.y)
      expect(edge.to_x).toBe(node1.x)
      expect(edge.to_y).toBe(node1.y)
    })

    it('should calculate dynamic canvas height based on tree depth', () => {
      wrapper = mount(Map, {
        global: {
          plugins: [pinia],
          stubs: {
            'router-link': true
          }
        }
      })

      const { requiredHeight, nodes } = wrapper.vm.layoutData

      expect(requiredHeight).toBeDefined()

      const maxDepth = Math.max(...nodes.map((node: any) => node.depth))
      const LEVEL_HEIGHT = 80
      const PADDING_Y = 30
      const expectedHeight = PADDING_Y * 2 + (maxDepth + 1) * LEVEL_HEIGHT

      expect(requiredHeight).toBe(expectedHeight)
    })

    it('should handle single node map correctly', () => {
      const singleNodeSections: MapSection[] = [
        { id: '0', number: 0, title: 'Start', is_visited: true }
      ]

      const singleNodeTransitions: MapTransition[] = []

      mapStore.mapData = {
        sections: singleNodeSections,
        transitions: singleNodeTransitions
      }

      wrapper = mount(Map, {
        global: {
          plugins: [pinia],
          stubs: {
            'router-link': true
          }
        }
      })

      const { nodes, requiredHeight } = wrapper.vm.layoutData

      expect(nodes.length).toBe(1)
      expect(nodes[0].number).toBe(0)
      expect(nodes[0].x).toBe(400)
      expect(requiredHeight).toBeGreaterThan(0)
    })

    it('should position nodes horizontally within canvas bounds', () => {
      wrapper = mount(Map, {
        global: {
          plugins: [pinia],
          stubs: {
            'router-link': true
          }
        }
      })

      const { nodes } = wrapper.vm.layoutData

      nodes.forEach((node: any) => {
        expect(node.x).toBeGreaterThanOrEqual(0)
        expect(node.x).toBeLessThanOrEqual(800)
        expect(node.y).toBeGreaterThanOrEqual(0)
      })
    })
  })

  describe('ensureCanvasSize', () => {
    it('should adapt canvas height to required height from layout', async () => {
      const mockElement = {
        width: 800,
        height: 600,
        offsetWidth: 800,
        offsetHeight: 600,
        getBoundingClientRect: vi.fn(() => ({ width: 800, height: 600 }))
      }

      wrapper = mount(Map, {
        global: {
          plugins: [pinia],
          stubs: {
            'router-link': true
          }
        }
      })

      wrapper.vm.canvasRef = mockElement

      const { requiredHeight } = wrapper.vm.layoutData
      wrapper.vm.ensureCanvasSize()

      expect(mockElement.width).toBeGreaterThanOrEqual(requiredHeight)
    })

    it('should not resize canvas if already correct size', () => {
      const mockElement = {
        width: 800,
        height: 600,
        offsetWidth: 800,
        offsetHeight: 600,
        getBoundingClientRect: vi.fn(() => ({ width: 800, height: 600 }))
      }

      wrapper = mount(Map, {
        global: {
          plugins: [pinia],
          stubs: {
            'router-link': true
          }
        }
      })

      wrapper.vm.canvasRef = mockElement

      const initialWidth = mockElement.width
      const initialHeight = mockElement.height

      wrapper.vm.ensureCanvasSize()

      expect(mockElement.width).toBe(initialWidth)
      expect(mockElement.height).toBe(initialHeight)
    })
  })

  describe('drawMap', () => {
    it('should not render text labels on edges', () => {
      let fillTextCalls = 0
      let fillTextArgs: string[] = []

      mockCtx.fillText = vi.fn((text: string) => {
        fillTextCalls++
        fillTextArgs.push(text)
      })

      wrapper = mount(Map, {
        global: {
          plugins: [pinia],
          stubs: {
            'router-link': true
          }
        }
      })

      const mockCanvasRef = {
        width: 800,
        height: 600,
        getBoundingClientRect: vi.fn(() => ({ width: 800, height: 600 })),
        getContext: vi.fn(() => mockCtx)
      }

      wrapper.vm.canvasRef = mockCanvasRef
      wrapper.vm.drawMap()

      expect(fillTextCalls).toBeGreaterThan(0)

      fillTextArgs.forEach(text => {
        const nodeNumber = parseInt(text)
        const { nodes } = wrapper.vm.layoutData
        const nodeExists = nodes.some((node: any) => node.number === nodeNumber)
        expect(nodeExists).toBe(true)
      })
    })

    it('should render text labels only on nodes', () => {
      let nodeNumberTexts: string[] = []

      mockCtx.fillText = vi.fn((text: string) => {
        nodeNumberTexts.push(text)
      })

      wrapper = mount(Map, {
        global: {
          plugins: [pinia],
          stubs: {
            'router-link': true
          }
        }
      })

      const mockCanvasRef = {
        width: 800,
        height: 600,
        getBoundingClientRect: vi.fn(() => ({ width: 800, height: 600 })),
        getContext: vi.fn(() => mockCtx)
      }

      wrapper.vm.canvasRef = mockCanvasRef
      wrapper.vm.drawMap()

      const { nodes } = wrapper.vm.layoutData

      nodeNumberTexts.forEach(text => {
        const nodeNumber = parseInt(text)
        const nodeExists = nodes.some((node: any) => node.number === nodeNumber)
        expect(nodeExists).toBe(true)
      })
    })

    it('should call fillText for each node number', () => {
      let fillTextCallCount = 0

      mockCtx.fillText = vi.fn(() => {
        fillTextCallCount++
      })

      wrapper = mount(Map, {
        global: {
          plugins: [pinia],
          stubs: {
            'router-link': true
          }
        }
      })

      const mockCanvasRef = {
        width: 800,
        height: 600,
        getBoundingClientRect: vi.fn(() => ({ width: 800, height: 600 })),
        getContext: vi.fn(() => mockCtx)
      }

      wrapper.vm.canvasRef = mockCanvasRef
      wrapper.vm.drawMap()

      const { nodes } = wrapper.vm.layoutData

      expect(fillTextCallCount).toBe(nodes.length)
    })

    it('should use correct text styling for nodes', () => {
      wrapper = mount(Map, {
        global: {
          plugins: [pinia],
          stubs: {
            'router-link': true
          }
        }
      })

      const mockCanvasRef = {
        width: 800,
        height: 600,
        getBoundingClientRect: vi.fn(() => ({ width: 800, height: 600 })),
        getContext: vi.fn(() => mockCtx)
      }

      wrapper.vm.canvasRef = mockCanvasRef
      wrapper.vm.drawMap()

      expect(mockCtx.font).toContain('bold')
      expect(mockCtx.fillStyle).toBe('#fffef9')
      expect(mockCtx.textAlign).toBe('center')
      expect(mockCtx.textBaseline).toBe('middle')
    })

    it('should clear canvas before drawing', () => {
      wrapper = mount(Map, {
        global: {
          plugins: [pinia],
          stubs: {
            'router-link': true
          }
        }
      })

      const mockCanvasRef = {
        width: 800,
        height: 600,
        getBoundingClientRect: vi.fn(() => ({ width: 800, height: 600 })),
        getContext: vi.fn(() => mockCtx)
      }

      wrapper.vm.canvasRef = mockCanvasRef
      wrapper.vm.drawMap()

      expect(mockCtx.clearRect).toHaveBeenCalledWith(0, 0, 800, 600)
    })
  })

  describe('edge cases', () => {
    it('should handle empty transitions array', () => {
      mapStore.mapData = {
        sections: mockSections,
        transitions: []
      }

      wrapper = mount(Map, {
        global: {
          plugins: [pinia],
          stubs: {
            'router-link': true
          }
        }
      })

      const { nodes, edges } = wrapper.vm.layoutData

      expect(nodes.length).toBe(mockSections.length)
      expect(edges.length).toBe(0)
    })

    it('should handle transitions to same node (self-loop)', () => {
      const selfLoopTransitions: MapTransition[] = [
        { from_section: 0, to_section: 0, text: 'Stay', is_available: true },
        { from_section: 0, to_section: 1, text: 'Move', is_available: true }
      ]

      mapStore.mapData = {
        sections: mockSections,
        transitions: selfLoopTransitions
      }

      wrapper = mount(Map, {
        global: {
          plugins: [pinia],
          stubs: {
            'router-link': true
          }
        }
      })

      const { nodes } = wrapper.vm.layoutData

      const rootNode = nodes.find((node: any) => node.number === 0)
      expect(rootNode.children).not.toContain(0)
    })

    it('should handle multiple levels of depth correctly', () => {
      const deepTransitions: MapTransition[] = [
        { from_section: 0, to_section: 1, text: 'A', is_available: true },
        { from_section: 1, to_section: 2, text: 'B', is_available: true },
        { from_section: 2, to_section: 3, text: 'C', is_available: true },
        { from_section: 3, to_section: 4, text: 'D', is_available: true }
      ]

      mapStore.mapData = {
        sections: mockSections,
        transitions: deepTransitions
      }

      wrapper = mount(Map, {
        global: {
          plugins: [pinia],
          stubs: {
            'router-link': true
          }
        }
      })

      const { nodes, requiredHeight } = wrapper.vm.layoutData

      expect(nodes[0].depth).toBe(0)
      expect(nodes[1].depth).toBe(1)
      expect(nodes[2].depth).toBe(2)
      expect(nodes[3].depth).toBe(3)
      expect(nodes[4].depth).toBe(4)

      const LEVEL_HEIGHT = 80
      const PADDING_Y = 30
      const expectedHeight = PADDING_Y * 2 + 5 * LEVEL_HEIGHT
      expect(requiredHeight).toBe(expectedHeight)
    })

    it('should handle null mapData gracefully', () => {
      mapStore.mapData = null

      wrapper = mount(Map, {
        global: {
          plugins: [pinia],
          stubs: {
            'router-link': true
          }
        }
      })

      const { nodes, edges, requiredHeight } = wrapper.vm.layoutData

      expect(nodes).toEqual([])
      expect(edges).toEqual([])
      expect(requiredHeight).toBe(0)
    })
  })
})
