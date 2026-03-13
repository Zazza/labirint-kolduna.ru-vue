<script setup lang="ts">
import {computed, nextTick, onMounted, ref} from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useGameStore } from '@/stores/game'
import { useRouter } from 'vue-router'
import type {BonusDTO, PlayerInfoBonus, SectionChoiceItems} from "@/types";
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

const authStore = useAuthStore()
const gameStore = useGameStore()
const router = useRouter()

const gameSection = computed(() => {
  return gameStore.section
})

const gameActionContent = computed(() => {
  if (gameStore.action?.content !== undefined) {
    return gameStore.action
  }
})

const rollTheDiceWaiting = computed(() => gameStore.section?.roll_the_dices)

// Типизированные computed для шаблонов
const choiceItems = computed<SectionChoiceItems[]>(() => gameStore.section?.choice?.Items || [])

const selectedItems = ref<string[]>([])

const refreshPage = () => {
  window.location.reload();
};

const goRules = () => {
  router.push('/rules')
}

onMounted(() => {
  console.log('Home mounted, isAuthenticated:', authStore.isAuthenticated)

  if (authStore.isAuthenticated) {
    gameStore.getSection()
  }
})

const setChoice = async (transitionID?: number) => {
  await gameStore.setRequest(Choice, {data: selectedItems.value, transitionID})

  if (gameStore.action?.result) {
    await gameStore.getSection()
  }
}

const setMove = async (transitionID?: number) => {
  await gameStore.setRequest(Move, {data: selectedItems.value, transitionID})

  if (gameStore.action?.result) {
    await gameStore.getSection()
  }
}

const setBattle = async (weapon?: string) => {
  await gameStore.setRequest(SetBattle, {weapon})

  if (gameStore.action?.result) {
    await nextTick();
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth'
    });

    await gameStore.getSection()
  }
}

const setSleepyChoice = async () => {
  await gameStore.setRequest(SleepyChoice, {})
  if (gameStore.action?.result) {
    await gameStore.getSection()
  }
}

const setBribeChoice = async () => {
  await gameStore.setRequest(BribeChoice, {})
  if (gameStore.action?.result) {
    await gameStore.getSection()
  }
}

const rollTheDice = async () => {
  await gameStore.setRequest(RollTheDice, {})
  if (gameStore.action?.result) {
    await gameStore.getSection()
  }
}

const goToProfile = () => {
  router.push('/profile')
}

const goToAuth = () => {
  router.push('/auth')
}

const handleLogout = async () => {
  await authStore.logout()
  // Перезагружаем страницу для сброса состояния
  window.location.href = '/auth'
}
</script>

