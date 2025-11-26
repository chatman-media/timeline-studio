# Voice Recording

[English](./README.md) | **Русский**

## Обзор
Модуль записи голоса с функциональностью записи через микрофон, выбором устройств, управлением разрешениями, таймером обратного отсчета и поддержкой множества аудио форматов.

## Статус
- ✅ **Компоненты**: Полностью реализованы
- ✅ **Хуки**: Полностью реализованы
- ✅ **Тесты**: Отличное покрытие (88.29% компоненты, 72.53% хуки)
- ✅ **Всего тестов**: 89 тестов проходят
- ✅ **Tauri интеграция**: Полная интеграция для файловых операций

## Структура
```
voice-recording/
├── components/
│   ├── audio-permission-request.tsx
│   └── voice-recording-modal.tsx
├── hooks/
│   ├── use-audio-devices.ts
│   ├── use-audio-permissions.ts
│   └── use-voice-recording.ts
├── types/
│   ├── tauri.ts
│   └── index.ts
├── __tests__/
│   ├── components/
│   └── hooks/
└── __mocks__/
```

## Функции
### ✅ Реализовано
- [x] Проверка поддержки MediaDevices API
- [x] Выбор аудио устройства из доступных
- [x] Выбор формата аудио (WebM, MP3, WAV, OGG, M4A)
- [x] Настраиваемый обратный отсчет (0-10 сек)
- [x] Визуальный индикатор времени записи
- [x] Прогресс-бар записи (до 5 минут)
- [x] Автоматическое сохранение в директорию проекта
- [x] Интеграция с ResourcesProvider
- [x] Отображение статуса разрешений
- [x] Обработка ошибок доступа
- [x] Обновление списка устройств
- [x] Автоматическая очистка ресурсов

### ❌ Не реализовано
- [ ] Настройки качества записи
- [ ] Визуализация уровня аудио
- [ ] Шумоподавление
- [ ] Автоматическое усиление
- [ ] E2E тесты

## Использование
```typescript
import { VoiceRecordModal, useVoiceRecording } from '@/features/voice-recording'

function RecordButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const {
    isRecording,
    recordingTime,
    startRecording,
    stopRecording
  } = useVoiceRecording()

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)}>
        Записать голос
      </Button>
      <VoiceRecordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
```

## Интеграция
- **Зависит от**: @/features/modals, @/features/resources, @tauri-apps/api
- **Используется в**: Рабочие процессы записи медиа

## Тестирование
- **Всего тестов**: 89 тестов (все проходят)
- **Покрытие компонентов**: 88.29% (AudioPermissionRequest: 100%, VoiceRecordingModal: 88.89%)
- **Покрытие хуков**: 72.53% (useVoiceRecording: 58.6%, useAudioPermissions: 85.84%, useAudioDevices: 100%)

```bash
bun test src/features/voice-recording
```

## TODO / Roadmap
- [ ] Настройки качества записи (битрейт, частота дискретизации)
- [ ] Визуализация уровня аудио во время записи
- [ ] Функция шумоподавления
- [ ] Автоматическое усиление
- [ ] Проверки утечек памяти
- [ ] Оптимизация функций очистки
- [ ] E2E тесты (запланированы в `e2e/tauri/features/voice-recording/`)
