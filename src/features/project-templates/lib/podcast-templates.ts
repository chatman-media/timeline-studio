import type { ProjectTemplate } from "../types"

/**
 * Шаблоны для подкастов
 */
export const podcastTemplates: ProjectTemplate[] = [
  {
    id: "podcast-interview",
    name: {
      ru: "Подкаст-интервью",
      en: "Podcast Interview",
    },
    description: {
      ru: "Двухкамерный формат с ведущим и гостем",
      en: "Two-camera format with host and guest",
    },
    category: "podcast",
    targetPlatform: "youtube",
    aspectRatio: "16:9",
    estimatedDuration: 3600, // 60 минут
    tags: {
      ru: ["подкаст", "интервью", "разговор"],
      en: ["podcast", "interview", "talk"],
    },

    structure: {
      sections: [
        {
          id: "intro",
          type: "intro",
          name: { ru: "Вступление", en: "Introduction" },
          duration: 30,
          position: 0,
          locked: true,
        },
        {
          id: "guest-intro",
          type: "chapter",
          name: { ru: "Представление гостя", en: "Guest Introduction" },
          duration: 120,
          position: 30,
        },
        {
          id: "main-discussion",
          type: "content",
          name: { ru: "Основная беседа", en: "Main Discussion" },
          duration: 3000,
          position: 150,
        },
        {
          id: "qa",
          type: "chapter",
          name: { ru: "Вопросы и ответы", en: "Q&A" },
          duration: 300,
          position: 3150,
        },
        {
          id: "outro",
          type: "outro",
          name: { ru: "Заключение", en: "Outro" },
          duration: 60,
          position: 3450,
          locked: true,
        },
      ],
      tracks: [
        {
          id: "video-host",
          type: "video",
          name: "Камера ведущего",
          locked: false,
          visible: true,
        },
        {
          id: "video-guest",
          type: "video",
          name: "Камера гостя",
          locked: false,
          visible: true,
        },
        {
          id: "video-both",
          type: "video",
          name: "Обе камеры",
          locked: false,
          visible: true,
        },
        {
          id: "graphics-lower-thirds",
          type: "graphics",
          name: "Нижние титры",
          locked: false,
          visible: true,
        },
        {
          id: "audio-host",
          type: "audio",
          name: "Микрофон ведущего",
          locked: false,
          visible: true,
        },
        {
          id: "audio-guest",
          type: "audio",
          name: "Микрофон гостя",
          locked: false,
          visible: true,
        },
        {
          id: "audio-music",
          type: "audio",
          name: "Фоновая музыка",
          locked: false,
          visible: true,
        },
      ],
      multiCameraTemplates: ["split-vertical-2", "picture-in-picture-2"],
    },

    placeholders: {
      intro: {
        duration: 30,
        templateId: "podcast-intro",
        required: true,
      },
      outro: {
        duration: 60,
        templateId: "podcast-outro",
        required: true,
      },
      mainContent: {
        minDuration: 1800,
        maxDuration: 7200,
      },
      chapters: {
        auto: true,
        interval: 300, // Глава каждые 5 минут
      },
    },

    settings: {
      resolution: "1920x1080",
      frameRate: "30",
      aspectRatio: {
        label: "16:9",
        textLabel: "Широкоэкнранный",
        description: "YouTube",
        value: {
          width: 1920,
          height: 1080,
          name: "16:9",
        },
      },
      colorSpace: "sdr",
    },
  },

  {
    id: "podcast-solo",
    name: {
      ru: "Сольный подкаст",
      en: "Solo Podcast",
    },
    description: {
      ru: "Формат с одним ведущим",
      en: "Format with single host",
    },
    category: "podcast",
    targetPlatform: "youtube",
    aspectRatio: "16:9",
    estimatedDuration: 1800, // 30 минут
    tags: {
      ru: ["подкаст", "соло", "монолог"],
      en: ["podcast", "solo", "monologue"],
    },

    structure: {
      sections: [
        {
          id: "intro",
          type: "intro",
          name: { ru: "Вступление", en: "Introduction" },
          duration: 20,
          position: 0,
          locked: true,
        },
        {
          id: "topic-intro",
          type: "chapter",
          name: { ru: "Введение в тему", en: "Topic Introduction" },
          duration: 180,
          position: 20,
        },
        {
          id: "main-content",
          type: "content",
          name: { ru: "Основной контент", en: "Main Content" },
          duration: 1500,
          position: 200,
        },
        {
          id: "summary",
          type: "chapter",
          name: { ru: "Резюме", en: "Summary" },
          duration: 80,
          position: 1700,
        },
        {
          id: "outro",
          type: "outro",
          name: { ru: "Заключение", en: "Outro" },
          duration: 20,
          position: 1780,
          locked: true,
        },
      ],
      tracks: [
        {
          id: "video-main",
          type: "video",
          name: "Основное видео",
          locked: false,
          visible: true,
        },
        {
          id: "graphics-slides",
          type: "graphics",
          name: "Слайды",
          locked: false,
          visible: true,
        },
        {
          id: "audio-voice",
          type: "audio",
          name: "Голос",
          locked: false,
          visible: true,
        },
        {
          id: "audio-music",
          type: "audio",
          name: "Музыка",
          locked: false,
          visible: true,
        },
      ],
    },

    placeholders: {
      intro: {
        duration: 20,
        templateId: "podcast-intro",
        required: true,
      },
      outro: {
        duration: 20,
        templateId: "podcast-outro",
        required: true,
      },
      mainContent: {
        minDuration: 600,
        maxDuration: 3600,
      },
      chapters: {
        auto: true,
        interval: 300,
      },
    },

    settings: {
      resolution: "1920x1080",
      frameRate: "30",
      aspectRatio: {
        label: "16:9",
        textLabel: "Широкоэкнранный",
        description: "YouTube",
        value: {
          width: 1920,
          height: 1080,
          name: "16:9",
        },
      },
      colorSpace: "sdr",
    },
  },

  {
    id: "podcast-panel",
    name: {
      ru: "Панельный подкаст",
      en: "Panel Podcast",
    },
    description: {
      ru: "Формат с несколькими участниками (3-4 человека)",
      en: "Format with multiple participants (3-4 people)",
    },
    category: "podcast",
    targetPlatform: "youtube",
    aspectRatio: "16:9",
    estimatedDuration: 4200, // 70 минут
    tags: {
      ru: ["подкаст", "панель", "дискуссия"],
      en: ["podcast", "panel", "discussion"],
    },

    structure: {
      sections: [
        {
          id: "intro",
          type: "intro",
          name: { ru: "Вступление", en: "Introduction" },
          duration: 60,
          position: 0,
          locked: true,
        },
        {
          id: "participants-intro",
          type: "chapter",
          name: { ru: "Представление участников", en: "Participants Introduction" },
          duration: 180,
          position: 60,
        },
        {
          id: "main-discussion",
          type: "content",
          name: { ru: "Основная дискуссия", en: "Main Discussion" },
          duration: 3600,
          position: 240,
        },
        {
          id: "closing",
          type: "chapter",
          name: { ru: "Заключительные мысли", en: "Closing Thoughts" },
          duration: 300,
          position: 3840,
        },
        {
          id: "outro",
          type: "outro",
          name: { ru: "Концовка", en: "Outro" },
          duration: 60,
          position: 4140,
          locked: true,
        },
      ],
      tracks: [
        {
          id: "video-panel",
          type: "video",
          name: "Общий план панели",
          locked: false,
          visible: true,
        },
        {
          id: "video-speaker1",
          type: "video",
          name: "Камера участника 1",
          locked: false,
          visible: true,
        },
        {
          id: "video-speaker2",
          type: "video",
          name: "Камера участника 2",
          locked: false,
          visible: true,
        },
        {
          id: "video-speaker3",
          type: "video",
          name: "Камера участника 3",
          locked: false,
          visible: true,
        },
        {
          id: "graphics",
          type: "graphics",
          name: "Графика и титры",
          locked: false,
          visible: true,
        },
        {
          id: "audio-mix",
          type: "audio",
          name: "Сведенный звук",
          locked: false,
          visible: true,
        },
      ],
      multiCameraTemplates: ["grid-3x1", "grid-2x2", "split-vertical-3"],
    },

    placeholders: {
      intro: {
        duration: 60,
        templateId: "podcast-intro",
        required: true,
      },
      outro: {
        duration: 60,
        templateId: "podcast-outro",
        required: true,
      },
      mainContent: {
        minDuration: 2400,
        maxDuration: 7200,
      },
      chapters: {
        auto: true,
        interval: 600, // Глава каждые 10 минут
      },
    },

    settings: {
      resolution: "1920x1080",
      frameRate: "30",
      aspectRatio: {
        label: "16:9",
        textLabel: "Широкоэкнранный",
        description: "YouTube",
        value: {
          width: 1920,
          height: 1080,
          name: "16:9",
        },
      },
      colorSpace: "sdr",
    },
  },
]
