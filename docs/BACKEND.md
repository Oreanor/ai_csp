# Бэкенд: где что лежит и что делать дальше

Краткая карта для разработчика, который подключает реальную БД, LLM и продакшен-окружение. Сейчас проект остаётся **PoC**: данные пользователей в **JSON-файле**, ответы модели — **заглушка**.

## Стек на сегодня

- **Next.js 16** (App Router): HTTP — это **Route Handlers** в `src/app/api/**`.
- **Слой данных** — не Prisma и не ORM в коде PoC; в `package.json` может лежать Prisma — **схемы пока нет**, репозиторий пользователей реализован поверх файла.
- **LLM** — интерфейс + `StubLlmClient`, без внешних API.

## Карта каталогов

| Путь | Назначение |
|------|------------|
| `src/app/api/users/route.ts` | `GET` список, `POST` создать пользователя |
| `src/app/api/users/[id]/route.ts` | `GET` / `PATCH` / `DELETE` по `id` |
| `src/app/api/llm/complete/route.ts` | `POST` чат-запрос к `LlmClient` |
| `src/lib/server/users/` | Пользователи: контракт, JSON-реализация, валидация, фабрика |
| `src/lib/server/llm/` | LLM: типы, контракт, стаб, разбор тела запроса, фабрика |
| `src/lib/server/index.ts` | Реэкспорт публичного API слоя (удобно импортировать из фич) |
| `src/types/user.ts` | Тип `User` и DTO для create/update |
| `data/users.json` | Текущее хранилище пользователей (массив объектов) |

Роуты **тонкие**: парсинг тела, вызов репозитория / `getLlmClient()`, маппинг ошибок в HTTP.

## Контракт пользователей (`UserRepository`)

Файл: `src/lib/server/users/repository.ts`

Ожидаемые методы:

- `list()` — все пользователи (сортировка по дате создания — сейчас в JSON-реализации).
- `getById(id)` — `null`, если нет.
- `create({ email, name })` — уникальность email (нормализация: trim + lower case для сравнения).
- `update(id, patch)` — частично `email` / `name`; те же правила уникальности email.
- `delete(id)` — идемпотентность не требуется: при отсутствии id — ошибка `UserRepositoryNotFoundError`.

Реализация по умолчанию: **`JsonUserRepository`** (`json-user-repository.ts`) — читает/пишет весь массив в файл. **Не подходит** для продакшена (гонки записей, serverless с read-only FS).

Фабрика: **`getUserRepository()`** в `instance.ts`.

- Переменная окружения **`USERS_STORE_PATH`** — абсолютный или относительный путь к JSON (если оставляете файловый режим для dev).
- Чтобы перейти на БД: завести, например, `PrismaUserRepository` (или Drizzle), реализовать тот же интерфейс и **подменить создание синглтона** в `getUserRepository()` (или вынести выбор в фабрику по `NODE_ENV` / env).

Ошибки для маппинга в HTTP уже есть: `ValidationError` (400), `UserRepositoryNotFoundError` (404), `UserRepositoryConflictError` (409).

## Контракт LLM (`LlmClient`)

Файл: `src/lib/server/llm/llm-client.ts`

- Метод: `complete(input: LlmCompletionInput): Promise<LlmCompletionOutput>`.
- Вход: `messages` (`role`: `system` | `user` | `assistant`, `content`), опционально `temperature`, `maxOutputTokens`.
- Выход: `text`, опционально `finishReason`.

Фабрика: **`getLlmClient()`** в `llm/instance.ts` — сейчас всегда **`StubLlmClient`**.

Разбор тела `POST /api/llm/complete`: `src/lib/server/llm/parse-completion-body.ts`.

**Что сделать:** добавить класс, например `OpenAiLlmClient implements LlmClient`, читать ключи из env, в `getLlmClient()` выбирать реализацию по `LLM_PROVIDER` (или аналог). Стриминг в PoC не заложен — при необходимости расширить интерфейс отдельным методом или отдельным route.

## Примеры запросов (curl)

```bash
# Список пользователей
curl -s http://localhost:3000/api/users

# Создать
curl -s -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"dev@example.com\",\"name\":\"Dev User\"}"

# Обновить
curl -s -X PATCH http://localhost:3000/api/users/<id> \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"New Name\"}"

# LLM (стаб)
curl -s -X POST http://localhost:3000/api/llm/complete \
  -H "Content-Type: application/json" \
  -d "{\"messages\":[{\"role\":\"user\",\"content\":\"Hello\"}]}"
```

## Чеклист для бэкендера

1. **БД** — выбрать Postgres/MySQL и т.д., описать схему пользователя (минимум поля как в `src/types/user.ts`, плюс индекс по email).
2. **Репозиторий** — новый класс, реализующий `UserRepository`; подключить в `getUserRepository()`; миграции (Prisma/Drizzle/Flyway).
3. **JSON** — решить, нужен ли dev-fallback; при необходимости оставить `JsonUserRepository` только за флагом env.
4. **LLM** — провайдер, ключи, лимиты, логирование, обработка таймаутов; заменить/дополнить `StubLlmClient`.
5. **Авторизация** — сейчас API открыт; добавить сессии/JWT/API keys и проверку в роутах или middleware.
6. **Валидация** — при росте схемы имеет смысл Zod/OpenAPI; сейчас ручные парсеры в `users/validation.ts` и `llm/parse-completion-body.ts`.
7. **Деплой** — убедиться, что файловая БД не используется на read-only диске; для Vercel — только внешняя БД.

## Связанные правила проекта

Общие договорённости по структуре репозитория: `docs/ENGINEERING_RULES.md`.
