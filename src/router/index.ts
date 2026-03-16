import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { authService } from '@/services/auth'
import { isTokenValid } from '@/utils/jwt'
import Home from '@/views/Home.vue'
import Profile from '@/views/Profile.vue'
import Rules from '@/views/Rules.vue'
import Map from '@/views/Map.vue'
import Auth from '@/views/Auth.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
      meta: {
        title: 'Главная',
        requiresAuth: true
      }
    },
    {
      path: '/profile',
      name: 'profile',
      component: Profile,
      meta: {
        title: 'Профиль',
        requiresAuth: true
      }
    },
    {
      path: '/rules',
      name: 'tiles',
      component: Rules,
      meta: {
        title: 'Правила',
        requiresAuth: true
      }
    },
    {
      path: '/map',
      name: 'map',
      component: Map,
      meta: {
        title: 'Карта',
        requiresAuth: true
      }
    },
    {
      path: '/auth',
      name: 'auth',
      component: Auth,
      meta: {
        title: 'Аутентификация',
        guestOnly: true
      }
    }
  ],
})

// Navigation guards для защиты маршрутов
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // Проверяем токен и его валидность
  const hasToken = !!authService.getAccessToken()

  // Если маршрут требует аутентификации
  if (to.meta.requiresAuth && !hasToken) {
    next('/auth')
    return
  }

  // Если маршрут только для гостей (например, страница логина)
  if (to.meta.guestOnly && hasToken) {
    next('/')
    return
  }

  next()
})

export default router
