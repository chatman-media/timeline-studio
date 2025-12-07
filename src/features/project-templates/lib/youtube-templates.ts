import type { ProjectTemplate } from "../types"

/**
 * Шаблоны для YouTube
 */
export const youtubeTemplates: ProjectTemplate[] = [
  {
    id: "youtube-standard",
    name: {
      ru: "Стандартное YouTube видео",
      en: "Standard YouTube Video",
    },
    description: {
      ru: "Классический формат с интро, основным контентом и аутро",
      en: "Classic format with intro, main content and outro",
    },
    category: "youtube",
    targetPlatform: "youtube",
    aspectRatio: "16:9",
    estimatedDuration: 600, // 10 минут
    tags: {
      ru: ["youtube", "стандарт", "обзор", "влог"],
      en: ["youtube", "standard", "review", "vlog"],
    },

    structure: {
      sections: [
        {
          id: "intro",
          type: "intro",
          name: { ru: "Интро", en: "Intro" },
          duration: 5,
          position: 0,
          locked: true,
        },
        {
          id: "cold-open",
          type: "content",
          name: { ru: "Вступление (Cold Open)", en: "Cold Open" },
          duration: 10,
          position: 5,
        },
        {
          id: "main-content",
          type: "content",
          name: { ru: "Основной контент", en: "Main Content" },
          duration: 540,
          position: 15,
        },
        {
          id: "outro",
          type: "outro",
          name: { ru: "Концовка", en: "Outro" },
          duration: 8,
          position: 555,
          locked: true,
        },
        {
          id: "end-screen",
          type: "outro",
          name: { ru: "Конечная заставка", en: "End Screen" },
          duration: 7,
          position: 563,
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
          id: "graphics",
          type: "graphics",
          name: "Графика",
          locked: false,
          visible: true,
        },
        {
          id: "audio-main",
          type: "audio",
          name: "Основной звук",
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
        duration: 5,
        templateId: "youtube-intro-modern",
        required: true,
      },
      outro: {
        duration: 8,
        templateId: "youtube-outro-subscribe",
        required: true,
      },
      mainContent: {
        minDuration: 60,
        maxDuration: 3600,
      },
      music: {
        required: false,
        loop: true,
      },
      chapters: {
        auto: true,
        interval: 60,
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
    id: "youtube-short",
    name: {
      ru: "YouTube Shorts",
      en: "YouTube Shorts",
    },
    description: {
      ru: "Вертикальное короткое видео до 60 секунд",
      en: "Vertical short video up to 60 seconds",
    },
    category: "youtube",
    targetPlatform: "youtube",
    aspectRatio: "9:16",
    estimatedDuration: 60,
    tags: {
      ru: ["shorts", "вертикальное", "короткое"],
      en: ["shorts", "vertical", "short"],
    },

    structure: {
      sections: [
        {
          id: "hook",
          type: "content",
          name: { ru: "Хук (первые 3 сек)", en: "Hook (first 3 sec)" },
          duration: 3,
          position: 0,
          locked: false,
        },
        {
          id: "main",
          type: "content",
          name: { ru: "Основной контент", en: "Main Content" },
          duration: 54,
          position: 3,
        },
        {
          id: "cta",
          type: "outro",
          name: { ru: "Призыв к действию", en: "Call to Action" },
          duration: 3,
          position: 57,
          locked: true,
        },
      ],
      tracks: [
        {
          id: "video",
          type: "video",
          name: "Видео",
          locked: false,
          visible: true,
        },
        {
          id: "text",
          type: "text",
          name: "Текст/субтитры",
          locked: false,
          visible: true,
        },
        {
          id: "audio",
          type: "audio",
          name: "Звук",
          locked: false,
          visible: true,
        },
      ],
    },

    placeholders: {
      mainContent: {
        minDuration: 15,
        maxDuration: 60,
      },
      outro: {
        duration: 3,
        templateId: "shorts-cta-subscribe",
        required: true,
      },
    },

    settings: {
      resolution: "1080x1920",
      frameRate: "30",
      aspectRatio: {
        label: "9:16",
        textLabel: "Портрет",
        description: "TikTok, YouTube Shorts",
        value: {
          width: 1080,
          height: 1920,
          name: "9:16",
        },
      },
      colorSpace: "sdr",
    },
  },

  {
    id: "youtube-tutorial",
    name: {
      ru: "Обучающее видео",
      en: "Tutorial Video",
    },
    description: {
      ru: "Структура для пошаговых инструкций и туториалов",
      en: "Structure for step-by-step instructions and tutorials",
    },
    category: "tutorial",
    targetPlatform: "youtube",
    aspectRatio: "16:9",
    estimatedDuration: 900, // 15 минут
    tags: {
      ru: ["туториал", "обучение", "инструкция"],
      en: ["tutorial", "education", "instruction"],
    },

    structure: {
      sections: [
        {
          id: "intro",
          type: "intro",
          name: { ru: "Вступление", en: "Introduction" },
          duration: 10,
          position: 0,
          locked: true,
        },
        {
          id: "overview",
          type: "chapter",
          name: { ru: "Обзор", en: "Overview" },
          duration: 30,
          position: 10,
        },
        {
          id: "step1",
          type: "chapter",
          name: { ru: "Шаг 1", en: "Step 1" },
          duration: 180,
          position: 40,
        },
        {
          id: "step2",
          type: "chapter",
          name: { ru: "Шаг 2", en: "Step 2" },
          duration: 180,
          position: 220,
        },
        {
          id: "step3",
          type: "chapter",
          name: { ru: "Шаг 3", en: "Step 3" },
          duration: 180,
          position: 400,
        },
        {
          id: "summary",
          type: "chapter",
          name: { ru: "Резюме", en: "Summary" },
          duration: 30,
          position: 580,
        },
        {
          id: "outro",
          type: "outro",
          name: { ru: "Заключение", en: "Outro" },
          duration: 10,
          position: 610,
          locked: true,
        },
      ],
      tracks: [
        {
          id: "video-screen",
          type: "video",
          name: "Захват экрана",
          locked: false,
          visible: true,
        },
        {
          id: "video-camera",
          type: "video",
          name: "Камера",
          locked: false,
          visible: true,
        },
        {
          id: "graphics-chapters",
          type: "graphics",
          name: "Заголовки глав",
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
          name: "Фоновая музыка",
          locked: false,
          visible: true,
        },
      ],
    },

    placeholders: {
      intro: {
        duration: 10,
        templateId: "tutorial-intro",
        required: true,
      },
      outro: {
        duration: 10,
        templateId: "tutorial-outro",
        required: true,
      },
      mainContent: {
        minDuration: 300,
        maxDuration: 1800,
      },
      chapters: {
        auto: false, // Главы создаются вручную
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
