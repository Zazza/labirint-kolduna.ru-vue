<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useGameStore } from '@/stores/game'
import { useAuthStore } from '@/stores/auth'

const gameStore = useGameStore()
const authStore = useAuthStore()

onMounted(() => {
  gameStore.initializeBackend()
})

onUnmounted(() => {
  // Отключаемся при закрытии приложения
  //gameStore.disconnect()
})
</script>

<template>
  <div id="app">
    <router-view />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
}

body {
  background: #f5f0e8;
  color: #2c1810;
  line-height: 1.6;
}

#app {
  min-height: 100vh;
}
</style>
