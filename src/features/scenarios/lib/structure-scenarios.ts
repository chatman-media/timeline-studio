import type { Scenario } from "../types"

/**
 * Сценарии для структурирования проектов
 */
export const structureScenarios: Scenario[] = [
  {
    id: "add-intro-outro",
    name: {
      ru: "Добавить одинаковые интро и аутро",
      en: "Add Same Intro and Outro",
    },
    description: {
      ru: "Автоматически добавляет выбранные шаблоны интро и аутро к вашему видео",
      en: "Automatically adds selected intro and outro templates to your video",
    },
    category: "structure",
    difficulty: "beginner",
    estimatedTime: 2,
    tags: {
      ru: ["интро", "аутро", "структура"],
      en: ["intro", "outro", "structure"],
    },

    requirements: {
      minClips: 1,
      requiresIntro: true,
      requiresOutro: true,
    },

    steps: [
      {
        id: "select-clips",
        type: "select-clips",
        name: { ru: "Выберите клипы", en: "Select Clips" },
        description: {
          ru: "Выберите один или несколько клипов для обработки",
          en: "Select one or more clips to process",
        },
        config: {
          minClips: 1,
          maxClips: undefined,
          allowedTypes: ["video"],
        },
        validation: {
          required: true,
          errorMessage: {
            ru: "Необходимо выбрать хотя бы один клип",
            en: "At least one clip must be selected",
          },
        },
      },
      {
        id: "select-intro",
        type: "add-intro",
        name: { ru: "Выберите интро", en: "Select Intro" },
        config: {
          templateType: "graphics",
          category: "intro",
          position: "start",
        },
        validation: {
          required: true,
        },
      },
      {
        id: "select-outro",
        type: "add-outro",
        name: { ru: "Выберите аутро", en: "Select Outro" },
        config: {
          templateType: "graphics",
          category: "outro",
          position: "end",
        },
        validation: {
          required: true,
        },
      },
      {
        id: "preview",
        type: "preview",
        name: { ru: "Предпросмотр", en: "Preview" },
        config: {
          showTimeline: true,
          allowEdit: true,
        },
        optional: true,
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
    id: "add-chapters",
    name: {
      ru: "Добавить главы с таймкодами",
      en: "Add Chapters with Timecodes",
    },
    description: {
      ru: "Автоматически создает главы и добавляет заголовки",
      en: "Automatically creates chapters and adds titles",
    },
    category: "structure",
    difficulty: "beginner",
    estimatedTime: 5,
    tags: {
      ru: ["главы", "таймкоды", "структура"],
      en: ["chapters", "timecodes", "structure"],
    },

    requirements: {
      minClips: 1,
    },

    steps: [
      {
        id: "select-video",
        type: "select-clips",
        name: { ru: "Выберите видео", en: "Select Video" },
        config: {
          minClips: 1,
          maxClips: 1,
          allowedTypes: ["video"],
        },
        validation: {
          required: true,
        },
      },
      {
        id: "analyze-content",
        type: "analyze-video",
        name: { ru: "Анализ контента", en: "Analyze Content" },
        description: {
          ru: "Определение смен сцен и важных моментов",
          en: "Detecting scene changes and important moments",
        },
        config: {},
        automation: {
          canAutomate: true,
          aiAssisted: true,
          engine: "ai-director",
        },
      },
      {
        id: "add-chapter-markers",
        type: "add-chapters",
        name: { ru: "Добавить маркеры глав", en: "Add Chapter Markers" },
        config: {},
      },
      {
        id: "add-titles",
        type: "add-template",
        name: { ru: "Добавить заголовки", en: "Add Titles" },
        config: {
          templateType: "graphics",
          category: "title",
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
]
