#!/usr/bin/env node
/**
 * Конвейер создания не-buildable Nx-библиотеки.
 *
 * Делает одной командой то, что иначе делается вручную после каждого `nx g`:
 *   1. генерирует lib с фиксированными флагами (см. defaults в nx.json);
 *   2. удаляет сгенерированную заглушку компонента;
 *   3. переносит файлы из --from в src/lib (через git mv, история сохраняется);
 *   4. собирает index.ts только из реальных .ts-файлов (публичный API);
 *   5. ставит prefix=amk и цели lint/typecheck в project.json (test — только
 *      если среди перенесённых файлов есть спеки);
 *   6. убирает из tsconfig.lib.json настройки эмиссии — lib не эмитируется,
 *      поэтому rootDir/declaration/outDir ему не нужны (и не дают TS6059).
 *
 * Импорты в исходниках после переноса нужно заменить на @amk/<name> вручную
 * (или адресным sed) — так переход остаётся reviewable.
 *
 * Пример:
 *   npm run lib -- --name=shared-ui-logo --dir=libs/shared/ui/logo \
 *     --tags=scope:shared,type:ui --from=src/app/shared/components/logo
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const raw = {};
for (const arg of process.argv.slice(2)) {
  if (!arg.startsWith('--')) continue;
  const [key, ...rest] = arg.slice(2).split('=');
  raw[key] = rest.length ? rest.join('=') : true;
}

const fail = (message) => {
  console.error(`[new-lib] ${message}`);
  process.exit(1);
};

for (const key of ['name', 'dir', 'tags']) {
  if (!raw[key] || raw[key] === true) fail(`--${key} обязателен`);
}

const name = raw.name;
const dir = String(raw.dir).replace(/^\.\//, '').replace(/\/$/, '');
const importPath = raw.importPath || `@amk/${name}`;
const tags = raw.tags;
const from = raw.from ? path.resolve(String(raw.from)) : null;
const libRoot = path.resolve(process.cwd(), dir);
const libSrc = path.join(libRoot, 'src');
const libInternal = path.join(libSrc, 'lib');

if (existsSync(libRoot)) fail(`каталог уже существует: ${dir}`);

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const generation = spawnSync(
  npx,
  [
    '--no-install',
    'nx',
    'g',
    '@nx/angular:library',
    `--name=${name}`,
    `--directory=${dir}`,
    `--importPath=${importPath}`,
    `--tags=${tags}`,
    '--standalone',
    '--flat',
    '--skipModule',
    '--skipTests',
    '--style=none',
    '--unitTestRunner=none',
    '--linter=none',
    '--interactive=false',
  ],
  { stdio: 'inherit' },
);
if (generation.status !== 0) process.exit(generation.status ?? 1);

rmSync(libInternal, { recursive: true, force: true });
mkdirSync(libInternal, { recursive: true });

if (from) {
  if (!existsSync(from)) fail(`--from не найден: ${from}`);
  for (const entry of readdirSync(from)) {
    const source = path.join(from, entry);
    const target = path.join(libInternal, entry);
    if (existsSync(target)) fail(`цель уже существует: ${target}`);
    const move = spawnSync('git', ['mv', source, target], { stdio: 'inherit' });
    if (move.status !== 0) process.exit(move.status ?? 1);
  }
}

const internalFiles = readdirSync(libInternal);
const publicFiles = internalFiles.filter((file) => file.endsWith('.ts') && !/\.(spec|test)\.ts$/.test(file)).sort();
const specFiles = internalFiles.filter((file) => /\.(spec|test)\.ts$/.test(file));
const index =
  publicFiles.length > 0
    ? `${publicFiles.map((file) => `export * from './lib/${file.slice(0, -3)}';`).join('\n')}\n`
    : 'export {};\n';
writeFileSync(path.join(libSrc, 'index.ts'), index);

const projectPath = path.join(libRoot, 'project.json');
const project = JSON.parse(readFileSync(projectPath, 'utf8'));
project.prefix = 'amk';
delete project['// targets'];
project.targets = {
  ...(project.targets ?? {}),
  lint: {
    executor: '@angular-eslint/builder:lint',
    options: { lintFilePatterns: [`${dir}/src/**/*.ts`, `${dir}/src/**/*.html`] },
  },
  typecheck: {
    executor: 'nx:run-commands',
    options: { command: `tsc -p ${dir}/tsconfig.lib.json --noEmit` },
  },
};
if (specFiles.length > 0) {
  project.targets.test = {
    executor: '@angular/build:unit-test',
    options: {
      buildTarget: 'angular-material_kit:build:development',
      tsConfig: `${dir}/tsconfig.spec.json`,
      include: ['**/*.spec.ts', '**/*.test.ts'],
    },
  };
}
writeFileSync(projectPath, `${JSON.stringify(project, null, 2)}\n`);

const tsconfigPath = path.join(libRoot, 'tsconfig.lib.json');
const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf8'));
for (const option of ['outDir', 'rootDir', 'declaration', 'declarationMap', 'inlineSources']) {
  delete tsconfig.compilerOptions[option];
}
writeFileSync(tsconfigPath, `${JSON.stringify(tsconfig, null, 2)}\n`);

if (specFiles.length > 0) {
  writeFileSync(
    path.join(libRoot, 'tsconfig.spec.json'),
    `${JSON.stringify(
      {
        extends: './tsconfig.json',
        compilerOptions: { types: ['vitest/globals'] },
        include: ['**/*.spec.ts', '**/*.test.ts'],
      },
      null,
      2,
    )}\n`,
  );
}

console.log(`\n[new-lib] ${name} -> ${dir} (${importPath})`);
if (publicFiles.length > 0) {
  console.log(`[new-lib] public API: ${publicFiles.join(', ')}`);
}
console.log('[new-lib] замени импорты на @amk/<name> и проверь: nx graph && nx run-many -t lint,test,build');
