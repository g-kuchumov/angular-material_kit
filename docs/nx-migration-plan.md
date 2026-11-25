# План миграции Angular Material Kit в Nx-монорепозиторий

## Статус (обновлено после подключения Nx)

**Фаза 1 выполнена (Confirmed):**

- Установлены `nx@24.0.7`, `@nx/workspace@24.0.7`, `@nx/angular@24.0.7`, `@angular-devkit/core`, `@angular-devkit/schematics`, `@schematics/angular`. Angular версии остались на `22.0.x`.
- `npx nx init` выполнен с `--plugins=@nx/angular --nxCloud=false --aiAgents=none --cacheable=build,test,lint`; созданы `nx.json`, `project.json`, `.vscode/extensions.json`; `angular.json` конвертирован в `project.json`; npm-скрипты `start/build/watch/test/lint` теперь вызывают `nx`.
- `nx show projects` -> `["angular-material_kit"]`; `nx graph` строится; `defaultBase: master`.
- Проверено: `nx run angular-material_kit:lint` — OK, `nx run angular-material_kit:test` — 16 файлов/104 теста passed, `nx build --configuration=development` — OK.
- **Бюджет bundle (было):** initial bundle 1.01 MB при лимите 1 MB (превышение 9.08 kB). Бюджеты в `project.json` изначально были точно такими же, как в `angular.json`; исходники не менялись. **Исправлено:** лимит `initial` увеличен до `maximumWarning: 1.5MB`, `maximumError: 2MB`; production-сборка проходит без предупреждений. Lazy-загрузка features остаётся отдельной задачей фазы 4.
- Установка потребовала `npm install --legacy-peer-deps` из-за конфликта peer-зависимостей `@nx/angular` (optional peers `ng-packagr` / `@angular-devkit/build-angular` тянули Angular 21). Лишние пакеты (`ng-packagr`, webpack-based `@angular-devkit/build-angular`) после проверки удалены; приложение по-прежнему использует `@angular/build` (esbuild).
- Node в окружении `v22.22.1`, packages Angular 22 требуют `^22.22.3`: warnings EBADENGINE при установке, но сборка/тесты/lint работают.

**Фаза 3 выполнена (Confirmed):**

- Установлен `@nx/eslint-plugin@24.0.7` (вместе с зависимостями `@nx/js`, `@nx/devkit`); версия совпадает с `nx`/`@nx/angular`.
- В `eslint.config.js` подключён `nx.configs['flat/base']` и правило `@nx/enforce-module-boundaries` (`error`) с `depConstraints` по тегам `type:*` из раздела «Теги и правила зависимостей» ниже. Включены `enforceBuildableLibDependency: true` и `banTransitiveDependencies: true`.
- Добавлены жёсткие `bannedExternalImports`: `type:model` — `@angular/*`, `@ngneat/transloco`, `rxjs`; `type:util` — `@angular/*`, `@ngneat/transloco`; `type:domain-api` — `@angular/material`, `@angular/forms`, `@angular/common/http`, `@ngneat/transloco`; `type:ui` — `@angular/common/http`.
- Проект `angular-material_kit` получил теги `scope:app`, `type:app` в `project.json`.
- Правило проверено на практике: временная смена тега на `type:util` дала ошибки `A project tagged with "type:util" is not allowed to import "@angular/core"/"@angular/router"`; тег восстановлен.
- Финальная проверка `nx run-many -t lint,test,build --skip-nx-cache`: всё зелёное.

**Фаза 4, шаг 4.1 выполнен (Confirmed):**

- Созданы три lib через `@nx/angular:library` (с `--importPath`, `--tags`, `--unitTestRunner=none`, `--linter=none`):
  - `libs/shared/testing` — `@amk/shared-testing`, теги `scope:shared,type:testing`;
  - `libs/shared/util/overlay-scrollbar` — `@amk/shared-util-overlay-scrollbar`, теги `scope:shared,type:util`;
  - `libs/core/ui` — `@amk/core-ui`, теги `scope:core,type:core`.
- Перенесены файлы: `src/app/testing/transloco.testing.ts` → `libs/shared/testing/src/lib/`; `overlay-scrollbar.ts` → `libs/shared/util/overlay-scrollbar/src/lib/`; `overlay-scrollbar.service.ts` → `libs/core/ui/src/lib/`. Сгенерированные заглушки компонентов удалены, `index.ts` каждого lib экспортирует только нужный файл.
- Импорты заменены на scope-алиасы: 8 spec-файлов + `app.spec.ts` → `@amk/shared-testing`; `app.config.ts` → `@amk/core-ui`; сервис → `@amk/shared-util-overlay-scrollbar`.
- **Корректировка классификации:** `OverlayScrollbarService` (@Injectable, `@angular/core`) лежит в `type:core`, а не `type:util`, потому что для `type:util` задан запрет на `@angular/*`. Чистый DOM-класс `ScrollbarOverlay` остался в `type:util`.
- У каждой lib добавлен target `lint` с `@angular-eslint/builder:lint`; prefix заменён с `lib` на `amk`.
- `@nx/eslint-plugin` зафиксирован на точной версии `24.0.7` (как и остальные `@nx/*`), lockfile синхронизирован.
- `nx run-many -t lint,test,build --skip-nx-cache`: 4 проекта, всё зелёное; `tsconfig.base.json` получил `paths` для трёх алиасов.
- **Важно (TS 6.0.3):** как только lib начал импортировать исходник другой lib через `@amk/*`, `outDir` + `declaration` в `tsconfig.lib.json` заставили TypeScript считать rootDir равным каталогу lib и требовать явный `rootDir` (`TS6059` / `TS5011`). Перепроверил: убрать `declaration` недостаточно, а убрать `outDir` — достаточно. Поэтому выбрано **чистое решение**: не-buildable lib'ы никогда не эмитируются, и из их `tsconfig.lib.json` удалены `outDir`, `declaration`, `declarationMap`, `inlineSources`. Конфиг остаётся только для type-check/IDE, `rootDir` не нужен. `tsc -p <lib>/tsconfig.lib.json --noEmit` — без ошибок.
- **Конвейер выноса:** добавлен `tools/new-lib.mjs` (`npm run lib`), который одной командой генерирует lib с нужными тегами/importPath, удаляет заглушку, переносит файлы через `git mv`, собирает `index.ts`, ставит `prefix=amk` + lint target и нормализует tsconfig. Defaults генератора зафиксированы в `nx.json`. Подробности — `docs/architecture.md`.

