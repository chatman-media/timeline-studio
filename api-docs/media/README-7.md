# 06. Развертывание Timeline Studio

[← Назад к оглавлению](../README.md)

## 📋 Содержание

- [Процесс сборки](build.md)
- [Настройка Codecov](codecov-setup.md)
- [Платформы](#платформы)
  - [Windows](platforms/windows.md)
  - [macOS](platforms/macos.md)
  - [Linux](platforms/linux.md)
- [Решение проблем](troubleshooting.md)

## 🎯 Обзор

Timeline Studio поддерживает сборку для всех основных десктопных платформ. Каждая платформа имеет свои особенности сборки, подписания и распространения.

## 🚀 Быстрая сборка

### Универсальная команда

```bash
# Сборка для текущей платформы
bun run tauri build

# Сборка с определенными функциями
bun run tauri build -- --features gpu-acceleration,ml-recognition
```

### Результаты сборки

```
src-tauri/target/release/
├── bundle/
│   ├── dmg/          # macOS installer
│   ├── msi/          # Windows installer
│   ├── deb/          # Debian package
│   └── appimage/     # AppImage
└── timeline-studio   # Исполняемый файл
```

## 🖥️ Платформы

### Windows
- **Форматы**: MSI, NSIS, Portable
- **Подписание**: Authenticode сертификат
- **Зависимости**: Visual C++ Redistributable
- [Подробное руководство →](platforms/windows.md)

### macOS
- **Форматы**: DMG, App Bundle
- **Подписание**: Developer ID сертификат
- **Нотаризация**: Обязательна для распространения
- [Подробное руководство →](platforms/macos.md)

### Linux
- **Форматы**: AppImage, DEB, RPM, Snap
- **Зависимости**: Различаются по дистрибутивам
- **Песочница**: Flatpak поддержка
- [Подробное руководство →](platforms/linux.md)

## 📦 Конфигурация сборки

### tauri.conf.json

```json
{
  "bundle": {
    "active": true,
    "targets": ["dmg", "msi", "deb", "appimage"],
    "identifier": "com.timeline.studio",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ],
    "resources": [
      "models/*",
      "assets/*"
    ]
  }
}
```

### Оптимизация размера

```toml
# Cargo.toml
[profile.release]
opt-level = "z"     # Оптимизация по размеру
lto = true          # Link Time Optimization
codegen-units = 1   # Один модуль компиляции
strip = true        # Удаление символов отладки
```

## 🔐 Подписание и безопасность

### Подписание кода

1. **Windows**: Authenticode сертификат
2. **macOS**: Developer ID + нотаризация
3. **Linux**: GPG подписи для репозиториев

### Обновления

```typescript
// Автоматические обновления через Tauri
import { checkUpdate, installUpdate } from '@tauri-apps/api/updater'

async function checkForUpdates() {
  const update = await checkUpdate()
  if (update.shouldUpdate) {
    await installUpdate()
  }
}
```

## 🚢 CI/CD Pipeline

### GitHub Actions пример

```yaml
name: Release
on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    strategy:
      matrix:
        platform: [macos-latest, ubuntu-latest, windows-latest]
    
    runs-on: ${{ matrix.platform }}
    
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - uses: oven-sh/setup-bun@v1
      
      - name: Install dependencies
        run: bun install
        
      - name: Build
        run: bun run tauri build
        
      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: ${{ matrix.platform }}
          path: src-tauri/target/release/bundle/
```

## 📊 Метрики сборки

### Размеры приложения (примерные)

| Платформа | Размер установщика | Размер установленного |
|-----------|-------------------|-----------------------|
| Windows   | ~80 MB            | ~250 MB               |
| macOS     | ~90 MB            | ~280 MB               |
| Linux     | ~85 MB            | ~260 MB               |

### Время сборки

- **Первая сборка**: 10-15 минут
- **Инкрементальная**: 2-3 минуты
- **CI/CD**: 15-20 минут полный цикл

## 🔧 Оптимизации

### 1. Разделение кода (Code Splitting)

```typescript
// Ленивая загрузка тяжелых модулей
const RecognitionModule = lazy(() => import('@/features/recognition'))
const EffectsModule = lazy(() => import('@/features/effects'))
```

### 2. Сжатие ресурсов

```bash
# Оптимизация изображений
pngquant icons/*.png --ext=.png --force

# Сжатие ML моделей
gzip -9 models/*.onnx
```

### 3. Выборочные функции

```toml
# Cargo.toml
[features]
default = ["basic"]
basic = []
gpu-acceleration = ["dep:cuda"]
ml-recognition = ["dep:ort"]
full = ["gpu-acceleration", "ml-recognition"]
```

## 🚨 Частые проблемы

### "Missing dependencies" на Linux
```bash
# Установка зависимостей
sudo apt install libgtk-3-dev libwebkit2gtk-4.1-dev
```

### "Code signing failed" на macOS
- Проверьте срок действия сертификата
- Убедитесь в правильности keychain access

### "Build failed" на Windows
- Установите Visual Studio Build Tools
- Проверьте переменные окружения

## 📋 Чеклист перед релизом

- [ ] Обновлена версия в `package.json` и `Cargo.toml`
- [ ] Все тесты проходят успешно
- [ ] Нет критических TODO в коде
- [ ] Обновлен CHANGELOG.md
- [ ] Проверена работа на всех платформах
- [ ] Подписан код для каждой платформы
- [ ] Подготовлены release notes

## 🔗 Дополнительные ресурсы

- [Tauri Building Guide](https://tauri.app/v2/guides/building/)
- [Electron Forge](https://www.electronforge.io/) (для сравнения)
- [Code Signing Guide](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)

---

[← Разработка](../05-development/README.md) | [Далее: Процесс сборки →](build.md)