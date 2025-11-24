# Развертывание

## 📋 Содержание

Этот раздел содержит документацию по сборке и развертыванию Timeline Studio.

### 🏗️ Сборка приложения
- [**build-guide.md**](build-guide.md) - Руководство по сборке приложения для всех платформ

### 🔐 Настройка OAuth
- [**oauth-setup.md**](oauth-setup.md) - Настройка OAuth авторизации для социальных сетей

### 💻 Платформы
- [**platforms/windows.md**](platforms/windows.md) - Специфика сборки для Windows

## 🚀 Процесс развертывания

### 1. Подготовка к сборке

```bash
# Установка зависимостей
bun install

# Проверка конфигурации
bun run check:all

# Сборка фронтенда
bun run build
```

### 2. Сборка для платформ

#### macOS
```bash
bun run tauri build --target universal-apple-darwin
```

#### Windows
```bash
bun run tauri build --target x86_64-pc-windows-msvc
```

#### Linux
```bash
bun run tauri build --target x86_64-unknown-linux-gnu
```

### 3. Подписание и нотаризация

- **macOS**: Требуется Apple Developer сертификат
- **Windows**: Требуется сертификат для подписи кода
- **Linux**: AppImage автоматически готов к распространению

## 📦 Форматы дистрибутивов

### macOS
- `.dmg` - Disk Image для установки
- `.app` - Приложение bundle

### Windows
- `.msi` - Windows Installer
- `.exe` - Portable версия

### Linux
- `.AppImage` - Универсальный формат
- `.deb` - Для Debian/Ubuntu
- `.rpm` - Для Fedora/RHEL

## 🔧 Конфигурация

### Переменные окружения
```env
# Сборка
TAURI_PRIVATE_KEY=path/to/key
TAURI_KEY_PASSWORD=password

# Подписание
APPLE_ID=your@email.com
APPLE_PASSWORD=app-specific-password
APPLE_TEAM_ID=XXXXXXXXXX

# Windows
WINDOWS_CERTIFICATE=path/to/cert.pfx
WINDOWS_CERTIFICATE_PASSWORD=password
```

## 🌐 Распространение

### Официальные каналы
- GitHub Releases
- Официальный сайт
- Магазины приложений (планируется)

### Автообновление
- Встроенный механизм обновлений
- Дельта-обновления для экономии трафика
- Откат в случае ошибки

## 🔗 Связанные разделы

- [CI/CD](../13_ci_cd/) - Непрерывная интеграция и доставка
- [Разработка](../05_development/) - Руководство разработчика
- [Тестирование](../12_testing/) - Процессы тестирования

---

*Последнее обновление: 31 июля 2025*