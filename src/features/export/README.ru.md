# Export / Экспорт

[English](./README.md) | **Русский**

## Обзор

Комплексная система экспорта видео с профессиональными пресетами, интеграцией социальных сетей (YouTube, TikTok, Vimeo, Telegram), пакетным экспортом и экспортом секций. Включает 4-вкладочный интерфейс, похожий на DaVinci Resolve, с кодеками H.264/H.265/ProRes, OAuth авторизацией и управлением очередью рендеринга.

## Статус

- ✅ **Компоненты**: 6/6 реализовано (ExportModal, LocalExportTab, SocialExportTab, BatchExportTab, SectionExportTab, DetailedExportInterface)
- ✅ **Хуки**: 3/3 реализовано (useExportSettings, useSocialExport, useRenderQueue)
- ✅ **Сервисы**: 3/3 реализовано (OAuthService, SocialNetworksService, SecureTokenStorage)
- ✅ **Тесты**: 40+ тестов проходят (~90% покрытие)
- ✅ **Статус**: Готов к продакшену - 95% завершено

## Структура

```
export/
├── components/
│   ├── export-modal.tsx
│   ├── export-presets.tsx
│   ├── detailed-export-interface.tsx
│   ├── social-export-tab.tsx
│   ├── batch-export-tab.tsx
│   └── section-export-tab.tsx
├── hooks/
│   ├── use-export-settings.ts
│   ├── use-social-export.ts
│   └── use-render-queue.ts
├── services/
│   ├── social-networks-service.ts
│   ├── oauth-service.ts
│   └── secure-token-storage.ts
├── constants/
│   └── export-constants.ts
├── types/
│   └── export-types.ts
├── utils/
│   └── preset-configs.ts
└── __tests__/
```

## Возможности

### ✅ Реализовано

**Локальный экспорт**
- [x] Профессиональный интерфейс экспорта (4 вкладки как в DaVinci Resolve)
- [x] Пресеты экспорта (H.264 Master, H.265, ProRes, HyperDeck и др.)
- [x] Настройки качества (Custom, Good, Best с автоматическим битрейтом)
- [x] Выбор разрешения (720p, 1080p, 1440p, 4K, Timeline)
- [x] Выбор FPS (24, 25, 30, 60 fps, Timeline)
- [x] Поддержка форматов (MP4, MOV, WebM, QuickTime)
- [x] Поддержка кодеков (H.264, H.265/HEVC, ProRes, VP8, VP9)
- [x] Поддержка GPU ускорения
- [x] Отслеживание прогресса экспорта

**Интеграция с социальными сетями**
- [x] YouTube - OAuth 2.0 интеграция, оптимизированные настройки
- [x] TikTok - Вертикальные форматы, прямая загрузка
- [x] Vimeo - Высокое качество, профессиональные настройки
- [x] Telegram - Bot API, оптимизация размера файлов

**Пакетный экспорт**
- [x] Множественный экспорт проектов через очередь рендеринга
- [x] Управление очередью (добавление, отмена, статистика)
- [x] Оптимизация параллельного рендеринга
- [x] Отчеты об экспорте с детальной статистикой

**Экспорт секций**
- [x] По маркерам - автоматическое разделение между маркерами
- [x] По клипам - экспорт каждого клипа отдельно
- [x] Ручные диапазоны - произвольные временные диапазоны
- [x] Пресеты качества (Превью/Черновик/Финал)
- [x] Индивидуальные названия файлов

**Расширенные возможности**
- [x] OAuth интеграция для всех социальных платформ
- [x] Безопасное хранение токенов
- [x] Интеграция с очередью рендеринга
- [x] Полная интернационализация (15 языков)
- [x] Профессиональные форматы (ProRes, H.264/H.265 Master)

### ❌ Не реализовано

- [ ] Расширенные настройки экспорта аудио (частично готово)
- [ ] Опции наложения таймкода

## Использование

### Базовый экспорт

```typescript
import { ExportModal } from '@/features/export'

function App() {
  return <ExportModal />
}
```

### Пресеты экспорта

```typescript
import { ExportPresets, EXPORT_PRESETS } from '@/features/export'

function MyExportUI() {
  const [selectedPreset, setSelectedPreset] = useState('custom')

  return (
    <ExportPresets
      selectedPresetId={selectedPreset}
      onSelectPreset={(preset) => {
        setSelectedPreset(preset.id)
        // Применить настройки пресета
      }}
    />
  )
}
```

### Хук настроек экспорта

```typescript
import { useExportSettings } from '@/features/export'

const {
  getCurrentSettings,   // Получить текущие настройки
  updateSettings,       // Обновить настройки
  handleChooseFolder,   // Выбрать папку сохранения
  getExportConfig      // Получить конфигурацию рендеринга
} = useExportSettings()
```

### Экспорт в социальные сети

```typescript
import { useSocialExport } from '@/features/export'

const {
  authorize,           // OAuth авторизация
  uploadVideo,        // Загрузка на платформу
  isAuthorized       // Проверка статуса авторизации
} = useSocialExport('youtube')
```

## Интеграция

- **Зависит от**: `@/features/timeline`, `@/domains/video-compiler`
- **Используется в**: `@/features/media-studio`

## Тестирование

- **Всего тестов**: 40+
- **Покрытие**: ~90%
  - ExportModal: 21 тест
  - LocalExportTab: 14 тестов
  - useExportSettings: 7 тестов
  - Сервисы: 59 тестов (OAuth, Social Networks, TikTok)
  - Константы: 18 тестов
- **Запуск тестов**: `bun test src/features/export`

## Пресеты экспорта

### Профессиональные пресеты
- **Custom Export** - Ручная настройка всех параметров
- **H.264 Master** - Высокое качество H.264 для архива (80 Mbps CBR)
- **H.265 Master** - Высокое качество H.265/HEVC (60 Mbps VBR)
- **ProRes 422 HQ** - Apple ProRes для профессионального монтажа
- **HyperDeck** - Формат для Blackmagic HyperDeck (50 Mbps CBR)

### Пресеты для социальных сетей
- **YouTube 1080p** - Оптимизировано для YouTube (12 Mbps VBR, -14 LKFS)
- **Vimeo 1080p** - Высокое качество для Vimeo (20 Mbps VBR)
- **TikTok 1080p** - Вертикальное видео для TikTok (автобитрейт)

### Разрешения
- **4K (2160p)**: 3840x2160
- **QHD (1440p)**: 2560x1440
- **Full HD (1080p)**: 1920x1080
- **HD (720p)**: 1280x720
- **Timeline** - Использовать разрешение проекта

## TODO / Дорожная карта

- [ ] Расширенные настройки экспорта аудио (мультитрек, маппинг каналов)
- [ ] Опции наложения таймкода для профессиональных workflow
- [ ] Поддержка экспорта HDR (HDR10, Dolby Vision)
- [ ] Наложение пользовательского водяного знака
- [ ] E2E тесты - комплексный набор тестов (см. секцию E2E Tests в старом README)
- [ ] Сохранение очереди экспорта (сохранение/восстановление при перезапуске)
- [ ] Шаблоны экспорта (сохранение полных конфигураций экспорта)

## Документация

- **README.md** - Английская версия
- **README.ru.md** - Этот файл (RU)
