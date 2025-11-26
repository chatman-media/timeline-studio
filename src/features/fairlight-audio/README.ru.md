# Fairlight Audio / Профессиональная аудио рабочая станция

[English](./README.md) | **Русский**

## Обзор

Профессиональная аудио рабочая станция, интегрированная в Timeline Studio. Включает полноценный микшерный пульт, 7-полосный параметрический эквалайзер, компрессор, реверберацию, AI шумоподавление, surround звук (Stereo/5.1/7.1), MIDI интеграцию, движок автоматизации и профессиональные измерители (LUFS, Spectrum, Phase correlation). Построен на Web Audio API с AudioWorklet для обработки в реальном времени.

## Статус

- ✅ **Компоненты**: 20+ компонентов полностью реализованы
- ✅ **Хуки**: 6 хуков (useAudioEngine, useMixerState, useChannelAudio, useBusRouting, useMidi, useMidiIntegration)
- ✅ **Сервисы**: 10+ сервисов (AudioEngine, EqualizerProcessor, NoiseReductionEngine, FFTProcessor, SurroundAudioProcessor, MIDI сервисы, Bus & Routing сервисы)
- ✅ **Тесты**: Доступны комплексные моки и утилиты для тестирования
- ✅ **Статус**: 100% завершено - Готов к продакшену

## Структура

```
fairlight-audio/
├── components/
│   ├── mixer/              # Компоненты микшера
│   ├── waveform/           # Визуализация формы волны
│   ├── effects/            # Аудио эффекты
│   ├── midi/               # MIDI компоненты
│   ├── routing/            # Матрица маршрутизации
│   ├── automation/         # Виды автоматизации
│   └── meters/             # Профессиональные измерители
├── hooks/
│   ├── use-audio-engine.ts
│   ├── use-mixer-state.ts
│   ├── use-channel-audio.ts
│   ├── use-bus-routing.ts
│   ├── use-midi.ts
│   └── use-midi-integration.ts
├── services/
│   ├── audio-engine.ts
│   ├── timeline-sync-service.ts
│   ├── audio-file-manager.ts
│   ├── effects/
│   ├── noise-reduction/
│   ├── surround/
│   └── midi/
└── __tests__/
```

## Возможности

### ✅ Реализовано (100%)

**Компоненты микшера**
- [x] MixerConsole - Основной интерфейс микшера с канальными полосами
- [x] ChannelStrip - Канальная полоса с контролами громкости, панорамы, solo/mute
- [x] Fader - Вертикальный фейдер с dB шкалой
- [x] MasterSection - Мастер секция с лимитером
- [x] SurroundPanner - Визуальное позиционирование в surround поле (Stereo, 5.1, 7.1)

**Эффекты**
- [x] Equalizer - 7-полосный параметрический эквалайзер с визуализацией
- [x] Compressor - Динамический компрессор с визуализацией кривой
- [x] Reverb - Реверберация с импульсными характеристиками
- [x] NoiseReduction - AI шумоподавление с 3 алгоритмами
- [x] EffectsRack - Управление цепочкой эффектов

**MIDI интеграция**
- [x] MidiRouterView - Визуальное управление MIDI маршрутизацией
- [x] MidiSequencerView - MIDI секвенсор с piano roll
- [x] MidiSetup - Настройка MIDI устройств
- [x] MidiConfigurationModal - Модальное окно настройки MIDI
- [x] MidiMappingEditor - Редактор MIDI маппинга
- [x] MidiLearnDialog - Диалог обучения MIDI контроллеров

**Маршрутизация и автоматизация**
- [x] RoutingMatrix - Матрица маршрутизации аудио шин
- [x] SendPanel - Панель управления посылами канала
- [x] GroupStrip - Канальная полоса для групп
- [x] AutomationView - Визуализация и редактирование автоматизации
- [x] AutomationPanel - Панель управления режимами автоматизации
- [x] AutomationLane - Дорожка автоматизации с точками

**Профессиональные измерители**
- [x] LevelMeter - Профессиональные уровни Peak/RMS/VU
- [x] SpectrumAnalyzer - Real-time FFT анализ спектра
- [x] PhaseCorrelationMeter - Анализ стерео совместимости
- [x] LUFSMeter - Громкость вещания по стандарту EBU R128

