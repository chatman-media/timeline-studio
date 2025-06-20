# Руководство по сборке Timeline Studio для Windows

Данное руководство предоставляет подробные инструкции по сборке Timeline Studio на Windows.

## Требования

### 1. Visual Studio 2022
- Установите Visual Studio 2022 со следующими рабочими нагрузками:
  - Разработка классических приложений на C++
  - Windows SDK (последняя версия)
  - MSVC v143 - VS 2022 C++ x64/x86 инструменты сборки

### 2. Rust
```powershell
# Установите Rust с https://rustup.rs/
# Убедитесь, что установлена MSVC toolchain
rustup default stable-msvc
```

### 3. Node.js и Bun
- Установите Node.js 18+ с https://nodejs.org/
- Установите Bun:
```powershell
powershell -c "irm bun.sh/install.ps1|iex"
```

### 4. Настройка FFmpeg (выберите один вариант)

#### Вариант A: Использование vcpkg (рекомендуется для CI/CD)
```powershell
# Клонируйте vcpkg
git clone https://github.com/Microsoft/vcpkg.git C:\vcpkg
cd C:\vcpkg

# Инициализация vcpkg
.\bootstrap-vcpkg.bat

# Интеграция с MSBuild/Visual Studio
.\vcpkg integrate install

# Установка FFmpeg
.\vcpkg install ffmpeg:x64-windows

# Установка переменной окружения
[System.Environment]::SetEnvironmentVariable("VCPKG_ROOT", "C:\vcpkg", "User")
```

#### Вариант B: Предсобранные библиотеки FFmpeg
1. Загрузите FFmpeg shared библиотеки с https://www.gyan.dev/ffmpeg/builds/
   - Выберите сборку "release full-shared"
2. Извлеките в `C:\ffmpeg`
3. Установите переменные окружения:
```powershell
[System.Environment]::SetEnvironmentVariable("FFMPEG_DIR", "C:\ffmpeg", "User")
[System.Environment]::SetEnvironmentVariable("PKG_CONFIG_PATH", "C:\ffmpeg\lib\pkgconfig", "User")
[System.Environment]::SetEnvironmentVariable("PATH", "$env:PATH;C:\ffmpeg\bin", "User")
```

### 5. pkg-config для Windows
```powershell
# Используя Chocolatey
choco install pkgconfiglite

# Или загрузите с http://ftp.gnome.org/pub/gnome/binaries/win32/dependencies/
# Извлеките и добавьте в PATH
```

### 6. ONNX Runtime (для функций распознавания)
```powershell
# Загрузите ONNX Runtime с https://github.com/microsoft/onnxruntime/releases
# Извлеките в C:\onnxruntime
# Установите переменную окружения
[System.Environment]::SetEnvironmentVariable("ORT_DYLIB_PATH", "C:\onnxruntime\lib\onnxruntime.dll", "User")
```

## Сборка Timeline Studio

### 1. Клонирование репозитория
```powershell
git clone https://github.com/chatman-media/timeline-studio.git
cd timeline-studio
```

### 2. Установка зависимостей
```powershell
bun install
```

### 3. Сборка приложения
```powershell
# Сборка для разработки
bun run tauri dev

# Продакшн сборка
bun run tauri build
```

## Устранение неполадок

### Ошибки сборки FFmpeg
Если возникают ошибки типа "Could not find ffmpeg with vcpkg", убедитесь что:
1. vcpkg правильно установлен и интегрирован
2. Переменные окружения установлены корректно
3. Перезапустили терминал/PowerShell после установки переменных окружения

### pkg-config не найден
Убедитесь, что pkg-config находится в вашем PATH:
```powershell
where pkg-config
# Должен вернуть путь к pkg-config.exe
```

### Проблемы с MSVC toolchain
Убедитесь, что используете правильную Rust toolchain:
```powershell
rustup show
# Должна показать stable-x86_64-pc-windows-msvc как default
```

## Конфигурация CI/CD

Для GitHub Actions или других CI систем используйте эти переменные окружения:
```yaml
env:
  VCPKG_ROOT: C:\vcpkg
  FFMPEG_DIR: C:\ffmpeg
  PKG_CONFIG_PATH: C:\ffmpeg\lib\pkgconfig
  ORT_DYLIB_PATH: C:\onnxruntime\lib\onnxruntime.dll
```

## Альтернатива: Использование MSYS2
Если вышеуказанные методы не работают, можете попробовать MSYS2:
```bash
# Установите MSYS2 с https://www.msys2.org/
# В терминале MSYS2:
pacman -S mingw-w64-x86_64-ffmpeg mingw-w64-x86_64-pkg-config
```

Затем соберите с GNU toolchain:
```powershell
rustup default stable-gnu
```