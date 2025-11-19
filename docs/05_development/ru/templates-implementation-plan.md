# План реализации системы шаблонов

## Обзор

Поэтапная реализация трех взаимосвязанных систем:
1. **Unified Templates** - объединенные шаблоны (многокамерные + графические)
2. **Project Templates** - шаблоны проектов
3. **Scenarios** - сценарии монтажа

## Фаза 1: Unified Templates (2-3 дня)

### День 1: Типы и структура

**Задачи:**
1. ✅ Создать базовые типы (`features/templates/types/base.ts`)
2. ✅ Мигрировать типы многокамерных шаблонов
3. ✅ Мигрировать типы графических шаблонов
4. ✅ Создать реестр шаблонов
5. ✅ Обновить существующие шаблоны

**Файлы для создания:**
```
src/features/templates/
├── types/
│   ├── base.ts              ← Новый
│   ├── multi-camera.ts      ← Миграция из template-config.ts
│   └── graphics.ts          ← Миграция из style-templates/types/
├── lib/
│   ├── template-registry.ts ← Новый
│   └── template-utils.ts    ← Новый
```

### День 2: Компоненты и интеграция

**Задачи:**
1. ✅ Создать общий браузер шаблонов
2. ✅ Обновить адаптер для Browser
3. ✅ Мигрировать существующие компоненты
4. ✅ Обновить тесты

**Файлы для создания:**
```
src/features/templates/
├── components/
│   ├── template-browser/
│   │   ├── template-browser.tsx     ← Новый
│   │   ├── template-grid.tsx        ← Новый
│   │   ├── template-card.tsx        ← Новый
│   │   └── template-filters.tsx     ← Новый
│   └── shared/
│       └── template-preview.tsx     ← Общий компонент
```

### День 3: Сервисы и хуки

**Задачи:**
1. ✅ Создать XState машину для шаблонов
2. ✅ Создать хуки
3. ✅ Обновить интеграцию с Browser
4. ✅ Написать тесты

**Файлы для создания:**
```
src/features/templates/
├── services/
│   ├── template-manager.ts   ← Новый
│   ├── template-renderer.ts  ← Новый
│   └── template-machine.ts   ← Новый (XState)
├── hooks/
│   ├── use-template.ts       ← Новый
│   └── use-template-browser.ts ← Новый
```

## Фаза 2: Project Templates (3-4 дня)

### День 1-2: Базовая структура и типы

**Задачи:**
1. ✅ Создать структуру feature
2. ✅ Определить типы проектных шаблонов
3. ✅ Создать базовые шаблоны (YouTube, Instagram, Podcast)
4. ✅ Реализовать менеджер шаблонов

**Файлы для создания:**
```
src/features/project-templates/
├── types/
│   └── project-template.ts     ← Новый
├── lib/
│   ├── youtube-templates.ts    ← Новый
│   ├── social-templates.ts     ← Новый
│   └── podcast-templates.ts    ← Новый
├── services/
│   ├── project-template-manager.ts  ← Новый
│   └── template-applier.ts          ← Новый
```

**Пример базовых шаблонов:**

