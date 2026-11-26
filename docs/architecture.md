# Архитектура и конвейер выноса в библиотеки

## Принцип

Приложение остаётся тонкой композицией. Вся переиспользуемая логика живёт в Nx-библиотеках с узким публичным API (`src/index.ts`). Зависимости между lib'ами идут **только** через `@amk/*`, относительные кросс-проектные импорты запрещены ESLint-правилом `@nx/enforce-module-boundaries`.

Библиотеки **не buildable**: приложение компилирует их исходники напрямую через `paths` в `tsconfig.base.json`. Это даёт быстрый вынос без ng-packagr и отдельного build-оркестратора. Цена — граница существует на уровне исходников и контролируется ESLint, а не package.json. Если позже понадобится заменяемость на уровне пакетов, lib'ы переводятся в buildable с импортом из `dist`.

## Слои и теги

Матрица разрешённых зависимостей задана в `eslint.config.js` (`depConstraints`) и является единственным источником истины. Кратко:

| Тег                | Назначение                            | Может зависеть от                                                |
| ------------------ | ------------------------------------- | ---------------------------------------------------------------- |
| `type:app`         | композиция приложения                 | feature, core, data-access, domain-api, ui, util, model, testing |
| `type:feature`     | routable-фичи                         | ui, core, domain-api, util, model, testing                       |
| `type:data-access` | реализация портов, API                | domain-api, core, util, model                                    |
| `type:domain-api`  | контракты, типы, токены               | model, util                                                      |
| `type:ui`          | презентационные компоненты и оболочка | ui, domain-api, util, model                                      |
| `type:core`        | инфраструктура, сервисы Angular       | core, util, model                                                |
| `type:util`        | чистые функции/классы                 | util, model                                                      |
| `type:model`       | только типы                           | model                                                            |
| `type:testing`     | тестовые провайдеры/моки              | domain-api, core, util, model, testing                           |

Scope-ограничения накладываются поверх type-матрицы — проект должен пройти оба правила:

| Тег                   | Может зависеть от scope                                                  |
| --------------------- | ------------------------------------------------------------------------ |
| `scope:app`           | app, core, feature, domain, navigation, portal, accessibility, shared    |
| `scope:core`          | core, shared                                                             |
| `scope:feature`       | core, shared, domain                                                     |
| `scope:shared`        | shared, domain, navigation, portal, accessibility (только api контракты) |
| `scope:domain`        | domain, shared                                                           |
| `scope:navigation`    | navigation, shared                                                       |
| `scope:portal`        | portal, shared                                                           |
| `scope:accessibility` | accessibility, shared                                                    |

Дополнительные запреты внешних импортов: `util`/`model` не могут импортировать `@angular/*`, `domain-api` — `@angular/material`, `@angular/forms`, `@angular/common/http`, `@ngneat/transloco`, `ui` — `@angular/common/http`. `type:testing` разрешён как зависимость всем слоям, но сам не может тянуть `app`/`feature`/`ui`/`data-access`: это тестовый провайдер, а не продуктовая связь. `type:core` разрешён только для `feature` (settings использует `core-language`/`core-theme`) и `app` (композиция инфраструктуры). Для `type:ui` зависимость от `core` убрана: HTTP для UI по-прежнему запрещён. Навигация, портал и доступность вынесены из `core` в `domain/*`: оболочка (`sidenav`, `toolbar`, `breadcrumbs`, `accessibility-dialog`) зависит только от контрактов `SIDENAV_API`, `PORTAL_API`, `ACCESSIBILITY_API` (`type:domain-api`), реализации подключаются композицией через `provideSidenav()` / `providePortal()` / `provideAccessibility()`.

Для бизнес-логики принят вертикальный срез: `libs/domain/<entity>/model` (`scope:domain,type:model`) хранит чистые типы без Angular/rxjs, `libs/domain/<entity>/api` (`scope:domain,type:domain-api`) — интерфейс и `InjectionToken`, `libs/domain/<entity>/data-access` (`scope:domain,type:data-access`) — реализация и `provide<Entity>()`, `libs/features/<feature>` (`scope:feature,type:feature`) — только UI через контракт. `type:feature` не может зависеть от `type:data-access`: конкретная реализация подключается только в `app.config.ts` (`type:app`). Тестовые дубли живут в `shared/testing` и зависят только от domain-api.

