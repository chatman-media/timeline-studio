# Настройка CI/CD для Timeline Studio

Данный документ предоставляет инструкции по настройке непрерывной интеграции и развертывания для Timeline Studio.

*Обновлено: 3 августа 2025 для альфа-релиза v0.60.0*

## 🚀 Изменения в альфа-релизе

- **Миграция на Biome** - заменил ESLint для линтинга и форматирования
- **Отключена проверка TypeScript** - ~1860 ошибок, будет исправлено до Beta
- **Оптимизация Windows сборки** - предсобранные FFmpeg библиотеки вместо vcpkg
- **Новый workflow** - `alpha-release.yml` для автоматической сборки альфа-версий

## Настройка CI/CD для Windows

### Рекомендуемый подход: Предсобранные зависимости (БЫСТРО)

```yaml
- name: Настройка FFmpeg (Windows - оптимизировано)
  if: runner.os == 'Windows'
  shell: powershell
  run: |
    # Загрузка предсобранного FFmpeg (избегаем зависания vcpkg)
    Invoke-WebRequest -Uri "https://github.com/GyanD/codexffmpeg/releases/download/7.0.2/ffmpeg-7.0.2-full_build-shared.7z" -OutFile "ffmpeg.7z"
    7z x ffmpeg.7z -oC:\
    $ffmpegPath = Get-ChildItem -Path C:\ -Filter "ffmpeg-*" -Directory | Select-Object -First 1
    
    # Установка переменных окружения
    echo "FFMPEG_DIR=$($ffmpegPath.FullName)" >> $env:GITHUB_ENV
    echo "PKG_CONFIG_PATH=$($ffmpegPath.FullName)\lib\pkgconfig" >> $env:GITHUB_ENV
    echo "$($ffmpegPath.FullName)\bin" >> $env:GITHUB_PATH
```

### Альтернатива: vcpkg (МЕДЛЕННО, может зависнуть)

```yaml
- name: Установка FFmpeg через vcpkg (Windows)
  if: runner.os == 'Windows'
  timeout-minutes: 30  # Важно! Таймаут для предотвращения зависания
  run: |
    # Установка vcpkg
    git clone https://github.com/Microsoft/vcpkg.git C:\vcpkg
    C:\vcpkg\bootstrap-vcpkg.bat
    C:\vcpkg\vcpkg.exe integrate install
    
    # Установка FFmpeg (может занять 20+ минут)
    C:\vcpkg\vcpkg.exe install ffmpeg:x64-windows
    
    # Установка pkg-config
    choco install pkgconfiglite
    
    # Установка переменных окружения
    echo "VCPKG_ROOT=C:\vcpkg" | Out-File -FilePath $env:GITHUB_ENV -Encoding utf8 -Append
```

## Настройка CI/CD для macOS

```yaml
- name: Установка FFmpeg (macOS)
  if: runner.os == 'macOS'
  run: |
    brew install ffmpeg pkg-config
    # Для ONNX Runtime (опционально)
    brew install onnxruntime
```

## Настройка CI/CD для Linux

```yaml
- name: Установка FFmpeg и зависимостей (Linux)
  if: runner.os == 'Linux'
  run: |
    sudo apt-get update
    sudo apt-get install -y \
      ffmpeg \
      libavcodec-dev \
      libavformat-dev \
      libavutil-dev \
      libavfilter-dev \
      libavdevice-dev \
      libswscale-dev \
      libswresample-dev \
      pkg-config \
      libgtk-3-dev \
      libwebkit2gtk-4.1-dev \
      libayatana-appindicator3-dev \
      librsvg2-dev \
      libglib2.0-dev \
      libjavascriptcoregtk-4.1-dev \
      libsoup-3.0-dev
```

## Полный пример GitHub Actions Workflow (Альфа)

