# AngularMaterialKit

Nx-монорепозиторий на Angular 22: приложение остаётся тонкой композицией, переиспользуемый код живёт в библиотеках с узким публичным API (`src/index.ts`) и жёсткими ESLint-границами.

## Окружение

- Node **24.18.0** — зафиксирован в `.nvmrc`, оттуда же CI берёт версию.
- npm **11.16.0** — зафиксирован в `packageManager` (`engines` требует Node `^24.18.0`).

```bash
nvm use
npm ci --legacy-peer-deps
```

## Разработка и проверки

```bash
npm start                                                  # nx serve → http://localhost:4200
npm run build                                              # production-сборка в dist/angular-material_kit
npm run watch                                              # nx build --watch --configuration development
npm test                                                   # nx test
npm run lint                                               # nx lint
npm run lint:fix                                           # eslint --fix .
npm run format                                             # prettier --write .
npx nx graph                                               # граф зависимостей проектов
npx nx run-many -t lint,typecheck,test,build --skip-nx-cache # все цели всех проектов
```

CI запускает только затронутые проекты: `npx nx affected -t lint,typecheck,test,build --skip-nx-cache`.

Цель `typecheck` есть у каждой библиотеки, `test` — только у библиотек, где реально лежат спеки.

## Архитектура

Библиотеки помечаются тегами `scope:*` и `type:*`; межимпорты разрешены только через `@amk/*` и только в рамках матрицы `@nx/enforce-module-boundaries`. Навигация, портал и доступность разделены на `api` (контракт + токен) и `data-access` (реализация + `provideX()`), поэтому оболочка зависит только от контрактов.

- [Архитектура и конвейер выноса](docs/architecture.md)
- [План миграции в Nx](docs/nx-migration-plan.md)

## Новая библиотека

```bash
npm run lib -- \
  --name=shared-ui-logo \
  --dir=libs/shared/ui/logo \
  --tags=scope:shared,type:ui \
  --from=src/app/shared/components/logo
```

Скрипт создаёт проект с нужными тегами, переносит файлы через `git mv`, собирает публичный API и добавляет цели `lint`, `typecheck` (и `test`, если среди файлов есть спеки).