```typescript
// lib/youtube-templates.ts
export const youtubeTemplates: ProjectTemplate[] = [
  {
    id: 'youtube-standard',
    type: 'project',
    name: { ru: 'Стандартное YouTube видео', en: 'Standard YouTube Video' },
    category: 'youtube',
    aspectRatio: '16:9',
    estimatedDuration: 600, // 10 минут

    structure: {
      sections: [
        {
          id: 'intro',
          type: 'intro',
          name: { ru: 'Интро', en: 'Intro' },
          duration: 5,
          position: 0,
          locked: true
        },
        {
          id: 'cold-open',
          type: 'content',
          name: { ru: 'Вступление (Cold Open)', en: 'Cold Open' },
          duration: 10,
          position: 5
        },
        {
          id: 'main-content',
          type: 'content',
          name: { ru: 'Основной контент', en: 'Main Content' },
          duration: 540,
          position: 15
        },
        {
          id: 'outro',
          type: 'outro',
          name: { ru: 'Концовка', en: 'Outro' },
          duration: 8,
          position: 555,
          locked: true
        },
        {
          id: 'end-screen',
          type: 'outro',
          name: { ru: 'Конечная заставка', en: 'End Screen' },
          duration: 7,
          position: 563,
          locked: true
        }
      ],
      tracks: [
        { id: 'video-main', type: 'video', name: 'Основное видео', locked: false, visible: true },
        { id: 'graphics', type: 'graphics', name: 'Графика', locked: false, visible: true },
        { id: 'audio-main', type: 'audio', name: 'Основной звук', locked: false, visible: true },
        { id: 'audio-music', type: 'audio', name: 'Музыка', locked: false, visible: true }
      ]
    },

    placeholders: {
      intro: {
        duration: 5,
        templateId: 'youtube-intro-modern',
        required: true
      },
      outro: {
        duration: 8,
        templateId: 'youtube-outro-subscribe',
        required: true
      },
      mainContent: {
        minDuration: 60,
        maxDuration: 3600
      },
      music: {
        required: false,
        loop: true
      },
      chapters: {
        auto: true,
        interval: 60
      }
    },

    settings: {
      resolution: { width: 1920, height: 1080 },
      frameRate: 30,
      aspectRatio: '16:9',
      audioSampleRate: 48000,
      audioChannels: 2
    }
  },

  {
    id: 'youtube-short',
    type: 'project',
    name: { ru: 'YouTube Shorts', en: 'YouTube Shorts' },
    category: 'youtube',
    aspectRatio: '9:16',
    estimatedDuration: 60,

    structure: {
      sections: [
        {
          id: 'hook',
          type: 'content',
          name: { ru: 'Хук (первые 3 сек)', en: 'Hook (first 3 sec)' },
          duration: 3,
          position: 0,
          locked: false
        },
        {
          id: 'main',
          type: 'content',
          name: { ru: 'Основной контент', en: 'Main Content' },
          duration: 54,
          position: 3
        },
        {
          id: 'cta',
          type: 'outro',
          name: { ru: 'Призыв к действию', en: 'Call to Action' },
          duration: 3,
          position: 57,
          locked: true
        }
      ],
      tracks: [
        { id: 'video', type: 'video', name: 'Видео', locked: false, visible: true },
        { id: 'text', type: 'text', name: 'Текст/субтитры', locked: false, visible: true },
        { id: 'audio', type: 'audio', name: 'Звук', locked: false, visible: true }
      ]
    },

    placeholders: {
      mainContent: {
        minDuration: 15,
        maxDuration: 60
      },
      outro: {
        duration: 3,
        templateId: 'shorts-cta-subscribe',
        required: true
      }
    },

    settings: {
      resolution: { width: 1080, height: 1920 },
      frameRate: 30,
      aspectRatio: '9:16',
      audioSampleRate: 48000,
      audioChannels: 2
    }
  }
]
```

### День 3: Компоненты UI

**Задачи:**
1. ✅ Создать Template Picker (выбор шаблона)
2. ✅ Создать мастер настройки
3. ✅ Создать preview компонент
4. ✅ Интеграция с модальным окном создания проекта

**Файлы для создания:**
```
src/features/project-templates/
├── components/
│   ├── template-picker.tsx         ← Новый
│   ├── template-wizard.tsx         ← Новый
│   ├── template-customizer.tsx     ← Новый
│   └── template-preview.tsx        ← Новый
```

### День 4: Интеграция и тесты

**Задачи:**
1. ✅ Интеграция с Browser (новая вкладка)
2. ✅ Интеграция с созданием проекта
3. ✅ Применение шаблона к проекту
4. ✅ Написать тесты

## Фаза 3: Scenarios (4-5 дней)

### День 1-2: Базовые сценарии

**Задачи:**
1. ✅ Создать структуру feature
2. ✅ Определить типы сценариев
3. ✅ Реализовать базовые сценарии структуры
4. ✅ Создать XState машину для выполнения

