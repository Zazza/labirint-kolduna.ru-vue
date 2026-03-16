<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import type { AuthCredentials } from '@/types'

const authStore = useAuthStore()
const router = useRouter()

const mode = ref<'login' | 'register'>('login')
const formData = ref<AuthCredentials>({
  name: '',
  password: ''
})
const formError = ref<string>('')

const isLoginMode = computed(() => mode.value === 'login')
const isRegisterMode = computed(() => mode.value === 'register')

const validateInput = (value: string): boolean => {
  return /^[a-zA-Z0-9]{4,}$/.test(value)
}

const validateForm = (): boolean => {
  const { name, password } = formData.value

  if (!name || name.length < 4) {
    formError.value = 'Имя пользователя должно быть минимум 4 символа'
    return false
  }

  if (!validateInput(name)) {
    formError.value = 'Имя пользователя должно содержать только буквы и/или цифры'
    return false
  }

  if (!password || password.length < 4) {
    formError.value = 'Пароль должен быть минимум 4 символа'
    return false
  }

  if (!validateInput(password)) {
    formError.value = 'Пароль должен содержать только буквы и/или цифры'
    return false
  }

  formError.value = ''
  return true
}

const handleSubmit = async () => {
  formError.value = ''

  if (!validateForm()) {
    return
  }

  const result = isLoginMode.value
    ? await authStore.login(formData.value)
    : await authStore.register(formData.value)

  if (!result.success) {
    const errorText = result.error?.toLowerCase() || ''

    if (errorText.includes('user already exist')) {
      formError.value = 'Имя пользователя уже занято'
    } else if (errorText.includes('invalid credentials') || errorText.includes('user not found')) {
      formError.value = 'Неправильный логин или пароль'
    } else {
      formError.value = 'Имя и пароль - минимум 4 символа (только буквы и/или цифры)'
    }
  } else {
    window.location.reload();
  }
}

const handleLogout = async () => {
  await authStore.logout()
  formData.value = { name: '', password: '' }
  window.location.href = '/auth'
}

const toggleMode = () => {
  mode.value = isLoginMode.value ? 'register' : 'login'
  formError.value = ''
  authStore.clearError()
}
</script>

<template>
  <div class="book-container">
    <div class="book-page">
      <div v-if="!authStore.isAuthenticated" class="book-content">
        <div class="chapter-title">
          <h1>Лабиринт Колдуна</h1>
        </div>

        <div class="text-block">
          <p>Для сохранения прогресса игры и возможности продолжить с любого устройства необходимо создать игровой аккаунт.</p>

          <p>Ваш персонаж, все достижения и история приключений будут храниться на сервере и станут доступны после входа в систему.</p>
        </div>

        <!-- Форма -->
        <form @submit.prevent="handleSubmit" class="auth-form">
          <div class="form-group">
            <label for="name">Имя</label>
            <input
              id="name"
              v-model="formData.name"
              type="text"
              placeholder="Ваше имя"
              :disabled="authStore.isLoading"
            />
          </div>

          <div class="form-group">
            <label for="password">Пароль</label>
            <input
              id="password"
              v-model="formData.password"
              type="password"
              placeholder="Придумайте пароль"
              :disabled="authStore.isLoading"
            />
          </div>

          <div v-if="formError" class="error-message">
            {{ formError }}
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary" :disabled="authStore.isLoading">
              {{ authStore.isLoading ? 'Загрузка...' : (isRegisterMode ? 'Создать аккаунт и начать игру' : 'Войти') }}
            </button>

            <button type="button" class="btn btn-link" @click="toggleMode" :disabled="authStore.isLoading">
              {{ isRegisterMode ? 'Уже есть аккаунт? Войти' : 'Создать новый аккаунт' }}
            </button>
          </div>
        </form>

        <div class="footnote">
          <h3>Создание аккаунта</h3>
          <p>Имя и пароль — минимум 4 символа (только буквы и/или цифры).</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chapter-title {
  text-align: center;
  margin-bottom: 40px;
  padding-bottom: 30px;
  border-bottom: 1px solid #d4c5b0;
}

.chapter-title h1 {
  font-size: 28px;
  color: #2c2416;
  font-weight: normal;
  margin: 0;
}

.text-block {
  margin-bottom: 40px;
}

.text-block p {
  font-size: 18px;
  line-height: 1.8;
  color: #3d3426;
  margin: 0 0 1.5em 0;
}

.text-block p:first-of-type {
  text-indent: 0;
}

.footnote {
  background: #f4e4c1;
  padding: 25px 30px;
  margin: 40px 0;
  border-left: 3px solid #8b7355;
}

.footnote h3 {
  font-size: 16px;
  color: #5c4d3c;
  margin: 0 0 10px 0;
  font-weight: normal;
}

.footnote p {
  font-size: 15px;
  color: #6b5d4d;
  margin: 0;
  line-height: 1.6;
}

.auth-form {
  margin-top: 40px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  color: #5c4d3c;
  margin-bottom: 8px;
  font-family: 'Arial', sans-serif;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d4c5b0;
  border-radius: 4px;
  font-size: 16px;
  background: #f4e4c1;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #f4e4c1;
}

.form-group input:disabled {
  background: #f4e4c1;
  cursor: not-allowed;
}

.error-message {
  color: #c0392b;
  font-size: 14px;
  margin-bottom: 15px;
  padding: 10px;
  border-radius: 4px;
  text-align: center;
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 30px;
}

.btn {
  padding: 14px 24px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Arial', sans-serif;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #5c4d3c;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #4a3d2e;
}

.btn-link {
  background: none;
  color: #8b7355;
  padding: 10px;
}

.btn-link:hover:not(:disabled) {
  color: #6b5540;
  text-decoration: underline;
}
</style>