## Модель доступа K1

Приложение разделено на три ограниченных контекста: `auth` (сессия, вход, регистрация, refresh), `users` (профиль, каталог, статус) и `access` (роли, права, назначения, заявки, аудит). Регистрация принадлежит `auth`; `users` не знает ни о паролях, ни о токенах. Контракты backend: `/api/v1/auth/*`, `/api/v1/users/*`, `/api/v1/access/*`; `/users/me` и `/access/me` разделяют профиль и эффективный доступ.

Ключевые ограничения модели:

- **Нет универсального администратора.** Привилегированные роли `USER_ADMIN`, `ROLE_ADMIN`, `ACCESS_ADMIN`, `APPROVER`, `AUDITOR` попарно несовместимы (`findRoleConflict`, `MUTUALLY_EXCLUSIVE_ROLE_CODES`); `BASIC_USER` с ними не конфликтует. В демо-данных нет роли `SUPERADMIN` и ни одного пользователя со всеми правами.
- **Каталог прав неизменяем.** `PERMISSION_CATALOG` задан в коде, права не создаются через API, wildcard-ролей нет. Роли создаются и изменяются только через `AccessRequest`.
- **Разделение по отделам.** `RoleAssignment.scope` — `global` или `department:<id>`; `scopeAllows()` — только UX-проверка. `ACCESS_ADMIN` действует внутри своего отдела и не видит пользователей других отделов.
- **Двойной контроль.** Инициатор не может подписать свою заявку; самоназначение и самоотзыв роли запрещены. `AccessService` — демонстрационная реализация всех проверок; окончательное решение всегда принимает отдельный backend.
- **Гарды — только UX.** `authGuard` и `permissionGuard()` в `src/app/guards` скрывают маршруты, но не заменяют серверные проверки. Feature-слои работают только с `AUTH_API`, `USERS_API`, `ACCESS_API`.
- **Видимость и отказ — тоже UX.** Узлы `SidenavNode` несут `visibility.permission`; `SidenavService` фильтрует меню через `SIDENAV_VISIBILITY_CHECKER`, который в композиции подключён к `ACCESS_API`. Раздел Access помечен `alwaysVisible` как демонстрационное исключение и показывает все пункты. Отказ перехода открывает диалог через `AccessFeedbackService` и оставляет пользователя на текущей странице; отказ изменения показывает snackbar, не сбрасывая форму. Прямой переход без права всё равно завершается на `/forbidden`, но только после диалога.

Демо-входы (пароль любой): `anna@amk.local` → `BASIC_USER`, `boris@amk.local` → `USER_ADMIN` (hr), `victor@amk.local` → `ROLE_ADMIN` (finance), `access@amk.local` → `ACCESS_ADMIN` (it), `approver@amk.local` → `APPROVER`, `auditor@amk.local` → `AUDITOR`. Все страницы `/users/me`, `/users`, `/access/roles`, `/access/grants`, `/access/approvals`, `/access/audit` доступны с соответствующим входом; прямой переход без права после окна сообщения ведёт на `/forbidden`, а переход из приложения оставляет пользователя на текущей странице.

## Филиалы: RBAC + ABAC (ветка `feat/branch-scopes`)

Добавлен четвёртый домен `branches`: каталог филиалов (`domain-branches-{model,api,data-access}`) с плоской структурой и опциональным `parentId`. Иерархия используется только для дерева в UI: права от родителя **не наследуются**.

Разрешение на данные теперь двухмерное: `RoleAssignment.scope` задаёт отдел, а `RoleAssignment.branchScope` — `'all'` или явный список `BranchId`. Пункт «Все филиалы» — отдельное значение, а не wildcard. Проверка по набору филиалов использует **all-of**: доступ ко всем запрошенным филиалам; для фильтрации списков есть `visibleBranchIds()`. Изменение `branchScope` проходит через `AccessRequest` (`UPDATE_BRANCH_SCOPE`) и аудит; для чувствительных ролей `'all'` требует dual-control.

Маршрут `/access/branches` и feature `features-access-branches` показывают производную матрицу «нет прав / чтение / изменение» и проверку набора филиалов. Это UX-проекция политики, а не источник истины: итоговое решение принимает backend. Полный контракт для backend лежит вне репозитория: `../BACKEND_ACCESS_CONTRACT.md`.