**Файлы для создания:**
```
src/features/scenarios/
├── types/
│   ├── scenario.ts           ← Новый
│   └── scenario-step.ts      ← Новый
├── lib/
│   ├── structure-scenarios.ts    ← Новый
│   └── scenario-registry.ts      ← Новый
├── services/
│   ├── scenario-executor.ts      ← Новый
│   └── scenario-machine.ts       ← Новый (XState)
```

**Пример базовых сценариев:**

```typescript
// lib/structure-scenarios.ts
export const structureScenarios: Scenario[] = [
  {
    id: 'add-intro-outro',
    type: 'scenario',
    name: {
      ru: 'Добавить одинаковые интро и аутро',
      en: 'Add Same Intro and Outro'
    },
    description: {
      ru: 'Автоматически добавляет выбранные шаблоны интро и аутро к вашему видео',
      en: 'Automatically adds selected intro and outro templates to your video'
    },
    category: 'structure',
    difficulty: 'beginner',
    estimatedTime: 2, // минуты

    requirements: {
      minClips: 1,
      requiresIntro: true,
      requiresOutro: true
    },

    steps: [
      {
        id: 'select-clips',
        type: 'select-clips',
        name: { ru: 'Выберите клипы', en: 'Select Clips' },
        description: {
          ru: 'Выберите один или несколько клипов для обработки',
          en: 'Select one or more clips to process'
        },
        config: {
          minClips: 1,
          maxClips: null,
          allowedTypes: ['video']
        },
        validation: {
          required: true,
          errorMessage: {
            ru: 'Необходимо выбрать хотя бы один клип',
            en: 'At least one clip must be selected'
          }
        }
      },
      {
        id: 'select-intro',
        type: 'add-template',
        name: { ru: 'Выберите интро', en: 'Select Intro' },
        config: {
          templateType: 'graphics',
          category: 'intro',
          position: 'start'
        },
        validation: {
          required: true
        }
      },
      {
        id: 'select-outro',
        type: 'add-template',
        name: { ru: 'Выберите аутро', en: 'Select Outro' },
        config: {
          templateType: 'graphics',
          category: 'outro',
          position: 'end'
        },
        validation: {
          required: true
        }
      },
      {
        id: 'preview',
        type: 'preview',
        name: { ru: 'Предпросмотр', en: 'Preview' },
        config: {
          showTimeline: true,
          allowEdit: true
        },
        optional: true
      }
    ],

    settings: {
      allowSkipSteps: false,
      showPreview: true,
      saveProgress: true,
      undoSupport: true
    }
  },

  {
    id: 'cold-open-cuts',
    type: 'scenario',
    name: {
      ru: 'Вырезки в начале (Cold Open)',
      en: 'Cold Open with Cuts'
    },
    description: {
      ru: 'Создает быструю нарезку из лучших моментов видео перед основным контентом',
      en: 'Creates a quick montage from the best moments before main content'
    },
    category: 'automation',
    difficulty: 'intermediate',
    estimatedTime: 5,

    requirements: {
      minClips: 1,
      requiresIntro: false,
      aiAssisted: true
    },

    steps: [
      {
        id: 'analyze-video',
        type: 'analyze-video',
        name: { ru: 'Анализ видео', en: 'Analyze Video' },
        description: {
          ru: 'AI анализирует видео и находит лучшие моменты',
          en: 'AI analyzes video and finds the best moments'
        },
        config: {
          engine: 'moment-analyzer',
          params: {
            minScore: 0.7,
            maxMoments: 5
          }
        },
        automation: {
          canAutomate: true,
          aiAssisted: true,
          engine: 'moment-analyzer'
        }
      },
      {
        id: 'select-moments',
        type: 'select-clips',
        name: { ru: 'Выберите моменты', en: 'Select Moments' },
        description: {
          ru: 'Выберите 3-5 лучших моментов для нарезки',
          en: 'Select 3-5 best moments for the montage'
        },
        config: {
          minClips: 3,
          maxClips: 5,
          suggestedClips: true // AI предлагает моменты
        }
      },
      {
        id: 'add-music',
        type: 'add-music',
        name: { ru: 'Добавить музыку', en: 'Add Music' },
        config: {
          required: true,
          style: 'energetic'
        }
      },
      {
        id: 'sync-cuts',
        type: 'sync-beats',
        name: { ru: 'Синхронизация с музыкой', en: 'Sync with Music' },
        description: {
          ru: 'Автоматически синхронизирует вырезки с ритмом музыки',
          en: 'Automatically syncs cuts with music beats'
        },
        automation: {
          canAutomate: true,
          engine: 'beat-detector'
        }
      },
      {
        id: 'add-intro',
        type: 'add-template',
        name: { ru: 'Добавить интро', en: 'Add Intro' },
        config: {
          templateType: 'graphics',
          category: 'intro',
          position: 'after-cuts'
        },
        optional: true
      },
      {
        id: 'preview',
        type: 'preview',
        name: { ru: 'Предпросмотр', en: 'Preview' },
        config: {
          showTimeline: true,
          allowEdit: true
        }
      }
    ],

    settings: {
      allowSkipSteps: true,
      showPreview: true,
      saveProgress: true
    }
  },

  {
    id: 'rhythmic-montage',
    type: 'scenario',
    name: {
      ru: 'Ритмичный монтаж под музыку',
      en: 'Rhythmic Montage with Music'
    },
    description: {
      ru: 'Автоматически создает ритмичную нарезку, синхронизированную с битами музыки',
      en: 'Automatically creates a rhythmic montage synchronized with music beats'
    },
    category: 'automation',
    difficulty: 'advanced',
    estimatedTime: 10,

    requirements: {
      minClips: 5,
      requiresMusic: true,
      aiAssisted: true
    },

    steps: [
      {
        id: 'select-clips',
        type: 'select-clips',
        name: { ru: 'Выберите клипы', en: 'Select Clips' },
        config: {
          minClips: 5,
          allowedTypes: ['video']
        }
      },
      {
        id: 'select-music',
        type: 'add-music',
        name: { ru: 'Выберите музыку', en: 'Select Music' },
        config: {
          required: true,
          analyzeBeats: true
        }
      },
      {
        id: 'analyze-beats',
        type: 'analyze-audio',
        name: { ru: 'Анализ ритма', en: 'Beat Analysis' },
        description: {
          ru: 'Определение битов и ритма музыки',
          en: 'Detecting beats and rhythm in music'
        },
        automation: {
          canAutomate: true,
          engine: 'beat-detector'
        }
      },
      {
        id: 'auto-cuts',
        type: 'add-cuts',
        name: { ru: 'Автоматические вырезки', en: 'Auto Cuts' },
        description: {
          ru: 'Создание вырезок на каждом бите',
          en: 'Creating cuts on each beat'
        },
        config: {
          cutOnBeat: true,
          minCutDuration: 0.5,
          maxCutDuration: 2.0,
          transitionType: 'cut'
        },
        automation: {
          canAutomate: true,
          engine: 'auto-cutter',
          params: {
            syncToBeats: true,
            randomize: false
          }
        }
      },
      {
        id: 'add-transitions',
        type: 'apply-transitions',
        name: { ru: 'Добавить переходы', en: 'Add Transitions' },
        config: {
          transitionType: 'auto',
          onBeat: true
        },
        optional: true
      },
      {
        id: 'preview',
        type: 'preview',
        name: { ru: 'Предпросмотр', en: 'Preview' },
        config: {
          showTimeline: true,
          showWaveform: true,
          allowEdit: true
        }
      }
    ],

    settings: {
      allowSkipSteps: false,
      showPreview: true,
      saveProgress: true
    }
  }
]
```