<template>
  <div class="book-container">
    <!-- Верхняя панель персонажа внутри книги -->
    <div class="book-page">
      <div class="player-bar" v-if="gameSection">
        <div class="player-stats">
          <span class="stat"
                @click="goToProfile()"
                v-if="gameSection.type !== 'sleepy'">Профиль: HP {{ gameSection.player?.health }}</span>
          <span class="stat"
                @click="router.push('/map')"
                v-if="gameSection.map_available">Карта</span>
          <span class="stat" @click="goRules()">Правила</span>
          <span class="stat" @click="handleLogout()">Выход</span>
        </div>
      </div>

      <!-- Заголовок главы -->
      <div class="chapter-header" v-if="gameSection && gameSection.type !== 'sleepy'">
        <span class="chapter-number">Секция {{ gameSection.section }}</span>
      </div>
      <div class="chapter-header" v-else-if="gameSection && gameSection.type == 'sleepy'">
        <span class="chapter-number">Сонное царство</span>
      </div>

      <!-- Текст книги -->
      <div v-if="authStore.isAuthenticated" class="book-content">
        <div class="section-text" v-if="gameActionContent" v-html="gameActionContent.content"></div>
      </div>

      <div v-if="authStore.isAuthenticated" class="book-content">
        <div class="section-text" v-if="gameSection && !gameActionContent" v-html="gameSection.text"></div>
      </div>

      <!-- Сноски внизу страницы -->
      <div class="footnotes" v-if="gameActionContent">
        <hr class="footnote-divider" />
        <ul class="footnote-list">
          <li v-for="item in gameActionContent.actions">
            <a @click="setMove(item.TransitionID)">
              <span class="footnote-mark">*</span>
              {{ item?.Text }}
            </a>
          </li>
          <li>
            <a @click="refreshPage">
              <span class="footnote-mark">*</span>
              Обратно к списку
            </a>
          </li>
        </ul>
      </div>

      <div class="footnotes" v-if="gameSection && !gameActionContent">
        <hr class="footnote-divider" />

        <!-- Чекбоксы для выбора -->
        <div class="choice-box" v-if="choiceItems.length > 0">
          <ul class="choice-list">
            <li v-for="(item, index) in choiceItems" :key="index">
              <label>
                <input
                    type="checkbox"
                    :id="(item as any).Name"
                    :value="(item as any).Name"
                    v-model="selectedItems"
                    :disabled="(gameSection.choice?.MaxSelections !== undefined && selectedItems.length >= gameSection.choice.MaxSelections) && !((item as any).Name && selectedItems.includes((item as any).Name))"
                />
                {{ (item as any).Description }}
              </label>
            </li>
          </ul>
        </div>

        <!-- Переходы choice -->
        <ul class="footnote-list" v-if="gameSection.type === 'choice' || gameSection.type === 'sleepy'">
          <li v-for="item in gameSection.transitions">
            <a v-if="item?.BattleStart && !item?.SleepyTransition && !item?.Bribe" @click="setBattle()">
              <span class="footnote-mark">*</span>
              {{ item?.Text }}
            </a>

            <a class="transition-visited"
                v-if="!item?.BattleStart && !item?.SleepyTransition && !item?.Bribe && item.Visited"
                @click="setChoice(item.TransitionID)"
            >
              <span class="footnote-mark">*</span>
              {{ item?.Text  }}
            </a>

            <a
                v-if="!item?.BattleStart && !item?.SleepyTransition && !item?.Bribe && !item.Visited"
                @click="setChoice(item.TransitionID)"
            >
              <span class="footnote-mark">*</span>
              {{ item?.Text  }}
            </a>


            <a v-if="item?.SleepyTransition && !item?.Bribe && !item?.BattleStart" @click="setSleepyChoice()">
              <span class="footnote-mark">*</span>
              {{ item?.Text  }}
            </a>
            <a v-if="item?.Bribe" @click="setBribeChoice()">
              <span class="footnote-mark">*</span>
              {{ item?.Text  }}
            </a>
          </li>
        </ul>

        <!-- Переходы battle -->
        <ul class="footnote-list" v-if="gameSection.type === 'battle'">
          <li v-for="item in gameSection.transitions">
            <a @click="setBattle(item?.Weapon)" v-if="!item?.Bribe">
              <span class="footnote-mark">*</span>
              {{ item?.Text }}
            </a>
            <a @click="setBribeChoice()" v-if="item?.Bribe">
              <span class="footnote-mark">*</span>
              {{ item?.Text }}
            </a>
          </li>
        </ul>

        <!-- Бросок кубиков -->
        <div class="dice-section" v-if="rollTheDiceWaiting">
          <a @click="rollTheDice()" class="dice-link">
            <span class="dice-icon">🎲</span>
            Бросить кубики
          </a>
        </div>

        <p class="error-text" v-if="gameStore.action?.error">{{ gameStore.action?.error }}</p>
      </div>
    </div>
  </div>

  <div ref="bottomAnchor"></div>
</template>

<style scoped>
/* Основной текст книги */
.book-content {
  margin-bottom: 40px;
}

/* Сноски */
.footnotes {
  margin-top: 60px;
  padding-top: 24px;
}

.footnote-divider {
  border: none;
  margin-bottom: 20px;
  width: 40%;
  margin-left: 0;
}

.footnote-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footnote-list li {
  font-size: 15px;
  color: #5a4a3a;
  margin-bottom: 12px;
  line-height: 1.6;
}

.footnote-list a:hover {
  color: #a0522d;
  border-bottom: 1px solid;
}

.footnote-mark {
  color: #8b4513;
  font-weight: bold;
  margin-right: 8px;
}

.footnote-list .transition-visited {
  color: #2c1810;
}

.footnote-list .transition-visited:hover {
  color: #2c1810;
  border-bottom: apx solid;
}

/* Блок выбора */
.choice-box {
  margin-bottom: 24px;
  padding: 16px;
  border-radius: 4px;
}

.choice-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.choice-list li {
  font-size: 15px;
  color: #2c1810;
  margin-bottom: 10px;
}

.choice-list label {
  cursor: pointer;
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.choice-list input[type="checkbox"] {
  margin-top: 4px;
  accent-color: #8b4513;
}

/* Секция кубиков */
.dice-section {
  margin-top: 20px;
}

.dice-link {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  color: #8b4513;
  cursor: pointer;
  text-decoration: none;
  border-bottom: 1px dotted #8b4513;
}

.dice-link:hover {
  border-bottom-style: solid;
}

.dice-icon {
  font-size: 20px;
}

/* Ошибка */
.error-text {
  color: #a52a2a;
  font-size: 14px;
  margin-top: 16px;
  font-style: italic;
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

/* Кнопка */
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