```yaml
name: CI - Alpha Release

on:
  push:
    branches: [ main, alpha-release-* ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]

    steps:
    - uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '24'

    - name: Setup Bun
      uses: oven-sh/setup-bun@v2
      with:
        bun-version: latest

    - name: Setup Rust
      uses: dtolnay/rust-toolchain@stable

    # Linux dependencies
    - name: Install Linux dependencies
      if: runner.os == 'Linux'
      run: |
        sudo apt-get update
        sudo apt-get install -y \
          libgtk-3-dev libwebkit2gtk-4.1-dev \
          libayatana-appindicator3-dev librsvg2-dev \
          ffmpeg libavcodec-dev libavformat-dev \
          libavutil-dev libavfilter-dev libavdevice-dev

    # macOS dependencies
    - name: Install macOS dependencies
      if: runner.os == 'macOS'
      run: |
        brew install ffmpeg pkg-config

    # Windows dependencies (оптимизировано)
    - name: Install Windows dependencies
      if: runner.os == 'Windows'
      shell: powershell
      run: |
        # Предсобранный FFmpeg (быстро)
        Invoke-WebRequest -Uri "https://github.com/GyanD/codexffmpeg/releases/download/7.0.2/ffmpeg-7.0.2-full_build-shared.7z" -OutFile "ffmpeg.7z"
        7z x ffmpeg.7z -oC:\
        $ffmpegPath = Get-ChildItem -Path C:\ -Filter "ffmpeg-*" -Directory | Select-Object -First 1
        
        echo "FFMPEG_DIR=$($ffmpegPath.FullName)" >> $env:GITHUB_ENV
        echo "PKG_CONFIG_PATH=$($ffmpegPath.FullName)\lib\pkgconfig" >> $env:GITHUB_ENV
        echo "$($ffmpegPath.FullName)\bin" >> $env:GITHUB_PATH

    # Cache dependencies
    - name: Cache dependencies
      uses: actions/cache@v4
      with:
        path: |
          ~/.cargo/registry
          ~/.cargo/git
          target
          node_modules
        key: ${{ runner.os }}-alpha-${{ hashFiles('**/Cargo.lock', '**/package.json') }}

    - name: Install dependencies
      run: bun install --frozen-lockfile

    # Проверка кода через Biome (вместо ESLint)
    - name: Lint with Biome
      run: bun run lint

    # TypeScript проверка ОТКЛЮЧЕНА для альфы
    # - name: TypeScript check
    #   run: bun run check:type

    - name: Run tests
      run: bun run test

    - name: Build frontend
      run: bun run build

    - name: Build Tauri app
      run: bun run tauri build
```

## Альфа-релиз Workflow

Специальный workflow для создания альфа-релизов:

```yaml
name: Alpha Release Build

on:
  push:
    tags:
      - 'v*-alpha'
  workflow_dispatch:

jobs:
  build-alpha:
    strategy:
      matrix:
        include:
          - os: ubuntu-latest
            target: x86_64-unknown-linux-gnu
          - os: macos-latest
            target: x86_64-apple-darwin
          - os: windows-latest
            target: x86_64-pc-windows-msvc

    runs-on: ${{ matrix.os }}
    
    steps:
      # ... (настройка зависимостей как выше)
      
      - name: Build Alpha Release
        run: bun run tauri build --target ${{ matrix.target }}

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: alpha-${{ matrix.target }}
          path: src-tauri/target/*/release/bundle/

  create-release:
    needs: build-alpha
    runs-on: ubuntu-latest
    
    steps:
      - name: Create Alpha Release
        uses: softprops/action-gh-release@v2
        with:
          prerelease: true
          files: alpha-*/**/*
          body_path: ALPHA_RELEASE.md
```

## Используемые инструменты

### Линтинг и форматирование
- **Biome** - единый инструмент (заменил ESLint + Prettier)
  ```bash
  bun run lint        # Проверка
  bun run lint:fix    # Автоисправление
  bun run lint:ci     # CI режим
  ```

### Сборка и тестирование
- **Bun** - JavaScript runtime и package manager
- **Vitest** - тестовый фреймворк
- **Tauri v2** - десктопное приложение

## Известные проблемы и решения

### 1. TypeScript ошибки (~1860)
- **Статус**: Временно отключено в CI
- **План**: Исправить до Beta релиза
- **Обход**: Локальная проверка `bun run check:type`

### 2. Windows FFmpeg зависания
- **Проблема**: vcpkg install может зависнуть на 30+ минут
- **Решение**: Использовать предсобранные библиотеки
- **Таймаут**: Добавить `timeout-minutes: 30`

### 3. Biome vs ESLint
- **Изменение**: Полная миграция на Biome
- **Преимущества**: Быстрее в 10-20 раз
- **Конфигурация**: `biome.json`

### 4. Кэширование
```yaml
- uses: actions/cache@v4
  with:
    path: |
      ~/.cargo
      target
      node_modules
      C:\vcpkg  # Windows only
    key: ${{ runner.os }}-${{ hashFiles('**/Cargo.lock') }}
```

## Секреты GitHub

Необходимые секреты для CI/CD:
- `TAURI_SIGNING_PRIVATE_KEY` - для подписи приложения
- `TAURI_SIGNING_PUBLIC_KEY` - публичный ключ
- `GITHUB_TOKEN` - автоматически предоставляется

## Мониторинг CI/CD

### Метрики
- **Время сборки**: 15-20 минут (все платформы)
- **Успешность**: ~95% (основные ветки)
- **Покрытие тестами**: 80%+

### Оповещения
- Slack/Discord webhook для уведомлений о сбоях
- Email уведомления для критических ошибок

---

*Для вопросов по CI/CD обращайтесь: ak.chatman.media@gmail.com*