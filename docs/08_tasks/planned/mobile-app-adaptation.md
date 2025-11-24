# Мобильное приложение Timeline Studio на Tauri

## Обзор
Адаптация существующего Tauri приложения Timeline Studio для мобильных платформ iOS и Android. Tauri v2 уже поддерживает мобильные платформы, что делает процесс относительно простым.

## Цели
- Адаптировать существующее Tauri приложение для iOS и Android
- Минимальные изменения в коде - в основном CSS адаптация
- Переиспользовать 95% существующего кода
- Сохранить все функции десктопной версии

## Технический стек (уже есть!)

### Что уже работает
- **Frontend**: Next.js + React - полностью переиспользуется
- **Backend**: Rust через Tauri - работает на мобильных
- **FFmpeg**: Нужны мобильные сборки (Tauri поможет)
- **UI**: shadcn/ui + Tailwind CSS - нужна адаптация стилей

### Что нужно добавить
- **iOS**: Настроить Tauri iOS target
- **Android**: Настроить Tauri Android target
- **Стили**: Адаптивные CSS для мобильных экранов
- **Жесты**: Touch события вместо mouse

## Простые шаги для мобильной версии

### 1. Настройка Tauri для мобильных платформ
```bash
# Добавить мобильные таргеты
cargo tauri ios init
cargo tauri android init

# Проверить зависимости
cargo tauri ios dev       # Запуск на iOS
cargo tauri android dev   # Запуск на Android
```

### 2. Что уже будет работать из коробки
- ✅ Все React компоненты
- ✅ XState машины состояний
- ✅ Rust backend функции
- ✅ Tauri команды и IPC
- ✅ Большинство UI компонентов

### 3. Минимальные изменения CSS

```css
/* Адаптация существующих компонентов */
@media (max-width: 768px) {
  /* Timeline - горизонтальный скролл */
  .timeline-container {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  /* Боковые панели - скрыть или сделать модальными */
  .sidebar {
    position: fixed;
    transform: translateX(-100%);
  }
  
  /* Кнопки - увеличить для touch */
  .btn {
    min-height: 44px; /* iOS guideline */
    min-width: 44px;
  }
}
```

### 4. Touch события (минимальные изменения)
```typescript
// Добавить в существующие компоненты
const isMobile = window.matchMedia('(max-width: 768px)').matches;

// Использовать существующие обработчики
onMouseDown={!isMobile ? handleMouseDown : undefined}
onTouchStart={isMobile ? handleTouchStart : undefined}
```

## Что нужно адаптировать

### 1. FFmpeg для мобильных платформ
```toml
# Cargo.toml - добавить условную компиляцию
[target.'cfg(target_os = "ios")'.dependencies]
ffmpeg-next = { version = "6.0", features = ["build"] }

[target.'cfg(target_os = "android")'.dependencies]
ffmpeg-next = { version = "6.0", features = ["build"] }
```

### 2. Файловая система
```rust
// Использовать Tauri API для мобильных путей
#[cfg(mobile)]
let documents_dir = app.path_resolver().app_documents_dir()?;

#[cfg(not(mobile))]
let documents_dir = app.path_resolver().app_data_dir()?;
```

### 3. Разрешения
```xml
<!-- iOS Info.plist -->
<key>NSPhotoLibraryUsageDescription</key>
<string>Для импорта видео из галереи</string>
<key>NSCameraUsageDescription</key>
<string>Для записи видео</string>

<!-- Android AndroidManifest.xml -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.CAMERA" />
```

## Простой план разработки

### Неделя 1-2: Базовая настройка
```bash
# 1. Обновить Tauri до v2
cargo install tauri-cli --version "^2.0.0"

# 2. Инициализировать мобильные проекты
cargo tauri ios init
cargo tauri android init

# 3. Установить зависимости
# iOS: Xcode
# Android: Android Studio
```

### Неделя 3-4: UI адаптация
- [ ] Добавить медиа-запросы в globals.css
- [ ] Адаптировать Timeline для touch
- [ ] Сделать модальные окна полноэкранными на мобильных
- [ ] Увеличить размеры кнопок для touch

### Неделя 5-6: Тестирование и оптимизация
- [ ] Тестировать на реальных устройствах
- [ ] Оптимизировать производительность
- [ ] Исправить специфичные для платформ баги

### Неделя 7-8: Подготовка к релизу
- [ ] Настроить CI/CD для мобильных сборок
- [ ] Подготовить assets (иконки, splash screens)
- [ ] Создать store listings

## Примеры кода адаптации

### Адаптивный Timeline
```tsx
// src/features/timeline/components/timeline.tsx
const Timeline = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  return (
    <div className={cn(
      "timeline-container",
      isMobile && "timeline-mobile"
    )}>
      {/* Существующий код timeline */}
    </div>
  );
};
```

### Мобильная навигация
```tsx
// src/components/layout/mobile-nav.tsx
const MobileNav = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        {/* Навигация */}
      </SheetContent>
    </Sheet>
  );
};
```

## GitHub Actions для мобильных сборок

```yaml
# .github/workflows/mobile-build.yml
name: Mobile Build

on:
  push:
    branches: [main]

jobs:
  ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup
        run: |
          rustup target add aarch64-apple-ios
          cargo install tauri-cli
      - name: Build iOS
        run: cargo tauri ios build

  android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup
        run: |
          rustup target add aarch64-linux-android
          cargo install tauri-cli
      - name: Build Android
        run: cargo tauri android build
```

## Преимущества Tauri подхода

1. **Один код для всех платформ** - 95% переиспользование
2. **Нативная производительность** - Rust backend
3. **Маленький размер** - ~30-50MB вместо 150MB+
4. **Безопасность** - изоляция процессов Tauri
5. **Простота поддержки** - один codebase

## Реальная оценка времени

- **2 недели**: Базовая рабочая версия
- **1 месяц**: Оптимизированный UI/UX
- **2 месяца**: Production-ready с магазинами

Это реально сделать одному разработчику благодаря Tauri v2!