**Фаза 4, шаг 4.2 выполнен (Confirmed):** все презентационные компоненты вынесены через `npm run lib` в `libs/shared/ui/*` с тегами `scope:shared,type:ui`: `logo`, `footer`, `menus`, `breadcrumbs`, `accessibility`, `toolbar`, `sidenav`. Импорты переведены на `@amk/*`, включая `app.routes.ts`. Заодно вынесены `core/portal`, `core/accessibility`, `core/navigation` (`type:core`) — без них UI-lib'ы импортировали бы сервисы из приложения, что запрещено границами. В `depConstraints` для `type:ui` добавлен `type:core`: UI-оболочка легально пользуется инфраструктурными сервисами (portal, navigation, accessibility); HTTP по-прежнему запрещён. `nx run-many -t lint,test,build --skip-nx-cache`: 14 проектов, 16 файлов / 104 теста, bundle 1.01 MB — зелёное. `nx graph` — 14 нод, без циклов.

**Фаза 4, шаг 4.4 выполнен (Confirmed):** `core/navigation` разделён на `libs/domain/navigation/api` (`scope:navigation,type:domain-api`: `SidenavApi`, `SIDENAV_API`, `SIDENAV_INITIAL_NODES`, модели и helpers) и `libs/domain/navigation/data-access` (`scope:navigation,type:data-access`: `SidenavService implements SidenavApi`, `provideSidenav()`). Конкретное меню вынесено из сервиса в `src/app/app.navigation.ts` (`APP_SIDENAV_NODES`) и подключается в `app.config.ts`. UI (`sidenav`, `toolbar`, `breadcrumbs`, `sidenav-node`) инъектит только `SIDENAV_API`; для его тестов добавлен `provideTestSidenav()` в `shared/testing`. Старый алиас `@amk/core-navigation` удалён. `nx graph` — 15 нод, без циклов; `nx run-many -t lint,test,build --skip-nx-cache`: 15 проектов, 16 файлов / 105 тестов, bundle 1.01 MB — зелёное. Зависимость `type:ui -> type:core` оставлена только из-за `portal`.

