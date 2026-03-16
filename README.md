# 🧙‍♂️ Labyrinth of the Sorcerer - Frontend

Интерактивная приключенческая игра с боевой системой, инвентарем и правилами.

## Содержание
- [Стек технологий](#стек-технологий)
- [Функциональность](#функциональность)
- [Установка и запуск](#установка-и-запуск)
- [Переменные окружения](#переменные-окружения)
- [Архитектура](#архитектура)
- [Структура файлов](#структура-файлов)
- [API роуты](#api-роуты)
- [Компоненты](#компоненты)
- [Pinia Stores](#pinia-stores)
- [Безопасность](#безопасность)
- [Разработка](#разработка)

## Стек технологий

### Основные зависимости
- **Vue.js** 3.5.27 — Progressive JavaScript framework
- **TypeScript** 5.9.3 — Type-safe JavaScript
- **Vite** 7.3.1 — Next generation frontend tooling
- **Pinia** 3.0.4 — State management для Vue
- **Vue Router** 5.0.1 — Официальный маршрутизатор для Vue
- **Axios** 1.6.5 — HTTP клиент для браузера и Node.js

### Dev зависимости
- **Vitest** 2.1.8 — Unit testing framework
- **@vitest/coverage-v8** 2.1.8 — Code coverage для Vitest
- **@vue/test-utils** 2.4.6 — Testing utilities для Vue
- **@vitejs/plugin-vue** 6.0.3 — Official Vue plugin для Vite
- **vue-tsc** 3.2.4 — TypeScript type checking для Vue
- **npm-run-all2** 8.0.4 — Параллельный и последовательный запуск npm скриптов
- **happy-dom** 15.11.7 — Lightweight DOM implementation для тестирования
- **jsdom** 25.0.1 — DOM implementation для тестирования

### Требования
- **Node.js**: ^20.19.0 || >=22.12.0
- **npm/yarn**: Любая современная версия
- **Backend API**: Python FastAPI на порту 5000

## Функциональность

### Игровой процесс
- **Навигация по секциям** — Переход между локациями и сюжетными сценами
- **Боевая система** — Автоматические и ручные бои с врагами
- **Бросок кубиков** — Рандомизированные события и проверки характеристик
- **Способности** — Лечение, бонусы, сон, подкуп и другие механики

### Профиль и инвентарь
- **Здоровье** — Отслеживание текущего и максимального здоровья
- **Оружие** — Управление боевым экипированием
- **Инвентарь** — Баг с предметами и медикаментами
- **Баффы и дебаффы** — Временные эффекты на персонажа

### Карта лабиринта
- **Интерактивная визуализация** — Canvas карта с узлами и связями
- **Граф локаций** — Отображение связей между секциями
- **Выделение активной локации** — Индикация текущего положения игрока

### Аутентификация
- **JWT Authentication** — Access + refresh токены
- **Автоматическое обновление токенов** — Auto-refresh через interceptors
- **Защищённые маршруты** — Navigation guards для аутентификации

## Установка и запуск

### Требования
- Node.js ^20.19.0 || >=22.12.0
- npm, yarn или pnpm
- Backend API запущен на порту 5000

### Инструкция

1. **Клонирование репозитория**
   ```bash
   git clone <repository-url>
   cd labirint-kolduna.ru-vue
   ```

2. **Установка зависимостей**
   ```bash
   npm install
   ```

3. **Настройка переменных окружения**
   ```bash
   cp .env.example .env
   ```

   Отредактируйте `.env` при необходимости:
   ```env
   VITE_BACKEND_HOST=127.0.0.1
   VITE_BACKEND_PORT=5000
   ```

4. **Запуск dev сервера**
   ```bash
   npm run dev
   ```

   Приложение будет доступно по адресу `http://localhost:3000`

### NPM скрипты

| Скрипт | Описание |
|--------|----------|
| `npm run dev` | Запуск dev сервера (port 3000) |
| `npm run build` | Production build с type-check |
| `npm run build-only` | Production build без type-check |
| `npm run preview` | Preview production build |
| `npm run type-check` | TypeScript type checking |
| `npm run test` | Запуск unit тестов |
| `npm run test:watch` | Запуск тестов в watch mode |
| `npm run test:coverage` | Запуск тестов с coverage report |

## Переменные окружения

Переменные окружения настраиваются в файле `.env` в корне проекта:

```env
# Backend connection settings
VITE_BACKEND_HOST=127.0.0.1
VITE_BACKEND_PORT=5000
```

### Описание переменных

| Переменная | Значение по умолчанию | Описание |
|-----------|----------------------|----------|
| `VITE_BACKEND_HOST` | `127.0.0.1` | Host backend API |
| `VITE_BACKEND_PORT` | `5000` | Port backend API |

## Архитектура

### Основные принципы

- **Vue Composition API** — Используем `<script setup>` syntax для компонентов
- **Type Safety** — Все API requests/responses типизированы через TypeScript interfaces
- **Pinia Stores** — Глобальное состояние управляется через Pinia
- **Vue Router** — Навигация и защита маршрутов через Vue Router
- **Axios Interceptors** — Auto-refresh токенов и централизованная обработка ошибок
- **Separation of Concerns** — Чёткое разделение: API → Services → Stores → Views

### Поток данных

```
User Input → Vue Component → Pinia Store → API Service → Axios → Backend API
```

### HTTP клиент

Axios instance с интерцепторами для:
- Автоматического добавления Authorization заголовка
- Auto-refresh токенов при 401 ошибке
- Централизованной обработки ошибок

## Структура файлов

```
src/
├── main.ts                    # Entry point приложения
├── App.vue                    # Root компонент
├── router/
│   └── index.ts              # Vue Router config + auth guards
├── stores/
│   ├── auth.ts               # Authentication state (user, tokens)
│   ├── game.ts               # Game state (section, action)
│   ├── profile.ts            # Player profile state
│   └── map.ts                # Map state (graph data, selected node)
├── services/
│   ├── http.ts               # Axios HTTP client + interceptors
│   └── auth.ts               # Auth API calls (login, register, refresh)
├── types/
│   ├── index.ts              # TypeScript interfaces
│   └── requestType.ts       # Request types (Choice, Move, Battle, etc.)
├── utils/
│   ├── jwt.ts                # JWT utilities (decode, validate)
│   └── sanitize.ts           # HTML sanitization
└── views/
    ├── Auth.vue              # Login/Register формы
    ├── Home.vue              # Игровой интерфейс
    ├── Profile.vue           # Профиль игрока
    ├── Rules.vue             # Правила игры
    └── Map.vue               # Интерактивная карта
```

## API роуты

### Authentication

| Метод | Эндпоинт | Описание | Auth |
|-------|----------|----------|------|
| POST | `/api/auth/login` | Вход в систему | No |
| POST | `/api/auth/register` | Регистрация | No |
| POST | `/api/auth/refresh` | Обновление токена | No |

### Game

| Метод | Эндпоинт | Описание | Auth |
|-------|----------|----------|------|
| GET | `/api/game/get-section` | Получение текущей секции | Yes |
| GET | `/api/game/role-the-dice` | Бросок кубиков | Yes |
| GET | `/api/game/profile` | Получение профиля | Yes |
| GET | `/api/game/map` | Получение карты лабиринта | Yes |
| POST | `/api/game/choice` | Выбор в диалоге | Yes |
| POST | `/api/game/move` | Перемещение | Yes |
| POST | `/api/game/battle` | Бой | Yes |
| POST | `/api/game/ability/meds` | Использование медикаментов | Yes |
| POST | `/api/game/ability/bonus` | Использование бонуса | Yes |
| POST | `/api/game/ability/sleep` | Сон | Yes |
| POST | `/api/game/ability/sleep/choice` | Выбор во сне | Yes |
| POST | `/api/game/ability/bribe` | Подкуп | Yes |

## Компоненты

### Auth.vue
**Назначение:** Формы входа и регистрации

**Функционал:**
- Переключение между Login и Register режимами
- Валидация формы
- Обработка ошибок
- Сохранение токенов в localStorage
- Автоматический редирект на главную после успешной аутентификации

**Key features:**
- JWT authentication
- Form validation
- Error handling
- Auto-redirect

### Home.vue
**Назначение:** Игровой интерфейс

**Функционал:**
- Отображение текущей секции с текстом
- Кнопки действий (Move, Battle, Roll Dice)
- Навигация по секциям
- HTML sanitization для текста секции
- Обработка ошибок и загрузки

**Key features:**
- Dynamic content rendering
- Action buttons
- Loading states
- Error handling

### Profile.vue
**Назначение:** Статистика и инвентарь игрока

**Функционал:**
- Отображение здоровья (текущее/максимальное)
- Список оружия
- Инвентарь с предметами
- Баффы и дебаффы
- Золото и другие характеристики

**Key features:**
- Character stats display
- Equipment list
- Inventory management
- Active effects

### Map.vue
**Назначение:** Интерактивная карта лабиринта

**Функционал:**
- Canvas визуализация графа локаций
- Выделение текущей локации
- Интерактивное выделение узлов
- Отображение связей между секциями
- Zoom и pan (опционально)

**Key features:**
- Graph visualization
- Interactive nodes
- Current location highlight
- Canvas rendering

### Rules.vue
**Назначение:** Правила игры

**Функционал:**
- Отображение правил игры
- Описание механик
- Объяснение боевой системы

**Key features:**
- Static content
- Markdown rendering (опционально)

## Pinia Stores

### auth.ts
**State:**
- `user: User | null` — Данные пользователя
- `isLoading: boolean` — Статус загрузки
- `error: string | null` — Ошибка авторизации

**Actions:**
- `login(credentials)` — Вход в систему
- `register(credentials)` — Регистрация
- `logout()` — Выход
- `checkAuth()` — Проверка авторизации при загрузке
- `autoRefresh()` — Автоматическое обновление токена

**Getters:**
- `isAuthenticated` — Проверка авторизации

### game.ts
**State:**
- `section: Section | null` — Текущая секция
- `action: string | null` — Текущее действие
- `isLoading: boolean` — Статус загрузки
- `error: string | null` — Ошибка игры

**Actions:**
- `getSection()` — Получение текущей секции
- `setRequest(requestType, data)` — Отправка игрового запроса

**Key features:**
- Game flow management
- Section navigation
- Action handling

### profile.ts
**State:**
- `profile: Profile | null` — Профиль игрока
- `isLoading: boolean` — Статус загрузки
- `error: string | null` — Ошибка загрузки профиля

**Actions:**
- `getProfile()` — Получение профиля
- `setRequest(requestType, data)` — Отправка запроса профиля

**Key features:**
- Character stats
- Inventory management
- Equipment display

### map.ts
**State:**
- `mapData: MapData | null` — Данные карты
- `selectedNode: string | null` — Выбранный узел
- `isLoading: boolean` — Статус загрузки
- `error: string | null` — Ошибка загрузки карты

**Actions:**
- `fetchMap()` — Получение карты
- `selectNode(nodeId)` — Выбор узла

**Key features:**
- Map visualization
- Node selection
- Interactive graph

## Безопасность

### JWT Authentication
- **Access Token** — Для авторизации запросов (хранится в localStorage)
- **Refresh Token** — Для обновления access token (хранится в localStorage)
- **Token Validation** — Проверка срока действия токена (`isTokenValid()`)

### Auto-refresh Tokens
- **Axios Interceptors** — Автоматическое обновление при 401 ошибке
- **MAX_REFRESH_RETRIES** — Максимум 3 попытки обновления
- **Concurrent Request Handling** — Очередь запросов во время обновления
- **Logout on Failure** — Выход при неудачном обновлении

### Navigation Guards
- **requiresAuth** — Требует аутентификации
- **guestOnly** — Доступно только для неавторизованных
- **Token Validation** — Проверка валидности токена при навигации

### HTML Sanitization
- **Allowed Tags:** `p`, `strong`, `em`, `u`, `br`, `span`, `div`, `ul`, `ol`, `li`, `blockquote`
- **Allowed Attributes:** `class`, `style`, `id`
- **Recursive Sanitization** — Глубокая очистка DOM дерева

### Token Storage
- **localStorage** — Хранение токенов в браузере
- **Key Names:** `access_token`, `refresh_token`
- **Cleanup** — Удаление токенов при logout

## Разработка

### Code Style

- **Vue Composition API** — Используем `<script setup>` syntax
- **TypeScript Interfaces** — Типизация всех API requests/responses
- **CamelCase** — Для TypeScript и переменных
- **PascalCase** — Для компонентов
- **Pinia Stores** — `defineStore()` для глобального состояния
- **Vue Router** — `<router-view>` и meta fields для маршрутизации

### Конвенции

**API Calls:**
- Все API запросы через `services/`
- Использование типизированных interfaces
- Централизованная обработка ошибок через interceptors

**State Management:**
- Глобальное состояние через Pinia stores
- Компоненты используют store через `useAuthStore()`, `useGameStore()`, etc.
- Рективные computed properties для деривативных значений

**Navigation:**
- Использовать Vue Router, не `window.location`
- Программная навигация через `router.push()`
- Использовать meta fields для защиты маршрутов

### Testing

**Фреймворки:**
- Vitest — Unit testing
- @vue/test-utils — Component testing
- happy-dom / jsdom — DOM implementation

**Команды:**
```bash
npm run test              # Запуск тестов
npm run test:watch       # Запуск в watch mode
npm run test:coverage    # С coverage report
```

### Build & Deploy

**Production Build:**
```bash
npm run build
```

**Preview:**
```bash
npm run preview
```

**Output:**
- `dist/` — Production build
- `dist/assets/` — Optimized assets (CSS, JS, images)

### Траблшутинг

**Проблема:** CORS ошибки при запросах к API

**Решение:**
1. Убедитесь, что backend запущен на порту 5000
2. Проверьте переменные окружения в `.env`
3. Убедитесь, что backend позволяет CORS для `localhost:3000`

**Проблема:** Token refresh loop

**Решение:**
1. Проверьте MAX_REFRESH_RETRIES в `http.ts`
2. Убедитесь, что refresh токен валиден
3. Проверьте логику в axios interceptor

**Проблема:** Type checking errors

**Решение:**
```bash
npm run type-check
```

---

## Лицензия

[Укажите лицензию проекта]

## Контакты

Для вопросов и предложений обращайтесь к разработчикам проекта.

---

**Built with Vue 3, TypeScript, and Vite** 🚀
