<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useProfileStore } from '@/stores/profile'
import { useRouter } from 'vue-router'
import {Bonus, Meds, Sleep} from "@/types/requestType.ts";
import type {BonusDTO} from "@/types";

const authStore = useAuthStore()
const profileStore = useProfileStore()
const router = useRouter()

const profile = computed(() => profileStore.profile)
const isLoading = computed(() => profileStore.isLoading)
const error = computed(() => profileStore.error)

const goHome = () => {
  router.push('/')
}

const goToAuth = () => {
  router.push('/auth')
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/auth')
}

const refreshPage = () => {
  window.location.reload();
};

onMounted(() => {
  if (authStore.isAuthenticated) {
    profileStore.getProfile()
  }
})

const setMeds = async () => {
  let result = await profileStore.setRequest(Meds, {})
  if (result?.result) {
    await profileStore.getProfile()
  }
}

const setSleep = async () => {
  let result = await profileStore.setRequest(Sleep, {})
  if (result?.result) {
    goHome();
  }
}

const setBonus = async (bonus: string, option?: string) => {
  let data: BonusDTO = {
    bonus: bonus,
    option: option,
  }

  let result = await profileStore.setRequest(Bonus, data)
  if (result?.result) {
    goHome();
  }
}
</script>

<template>
  <div class="book-container">
    <div class="book-page">
      <!-- Верхняя панель персонажа внутри книги -->
      <div class="player-bar" v-if="profile">
        <div class="player-stats">
          <span class="stat" @click="goHome">← Назад к игре</span>
        </div>
      </div>

      <!-- Заголовок -->
      <div class="chapter-header">
        <span class="chapter-number">Профиль</span>
      </div>

      <div v-if="!authStore.isAuthenticated" class="guest-section">
        <p class="guest-text">Для просмотра профиля необходимо войти в систему</p>
        <button @click="goToAuth" class="btn btn-primary">Войти</button>
      </div>

      <div v-else-if="isLoading" class="loading">
        Загрузка профиля...
      </div>

      <div v-else-if="error" class="error">
        {{ error }}
      </div>

      <div v-else-if="profile" class="profile-content">
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-label">Здоровье</span>
            <span class="stat-value health">{{ profile.health }}&nbsp;/&nbsp;{{ profile.max_health }}</span>
          </div>

          <div class="stat-card">
            <span class="stat-label">Золото</span>
            <span class="stat-value gold">{{ profile.gold }}</span>
          </div>

          <div class="stat-card">
            <span class="stat-label">Лекарства</span>
            <span class="stat-value meds">{{ profile.meds?.Count }}</span>
          </div>
        </div>

        <div v-if="profile.weapons?.length" class="section">
          <h3>Здоровье</h3>
          <ul class="item-list">
            <li>
              <p><a @click="setMeds()" v-if="profile.meds?.Count > 0">Использовать аптечку</a></p>
            </li>
            <li>
              <p><a @click="setSleep()">Попробовать поспать</a></p>
            </li>
          </ul>
        </div>

        <div v-if="profile.weapons?.length" class="section">
          <h3>Оружие</h3>
          <ul class="item-list">
            <li v-for="(weapon, index) in profile.weapons" :key="index">
              <span v-if="weapon?.Count"><strong>{{ weapon.Name }}</strong> x {{ weapon.Count }} (<span>🗡️</span> минимальный бросок кубиков [{{ weapon.MinCubeHit }}] ={{ weapon.Damage }})</span>
              <span v-else><strong>{{ weapon.Name }}</strong> (<span>🗡️</span> минимальный бросок кубиков [{{ weapon.MinCubeHit }}]+{{ weapon.Damage }})</span>
            </li>
          </ul>
        </div>

        <div v-if="profile.bag?.length" class="section">
          <h3>Сумка</h3>
          <ul class="item-list">
            <li v-for="(item, index) in profile.bag" :key="index">
              {{ item.Description }}
            </li>
          </ul>
        </div>

        <div v-if="profile.buff?.length" class="section">
          <h3>Баффы</h3>
          <ul class="item-list">
            <li v-for="(buff, index) in profile.buff" :key="index">
              {{ buff.Name }}
            </li>
          </ul>
        </div>

        <div v-if="profile.debuff?.length" class="section">
          <h3>Дебаффы</h3>
          <ul class="item-list">
            <li v-for="(debuff, index) in profile.debuff" :key="index">
              -{{ debuff.Health }} жизненные силы [{{ debuff.Name }}]
            </li>
          </ul>
        </div>

        <div v-if="profile.bonus?.length" class="section">
          <h3>Бонусы</h3>
          <ul class="item-list">
            <li v-for="(bonus, index) in profile.bonus" :key="index">
              <a @click="setBonus(bonus.alias, bonus.option.alias)" v-if="bonus.option">{{ bonus.name }} ({{ bonus.option?.name }})</a>
              <a @click="setBonus(bonus.alias)" v-else>{{ bonus.name }}</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Основной контент */
.profile-content {
  margin-bottom: 40px;
}

/* Статистика */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  border: 1px solid #8b4513;
  padding: 10px;
  border-radius: 4px;
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #5a4a3a;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
}

.stat-value.health {
  color: #e74c3c;
}

.stat-value.gold {
  color: #f39c12;
}

.stat-value.meds {
  color: #3498db;
}

/* Секции */
.section {
  margin-top: 24px;
}

.section h3 {
  font-size: 18px;
  color: #2c1810;
  margin-bottom: 12px;
}

.item-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.item-list li {
  font-size: 15px;
  color: #5a4a3a;
  padding: 8px 12px;
  margin-bottom: 4px;
  border-radius: 4px;
}

/* Гостевая секция */
.guest-section {
  text-align: center;
  padding: 40px;
}

.guest-text {
  font-size: 18px;
  color: #5a4a3a;
  margin-bottom: 24px;
}

/* Загрузка и ошибка */
.loading, .error {
  text-align: center;
  padding: 40px;
  color: #5a4a3a;
}

.error {
  color: #a52a2a;
}

/* Кнопки */
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

.btn-secondary {
  background: #5a4a3a;
  color: #fffef9;
}

.btn-secondary:hover {
  background: #6d5a48;
  transform: translateY(-2px);
}

.btn-logout {
  background: #8b4513;
  color: #fffef9;
}

.btn-logout:hover {
  background: #a0522d;
  transform: translateY(-2px);
}

.btn:hover {
  box-shadow: 0 4px 12px rgba(139, 69, 19, 0.3);
}
</style>