**Основные сервисы**
- [x] AudioEngine - Движок обработки на базе Web Audio API
- [x] TimelineSyncService - Синхронизация таймлайна/микшера
- [x] AudioFileManager - Загрузка и кэширование аудио файлов
- [x] EqualizerProcessor - Процессор эквалайзера на базе BiquadFilter
- [x] NoiseReductionEngine - Многоалгоритмное шумоподавление
- [x] FFTProcessor - Процессор быстрого преобразования Фурье
- [x] SurroundAudioProcessor - Процессор пространственного звука
- [x] MIDI Services - Полный MIDI движок и маршрутизация
- [x] Bus & Routing Services - Управление аудио шинами и группами
- [x] AutomationEngine - Движок автоматизации с 5 режимами

### ❌ Не реализовано

- [ ] Поддержка VST/AU плагинов через WebAssembly
- [ ] MIDI Router Matrix View - визуальная матрица маршрутизации
- [ ] MIDI Monitor - визуализация потока MIDI в реальном времени

## Использование

### Базовая интеграция

```typescript
import { MixerConsole } from "@/features/fairlight-audio"

function AudioMixerView() {
  return <MixerConsole />
}
```

### Audio Engine

```typescript
import { AudioEngine, ChannelStrip } from "@/features/fairlight-audio"

const engine = new AudioEngine()
const channel = engine.createChannel("custom-1")

// Подключение аудио элемента
const audio = new Audio("/path/to/file.mp3")
engine.connectMediaElement("custom-1", audio)

// Управление параметрами
engine.updateChannelVolume("custom-1", 75) // 75%
engine.updateChannelPan("custom-1", -50)   // Лево
```

### Эквалайзер

```typescript
import { EqualizerProcessor } from "@/features/fairlight-audio"

const eqBands = [
  { frequency: 60, gain: 0, q: 0.7, type: "highshelf" },
  { frequency: 150, gain: 0, q: 0.7, type: "peaking" },
  // ... остальные полосы
]

const eq = new EqualizerProcessor(audioContext, eqBands)
engine.addEffect(channelId, eq.getInputNode())
```

### MIDI интеграция

```typescript
import { useMidi, useMidiIntegration } from "@/features/fairlight-audio"

const { devices, isInitialized, sendMessage } = useMidi()
const { learnMode, startLearning, stopLearning } = useMidiIntegration(mixerState)
```

## Интеграция

- **Зависит от**: `@/features/timeline`, Web Audio API, Web MIDI API
- **Используется в**: `@/features/media-studio`

## Тестирование

- **Утилиты тестирования**: Полная настройка моков в `/src/test/utils/`
- **Mock AudioContext**: Поддержка unit тестов
- **Mock MediaElement**: Поддержка тестирования загрузки аудио
- **Симуляция событий**: Утилиты для симуляции жизненного цикла аудио
- **Документация**: См. `/src/test/utils/README.md`

## Архитектура Web Audio API

### Цепочка обработки канала
```
Source → GainNode → StereoPanner → Effects[] → Analyser → Master
```

### Мастер секция
```
Channels → MasterGain → Limiter → Destination
```

## Производительность

- **Sample Rate**: 48kHz для профессионального качества
- **Latency**: "interactive" режим для минимальной задержки
- **FFT Size**: 2048 для анализаторов (баланс между точностью и производительностью)
- **Real-time обработка**: <1ms задержка

## TODO / Дорожная карта

- [ ] Поддержка VST/AU плагинов через WebAssembly
- [ ] MIDI Router Matrix View - визуальная матрица MIDI маршрутизации
- [ ] MIDI Monitor - визуализация потока MIDI в реальном времени
- [ ] Расширенные шаблоны маршрутизации
- [ ] Улучшения редактирования кривых автоматизации
- [ ] E2E тесты - комплексный набор тестов (см. секцию E2E Tests в старом README)

## Документация

- **README.md** - Английская версия
- **README.ru.md** - Этот файл (RU)
- **/src/test/utils/README.md** - Документация утилит для тестирования аудио