### День 3: Компоненты мастера

**Задачи:**
1. ✅ Создать Scenario Browser
2. ✅ Создать Scenario Wizard
3. ✅ Реализовать компоненты шагов
4. ✅ Создать progress indicator

**Файлы для создания:**
```
src/features/scenarios/
├── components/
│   ├── scenario-browser.tsx
│   ├── scenario-wizard/
│   │   ├── wizard.tsx
│   │   ├── step-renderer.tsx
│   │   └── progress-indicator.tsx
│   └── steps/
│       ├── select-clips-step.tsx
│       ├── select-template-step.tsx
│       ├── configure-cuts-step.tsx
│       └── preview-step.tsx
```

### День 4: Автоматизация

**Задачи:**
1. ✅ Интеграция с AI Director
2. ✅ Реализовать beat detector
3. ✅ Реализовать moment analyzer
4. ✅ Реализовать auto-cutter

**Файлы для создания:**
```
src/features/scenarios/
├── services/
│   └── automation/
│       ├── beat-detector.ts      ← Новый
│       ├── moment-analyzer.ts    ← Новый
│       └── auto-cutter.ts        ← Новый
```

### День 5: Интеграция и тесты

**Задачи:**
1. ✅ Интеграция с Browser
2. ✅ Интеграция с Timeline
3. ✅ E2E тесты сценариев
4. ✅ Документация