У каждой lib есть цель `typecheck` (`tsc -p tsconfig.lib.json --noEmit`). Спеки вынесены в собственные цели `test` только у тех lib'ов, где они реально есть: `@angular/build:unit-test` падает, если include-паттерны не нашли ни одного файла. Target приложения запускает свои 7 спеков; остальные спеков запускают lib-проекты через свои `tsconfig.spec.json`. После K1 — 31 файл / 145 тестов на 38 проектов (37 lib + app); после ветки филиалов — 34 файла / 153 теста на 42 проекта (41 lib + app). Генератор `tools/new-lib.mjs` создаёт `test` и `tsconfig.spec.json` автоматически, если в новую lib перенесены спеки; иначе создаётся только `typecheck`.

Для компонентных тестов приложения и фич используется `provideTestApp()` из `@amk/shared-testing`: он подключает router/http, Transloco и дубли всех доменных API (`SIDENAV_API`, `PORTAL_API`, `ACCESSIBILITY_API`). Дубли не зависят от реализаций — никаких DOM-эффектов, localStorage и реального PortalService в тестах.

Классификация — по **роли**, а не по расположению папки. Angular-сервис (`@Injectable`) не может быть `type:util`; routable demo-страница не является `shared/ui`.

## Конвейер: создать lib и перенести код

Defaults генератора (`standalone`, `flat`, `skipModule`, `skipTests`, `style=none`, `unitTestRunner=none`, `linter=none`, `prefix=amk`) зафиксированы в `nx.json`. Рутину инкапсулирует `tools/new-lib.mjs`:

```bash
npm run lib -- \
  --name=shared-ui-logo \
  --dir=libs/shared/ui/logo \
  --tags=scope:shared,type:ui \
  --from=src/app/shared/components/logo
```

Скрипт за одну операцию:
1.Вызывает `nx g @nx/angular:library` с нужным `--importPath` (`@amk/<name>` по умолчанию) и тегами.
2.Удаляет сгенерированную заглушку компонента.
3.Переносит содержимое `--from` через `git mv` (история файлов сохраняется).
4.Собирает `src/index.ts` из реальных `.ts`-файлов, исключая spec/test.
5.Проставляет `prefix: amk` и цели `lint` (TS + HTML), `typecheck` (и `test`, если есть спеки).
6.Убирает из `tsconfig.lib.json` настройки эмиссии: lib не эмитируется, поэтому `outDir`/`declaration`/`rootDir` ему не нужны и только вызывают `TS6059` при импорте соседней lib.

После этого остаётся два ручных шага — они намеренно не автоматизируются, чтобы diff был reviewable:

- заменить импорты перенесённых файлов на `@amk/<name>`;
- проверить `nx graph` и `nx run-many -t lint,test,build --skip-nx-cache`.

Если `--from` не передан, создаётся пустая lib с `export {};` — файлы можно перенести отдельным `git mv` позже.

## Чек-лист выноса

1.Новая lib создана через `npm run lib` (не вручную), с тегами `scope:*` и `type:*`.
2.Импорт только через `@amk/...`.
3.Публичный API — только то, что реально нужно снаружи. 4.`nx graph` — нет лишних/циклических связей. 5.`nx run-many -t lint,test,build --skip-nx-cache` — зелёное.
6.Отдельный коммит на каждый шаг выноса, без продуктовых изменений.

## Заменяемость

-Зависеть от контракта (`domain/api`), а не от реализации (`data-access`).
-Реализация подключается провайдером; подмена — новый провайдер, без правок потребителей.
-UI получает данные через inputs/outputs/порт и не знает HTTP и маршруты домена.
\-`feature` не импортирует `feature`; общий код поднимается в `shared`/`domain/api`.
-Каждая feature отдаёт свои routes, приложение только подключает `loadChildren`.

## Проверки в CI

```bash
nx affected -t lint,test,build --base=origin/master --head=HEAD
```

`nx graph` смотреть на ревью крупных PR. Бюджет bundle после перевода features на lazy-загрузку перекалиброван: `initial` — warning `1MB`, error `1.25MB` (после K1 initial total — 951.89 kB, transfer 189.96 kB; после филиалов — 956.12 kB, transfer 190.64 kB; лимит предупреждения не превышен). Демо-страницы живут в `src/app/features/ui-kit-demo/*` и не становятся lib'ами: у них нет внешних потребителей и контракта.
