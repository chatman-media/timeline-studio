# Управление версиями

[← Назад к руководству разработчика](README.md)

## 📋 Содержание

- [Обзор системы версионирования](#обзор-системы-версионирования)
- [Семантическое версионирование](#семантическое-версионирование)
- [Автоматические релизы](#автоматические-релизы)
- [Changelog и заметки о релизе](#changelog-и-заметки-о-релизе)
- [Версионирование зависимостей](#версионирование-зависимостей)
- [Tauri версионирование](#tauri-версионирование)
- [Git теги и ветки](#git-теги-и-ветки)
- [CI/CD пайплайн](#cicd-пайплайн)

## 🎯 Обзор системы версионирования

Timeline Studio использует централизованную систему управления версиями:

```json
// package.json
{
  "name": "@timeline-studio/monorepo",
  "version": "0.53.0",
  "workspaces": [
    ".",
    "promo"
  ]
}
```

### Ключевые принципы

1. **Единая версия** - Все компоненты имеют одинаковую версию
2. **Семантическое версионирование** - Следуем спецификации SemVer
3. **Автоматические релизы** - Используем semantic-release
4. **Синхронизация** - Версии синхронизируются между:
   - `package.json`
   - `src-tauri/Cargo.toml`
   - `src-tauri/tauri.conf.json`

## 📊 Семантическое версионирование

### Формат версии

```
MAJOR.MINOR.PATCH

Например: 1.2.3
```

- **MAJOR** - Несовместимые изменения API
- **MINOR** - Новая функциональность (обратно совместимая)
- **PATCH** - Исправления багов (обратно совместимые)

### Примеры версий

```bash
# Патч релиз (исправление багов)
0.53.0 → 0.53.1

# Минорный релиз (новые функции)
0.53.1 → 0.54.0

# Мажорный релиз (breaking changes)
0.54.0 → 1.0.0
```

### Pre-release версии

```bash
# Alpha версии (ранняя разработка)
1.0.0-alpha.1
1.0.0-alpha.2

# Beta версии (тестирование)
1.0.0-beta.1
1.0.0-beta.2

# Release candidate (финальное тестирование)
1.0.0-rc.1
1.0.0-rc.2
```

## 🚀 Автоматические релизы

### Semantic Release конфигурация

```javascript
// .releaserc.js
module.exports = {
  branches: ['main'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',
    '@semantic-release/npm',
    '@semantic-release/github',
    [
      '@semantic-release/git',
      {
        assets: [
          'package.json',
          'CHANGELOG.md',
          'src-tauri/Cargo.toml',
          'src-tauri/tauri.conf.json'
        ],
        message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}'
      }
    ]
  ]
}
```

### Conventional Commits

Релизы основаны на типах коммитов:

| Тип коммита | Версия | Пример |
|-------------|--------|---------|
| `fix:` | PATCH | `fix: исправить краш при экспорте` |
| `feat:` | MINOR | `feat: добавить поддержку 8K видео` |
| `feat!:` или `BREAKING CHANGE:` | MAJOR | `feat!: изменить API плагинов` |
| `perf:` | PATCH | `perf: оптимизировать рендеринг` |
| `docs:` | Без релиза | `docs: обновить README` |
| `chore:` | Без релиза | `chore: обновить зависимости` |

### Автоматизация процесса

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    branches: [main]

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run semantic-release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
        run: npx semantic-release
```

## 📝 Changelog и заметки о релизе

### Автоматическая генерация

```markdown
# Changelog

## [0.53.0](https://github.com/org/repo/compare/v0.52.1...v0.53.0) (2024-07-31)

### Features

* обновить тарифную сетку Timeline Studio ([19cb154](https://github.com/org/repo/commit/19cb154))

### Bug Fixes

* исправить стили и перевести Pricing на английский ([4a57239](https://github.com/org/repo/commit/4a57239))
```

### Ручные заметки о релизе

```markdown
# Release Notes v1.0.0

## 🎉 Основные изменения

- Полностью переработан интерфейс Timeline
- Добавлена поддержка GPU ускорения
- Новые AI инструменты для автомонтажа

## 🚀 Новые функции

- **Multi-cam редактирование** - До 16 камер одновременно
- **Цветокоррекция** - Профессиональные инструменты
- **Экспорт в социальные сети** - Прямая публикация

## 🐛 Исправления

- Исправлен краш при импорте больших файлов
- Улучшена производительность рендеринга
- Исправлены проблемы с памятью

## 💔 Breaking Changes

- Изменен формат проектов (автоматическая миграция)
- Удалена поддержка Windows 7
- Минимальная версия macOS теперь 12.0
```

## 📦 Версионирование зависимостей

### Package.json зависимости

```json
{
  "dependencies": {
    // Точная версия
    "react": "19.0.0",
    
    // Минорные обновления
    "next": "^15.1.3",
    
    // Патч обновления
    "framer-motion": "~11.1.7",
    
    // Диапазон версий
    "@radix-ui/react-dialog": ">=1.0.0 <2.0.0",
    
    // Workspace протокол
    "@timeline-studio/ui": "workspace:*"
  }
}
```

### Cargo.toml зависимости

```toml
[dependencies]
# Точная версия
serde = "=1.0.193"

# Совместимые версии (по умолчанию)
tokio = "1.35"

# Минимальная версия
tauri = "2.2"

# Git зависимости
ffmpeg-next = { git = "https://github.com/org/ffmpeg-next", tag = "v6.0.0" }

# Локальные зависимости
timeline-core = { path = "../timeline-core" }
```

### Обновление зависимостей

```bash
# JavaScript зависимости
bunx npm-check-updates -u
bun install

# Rust зависимости
cd src-tauri
cargo update
cargo outdated

# Проверка уязвимостей
bun audit
cargo audit
```

## 🎨 Tauri версионирование

### Синхронизация версий

```javascript
// scripts/sync-versions.js
const fs = require('fs')
const path = require('path')

// Читаем версию из package.json
const packageJson = require('../package.json')
const version = packageJson.version

// Обновляем Cargo.toml
const cargoPath = path.join(__dirname, '../src-tauri/Cargo.toml')
let cargoContent = fs.readFileSync(cargoPath, 'utf8')
cargoContent = cargoContent.replace(
  /version = ".*"/,
  `version = "${version}"`
)
fs.writeFileSync(cargoPath, cargoContent)

// Обновляем tauri.conf.json
const tauriConfPath = path.join(__dirname, '../src-tauri/tauri.conf.json')
const tauriConf = require(tauriConfPath)
tauriConf.version = version
fs.writeFileSync(
  tauriConfPath,
  JSON.stringify(tauriConf, null, 2)
)
```

### Версия в приложении

```typescript
// src/lib/version.ts
import packageJson from '../../package.json'

export const APP_VERSION = packageJson.version

// Использование
import { APP_VERSION } from '@/lib/version'

export const AboutDialog = () => {
  return (
    <div>
      <h1>Timeline Studio</h1>
      <p>Версия: {APP_VERSION}</p>
    </div>
  )
}
```

```rust
// src-tauri/src/main.rs
use tauri::Manager;

#[tauri::command]
fn get_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

// В JavaScript
const version = await invoke('get_version')
```

## 🏷️ Git теги и ветки

### Стратегия веток

```
main
├── develop
├── feature/new-feature
├── fix/bug-fix
├── release/1.0.0
└── hotfix/critical-fix
```

### Создание тегов

```bash
# Автоматически через semantic-release
# Или вручную:

# Создать аннотированный тег
git tag -a v1.0.0 -m "Release version 1.0.0"

# Отправить тег
git push origin v1.0.0

# Отправить все теги
git push origin --tags
```

### Соглашения о тегах

- Всегда с префиксом `v` (например, `v1.0.0`)
- Аннотированные теги для релизов
- Легковесные теги для промежуточных версий

## 🔄 CI/CD пайплайн

### Release workflow

```yaml
# .github/workflows/build-release.yml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    strategy:
      matrix:
        platform: [macos-latest, ubuntu-latest, windows-latest]
        
    runs-on: ${{ matrix.platform }}
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup environment
        uses: ./.github/actions/setup
        
      - name: Build application
        run: bun run tauri build
        
      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: ${{ matrix.platform }}-build
          path: |
            src-tauri/target/release/bundle/
            
  release:
    needs: build
    runs-on: ubuntu-latest
    
    steps:
      - name: Download artifacts
        uses: actions/download-artifact@v4
        
      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          files: |
            *-build/**/*.dmg
            *-build/**/*.exe
            *-build/**/*.AppImage
            *-build/**/*.deb
          draft: false
          prerelease: false
          generate_release_notes: true
```

### Проверка версий

```bash
# Скрипт проверки версий
#!/bin/bash
# scripts/check-versions.sh

PACKAGE_VERSION=$(node -p "require('./package.json').version")
CARGO_VERSION=$(grep -oP 'version = "\K[^"]+' src-tauri/Cargo.toml | head -1)
TAURI_VERSION=$(node -p "require('./src-tauri/tauri.conf.json').version")

if [ "$PACKAGE_VERSION" != "$CARGO_VERSION" ] || [ "$PACKAGE_VERSION" != "$TAURI_VERSION" ]; then
  echo "❌ Version mismatch detected!"
  echo "package.json: $PACKAGE_VERSION"
  echo "Cargo.toml: $CARGO_VERSION"
  echo "tauri.conf.json: $TAURI_VERSION"
  exit 1
fi

echo "✅ All versions match: $PACKAGE_VERSION"
```

## 🛡️ Безопасность релизов

### Подписание кода

```toml
# tauri.conf.json
{
  "bundle": {
    "windows": {
      "certificateThumbprint": "$WINDOWS_CERT_THUMBPRINT",
      "digestAlgorithm": "sha256",
      "timestampUrl": "http://timestamp.digicert.com"
    },
    "macOS": {
      "identity": "$APPLE_IDENTITY",
      "providerShortName": "$APPLE_TEAM_ID"
    }
  }
}
```

### Автообновления

```rust
// src-tauri/src/updater.rs
use tauri::updater::builder;

pub fn check_for_updates(app: &tauri::App) {
    let updater = builder(app.handle())
        .endpoints(vec![
            "https://updates.timeline-studio.app/{{target}}/{{current_version}}"
        ])
        .build()
        .unwrap();
        
    if let Ok(update) = updater.check() {
        if update.is_update_available() {
            update.download_and_install().unwrap();
        }
    }
}
```

## 🎯 Лучшие практики

### 1. Подготовка к релизу

```bash
# Чеклист перед релизом
- [ ] Все тесты проходят
- [ ] Документация обновлена
- [ ] CHANGELOG актуален
- [ ] Версии синхронизированы
- [ ] Нет критических issues
- [ ] Performance тесты пройдены
```

### 2. Версионирование функций

```typescript
// Флаги функций для постепенного внедрения
export const FEATURE_FLAGS = {
  NEW_TIMELINE: process.env.NEXT_PUBLIC_NEW_TIMELINE === 'true',
  GPU_ACCELERATION: compareVersions(APP_VERSION, '0.50.0') >= 0,
  AI_TOOLS: compareVersions(APP_VERSION, '0.52.0') >= 0
}
```

### 3. Миграции

```typescript
// src/migrations/index.ts
export const migrations = [
  {
    version: '0.50.0',
    migrate: async (project: Project) => {
      // Миграция формата проекта
      return migrateToV050(project)
    }
  },
  {
    version: '0.52.0',
    migrate: async (project: Project) => {
      // Добавление новых полей
      return migrateToV052(project)
    }
  }
]
```

## 📚 Дополнительные ресурсы

- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Release](https://semantic-release.gitbook.io/)
- [Tauri Updater](https://tauri.app/v2/guides/updates/)

---

[← Назад к руководству разработчика](README.md) | [Далее: Внесение изменений →](contributing.md)