## Фаза 4: Интеграция и полировка (2-3 дня)

### Задачи:
1. ✅ Обновить Browser с новыми вкладками
2. ✅ Создать единый UI для всех типов шаблонов
3. ✅ Оптимизация производительности
4. ✅ Полное покрытие тестами
5. ✅ Обновить документацию
6. ✅ Создать демо-видео

## Итоговая структура директорий

```
src/features/
├── templates/                    # Объединенные шаблоны
│   ├── types/
│   │   ├── base.ts
│   │   ├── multi-camera.ts
│   │   └── graphics.ts
│   ├── lib/
│   │   ├── multi-camera/
│   │   ├── graphics/
│   │   ├── template-registry.ts
│   │   └── template-utils.ts
│   ├── components/
│   │   ├── template-browser/
│   │   ├── multi-camera/
│   │   ├── graphics/
│   │   └── shared/
│   ├── services/
│   └── hooks/
│
├── project-templates/           # Шаблоны проектов
│   ├── types/
│   ├── lib/
│   ├── components/
│   ├── services/
│   └── hooks/
│
├── scenarios/                   # Сценарии монтажа
│   ├── types/
│   ├── lib/
│   ├── components/
│   │   ├── scenario-browser.tsx
│   │   ├── scenario-wizard/
│   │   ├── steps/
│   │   └── automation/
│   ├── services/
│   │   ├── scenario-executor.ts
│   │   ├── scenario-machine.ts
│   │   └── automation/
│   └── hooks/
│
└── browser/                     # Обновленный браузер
    ├── components/
    │   └── tab-adapters/
    │       ├── templates-adapter-content.tsx      # Обновлен
    │       ├── projects-adapter-content.tsx       # Новый
    │       └── scenarios-adapter-content.tsx      # Новый
    └── types/
        └── tab.ts                                 # Обновлен
```

## Метрики успеха

### Производительность
- Браузер шаблонов загружается < 100ms
- Применение шаблона < 500ms
- Выполнение базового сценария < 2s
- Выполнение AI-сценария < 10s

### Пользовательский опыт
- Все шаблоны с превью
- Поиск и фильтрация работают мгновенно
- Мастер сценариев интуитивно понятен
- Undo/Redo работает во всех сценариях

### Качество кода
- 100% покрытие тестами критичных компонентов
- 0 TypeScript ошибок
- 0 lint warnings
- Документация для всех публичных API

## Следующие шаги

После реализации базовых функций:

1. **Advanced Templates**
   - Импорт/экспорт пользовательских шаблонов
   - Маркетплейс шаблонов
   - Создание шаблонов из существующих проектов

2. **AI Enhancements**
   - Умные рекомендации шаблонов
   - Автогенерация сценариев на основе контента
   - Оптимизация вырезок на основе метрик

3. **Collaboration**
   - Шаринг шаблонов между пользователями
   - Командные библиотеки шаблонов
   - Версионирование шаблонов
