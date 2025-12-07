import type { ProjectTemplate } from "../types"

/**
 * Шаблоны для социальных сетей
 */
export const socialTemplates: ProjectTemplate[] = [
  {
    id: "instagram-reel",
    name: {
      ru: "Instagram Reels",
      en: "Instagram Reels",
    },
    description: {
      ru: "Вертикальное видео для Instagram Reels",
      en: "Vertical video for Instagram Reels",
    },
    category: "social",
    targetPlatform: "instagram",
    aspectRatio: "9:16",
    estimatedDuration: 60,
    tags: {
      ru: ["instagram", "reels", "вертикальное"],
      en: ["instagram", "reels", "vertical"],
    },

    structure: {
      sections: [
        {
          id: "hook",
          type: "content",
          name: { ru: "Хук (1-3 сек)", en: "Hook (1-3 sec)" },
          duration: 3,
          position: 0,
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
          name: { ru: "CTA", en: "CTA" },
          duration: 3,
          position: 57,
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
          id: "text-captions",
          type: "text",
          name: "Субтитры",
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
      mainContent: {
        minDuration: 15,
        maxDuration: 90,
      },
      music: {
        required: true,
        loop: false,
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
    id: "instagram-story",
    name: {
      ru: "Instagram Story",
      en: "Instagram Story",
    },
    description: {
      ru: "Короткая история для Instagram",
      en: "Short story for Instagram",
    },
    category: "social",
    targetPlatform: "instagram",
    aspectRatio: "9:16",
    estimatedDuration: 15,
    tags: {
      ru: ["instagram", "story", "история"],
      en: ["instagram", "story"],
    },

    structure: {
      sections: [
        {
          id: "main",
          type: "content",
          name: { ru: "Контент", en: "Content" },
          duration: 15,
          position: 0,
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
          id: "stickers",
          type: "graphics",
          name: "Стикеры",
          locked: false,
          visible: true,
        },
        {
          id: "text",
          type: "text",
          name: "Текст",
          locked: false,
          visible: true,
        },
      ],
    },

    placeholders: {
      mainContent: {
        minDuration: 5,
        maxDuration: 15,
      },
      music: {
        required: false,
        loop: false,
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
    id: "tiktok-video",
    name: {
      ru: "TikTok видео",
      en: "TikTok Video",
    },
    description: {
      ru: "Вертикальное видео для TikTok",
      en: "Vertical video for TikTok",
    },
    category: "social",
    targetPlatform: "tiktok",
    aspectRatio: "9:16",
    estimatedDuration: 60,
    tags: {
      ru: ["tiktok", "вертикальное", "короткое"],
      en: ["tiktok", "vertical", "short"],
    },

    structure: {
      sections: [
        {
          id: "hook",
          type: "content",
          name: { ru: "Хук (первые 3 сек)", en: "Hook (first 3 sec)" },
          duration: 3,
          position: 0,
        },
        {
          id: "main",
          type: "content",
          name: { ru: "Основной контент", en: "Main Content" },
          duration: 54,
          position: 3,
        },
        {
          id: "outro",
          type: "outro",
          name: { ru: "Концовка", en: "Outro" },
          duration: 3,
          position: 57,
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
          id: "text-captions",
          type: "text",
          name: "Текстовые эффекты",
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
        minDuration: 10,
        maxDuration: 180,
      },
      music: {
        required: true,
        loop: false,
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
    id: "facebook-video",
    name: {
      ru: "Facebook видео",
      en: "Facebook Video",
    },
    description: {
      ru: "Квадратное или горизонтальное видео для Facebook",
      en: "Square or horizontal video for Facebook",
    },
    category: "social",
    targetPlatform: "facebook",
    aspectRatio: "1:1",
    estimatedDuration: 120,
    tags: {
      ru: ["facebook", "квадратное", "соцсети"],
      en: ["facebook", "square", "social"],
    },

    structure: {
      sections: [
        {
          id: "intro",
          type: "intro",
          name: { ru: "Интро", en: "Intro" },
          duration: 3,
          position: 0,
        },
        {
          id: "main",
          type: "content",
          name: { ru: "Основной контент", en: "Main Content" },
          duration: 114,
          position: 3,
        },
        {
          id: "cta",
          type: "outro",
          name: { ru: "Призыв к действию", en: "Call to Action" },
          duration: 3,
          position: 117,
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
          id: "subtitles",
          type: "text",
          name: "Субтитры",
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
      intro: {
        duration: 3,
        templateId: "social-intro",
        required: false,
      },
      mainContent: {
        minDuration: 30,
        maxDuration: 600,
      },
      outro: {
        duration: 3,
        templateId: "social-cta",
        required: false,
      },
    },

    settings: {
      resolution: "1080x1080",
      frameRate: "30",
      aspectRatio: {
        label: "1:1",
        textLabel: "Социальные сети",
        description: "Instagram, Social media posts",
        value: {
          width: 1080,
          height: 1080,
          name: "1:1",
        },
      },
      colorSpace: "sdr",
    },
  },
]
