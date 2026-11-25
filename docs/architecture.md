# Архитектура и конвейер выноса в библиотеки

## Принцип

Приложение остаётся тонкой композицией. Вся переиспользуемая логика живёт в Nx-библиотеках с узким публичным API (`src/index.ts`). Зависимости между lib'ами идут **только** через `@amk/*`, относительные кросс-проектные импорты запрещены ESLint-правилом `@nx/enforce-module-boundaries`.

Библиотеки **не buildable**: приложение компилирует их исходники напрямую через `paths` в `tsconfig.base.json`. Это даёт быстрый вынос без ng-packagr и отдельного build-оркестратора. Цена — граница существует на уровне исходников и контролируется ESLint, а не package.json. Если позже понадобится заменяемость на уровне пакетов, lib'ы переводятся в buildable с импортом из `dist`.

## Слои и теги

Матрица разрешённых зависимостей задана в `eslint.config.js` (`depConstraints`) и является единственным источником истины. Кратко:

| Тег                | Назначение                            | Может зависеть от                                                |
| ------------------ | ------------------------------------- | ---------------------------------------------------------------- |
| `type:app`         | композиция приложения                 | feature, core, data-access, domain-api, ui, util, model, testing |
| `type:feature`     | routable-фичи                         | ui, data-access, domain-api, util, model                         |
| `type:data-access` | реализация портов, API                | domain-api, core, util, model                                    |
| `type:domain-api`  | контракты, типы, токены               | model, util                                                      |
| `type:ui`          | презентационные компоненты и оболочка | ui, core, domain-api, util, model                                |
| `type:core`        | инфраструктура, сервисы Angular       | core, util, model                                                |
| `type:util`        | чистые функции/классы                 | util, model                                                      |
| `type:model`       | только типы                           | model                                                            |
| `type:testing`     | тестовые провайдеры/моки              | все слои                                                         |

Дополнительные запреты внешних импортов: `util`/`model` не могут импортировать `@angular/*`, `domain-api` — `@angular/material`, `@angular/forms`, `@angular/common/http`, `@ngneat/transloco`, `ui` — `@angular/common/http`. `type:testing` разрешён как зависимость всем слоям: это тестовый провайдер, а не продуктовая связь. `type:ui` дополнительно может зависеть от `type:core`: оболочка пока пользуется инфраструктурным `portal` и `core-ui`. HTTP для UI остаётся запрещён. Навигация уже вынесена из `core` в `domain/navigation`: оболочка (`sidenav`, `toolbar`, `breadcrumbs`) зависит только от `SIDENAV_API` (`type:domain-api`), реализация подключается композицией через `provideSidenav()`. Когда `portal` тоже получит контракт, зависимость `type:ui -> type:core` можно будет убрать из `depConstraints`.

Спеки перенесённых lib'ов продолжает запускать единый target приложения. В `project.json` для него задан `include: ["**/*.spec.ts", "../libs/**/*.spec.ts"]`: glob'ы `@angular/build:unit-test` резолвятся относительно `sourceRoot` приложения (`src`), поэтому `../libs` — это корневая папка `libs`. Без второго паттерна спеки lib'ов молча перестают выполняться.

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
5.Проставляет `prefix: amk` и target `lint`.
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

`nx graph` смотреть на ревью крупных PR. Бюджет bundle после перевода features на lazy-загрузку перекалиброван: `initial` — warning `1MB`, error `1.25MB` (factual initial total — 930.97 kB). Демо-страницы живут в `src/app/features/ui-kit-demo/*` и не становятся lib'ами: у них нет внешних потребителей и контракта.
