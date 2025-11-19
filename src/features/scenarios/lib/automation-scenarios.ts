import type { Scenario } from "../types"

/**
 * Сценарии автоматизации монтажа
 */
export const automationScenarios: Scenario[] = [
  {
    id: "cold-open-cuts",
    name: {
      ru: "Вырезки в начале (Cold Open)",
      en: "Cold Open with Cuts",
    },
    description: {
      ru: "Создает быструю нарезку из лучших моментов видео перед основным контентом",
      en: "Creates a quick montage from the best moments before main content",
    },
    category: "automation",
    difficulty: "intermediate",
    estimatedTime: 5,
    tags: {
      ru: ["вырезки", "монтаж", "AI"],
      en: ["cuts", "montage", "AI"],
    },

    requirements: {
      minClips: 1,
      requiresIntro: false,
      aiAssisted: true,
    },

    steps: [
      {
        id: "analyze-video",
        type: "analyze-video",
        name: { ru: "Анализ видео", en: "Analyze Video" },
        description: {
          ru: "AI анализирует видео и находит лучшие моменты",
          en: "AI analyzes video and finds the best moments",
        },
        config: {},
        automation: {
          canAutomate: true,
          aiAssisted: true,
          engine: "moment-analyzer",
          params: {
            minScore: 0.7,
            maxMoments: 5,
          },
        },
      },
      {
        id: "select-moments",
        type: "select-clips",
        name: { ru: "Выберите моменты", en: "Select Moments" },
        description: {
          ru: "Выберите 3-5 лучших моментов для нарезки",
          en: "Select 3-5 best moments for the montage",
        },
        config: {
          minClips: 3,
          maxClips: 5,
          suggestedClips: true,
        },
        validation: {
          required: true,
        },
      },
      {
        id: "add-music",
        type: "add-music",
        name: { ru: "Добавить музыку", en: "Add Music" },
        config: {
          required: true,
          style: "energetic",
        },
      },
      {
        id: "sync-cuts",
        type: "sync-beats",
        name: { ru: "Синхронизация с музыкой", en: "Sync with Music" },
        description: {
          ru: "Автоматически синхронизирует вырезки с ритмом музыки",
          en: "Automatically syncs cuts with music beats",
        },
        config: {},
        automation: {
          canAutomate: true,
          engine: "beat-detector",
        },
      },
      {
        id: "add-intro",
        type: "add-intro",
        name: { ru: "Добавить интро", en: "Add Intro" },
        config: {
          templateType: "graphics",
          category: "intro",
          position: "after-cuts",
        },
        optional: true,
      },
      {
        id: "preview",
        type: "preview",
        name: { ru: "Предпросмотр", en: "Preview" },
        config: {
          showTimeline: true,
          allowEdit: true,
        },
      },
    ],

    settings: {
      allowSkipSteps: true,
      showPreview: true,
      saveProgress: true,
      undoSupport: true,
    },
  },

  {
    id: "rhythmic-montage",
    name: {
      ru: "Ритмичный монтаж под музыку",
      en: "Rhythmic Montage with Music",
    },
    description: {
      ru: "Автоматически создает ритмичную нарезку, синхронизированную с битами музыки",
      en: "Automatically creates a rhythmic montage synchronized with music beats",
    },
    category: "automation",
    difficulty: "advanced",
    estimatedTime: 10,
    tags: {
      ru: ["ритм", "музыка", "монтаж", "AI"],
      en: ["rhythm", "music", "montage", "AI"],
    },

    requirements: {
      minClips: 5,
      requiresMusic: true,
      aiAssisted: true,
    },

    steps: [
      {
        id: "select-clips",
        type: "select-clips",
        name: { ru: "Выберите клипы", en: "Select Clips" },
        config: {
          minClips: 5,
          allowedTypes: ["video"],
        },
        validation: {
          required: true,
        },
      },
      {
        id: "select-music",
        type: "add-music",
        name: { ru: "Выберите музыку", en: "Select Music" },
        config: {
          required: true,
          analyzeBeats: true,
        },
        validation: {
          required: true,
        },
      },
      {
        id: "analyze-beats",
        type: "analyze-audio",
        name: { ru: "Анализ ритма", en: "Beat Analysis" },
        description: {
          ru: "Определение битов и ритма музыки",
          en: "Detecting beats and rhythm in music",
        },
        config: {},
        automation: {
          canAutomate: true,
          engine: "beat-detector",
        },
      },
      {
        id: "auto-cuts",
        type: "add-cuts",
        name: { ru: "Автоматические вырезки", en: "Auto Cuts" },
        description: {
          ru: "Создание вырезок на каждом бите",
          en: "Creating cuts on each beat",
        },
        config: {
          cutOnBeat: true,
          minCutDuration: 0.5,
          maxCutDuration: 2.0,
          transitionType: "cut",
        },
        automation: {
          canAutomate: true,
          engine: "auto-cutter",
          params: {
            syncToBeats: true,
            randomize: false,
          },
        },
      },
      {
        id: "add-transitions",
        type: "apply-transitions",
        name: { ru: "Добавить переходы", en: "Add Transitions" },
        config: {
          transitionType: "cut",
        },
        optional: true,
      },
      {
        id: "preview",
        type: "preview",
        name: { ru: "Предпросмотр", en: "Preview" },
        config: {
          showTimeline: true,
          showWaveform: true,
          allowEdit: true,
        },
      },
    ],

    settings: {
      allowSkipSteps: false,
      showPreview: true,
      saveProgress: true,
      undoSupport: true,
    },
  },

  {
    id: "auto-highlight-reel",
    name: {
      ru: "Автоматическая нарезка лучших моментов",
      en: "Auto Highlight Reel",
    },
    description: {
      ru: "AI находит и собирает лучшие моменты в короткое видео",
      en: "AI finds and compiles best moments into a short video",
    },
    category: "automation",
    difficulty: "intermediate",
    estimatedTime: 8,
    tags: {
      ru: ["AI", "лучшие моменты", "автомонтаж"],
      en: ["AI", "highlights", "auto-edit"],
    },

    requirements: {
      minClips: 1,
      aiAssisted: true,
    },

    steps: [
      {
        id: "select-source",
        type: "select-clips",
        name: { ru: "Выберите исходное видео", en: "Select Source Video" },
        config: {
          minClips: 1,
          maxClips: 3,
          allowedTypes: ["video"],
        },
        validation: {
          required: true,
        },
      },
      {
        id: "ai-analysis",
        type: "analyze-video",
        name: { ru: "AI анализ", en: "AI Analysis" },
        description: {
          ru: "Поиск интересных моментов, динамических сцен и важных событий",
          en: "Finding interesting moments, dynamic scenes and important events",
        },
        config: {},
        automation: {
          canAutomate: true,
          aiAssisted: true,
          engine: "moment-analyzer",
        },
      },
      {
        id: "auto-montage",
        type: "auto-montage",
        name: { ru: "Автомонтаж", en: "Auto Montage" },
        description: {
          ru: "Автоматическая сборка лучших моментов",
          en: "Automatic compilation of best moments",
        },
        config: {},
        automation: {
          canAutomate: true,
          aiAssisted: true,
          engine: "auto-cutter",
        },
      },
      {
        id: "add-music",
        type: "add-music",
        name: { ru: "Добавить музыку", en: "Add Music" },
        config: {
          required: false,
          style: "upbeat",
        },
        optional: true,
      },
      {
        id: "preview",
        type: "preview",
        name: { ru: "Предпросмотр и редактирование", en: "Preview and Edit" },
        config: {
          showTimeline: true,
          allowEdit: true,
        },
      },
    ],

    settings: {
      allowSkipSteps: true,
      showPreview: true,
      saveProgress: true,
      undoSupport: true,
    },
  },
]
