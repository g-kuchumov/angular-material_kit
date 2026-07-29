// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const eslintConfigPrettier = require('eslint-config-prettier');
const eslintPluginPrettier = require('eslint-plugin-prettier');

module.exports = (async () => {
  const rxjsXPlugin = await import('eslint-plugin-rxjs-x');
  const rxjsX = rxjsXPlugin.default || rxjsXPlugin;

  return tseslint.config(
    {
      files: ['**/*.ts'],
      extends: [
        eslint.configs.recommended,
        tseslint.configs.strict,
        tseslint.configs.stylistic,
        tseslint.configs.strictTypeChecked,
        tseslint.configs.stylisticTypeChecked,
        rxjsX.configs.recommended,
        angular.configs.tsRecommended,
      ],
      plugins: {
        prettier: eslintPluginPrettier, // Подключает Prettier как плагин ESLint
      },
      languageOptions: {
        parserOptions: {
          projectService: true, // Говорит TypeScript автоматически искать tsconfig.json
          tsconfigRootDir: __dirname, // Указывает на корневую папку проекта
        },
      },
      processor: angular.processInlineTemplates,
      rules: {
        '@angular-eslint/directive-selector': [
          'error',
          {
            type: 'attribute',
            prefix: 'amk',
            style: 'camelCase',
          },
        ],
        '@angular-eslint/component-selector': [
          'error',
          {
            type: 'element',
            prefix: 'amk',
            style: 'kebab-case',
          },
        ],

        // Обязывает указывать модификаторы для свойств и методов, но запрещает писать public для конструкторов.
        '@typescript-eslint/explicit-member-accessibility': [
          'error',
          {
            accessibility: 'explicit',
            overrides: {
              constructors: 'no-public',
            },
          },
        ],

        '@typescript-eslint/no-explicit-any': 'error', // Запрещает тип 'any'. Заставляет писать интерфейсы, чтобы не ломать строгую типизацию.
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }], // Запрещает неиспользуемые переменные. Игнорирует аргументы функций, только если они начинаются с '_'.
        '@angular-eslint/use-lifecycle-interface': 'error', // Обязывает писать 'implements OnInit/OnDestroy', если в классе объявлены одноименные методы.
        '@angular-eslint/no-output-on-prefix': 'error', // Запрещает префикс 'on' в именах @Output() (нельзя onClick), чтобы в HTML не было двойного синтаксиса (onClick)="...".
        '@angular-eslint/prefer-standalone': 'error', // Требует делать все компоненты, директивы и пайпы Standalone (standalone: true) по стандарту Angular 19-22+.
        eqeqeq: ['error', 'always'], // Запрещает нестрогое сравнение '=='. Заставляет использовать '===', защищая от багов приведения типов.
        'no-console': ['error', { allow: ['warn', 'error'] }], // Запрещает 'console.log' в продакшене. При этом оставляет возможность выводить важные 'warn' и 'error'.
        'no-debugger': 'error', // Категорически запрещает команду 'debugger', которая намертво вешает сайт у пользователя при открытой консоли.
        'no-duplicate-imports': 'error', // Запрещает разбивать импорты из одного и того же файла на несколько строк. Требует группировать их в одну.

        'no-eval': 'error', // Категорически запрещает использование 'eval()', защищая от выполнения вредоносного кода.
        'no-param-reassign': ['error', { props: true }], // Запрещает мутировать (перезаписывать) входные параметры функций и их свойства.
        'max-classes-per-file': ['error', 1], // Ограничивает количество классов в файле до одного (один файл — один компонент/сервис).
        '@typescript-eslint/no-require-imports': 'error', // Запрещает устаревший синтаксис 'require()' в TS файлах, требуя только 'import'.

        '@typescript-eslint/consistent-type-definitions': ['error', 'interface'], // Заставляет всегда использовать 'interface' вместо 'type' для описания объектов.
        '@typescript-eslint/no-misused-new': 'error', // Запрещает объявлять метод 'new' внутри интерфейсов или некорректно определять конструкторы.
        '@typescript-eslint/prefer-as-const': 'error', // Требует использовать 'as const' вместо явного перечисления литеральных типов, где это возможно.

        '@angular-eslint/prefer-host-metadata-property': 'error', // Запрещает использовать декораторы @HostBinding и @HostListener. Требует использовать свойство 'host' в декораторе @Component.
        '@angular-eslint/no-input-rename': 'error', // Запрещает переименовывать @Input() свойства (например, @Input('badName')), чтобы имя в TS и HTML совпадало.
        '@angular-eslint/no-output-rename': 'error', // Запрещает переименовывать @Output() свойства, сохраняя прозрачность событий в шаблонах.

        'prettier/prettier': 'error', // Выводит ошибки форматирования Prettier как ошибки ESLint

        indent: ['error', 2, { SwitchCase: 1 }], // Размер отступа — 2 пробела
        semi: ['error', 'always'], // Точка с запятой обязательна всегда
        curly: ['error', 'all'], // Фигурные скобки обязательны для всех блоков
        'brace-style': ['error', '1tbs', { allowSingleLine: true }], // Стиль скобок: открывающая на той же строке (1tbs), но можно писать всё в одну строку, если код короткий
        'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }], // Никаких лишних пустых строк: максимум 1 пустая строка подряд
        'keyword-spacing': ['error', { before: true, after: true }], // Пробелы вокруг ключевых слов
        'space-before-blocks': ['error', 'always'], // Пробел перед открывающей фигурной скобкой
        'object-curly-spacing': ['error', 'always'], // Пробелы внутри фигурных скобок
        'comma-dangle': [
          'error',
          {
            arrays: 'always-multiline', // В массивах ставим запятую, если каждый элемент на новой строке
            objects: 'always-multiline', // В объектах ставим запятую, если свойства на новых строках
            imports: 'never', // В импортах запятая в конце НЕ нужна
            exports: 'never', // В экспортах запятая в конце НЕ нужна
            functions: 'never', // В аргументах функций запятую в конце не ставим
          },
        ],
      },
    },
    {
      files: ['**/*.html'],
      extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
      rules: {
        '@angular-eslint/template/banana-in-box': 'error', // Запрещает перепутанный синтаксис ([ngModel]). Только [(ngModel)].
        '@angular-eslint/template/eqeqeq': ['error', { allowNullOrUndefined: true }], // Требует строгое сравнение === внутри HTML-шаблонов.
        '@angular-eslint/template/prefer-control-flow': 'error', // Запрещает устаревшие *ngIf и *ngFor, требуя новый синтаксис @if и @for
        '@angular-eslint/template/no-duplicate-attributes': 'error', // Запрещает дублировать одинаковые атрибуты (например, два тега class) в одном элементе
        '@angular-eslint/template/attributes-order': [
          'error',
          {
            alphabetical: false,
            order: [
              'STRUCTURAL_DIRECTIVE', // 1. Логика: *ngIf, *ngFor
              'TEMPLATE_REFERENCE', // 1. Ссылки на шаблон: #myInput
              'ATTRIBUTE_BINDING', // 2. Статические HTML-атрибуты: class, id, type, placeholder
              'INPUT_BINDING', // 3. Входящие свойства (Инпуты): [value], [disabled]
              'TWO_WAY_BINDING', // 4. Двусторонняя связь (Бананы в коробке): [(ngModel)]
              'OUTPUT_BINDING', // 5. Исходящие события (Аутпуты): (click), (submit)
            ],
          },
        ],
      },
    },
    eslintConfigPrettier,
  );
})();