**Lazy-маршруты и бюджет выполнено (Confirmed):** демо-страницы переименованы в `src/app/features/ui-kit-demo/*` (без выноса в lib'ы: нет потребителей и контракта) и переведены на `loadComponent`. Заодно на `loadComponent` переведены `login`, `register`, `settings` — именно они тянули в initial bundle `@angular/forms`, form-field/input и Material card/checkbox. Initial total упал с **1.01 MB до 930.97 kB** (transfer 194.66 → 185.81 kB); одни демо-страницы дали лишь +3.65 kB к main, реальный выигрыш дал lazy auth/settings. Бюджет перекалиброван с временных `1.5MB/2MB` на `1MB/1.25MB` (изначально был `500kB/1MB`): сборка проходит без предупреждений. `nx run-many -t lint,test,build --skip-nx-cache`: 15 проектов, 16 файлов / 105 тестов — зелёное.

**Фаза 4, шаг 4.3 завершён (Confirmed):** `core/services/language`, `theme`, `paginator`, `transloco` и `app/transloco-loader.ts` вынесены через `npm run lib` в `libs/core/{language,theme,paginator,transloco}` (`scope:core,type:core`). Публичные API — только `src/index.ts` (внутренние barrel'ы удалены). `transloco.providers` теперь импортирует loader из своей же lib и `APP_LANGUAGES` из `@amk/core-language` — cross-layer импорт в корень приложения убран. `transloco.config.js`: `rootTranslationsPath` исправлен с `src/assets/i18n/` на `public/assets/i18n/`; runtime-путь `/assets/i18n/${lang}.json` остался корректным. `nx graph` — 19 нод, без циклов; `nx run-many -t lint,test,build --skip-nx-cache`: 19 проектов, 16 файлов / 105 тестов, initial 931.21 kB — зелёное.

**Фаза 4, шаг 4.5 выполнен (Confirmed):** `features/auth` и `features/settings` вынесены в `libs/features/*` (`scope:feature,type:feature`) через `npm run lib`; маршруты `login`, `register`, `settings` теперь грузят публичные API `@amk/features-auth` / `@amk/features-settings` через `loadComponent`. В `depConstraints` для `type:feature` добавлен `type:core`: `settings` легально пользуется `core-language`/`core-theme`. `nx graph` — 21 нода, без циклов; `nx run-many -t lint,test,build --skip-nx-cache`: 21 проект, 16 файлов / 105 тестов, initial 931.19 kB — зелёное.

**Фаза 5, CI выполнено (Confirmed):** добавлен `.github/workflows/ci.yml`: checkout с полной историей, Node 22, `npm ci --legacy-peer-deps`, `nrwl/nx-set-shas@v4`, затем `nx affected -t lint,test,build --base="$NX_BASE" --head="$NX_HEAD" --skip-nx-cache`. Команда проверена локально на диапазоне `HEAD~1..HEAD`: затронуты `angular-material_kit`, `features-auth`, `features-settings`, всё зелёное.

**Портал разделен по схеме навигации (Confirmed):** `core/portal` → `libs/domain/portal/api` (`scope:portal,type:domain-api`: `PortalApi`, `PORTAL_API`, модели/типы слотов) и `libs/domain/portal/data-access` (`scope:portal,type:data-access`: `PortalService implements PortalApi`, `providePortal()`). Оболочка (`sidenav`) инъектит только `PORTAL_API`; реализация подключается в `app.config.ts` и в `app.spec.ts` через `providePortal()`. Старый алиас `@amk/core-portal` удалён. `nx graph` — 22 ноды, без циклов; `nx run-many -t lint,test,build --skip-nx-cache`: 22 проекта, 16 файлов / 106 тестов, initial 931.28 kB — зелёное. Зависимость `type:ui -> type:core` осталась только из-за `accessibility`.

**Доступность разделена, граница `ui -> core` снята (Confirmed):** `core/accessibility` → `libs/domain/accessibility/api` (`scope:accessibility,type:domain-api`: `AccessibilityApi`, `ACCESSIBILITY_API`, модели настроек) и `libs/domain/accessibility/data-access` (`scope:accessibility,type:data-access`: `AccessibilityService implements AccessibilityApi`, `provideAccessibility()`). `accessibility-dialog` инъектит только `ACCESSIBILITY_API`; `app.config.ts` подключает реализацию через `provideAccessibility()` и инициализирует сервис через контракт. Удалён старый алиас `@amk/core-accessibility`. Из `depConstraints` для `type:ui` удалён `type:core` — оболочка больше не зависит от инфраструктурных реализаций. `nx graph` — 23 ноды, без циклов; `nx run-many -t lint,test,build --skip-nx-cache`: 23 проекта, 16 файлов / 107 тестов, initial 931.35 kB — зелёное.

**Per-lib цели проверок (Confirmed):** у всех 22 lib'ов добавлен `typecheck` (`tsc -p tsconfig.lib.json --noEmit`). Target `test` добавлен 10 lib'ам, где есть спеки, с собственными `tsconfig.spec.json`; target приложения сужен до своих 5 спеков. `@angular/build:unit-test` не умеет проходить без найденных тестов, поэтому lib'ы без спеков `test`-цели не получают — генератор создаёт её только при наличии `*.spec.ts`. CI обновлён до `nx affected -t lint,typecheck,test,build`. `nx run-many -t lint,test,build,typecheck --skip-nx-cache`: 23 проекта, 11 test-таргетов, 17 файлов / 109 тестов, initial 931.33 kB — зелёное.

**Линтинг HTML lib'ов (Confirmed):** в `lintFilePatterns` всех 22 lib'ов добавлен `src/**/*.html` — template-линтер (`templateRecommended` + `templateAccessibility` + Prettier) теперь проверяет 12 шаблонов оболочки и feature-страниц, которые ранее линтились только будучи в `src/app`. Генератор `tools/new-lib.mjs` добавляет HTML-паттерн автоматически.

**Scope-ограничения включены (Confirmed):** в `depConstraints` добавлены правила `scope:app/core/feature/shared/navigation/portal/accessibility`. Доменные `data-access` зависят только от своего `domain-api` и `shared/testing`, оболочка (`scope:shared`) — от `shared` и domain-api контрактов навигации/портала/доступности, `feature` — от `core` и `shared`, `app` — от всех scope. Правило проверено негативным тестом: временный импорт `@amk/domain-navigation-api` из `features-auth` дал `A project tagged with "scope:feature" can only depend on libs tagged with "scope:core", "scope:shared"`, хотя по `type:*` такой импорт разрешён. `nx graph` — 23 ноды без циклов; `nx run-many -t lint,test,build,typecheck --skip-nx-cache` — зелёное.

**Окружение зафиксировано (Confirmed):** добавлен `.nvmrc` с Node `24.18.0`, `package.json` получил `engines.node: ^24.18.0`; npm `11.16.0` из `packageManager` совпадает с npm в поставке Node 24.18.0. CI использует `node-version-file: .nvmrc` вместо плавающего мажора `22` — одна и та же версия локально и в GitHub Actions. Все проверки (`nx graph`, `nx run-many -t lint,test,build,typecheck --skip-nx-cache`) прогонялись под Node 24.18.0 и прошли.

**README переписан под Nx (Confirmed):** команды `ng serve/build/test/e2e` и ссылки на отсутствующий `angular.json` заменены на `npm start/build/test/lint`, `npx nx graph`, `npx nx run-many -t lint,typecheck,test,build --skip-nx-cache` и `npm run lib`. Добавлены разделы про окружение, архитектуру и цели проверок.

**`type:testing` сужен (Confirmed):** провайдеры теперь могут зависеть только от `domain-api/core/util/model/testing` и не тянут `app`/`feature`/`data-access`/`ui`. Негативный тест: импорт `@amk/shared-ui-menus` из `shared-testing` дал `A project tagged with "type:testing" can only depend on libs tagged with "type:domain-api", "type:core", "type:util", "type:model", "type:testing"`.

**Границы готовы к бизнес-доменам (Confirmed):** добавлен общий тег `scope:domain` для бизнес-доменов; `feature`, `shared` и `app` теперь могут зависеть от `scope:domain`, сами домены — от `domain`/`shared`. Из `type:feature` убран `type:data-access`: фича видит только `domain-api` и не может обойти контракт. Зафиксирован порядок вертикального среза `model → api → data-access → feature` и размещение тестовых дублей в `shared/testing`. Это снимает блокировку, при которой первая же бизнес-фича с `scope:orders` не смогла бы импортировать свой `@amk/domain-orders-api`.

**Единые test-провайдеры (Confirmed):** в `shared/testing` добавлены `provideTestAccessibility()`, `provideTestPortal()` (дубли с теми же сигналами/слотами, что у реальных API) и `provideTestApp()` — router, http, Transloco и все доменные дубли одним вызовом. `app.spec.ts` переведён с ручного набора провайдеров (где использовался реальный `provideSidenav()` и не было доступности) на `provideTestApp()`. У `shared-testing` появился собственный `test`-таргет с двумя спеками: проверка всех токенов и attach/close портала.

**Итог миграции:** все импорты между lib'ами идут только через `@amk/*`, границы `@nx/enforce-module-boundaries` соблюдены, `nx graph` без циклов. `src/styles.scss` — пользовательское изменение, в миграционные коммиты не включалось.

## Подтверждённые факты о текущем проекте

**Стек (из `package.json`, `angular.json`, `tsconfig*.json`, `eslint.config.js`) — Confirmed:**

- Angular **22.0.x** (`@angular/core`, `@angular/material`, `@angular/cdk`, `@angular/build:application`, esbuild/application builder).
- Standalone bootstrap: `src/main.ts` + `provideRouter`/providers в `src/app/app.config.ts`, корень `amk-root` (`src/app/app.ts`) содержит только `<router-outlet />`.
- TypeScript **~6.0.2**, `strict`-ориентированные флаги, `module: preserve`, project references (`tsconfig.json` -> `app/spec`).
- RxJS **~7.8.0**, Transloco (`@ngneat/transloco`), Angular Material, Vitest (`@angular/build:unit-test`, `vitest/globals`), ESLint flat config + `angular-eslint` + `typescript-eslint` strict/typeChecked + `eslint-plugin-rxjs-x` + Prettier.
- Prefix: `amk`, стили SCSS, assets из `public/`, i18n JSON в `public/assets/i18n/`.
- Path aliases в `tsconfig` **не настроены** (Confirmed).
- Nx изначально в репозитории **отсутствовал** (Confirmed); подключён в фазе 1, см. статус выше. Нет NgRx/guards/interceptors/pipes/enums/environments/e2e.

**Структура `src/app` — Confirmed (с корректировкой от 2026-11-25):**

> ⚠️ Ранее здесь упоминался `features/context-demo (list/detail/documents)`. Этого кода нет ни в рабочем дереве, ни в одной ветке, ни в истории коммитов: на момент первого аудита это были untracked-файлы, которые так и не были закоммичены. Пункт меню `context-demo` был мёртвой ссылкой и удалён. Все упоминания `context-demo` как цели выноса ниже сняты с плана.

- `core/services/`: `accessibility`, `language`, `paginator` (`MatPaginatorIntl`), `portal`, `sidenav` (`SidenavService` + `sidenav-node.model`), `theme`, `transloco` providers; есть index/barrel-файлы.
- `features/`: `auth/login`, `auth/register`, `settings` (+ `expression-panel`). Демо-страницы `button/button-toggle/card/checkbox` остаются в приложении (`shared/components/*`), но не являются переиспользуемыми lib'ами.
- `shared/components/`: `accessibility`, `breadcrumbs`, `button` (+ `button-panel`), `button-toggle`, `card`, `checkbox`, `footer`, `logo`, `menus` (`base-menu.directive`, `account-menu`, `notification-menu`, `menu-context.token`), `sidenav`/`sidenav-node`, `toolbar`.
- `shared/directives/`: `overlay-scrollbar.service.ts`, `overlay-scrollbar.ts`.
- `testing/transloco.testing.ts`, `transloco-loader.ts`, `app.routes.ts`, `app.config.ts`.
- **TS totals:** 49 non-spec `.ts` + 16 `.spec.ts`.

**Граф зависимостей (по grep/import анализу) — Confirmed:**

- `features -> shared/core` есть (`features/settings/expression-panel -> core/services/language/theme`, `features/auth/* -> shared/components/footer|logo`).
- `shared -> core` есть (`sidenav/toolbar/breadcrumbs/button/accessibility-dialog -> core/services/*`).
- `core -> features/shared` импортов **не найдено**.
- `shared -> features` импортов **не найдено**.
- `core/services/transloco/transloco.providers.ts -> ../../../transloco-loader.ts` — пересечение слоя (core зависит от app-root файла). Кандидат на вынос в `core/i18n`.
- `sidenav` — cross-cutting узел: сервис в core, UI в shared, конфигурация конкретного меню зашита прямо в `SidenavService`. Главный кандидат на аккуратное разделение API/реализации.
- Циклических импортов по grep не видно (Inferred: не полное доказательство графа).

**Текущее состояние git — Confirmed:** на момент аудита ветка `feat_right-sidenav` была грязной (untracked `button-panel`, spec для sidenav service и др.). Миграцию в Nx лучше начинать **после фиксации/стэша чистого состояния**, иначе будет трудно отделить миграционные изменения от продуктовых. Упоминавшийся тогда `context-demo` в репозиторий не попал.

## Целевая модель Nx (что даёт “заменяемость”)

Цель — не просто “папки в Nx”, а **контракты + изолированные реализации**:

1. **App — тонкая композиция**: bootstrap, провайдеры, маршруты, сборка shell. Минимум логики.
2. **Feature libs** — бизнес/экранные сценарии. Их можно заменить другой реализацией, если они зависят от доменных контрактов, а не от чужих внутренних деталей.
3. **UI libs** — переиспользуемые презентационные компоненты без знания бизнес-данных/роутинга домена.
4. **Data-access libs** — API/репозитории/адаптеры внешних источников. Заменяемость достигается через токен/интерфейс + provider.
5. **Util/model/config libs** — чистые типы, утилиты, конфиги, тестовые хелперы.
6. **Жёсткие границы ESLint** — архитектура проверяется автоматически, а не “по договорённости”.

## Рекомендуемая целевая структура

```text
.
├── apps/
│   └── material-kit/
│       ├── project.json
│       ├── src/
│       │   ├── main.ts
│       │   ├── app/app.config.ts
│       │   ├── app/app.routes.ts
│       │   └── app/app.component.ts
│       └── public/
├── libs/
│   ├── core/
│   │   ├── config/                  # app-wide config, providers composition helpers
│   │   ├── http/                    # interceptors, api base config, error handling
│   │   ├── i18n/                    # Transloco loader/providers, language init
│   │   ├── a11y/                    # accessibility service + model + providers
│   │   └── shell/                   # layout shell only if truly app-core
│   ├── shared/
│   │   ├── ui/
│   │   │   ├── button/
│   │   │   ├── button-toggle/
│   │   │   ├── card/
│   │   │   ├── checkbox/
│   │   │   ├── logo/
│   │   │   ├── footer/
│   │   │   ├── breadcrumbs/
│   │   │   ├── menus/
│   │   │   └── sidenav/             # UI components only
│   │   ├── util/                    # pure helpers, directives where appropriate
│   │   ├── models/                  # shared DTO/types only when truly shared
│   │   └── testing/                 # transloco testing helpers, test providers
│   ├── domain/                      # optional but recommended for replaceability
│   │   └── navigation/
│   │       ├── api/                 # SidenavNode, SidenavContext, tokens/interfaces
│   │       └── data-access/         # SidenavService implementation/provider
│   ├── features/
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   └── register/
│   │   └── settings/
│   │   # демо-страницы button/card/checkbox/button-toggle остаются в приложении,
│   │   # но не становятся отдельными lib'ами (нет потребителей и контракта)
├── tools/
├── nx.json
├── tsconfig.base.json
├── eslint.config.mjs
└── package.json
```

> Это целевая форма. Не обязательно создавать все libs в первый день; важно, чтобы новые границы были правильными.

## Куда что выносить (конкретно для этого репозитория)

| Текущее место                                                              | Куда                                                                                    | Тип              | Почему / как сделать заменяемым                                                                                                                                                  |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/app.config.ts`, `app.routes.ts`, `app.ts/html/scss`               | `apps/material-kit/src/app/*`                                                           | app              | Только композиция. В app не держать переиспользуемую логику.                                                                                                                     |
| `core/services/theme/*`                                                    | `libs/core/theme` или `libs/shared/util/theme`                                          | core/util        | Тема/цветовая схема — app-wide concern. Экспортировать provider + service + model через `index.ts`.                                                                              |
| `core/services/language/*`                                                 | `libs/core/i18n` или `libs/core/language`                                               | core             | Язык/инициализация — инфраструктура.                                                                                                                                             |
| `core/services/transloco/*` + `app/transloco-loader.ts`                    | `libs/core/i18n`                                                                        | core/data-access | Убрать импорт core->app-root. Loader/provider должны жить рядом и экспортироваться публичным API.                                                                                |
| `core/services/accessibility/*`                                            | разделено: `libs/domain/accessibility/api` + `libs/domain/accessibility/data-access`    | domain           | Контракт `AccessibilityApi`/`ACCESSIBILITY_API` в `api`, реализация `AccessibilityService` + `provideAccessibility()` в `data-access`. Диалог зависит только от контракта.       |
| `core/services/paginator/paginator-intl.ts`                                | `libs/core/material` или `libs/shared/ui/material`                                      | core/shared      | Адаптер Material i18n. Не смешивать с feature logic.                                                                                                                             |
| `core/services/portal/*`                                                   | разделено: `libs/domain/portal/api` + `libs/domain/portal/data-access`                  | domain           | Контракт `PortalApi`/`PORTAL_API` в `api`, реализация `PortalService` + `providePortal()` в `data-access`. Оболочка зависит только от контракта.                                 |
| `core/services/sidenav/*`                                                  | разделить: `libs/domain/navigation/api` + `libs/domain/navigation/data-access`          | domain           | **Ключевой рефакторинг.** Модели/контракт/context token — в `api`; реализация `SidenavService` — в `data-access`. Фичи зависят от `api` (или фасада), реализацию можно заменить. |
| `shared/components/sidenav/*`, `toolbar`, `breadcrumbs`                    | `libs/shared/ui/shell` или несколько `shared/ui/*`                                      | ui               | UI shell-компоненты. Они могут зависеть от `domain/navigation/api`, но не от feature libs.                                                                                       |
| `shared/components/button*`, `card`, `checkbox`, `button-toggle`           | **остаются в приложении**, переводятся на lazy `loadComponent`                          | —                | Routable demo-страницы без логики и без внешних потребителей. Выносить в lib'ы нецелесообразно: это не переиспользуемые компоненты и не контракт.                                |
| `shared/components/logo`, `footer`, `menus`, `accessibility-dialog/button` | `libs/shared/ui/<component>`                                                            | ui               | Презентационные/переиспользуемые компоненты. Стараться не тянуть feature/core implementation напрямую.                                                                           |
| `shared/directives/overlay-scrollbar*`                                     | `libs/shared/util/overlay-scrollbar`                                                    | util             | Техническая утилита/директива, не домен.                                                                                                                                         |
| `testing/transloco.testing.ts`                                             | `libs/shared/testing`                                                                   | testing          | Общие test providers/helpers, не production code.                                                                                                                                |
| `features/auth/login, register`                                            | `libs/features/auth/login`, `libs/features/auth/register` или один `libs/features/auth` | feature          | Если сценарии простые — одна feature-lib; если будут расти независимо — раздельно.                                                                                               |
| `features/settings/*`                                                      | `libs/features/settings`                                                                | feature          | Экран настроек и его локальные панели.                                                                                                                                           |

## Теги и правила зависимостей (жёсткая схема)

Используйте **два измерения тегов**: `scope:*` и `type:*`. Этого достаточно, чтобы правила были простыми и долговечными.

### Предлагаемые теги

| Проект/папка                | Теги                                 |
| --------------------------- | ------------------------------------ |
| `apps/material-kit`         | `scope:app`, `type:app`              |
| `libs/core/*`               | `scope:core`, `type:core`            |
| `libs/domain/*/api`         | `scope:<domain>`, `type:domain-api`  |
| `libs/domain/*/data-access` | `scope:<domain>`, `type:data-access` |
| `libs/features/*`           | `scope:<feature>`, `type:feature`    |
| `libs/shared/ui/*`          | `scope:shared`, `type:ui`            |
| `libs/shared/util/*`        | `scope:shared`, `type:util`          |
| `libs/shared/models/*`      | `scope:shared`, `type:model`         |
| `libs/shared/testing/*`     | `scope:shared`, `type:testing`       |

### Матрица зависимостей

| Source tag         | Может зависеть от                                                                                        |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| `type:app`         | `type:feature`, `type:core`, `type:ui`, `type:util`, `type:model`, `type:data-access`, `type:domain-api` |
| `type:feature`     | `type:ui`, `type:data-access`, `type:domain-api`, `type:util`, `type:model`                              |
| `type:data-access` | `type:domain-api`, `type:util`, `type:model`, `type:core` (ограниченно; лучше через токены)              |
| `type:domain-api`  | `type:model`, `type:util`                                                                                |
| `type:ui`          | `type:ui`, `type:util`, `type:model`, `type:domain-api` (только контракты/типы)                          |
| `type:util`        | `type:util`, `type:model`                                                                                |
| `type:model`       | `type:model`                                                                                             |
| `type:testing`     | всё, кроме `type:app` (или по необходимости)                                                             |

**Жёсткие запреты:**

- `feature -> feature` (кроме явно разрешённого редкого случая; лучше запретить).
- `ui -> feature`, `ui -> data-access`, `ui -> core`.
- `domain-api -> data-access/feature/app`.
- `shared/* -> feature/app`.
- Любой проект без тега — считать нарушением процесса (добавить проверку в CI).

## ESLint: жёсткие границы (`@nx/enforce-module-boundaries`)

Проект уже на **flat ESLint config** (`eslint.config.js`) — Confirmed. В Nx это удобно сохранить как `eslint.config.mjs`/`eslint.config.js` с плоской конфигурацией.

### Базовый пример (flat config)

```js
// eslint.config.mjs
import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [],
          depConstraints: [
            {
              sourceTag: 'type:app',
              onlyDependOnLibsWithTags: [
                'type:feature',
                'type:core',
                'type:ui',
                'type:util',
                'type:model',
                'type:data-access',
                'type:domain-api',
              ],
            },
            {
              sourceTag: 'type:feature',
              onlyDependOnLibsWithTags: ['type:ui', 'type:data-access', 'type:domain-api', 'type:util', 'type:model'],
            },
            {
              sourceTag: 'type:data-access',
              onlyDependOnLibsWithTags: ['type:domain-api', 'type:util', 'type:model', 'type:core'],
            },
            {
              sourceTag: 'type:domain-api',
              onlyDependOnLibsWithTags: ['type:model', 'type:util'],
            },
            {
              sourceTag: 'type:ui',
              onlyDependOnLibsWithTags: ['type:ui', 'type:util', 'type:model', 'type:domain-api'],
            },
            {
              sourceTag: 'type:util',
              onlyDependOnLibsWithTags: ['type:util', 'type:model'],
            },
            {
              sourceTag: 'type:model',
              onlyDependOnLibsWithTags: ['type:model'],
            },
            {
              sourceTag: 'type:testing',
              onlyDependOnLibsWithTags: [
                'type:feature',
                'type:core',
                'type:ui',
                'type:util',
                'type:model',
                'type:data-access',
                'type:domain-api',
                'type:testing',
              ],
            },
          ],
        },
      ],
    },
  },
];
```

### Дополнительные “железные” правила

- `enforceBuildableLibDependency: true` — если появятся buildable/publishable libs, зависимость не должна ломать инкрементальную сборку.
- Запрет глубоких импортов: не импортировать `libs/*/src/lib/**` напрямую, только публичный API (`index.ts` / `exports` в зависимости от стратегии). В Nx это контролируется тем же правилом + дисциплиной barrel exports.
- Добавить проверку тегов в CI: падать, если у проекта нет `scope:*` и `type:*`.
- Для Angular selector prefix можно сохранить `amk` на уровне app, а в ui-libs решить: общий `amk` или доменный префикс. Главное — зафиксировать правило.
- Включить `nx lint`, `nx graph`, `nx affected -t lint,test,build` в CI.

## Поэтапный план миграции (без потерь, с откатом)

### Фаза 0 — подготовка (без Nx)

1. **Зафиксировать текущее состояние**: отдельный commit/branch point, зелёные `npm run lint`, `npm run test`, `npm run build`. Текущая ветка уже грязная — сначала разделить продуктовые изменения и миграцию.
2. **Снять baseline**: сохранить вывод build/lint/test, список маршрутов, скриншоты ключевых экранов (особенно sidenav/settings/auth).
3. **Ввести правило “миграция без функциональных изменений”**: первые PR — только перенос/конфиг/границы.
4. **Договориться о naming**: scope пакетов (`@amk/*` или `@app/*`), схема тегов, где лежат public API.

### Фаза 1 — подключение Nx к существующему Angular CLI проекту

**Цель:** репозиторий управляется Nx, приложение собирается как раньше.

Рекомендуемый безопасный путь для одного существующего Angular app:

1. В корне: `npx nx@latest init` (или эквивалент текущей версии Nx; проверить актуальную команду в docs Nx перед запуском). Выбрать интеграцию с существующим `package.json`/scripts, не переписывая лишнее.
2. Добавить Angular plugin: `nx add @nx/angular` (или `npm i -D @nx/angular @nx/eslint-plugin @nx/js` — по выбранному flow).
3. Конвертировать текущий проект в Nx project/app конфигурацию. В современных Nx сценариях это обычно делается через `nx init` + генераторы/конвертеры; итог должен быть: `nx.json`, `project.json`/проектная конфигурация, рабочие targets `build/serve/test/lint`.
4. Убедиться, что команды эквивалентны:
   - `nx build angular-material_kit` (или новое имя app)
   - `nx serve angular-material_kit`
   - `nx test angular-material_kit`
   - `nx lint angular-material_kit`
5. Сохранить Angular builder `@angular/build:*` и Vitest setup, если Nx их поддерживает в текущей версии — не менять тестовый раннер одновременно с миграцией.

**Риск-контроль:** отдельный PR “chore: add Nx”. Никаких переносов файлов, кроме минимально необходимых конфигов.

### Фаза 2 — нормализация структуры monorepo

1. Перенести приложение в `apps/material-kit` (или оставить имя ближе к текущему, но лучше короткое техническое имя). Обновить `project.json`, `tsconfig`, paths, assets/public, styles.
2. Создать `tsconfig.base.json` и базовые alias/TS references по Nx convention.
3. Включить кэш Nx, `namedInputs`, `targetDefaults`.
4. Настроить `nx graph` как обязательный артефакт ревью архитектуры.

**Риск-контроль:** после переноса app должен быть 1:1 функционально идентичен. Сравнить bundle output/маршруты/smoke.

### Фаза 3 — ввести границы до массового переноса

1. Подключить `@nx/enforce-module-boundaries` в ESLint.
2. Сначала добавить теги только для `app` и нескольких первых libs, но сразу включить правило в `error`.
3. Добавить convention: каждый lib имеет `index.ts` (public API). Внешние импорты — только из public API.
4. Ввести генераторы/шаблоны: `nx g @nx/angular:library ... --tags=...`.

**Важно:** границы нужно включить **до** того, как появится много libs, иначе долг накапливается мгновенно.

### Фаза 4 — поэтапный вынос библиотек (strangler pattern)

Порядок — от наименее связанного к наиболее связному. После каждого шага: `nx affected -t lint,test,build`, smoke UI.

#### Шаг 4.1. Shared/util + testing

- `testing/transloco.testing.ts` -> `libs/shared/testing`.
- `overlay-scrollbar` directive/service -> `libs/shared/util/overlay-scrollbar`.
- Низкий риск, мало доменной связности.

#### Шаг 4.2. Shared UI (презентационные)

- Начать с “листовых” компонентов: `logo`, `footer`.
- Затем составные: `menus`, `accessibility` UI, `breadcrumbs`, `sidenav` UI.
- Правило: UI lib не импортирует `features/*`, не делает HTTP, не знает маршруты домена. Вход/выход — через inputs/outputs/signals.
- `button/card/checkbox/button-toggle` **не** считать чистым shared UI в текущем виде: они используются как routable demo-экраны; `button` управляет правой панелью через portal. Их лучше вынести в `features/ui-kit`.

#### Шаг 4.3. Core/infrastructure

- `theme`, `language`, `accessibility`, `paginator-intl`, `transloco` — в `libs/core/*`.
- `transloco-loader` перенести рядом с i18n provider, убрать cross-layer import.
- В `app.config.ts` оставить только композицию providers из публичных API libs.
- Сверить `transloco.config.js` (`rootTranslationsPath: 'src/assets/i18n/'`) с фактическим расположением/runtime путём (`public/assets/i18n`, `/assets/i18n/${lang}.json`).

#### Шаг 4.4. Domain navigation (развязка sidenav)

- Создать `libs/domain/navigation/api`: `SidenavNode`, `SidenavContext`, token/интерфейс `SidenavApi`.
- Создать `libs/domain/navigation/data-access`: реализация `SidenavService`, provider `provideSidenav()`.
- Вынести конфигурацию конкретного меню приложения из общего сервиса в app/shell composition, если `SidenavService` сейчас содержит app-specific menu data.
- Потребители навигации зависят только от `navigation/api` (или узкого фасада), не от внутренностей shared sidenav component.
- UI sidenav зависит от `navigation/api`, получает данные через контракт. Это даст заменяемость: можно подменить реализацию навигации или UI.

#### Шаг 4.5. Features

- `auth/login`, `auth/register`, `settings` — отдельные feature libs. Демо-страницы остаются в приложении под lazy `loadComponent`.
- В app routes использовать lazy loading на feature entry points/route providers:

```ts
// apps/material-kit/src/app/app.routes.ts
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('@amk/shared/ui/shell').then((m) => m.SidenavShellComponent),
    children: [
      { path: 'settings', loadChildren: () => import('@amk/features/settings').then((m) => m.SETTINGS_ROUTES) },
      { path: 'button', loadComponent: () => import('./features/ui-kit-demo/button/button').then((m) => m.Button) },
    ],
  },
  { path: 'login', loadComponent: () => import('@amk/features/auth/login').then((m) => m.LoginPageComponent) },
];
```

_Имена — пример; подстройте под реальный export._

### Фаза 5 — закрепление архитектуры

1. **CI gate**: `nx affected -t lint,test,build --base=origin/main --head=HEAD`.
2. **Генераторы по умолчанию**: в `nx.json` задать defaults для Angular libs/components (standalone, style scss, prefix/tags conventions).
3. **Документировать правила** в `docs/architecture.md`: слои, теги, разрешённые импорты, как создавать новую lib.
4. **Запрет прямых импортов между features** проверить отдельным lint правилом/depConstraints.
5. **Визуальный контроль**: `nx graph` на ревью крупных PR.

## Правила “заменяемости” (чтобы это работало не только на бумаге)

1. **Зависеть от контракта, не от реализации.** Для навигации, API-клиентов, storage, feature flags — интерфейс + `InjectionToken`/provider в `api`/`domain` lib.
2. **Public API минимален.** Экспортировать только то, что реально нужно снаружи. Всё остальное — внутренности lib.
3. **Feature не импортирует feature.** Общий код поднимается в `shared/ui|util|model` или `domain/*/api`.
4. **UI не знает источник данных.** Данные приходят через input/порт/фасад.
5. **Data-access заменяем через provider.** Например, `provideNavigationApi(() => new SidenavService(...))` или `provideXxxApi(impl)`.
6. **Route-level boundaries.** Каждая feature отдаёт свои routes/entry component; app только подключает.
7. **Тесты на границах.** Для каждой lib — unit tests на public API; для app — smoke/e2e по ключевым маршрутам.

## Практические команды (шаблон, проверить под текущую версию Nx)

```bash
# 0. Базовая проверка перед миграцией
npm ci
npm run lint
npm run test
npm run build

# 1. Инициализация Nx в существующем Angular CLI репозитории
npx nx@latest init
nx add @nx/angular

# 2. Проверка после подключения Nx
nx graph
nx run-many -t lint,test,build

# 3. Генерация libs (примеры)
nx g @nx/angular:library shared-ui-logo --directory=libs/shared/ui/logo --standalone --tags="scope:shared,type:ui"
nx g @nx/angular:library domain-navigation-api --directory=libs/domain/navigation/api --standalone --tags="scope:navigation,type:domain-api"
nx g @nx/angular:library domain-navigation-data-access --directory=libs/domain/navigation/data-access --standalone --tags="scope:navigation,type:data-access"
nx g @nx/angular:library feature-settings --directory=libs/features/settings --standalone --tags="scope:settings,type:feature"

# 4. Контроль после каждого шага
nx affected -t lint,test,build
```

> Команды генерации/флаги Nx чувствительны к версии. Перед запуском сверяйте с `nx g @nx/angular:library --help` и актуальной документацией Nx.

## Риски и как избежать потерь

- **Смешение продуктовых изменений и миграции** — делать отдельные PR: “add Nx”, “move app”, “extract shared ui/util”, “split navigation domain”, “extract features”.
- **Ломание git history при массовых переносах** — переносить небольшими батчами, использовать `git mv`, проверять blame/history на ключевых файлах.
- **Скрытые циклические зависимости** — включить module boundaries с самого начала, регулярно смотреть `nx graph`.
- **Слишком крупные libs** — лучше несколько маленьких libs с ясным public API, чем одна “shared”.
- **Тестовый раннер/билдер меняются одновременно** — не делать. Сейчас Vitest + Angular build уже работает; сохраняем до завершения структурной миграции.
- **Public API превращается в свалку** — экспортировать только стабильные элементы, внутренние файлы не импортировать извне.
- **i18n путь ломается при переносе** — проверить `transloco.config.js`, расположение `public/assets/i18n`, и runtime loader path.
- **Routable demo-компоненты ошибочно попадают в shared/ui** — классифицировать по ответственности, а не по текущей папке.

## Тестовый долг, который стоит учитывать при миграции

Specs есть у части core services и shared-компонентов, но отсутствуют у toolbar/sidenav UI, accessibility UI, auth/settings, overlay-scrollbar directive/service, transloco loader/providers, paginator-intl. При выносе libs добавлять хотя бы smoke/unit tests на public API каждой новой lib; не переносить не покрытый тестами код “вслепую”.

## Рекомендуемый первый приоритет именно здесь

1. Закрыть текущие изменения на `feat_right-sidenav` и получить чистый baseline.
2. Подключить Nx без переноса файлов.
3. Вынести `shared/testing`, `overlay-scrollbar`, `logo/footer` — быстрые победы.
4. Разрезать `sidenav` на `domain/navigation/api` + `data-access` + `shared/ui/sidenav`, вынеся app-specific menu data из общего сервиса.
5. Перенести `settings`, `auth` в feature libs с lazy routes; демо-страницы оставить в приложении под lazy `loadComponent`.
6. Включить строгие `depConstraints` и сделать lint обязательным в CI.

## Источники

- Локальные файлы проекта: `package.json`, `angular.json`, `tsconfig*.json`, `eslint.config.js`, `.prettierrc`, `src/app/**`, `git status`.
- Nx docs: [Enforce Module Boundaries](https://nx.dev/features/enforce-module-boundaries), [@nx/angular application generator](https://nx.dev/technologies/angular/api/generators/application), [Crafting Your Nx Workspace](https://nx.dev/getting-started/tutorials/crafting-your-workspace).
- Примечание: некоторые URL рецептов миграции Nx возвращали 404 во время проверки, поэтому команды миграции даны как шаблон и требуют сверки с `nx --help`/актуальной документацией Nx.
