/**
 * Platform Configurations
 * Конфигурации для всех поддерживаемых платформ
 */

import {
  ContentType,
  CTAType,
  DayOfWeek,
  PenaltyType,
  Platform,
  PlatformId,
  PlatformImportance,
  SignalType,
} from "@timeline-studio/domains/shared/types/ai-tools/platform-adaptation"

type PlatformIdString =
  | "youtube"
  | "youtube_shorts"
  | "tiktok"
  | "instagram_reels"
  | "instagram_feed"
  | "instagram_stories"
  | "facebook"
  | "twitter"
  | "telegram"
  | "linkedin"
  | "vimeo"
  | "twitch"
  | "snapchat"

export const PLATFORM_CONFIGS: Record<PlatformIdString, Platform> = {
  youtube: {
    id: PlatformId.YOUTUBE,
    name: "YouTube",
    specifications: {
      videoSpecs: {
        resolution: [
          { width: 3840, height: 2160, preferred: true }, // 4K
          { width: 1920, height: 1080, preferred: true }, // 1080p
          { width: 1280, height: 720, preferred: false }, // 720p
        ],
        aspectRatio: [{ ratio: "16:9", width: 16, height: 9, preferred: true }],
        frameRate: [24, 25, 30, 48, 50, 60],
        codec: ["h264", "h265", "vp9"],
        bitrate: { min: 1000000, max: 68000000, recommended: 8000000 },
      },
      audioSpecs: {
        channels: [1, 2, 5.1],
        sampleRate: [48000],
        codec: ["aac", "opus"],
        bitrate: { min: 128000, max: 512000, recommended: 256000 },
      },
      duration: {
        min: 0,
        max: 43200, // 12 hours
        optimal: { min: 480, max: 1200 }, // 8-20 minutes
      },
      fileSize: {
        max: 137438953472, // 128 GB
        recommended: 8589934592, // 8 GB
      },
      features: {
        captions: true,
        hashtags: true,
        mentions: true,
        thumbnails: true,
        endScreens: true,
        chapters: true,
        polls: true,
        stickers: false,
      },
    },
    bestPractices: {
      engagement: {
        hookDuration: 15,
        ctaPlacement: [
          { timing: "beginning", duration: 5, type: CTAType.SUBSCRIBE },
          { timing: "end", duration: 20, type: CTAType.SUBSCRIBE },
        ],
        interactionPrompts: ["Like", "Subscribe", "Comment", "Share"],
      },
      content: {
        preferredTypes: [ContentType.TUTORIAL, ContentType.VLOG, ContentType.DOCUMENTARY, ContentType.MUSIC_VIDEO],
        avoidTypes: [],
        toneRecommendations: ["Engaging", "Informative", "Entertaining"],
        visualStyle: ["High quality", "Good lighting", "Stable footage"],
      },
      timing: {
        optimalTimes: [
          { dayOfWeek: DayOfWeek.TUESDAY, startHour: 14, endHour: 16, timezone: "UTC" },
          { dayOfWeek: DayOfWeek.WEDNESDAY, startHour: 14, endHour: 16, timezone: "UTC" },
          { dayOfWeek: DayOfWeek.THURSDAY, startHour: 14, endHour: 16, timezone: "UTC" },
        ],
        frequency: { min: 1, max: 7, unit: "week" },
        consistency: "Regular upload schedule is key",
      },
      optimization: {
        seo: {
          titleLength: { min: 10, max: 70, optimal: 60 },
          descriptionLength: { min: 100, max: 5000, optimal: 200 },
          keywordDensity: 0.02,
          hashtagCount: { min: 3, max: 15, optimal: 8 },
        },
        thumbnails: {
          resolution: { width: 1280, height: 720, preferred: true },
          textOverlay: true,
          contrast: 0.7,
          brandingPlacement: "bottom-right",
        },
        accessibility: {
          captions: { required: true, languages: ["en"], accuracy: 0.95 },
          audioDescription: false,
          colorContrast: 4.5,
        },
      },
    },
    algorithms: {
      signals: [
        { type: SignalType.VIEW_DURATION, importance: PlatformImportance.CRITICAL, timeframe: 48 },
        { type: SignalType.LIKES, importance: PlatformImportance.HIGH, timeframe: 24 },
        { type: SignalType.COMMENTS, importance: PlatformImportance.HIGH, timeframe: 24 },
        { type: SignalType.SHARES, importance: PlatformImportance.MEDIUM, timeframe: 72 },
      ],
      weights: [
        { signal: SignalType.VIEW_DURATION, weight: 0.4 },
        { signal: SignalType.LIKES, weight: 0.2 },
        { signal: SignalType.COMMENTS, weight: 0.2 },
        { signal: SignalType.SHARES, weight: 0.1 },
        { signal: SignalType.SAVES, weight: 0.1 },
      ],
      penalties: [
        { type: PenaltyType.LOW_QUALITY, severity: 0.8, description: "Poor video/audio quality" },
        { type: PenaltyType.CLICKBAIT, severity: 0.6, description: "Misleading title/thumbnail" },
      ],
    },
  },

  youtube_shorts: {
    id: PlatformId.YOUTUBE_SHORTS,
    name: "YouTube Shorts",
    specifications: {
      videoSpecs: {
        resolution: [
          { width: 1080, height: 1920, preferred: true }, // 9:16
          { width: 720, height: 1280, preferred: false },
        ],
        aspectRatio: [{ ratio: "9:16", width: 9, height: 16, preferred: true }],
        frameRate: [24, 25, 30, 60],
        codec: ["h264", "h265"],
        bitrate: { min: 1000000, max: 20000000, recommended: 5000000 },
      },
      audioSpecs: {
        channels: [1, 2],
        sampleRate: [48000],
        codec: ["aac"],
        bitrate: { min: 128000, max: 256000, recommended: 192000 },
      },
      duration: {
        min: 0,
        max: 60,
        optimal: { min: 15, max: 45 },
      },
      fileSize: {
        max: 2147483648, // 2 GB
        recommended: 104857600, // 100 MB
      },
      features: {
        captions: true,
        hashtags: true,
        mentions: true,
        thumbnails: false,
        endScreens: false,
        chapters: false,
        polls: false,
        stickers: true,
      },
    },
    bestPractices: {
      engagement: {
        hookDuration: 3,
        ctaPlacement: [{ timing: "middle", duration: 2, type: CTAType.FOLLOW }],
        interactionPrompts: ["Swipe up", "Like", "Share"],
      },
      content: {
        preferredTypes: [ContentType.TUTORIAL, ContentType.VLOG, ContentType.COMMERCIAL],
        avoidTypes: [ContentType.DOCUMENTARY],
        toneRecommendations: ["Quick", "Engaging", "Visual"],
        visualStyle: ["Vertical", "Fast-paced", "Eye-catching"],
      },
      timing: {
        optimalTimes: [
          { dayOfWeek: DayOfWeek.MONDAY, startHour: 6, endHour: 10, timezone: "UTC" },
          { dayOfWeek: DayOfWeek.MONDAY, startHour: 19, endHour: 23, timezone: "UTC" },
        ],
        frequency: { min: 3, max: 14, unit: "week" },
        consistency: "Multiple daily posts work well",
      },
      optimization: {
        seo: {
          titleLength: { min: 10, max: 100, optimal: 40 },
          descriptionLength: { min: 0, max: 100, optimal: 50 },
          keywordDensity: 0.03,
          hashtagCount: { min: 3, max: 30, optimal: 10 },
        },
        thumbnails: {
          resolution: { width: 1080, height: 1920, preferred: true },
          textOverlay: true,
          contrast: 0.8,
          brandingPlacement: "top",
        },
        accessibility: {
          captions: { required: true, languages: ["en"], accuracy: 0.9 },
          audioDescription: false,
          colorContrast: 4.5,
        },
      },
    },
    algorithms: {
      signals: [
        { type: SignalType.VIEW_DURATION, importance: PlatformImportance.CRITICAL, timeframe: 24 },
        { type: SignalType.REPLAYS, importance: PlatformImportance.HIGH, timeframe: 24 },
        { type: SignalType.SHARES, importance: PlatformImportance.HIGH, timeframe: 24 },
      ],
      weights: [
        { signal: SignalType.VIEW_DURATION, weight: 0.35 },
        { signal: SignalType.REPLAYS, weight: 0.25 },
        { signal: SignalType.SHARES, weight: 0.2 },
        { signal: SignalType.LIKES, weight: 0.2 },
      ],
      penalties: [{ type: PenaltyType.REPOST, severity: 0.7, description: "Reposted content" }],
    },
  },

  tiktok: {
    id: PlatformId.TIKTOK,
    name: "TikTok",
    specifications: {
      videoSpecs: {
        resolution: [
          { width: 1080, height: 1920, preferred: true },
          { width: 720, height: 1280, preferred: false },
        ],
        aspectRatio: [{ ratio: "9:16", width: 9, height: 16, preferred: true }],
        frameRate: [24, 25, 30, 60],
        codec: ["h264", "h265"],
        bitrate: { min: 1000000, max: 50000000, recommended: 8000000 },
      },
      audioSpecs: {
        channels: [2],
        sampleRate: [44100, 48000],
        codec: ["aac"],
        bitrate: { min: 96000, max: 256000, recommended: 128000 },
      },
      duration: {
        min: 3,
        max: 600, // 10 minutes
        optimal: { min: 15, max: 60 },
      },
      fileSize: {
        max: 4294967296, // 4 GB
        recommended: 524288000, // 500 MB
      },
      features: {
        captions: true,
        hashtags: true,
        mentions: true,
        thumbnails: true,
        endScreens: false,
        chapters: false,
        polls: true,
        stickers: true,
      },
    },
    bestPractices: {
      engagement: {
        hookDuration: 3,
        ctaPlacement: [{ timing: "end", duration: 3, type: CTAType.FOLLOW }],
        interactionPrompts: ["Follow", "Like", "Share", "Comment"],
      },
      content: {
        preferredTypes: [ContentType.VLOG, ContentType.MUSIC_VIDEO, ContentType.COMMERCIAL, ContentType.TUTORIAL],
        avoidTypes: [ContentType.DOCUMENTARY],
        toneRecommendations: ["Trendy", "Fun", "Authentic", "Creative"],
        visualStyle: ["Vertical", "Dynamic transitions", "Effects"],
      },
      timing: {
        optimalTimes: [
          { dayOfWeek: DayOfWeek.TUESDAY, startHour: 6, endHour: 10, timezone: "EST" },
          { dayOfWeek: DayOfWeek.THURSDAY, startHour: 7, endHour: 11, timezone: "EST" },
          { dayOfWeek: DayOfWeek.FRIDAY, startHour: 5, endHour: 9, timezone: "EST" },
        ],
        frequency: { min: 3, max: 21, unit: "week" },
        consistency: "3-5 posts per day optimal",
      },
      optimization: {
        seo: {
          titleLength: { min: 0, max: 150, optimal: 80 },
          descriptionLength: { min: 0, max: 2200, optimal: 150 },
          keywordDensity: 0.03,
          hashtagCount: { min: 3, max: 100, optimal: 5 },
        },
        thumbnails: {
          resolution: { width: 1080, height: 1920, preferred: true },
          textOverlay: false,
          contrast: 0.8,
          brandingPlacement: "none",
        },
        accessibility: {
          captions: { required: false, languages: ["en"], accuracy: 0.85 },
          audioDescription: false,
          colorContrast: 4.0,
        },
      },
    },
    algorithms: {
      signals: [
        { type: SignalType.VIEW_DURATION, importance: PlatformImportance.CRITICAL, timeframe: 12 },
        { type: SignalType.SHARES, importance: PlatformImportance.CRITICAL, timeframe: 12 },
        { type: SignalType.COMMENTS, importance: PlatformImportance.HIGH, timeframe: 24 },
        { type: SignalType.PROFILE_VISITS, importance: PlatformImportance.HIGH, timeframe: 24 },
      ],
      weights: [
        { signal: SignalType.VIEW_DURATION, weight: 0.3 },
        { signal: SignalType.SHARES, weight: 0.25 },
        { signal: SignalType.COMMENTS, weight: 0.2 },
        { signal: SignalType.PROFILE_VISITS, weight: 0.15 },
        { signal: SignalType.FOLLOW_RATE, weight: 0.1 },
      ],
      penalties: [
        { type: PenaltyType.SPAM, severity: 0.9, description: "Spammy content" },
        { type: PenaltyType.REPOST, severity: 0.6, description: "Unoriginal content" },
      ],
    },
  },

  instagram_reels: {
    id: PlatformId.INSTAGRAM_REELS,
    name: "Instagram Reels",
    specifications: {
      videoSpecs: {
        resolution: [
          { width: 1080, height: 1920, preferred: true },
          { width: 1080, height: 1350, preferred: false },
        ],
        aspectRatio: [
          { ratio: "9:16", width: 9, height: 16, preferred: true },
          { ratio: "4:5", width: 4, height: 5, preferred: false },
        ],
        frameRate: [23.976, 24, 25, 29.97, 30, 60],
        codec: ["h264", "h265"],
        bitrate: { min: 1000000, max: 35000000, recommended: 5000000 },
      },
      audioSpecs: {
        channels: [1, 2],
        sampleRate: [44100, 48000],
        codec: ["aac"],
        bitrate: { min: 96000, max: 256000, recommended: 128000 },
      },
      duration: {
        min: 3,
        max: 90,
        optimal: { min: 15, max: 30 },
      },
      fileSize: {
        max: 1073741824, // 1 GB
        recommended: 104857600, // 100 MB
      },
      features: {
        captions: true,
        hashtags: true,
        mentions: true,
        thumbnails: true,
        endScreens: false,
        chapters: false,
        polls: false,
        stickers: true,
      },
    },
    bestPractices: {
      engagement: {
        hookDuration: 3,
        ctaPlacement: [{ timing: "end", duration: 2, type: CTAType.FOLLOW }],
        interactionPrompts: ["Double tap", "Comment", "Share", "Save"],
      },
      content: {
        preferredTypes: [ContentType.VLOG, ContentType.TUTORIAL, ContentType.MUSIC_VIDEO, ContentType.COMMERCIAL],
        avoidTypes: [ContentType.DOCUMENTARY, ContentType.NEWS],
        toneRecommendations: ["Aesthetic", "Trendy", "Inspirational"],
        visualStyle: ["High quality", "Filtered", "On-brand"],
      },
      timing: {
        optimalTimes: [
          { dayOfWeek: DayOfWeek.MONDAY, startHour: 11, endHour: 13, timezone: "EST" },
          { dayOfWeek: DayOfWeek.TUESDAY, startHour: 11, endHour: 13, timezone: "EST" },
          { dayOfWeek: DayOfWeek.WEDNESDAY, startHour: 11, endHour: 13, timezone: "EST" },
        ],
        frequency: { min: 4, max: 14, unit: "week" },
        consistency: "Daily posting recommended",
      },
      optimization: {
        seo: {
          titleLength: { min: 0, max: 2200, optimal: 125 },
          descriptionLength: { min: 0, max: 2200, optimal: 125 },
          keywordDensity: 0.02,
          hashtagCount: { min: 3, max: 30, optimal: 10 },
        },
        thumbnails: {
          resolution: { width: 1080, height: 1920, preferred: true },
          textOverlay: true,
          contrast: 0.7,
          brandingPlacement: "subtle",
        },
        accessibility: {
          captions: { required: false, languages: ["en"], accuracy: 0.85 },
          audioDescription: false,
          colorContrast: 4.0,
        },
      },
    },
    algorithms: {
      signals: [
        { type: SignalType.SAVES, importance: PlatformImportance.CRITICAL, timeframe: 24 },
        { type: SignalType.SHARES, importance: PlatformImportance.CRITICAL, timeframe: 24 },
        { type: SignalType.VIEW_DURATION, importance: PlatformImportance.HIGH, timeframe: 48 },
        { type: SignalType.COMMENTS, importance: PlatformImportance.MEDIUM, timeframe: 48 },
      ],
      weights: [
        { signal: SignalType.SAVES, weight: 0.3 },
        { signal: SignalType.SHARES, weight: 0.25 },
        { signal: SignalType.VIEW_DURATION, weight: 0.25 },
        { signal: SignalType.COMMENTS, weight: 0.1 },
        { signal: SignalType.LIKES, weight: 0.1 },
      ],
      penalties: [{ type: PenaltyType.LOW_QUALITY, severity: 0.7, description: "Low resolution or poor audio" }],
    },
  },

  telegram: {
    id: PlatformId.TELEGRAM,
    name: "Telegram",
    specifications: {
      videoSpecs: {
        resolution: [
          { width: 1920, height: 1080, preferred: true },
          { width: 1280, height: 720, preferred: true },
          { width: 640, height: 480, preferred: false },
        ],
        aspectRatio: [
          { ratio: "16:9", width: 16, height: 9, preferred: true },
          { ratio: "9:16", width: 9, height: 16, preferred: false },
          { ratio: "1:1", width: 1, height: 1, preferred: false },
        ],
        frameRate: [24, 25, 30, 60],
        codec: ["h264", "h265"],
        bitrate: { min: 500000, max: 50000000, recommended: 8000000 },
      },
      audioSpecs: {
        channels: [1, 2],
        sampleRate: [44100, 48000],
        codec: ["aac", "opus"],
        bitrate: { min: 64000, max: 320000, recommended: 128000 },
      },
      duration: {
        min: 0,
        max: 3600, // 60 minutes
        optimal: { min: 30, max: 180 }, // 30 seconds - 3 minutes
      },
      fileSize: {
        max: 2147483648, // 2 GB
        recommended: 52428800, // 50 MB
      },
      features: {
        captions: true,
        hashtags: true,
        mentions: true,
        thumbnails: true,
        endScreens: false,
        chapters: false,
        polls: true,
        stickers: true,
      },
    },
    bestPractices: {
      engagement: {
        hookDuration: 5,
        ctaPlacement: [{ timing: "end", duration: 3, type: CTAType.LINK_IN_BIO }],
        interactionPrompts: ["Join channel", "Share", "React"],
      },
      content: {
        preferredTypes: [ContentType.NEWS, ContentType.TUTORIAL, ContentType.DOCUMENTARY, ContentType.VLOG],
        avoidTypes: [ContentType.COMMERCIAL],
        toneRecommendations: ["Informative", "Direct", "Valuable"],
        visualStyle: ["Clean", "Professional", "Readable captions"],
      },
      timing: {
        optimalTimes: [
          { dayOfWeek: DayOfWeek.MONDAY, startHour: 9, endHour: 11, timezone: "UTC" },
          { dayOfWeek: DayOfWeek.TUESDAY, startHour: 14, endHour: 16, timezone: "UTC" },
          { dayOfWeek: DayOfWeek.THURSDAY, startHour: 18, endHour: 20, timezone: "UTC" },
        ],
        frequency: { min: 1, max: 5, unit: "day" },
        consistency: "Quality over quantity",
      },
      optimization: {
        seo: {
          titleLength: { min: 10, max: 100, optimal: 60 },
          descriptionLength: { min: 0, max: 1024, optimal: 200 },
          keywordDensity: 0.02,
          hashtagCount: { min: 3, max: 10, optimal: 5 },
        },
        thumbnails: {
          resolution: { width: 1280, height: 720, preferred: true },
          textOverlay: true,
          contrast: 0.8,
          brandingPlacement: "bottom",
        },
        accessibility: {
          captions: { required: true, languages: ["en", "ru"], accuracy: 0.95 },
          audioDescription: false,
          colorContrast: 4.5,
        },
      },
    },
    algorithms: {
      signals: [
        { type: SignalType.VIEW_DURATION, importance: PlatformImportance.HIGH, timeframe: 24 },
        { type: SignalType.SHARES, importance: PlatformImportance.CRITICAL, timeframe: 24 },
        { type: SignalType.LIKES, importance: PlatformImportance.HIGH, timeframe: 48 },
        { type: SignalType.SAVES, importance: PlatformImportance.MEDIUM, timeframe: 72 },
      ],
      weights: [
        { signal: SignalType.SHARES, weight: 0.35 },
        { signal: SignalType.VIEW_DURATION, weight: 0.25 },
        { signal: SignalType.LIKES, weight: 0.2 },
        { signal: SignalType.SAVES, weight: 0.1 },
        { signal: SignalType.COMMENTS, weight: 0.1 },
      ],
      penalties: [
        { type: PenaltyType.SPAM, severity: 0.9, description: "Promotional spam" },
        { type: PenaltyType.CLICKBAIT, severity: 0.6, description: "Misleading content" },
      ],
    },
  },

  twitter: {
    id: PlatformId.TWITTER,
    name: "Twitter",
    specifications: {
      videoSpecs: {
        resolution: [
          { width: 1920, height: 1080, preferred: true },
          { width: 1280, height: 720, preferred: true },
        ],
        aspectRatio: [
          { ratio: "16:9", width: 16, height: 9, preferred: true },
          { ratio: "1:1", width: 1, height: 1, preferred: false },
        ],
        frameRate: [24, 25, 30, 60],
        codec: ["h264"],
        bitrate: { min: 1000000, max: 25000000, recommended: 5000000 },
      },
      audioSpecs: {
        channels: [1, 2],
        sampleRate: [44100, 48000],
        codec: ["aac"],
        bitrate: { min: 96000, max: 192000, recommended: 128000 },
      },
      duration: {
        min: 0.5,
        max: 140,
        optimal: { min: 15, max: 45 },
      },
      fileSize: {
        max: 536870912, // 512 MB
        recommended: 52428800, // 50 MB
      },
      features: {
        captions: true,
        hashtags: true,
        mentions: true,
        thumbnails: true,
        endScreens: false,
        chapters: false,
        polls: true,
        stickers: false,
      },
    },
    bestPractices: {
      engagement: {
        hookDuration: 2,
        ctaPlacement: [{ timing: "end", duration: 2, type: CTAType.FOLLOW }],
        interactionPrompts: ["Retweet", "Like", "Reply", "Quote"],
      },
      content: {
        preferredTypes: [ContentType.NEWS, ContentType.VLOG, ContentType.COMMERCIAL],
        avoidTypes: [ContentType.MUSIC_VIDEO],
        toneRecommendations: ["Concise", "Newsworthy", "Conversational"],
        visualStyle: ["Clear", "Subtitled", "Mobile-optimized"],
      },
      timing: {
        optimalTimes: [
          { dayOfWeek: DayOfWeek.WEDNESDAY, startHour: 9, endHour: 10, timezone: "EST" },
          { dayOfWeek: DayOfWeek.FRIDAY, startHour: 9, endHour: 10, timezone: "EST" },
        ],
        frequency: { min: 3, max: 30, unit: "day" },
        consistency: "Multiple daily tweets work well",
      },
      optimization: {
        seo: {
          titleLength: { min: 1, max: 280, optimal: 100 },
          descriptionLength: { min: 0, max: 0, optimal: 0 },
          keywordDensity: 0.02,
          hashtagCount: { min: 1, max: 5, optimal: 2 },
        },
        thumbnails: {
          resolution: { width: 1920, height: 1080, preferred: true },
          textOverlay: true,
          contrast: 0.8,
          brandingPlacement: "minimal",
        },
        accessibility: {
          captions: { required: false, languages: ["en"], accuracy: 0.9 },
          audioDescription: false,
          colorContrast: 4.5,
        },
      },
    },
    algorithms: {
      signals: [
        { type: SignalType.LIKES, importance: PlatformImportance.HIGH, timeframe: 6 },
        { type: SignalType.SHARES, importance: PlatformImportance.CRITICAL, timeframe: 6 },
        { type: SignalType.COMMENTS, importance: PlatformImportance.HIGH, timeframe: 12 },
      ],
      weights: [
        { signal: SignalType.SHARES, weight: 0.4 },
        { signal: SignalType.COMMENTS, weight: 0.3 },
        { signal: SignalType.LIKES, weight: 0.2 },
        { signal: SignalType.VIEW_DURATION, weight: 0.1 },
      ],
      penalties: [{ type: PenaltyType.SPAM, severity: 0.9, description: "Repetitive content" }],
    },
  },

  instagram_feed: {
    id: PlatformId.INSTAGRAM_FEED,
    name: "Instagram Feed",
    specifications: {
      videoSpecs: {
        resolution: [
          { width: 1080, height: 1080, preferred: true },
          { width: 1080, height: 1350, preferred: false },
        ],
        aspectRatio: [
          { ratio: "1:1", width: 1, height: 1, preferred: true },
          { ratio: "4:5", width: 4, height: 5, preferred: false },
        ],
        frameRate: [24, 25, 30, 60],
        codec: ["h264", "h265"],
        bitrate: { min: 1000000, max: 35000000, recommended: 5000000 },
      },
      audioSpecs: {
        channels: [1, 2],
        sampleRate: [44100, 48000],
        codec: ["aac"],
        bitrate: { min: 96000, max: 256000, recommended: 128000 },
      },
      duration: {
        min: 3,
        max: 60,
        optimal: { min: 30, max: 60 },
      },
      fileSize: {
        max: 1073741824, // 1 GB
        recommended: 104857600, // 100 MB
      },
      features: {
        captions: true,
        hashtags: true,
        mentions: true,
        thumbnails: true,
        endScreens: false,
        chapters: false,
        polls: false,
        stickers: false,
      },
    },
    bestPractices: {
      engagement: {
        hookDuration: 3,
        ctaPlacement: [{ timing: "end", duration: 2, type: CTAType.LINK_IN_BIO }],
        interactionPrompts: ["Like", "Comment", "Save", "Share"],
      },
      content: {
        preferredTypes: [ContentType.VLOG, ContentType.TUTORIAL, ContentType.COMMERCIAL],
        avoidTypes: [ContentType.NEWS],
        toneRecommendations: ["Aesthetic", "Inspirational", "Educational"],
        visualStyle: ["High quality", "Cohesive theme", "Brand consistency"],
      },
      timing: {
        optimalTimes: [
          { dayOfWeek: DayOfWeek.TUESDAY, startHour: 11, endHour: 13, timezone: "EST" },
          { dayOfWeek: DayOfWeek.WEDNESDAY, startHour: 11, endHour: 13, timezone: "EST" },
        ],
        frequency: { min: 3, max: 7, unit: "week" },
        consistency: "Regular posting schedule",
      },
      optimization: {
        seo: {
          titleLength: { min: 0, max: 2200, optimal: 125 },
          descriptionLength: { min: 0, max: 2200, optimal: 125 },
          keywordDensity: 0.02,
          hashtagCount: { min: 5, max: 30, optimal: 15 },
        },
        thumbnails: {
          resolution: { width: 1080, height: 1080, preferred: true },
          textOverlay: true,
          contrast: 0.7,
          brandingPlacement: "consistent",
        },
        accessibility: {
          captions: { required: false, languages: ["en"], accuracy: 0.85 },
          audioDescription: false,
          colorContrast: 4.0,
        },
      },
    },
    algorithms: {
      signals: [
        { type: SignalType.SAVES, importance: PlatformImportance.CRITICAL, timeframe: 24 },
        { type: SignalType.SHARES, importance: PlatformImportance.HIGH, timeframe: 24 },
        { type: SignalType.COMMENTS, importance: PlatformImportance.HIGH, timeframe: 48 },
      ],
      weights: [
        { signal: SignalType.SAVES, weight: 0.35 },
        { signal: SignalType.SHARES, weight: 0.25 },
        { signal: SignalType.COMMENTS, weight: 0.2 },
        { signal: SignalType.LIKES, weight: 0.2 },
      ],
      penalties: [],
    },
  },

  instagram_stories: {
    id: PlatformId.INSTAGRAM_STORIES,
    name: "Instagram Stories",
    specifications: {
      videoSpecs: {
        resolution: [{ width: 1080, height: 1920, preferred: true }],
        aspectRatio: [{ ratio: "9:16", width: 9, height: 16, preferred: true }],
        frameRate: [24, 25, 30, 60],
        codec: ["h264", "h265"],
        bitrate: { min: 1000000, max: 20000000, recommended: 3500000 },
      },
      audioSpecs: {
        channels: [1, 2],
        sampleRate: [44100, 48000],
        codec: ["aac"],
        bitrate: { min: 96000, max: 256000, recommended: 128000 },
      },
      duration: {
        min: 1,
        max: 60,
        optimal: { min: 5, max: 15 },
      },
      fileSize: {
        max: 536870912, // 512 MB
        recommended: 52428800, // 50 MB
      },
      features: {
        captions: true,
        hashtags: true,
        mentions: true,
        thumbnails: false,
        endScreens: false,
        chapters: false,
        polls: true,
        stickers: true,
      },
    },
    bestPractices: {
      engagement: {
        hookDuration: 2,
        ctaPlacement: [{ timing: "middle", duration: 2, type: CTAType.SWIPE_UP }],
        interactionPrompts: ["Swipe up", "Reply", "Poll", "Question"],
      },
      content: {
        preferredTypes: [ContentType.VLOG, ContentType.TUTORIAL],
        avoidTypes: [ContentType.DOCUMENTARY, ContentType.NEWS],
        toneRecommendations: ["Casual", "Behind-the-scenes", "Interactive"],
        visualStyle: ["Vertical", "Quick", "Interactive elements"],
      },
      timing: {
        optimalTimes: [
          { dayOfWeek: DayOfWeek.MONDAY, startHour: 7, endHour: 9, timezone: "EST" },
          { dayOfWeek: DayOfWeek.MONDAY, startHour: 19, endHour: 21, timezone: "EST" },
        ],
        frequency: { min: 1, max: 7, unit: "day" },
        consistency: "Daily stories work best",
      },
      optimization: {
        seo: {
          titleLength: { min: 0, max: 0, optimal: 0 },
          descriptionLength: { min: 0, max: 0, optimal: 0 },
          keywordDensity: 0,
          hashtagCount: { min: 1, max: 10, optimal: 3 },
        },
        thumbnails: {
          resolution: { width: 1080, height: 1920, preferred: true },
          textOverlay: true,
          contrast: 0.8,
          brandingPlacement: "top",
        },
        accessibility: {
          captions: { required: false, languages: ["en"], accuracy: 0.8 },
          audioDescription: false,
          colorContrast: 4.0,
        },
      },
    },
    algorithms: {
      signals: [
        { type: SignalType.VIEW_DURATION, importance: PlatformImportance.HIGH, timeframe: 24 },
        { type: SignalType.PROFILE_VISITS, importance: PlatformImportance.HIGH, timeframe: 24 },
      ],
      weights: [
        { signal: SignalType.VIEW_DURATION, weight: 0.4 },
        { signal: SignalType.PROFILE_VISITS, weight: 0.3 },
        { signal: SignalType.SHARES, weight: 0.3 },
      ],
      penalties: [],
    },
  },

  facebook: {
    id: PlatformId.FACEBOOK,
    name: "Facebook",
    specifications: {
      videoSpecs: {
        resolution: [
          { width: 1920, height: 1080, preferred: true },
          { width: 1280, height: 720, preferred: false },
        ],
        aspectRatio: [
          { ratio: "16:9", width: 16, height: 9, preferred: true },
          { ratio: "1:1", width: 1, height: 1, preferred: false },
          { ratio: "9:16", width: 9, height: 16, preferred: false },
        ],
        frameRate: [24, 25, 30, 60],
        codec: ["h264"],
        bitrate: { min: 1000000, max: 40000000, recommended: 8000000 },
      },
      audioSpecs: {
        channels: [1, 2],
        sampleRate: [44100, 48000],
        codec: ["aac"],
        bitrate: { min: 96000, max: 256000, recommended: 128000 },
      },
      duration: {
        min: 1,
        max: 14400, // 240 minutes
        optimal: { min: 60, max: 180 },
      },
      fileSize: {
        max: 10737418240, // 10 GB
        recommended: 1073741824, // 1 GB
      },
      features: {
        captions: true,
        hashtags: true,
        mentions: true,
        thumbnails: true,
        endScreens: false,
        chapters: false,
        polls: true,
        stickers: false,
      },
    },
    bestPractices: {
      engagement: {
        hookDuration: 3,
        ctaPlacement: [
          { timing: "beginning", duration: 3, type: CTAType.LIKE },
          { timing: "end", duration: 5, type: CTAType.SHARE },
        ],
        interactionPrompts: ["Like", "Share", "Comment", "React"],
      },
      content: {
        preferredTypes: [ContentType.VLOG, ContentType.NEWS, ContentType.DOCUMENTARY],
        avoidTypes: [],
        toneRecommendations: ["Informative", "Emotional", "Shareable"],
        visualStyle: ["Clear captions", "Square format works well", "Eye-catching"],
      },
      timing: {
        optimalTimes: [
          { dayOfWeek: DayOfWeek.THURSDAY, startHour: 13, endHour: 16, timezone: "EST" },
          { dayOfWeek: DayOfWeek.FRIDAY, startHour: 13, endHour: 16, timezone: "EST" },
        ],
        frequency: { min: 3, max: 7, unit: "week" },
        consistency: "Regular posting important",
      },
      optimization: {
        seo: {
          titleLength: { min: 10, max: 255, optimal: 80 },
          descriptionLength: { min: 0, max: 5000, optimal: 200 },
          keywordDensity: 0.02,
          hashtagCount: { min: 3, max: 10, optimal: 5 },
        },
        thumbnails: {
          resolution: { width: 1200, height: 630, preferred: true },
          textOverlay: true,
          contrast: 0.7,
          brandingPlacement: "bottom",
        },
        accessibility: {
          captions: { required: true, languages: ["en"], accuracy: 0.9 },
          audioDescription: false,
          colorContrast: 4.5,
        },
      },
    },
    algorithms: {
      signals: [
        { type: SignalType.SHARES, importance: PlatformImportance.CRITICAL, timeframe: 48 },
        { type: SignalType.COMMENTS, importance: PlatformImportance.HIGH, timeframe: 48 },
        { type: SignalType.VIEW_DURATION, importance: PlatformImportance.HIGH, timeframe: 72 },
      ],
      weights: [
        { signal: SignalType.SHARES, weight: 0.35 },
        { signal: SignalType.COMMENTS, weight: 0.25 },
        { signal: SignalType.VIEW_DURATION, weight: 0.2 },
        { signal: SignalType.LIKES, weight: 0.2 },
      ],
      penalties: [
        { type: PenaltyType.CLICKBAIT, severity: 0.8, description: "Clickbait content" },
        { type: PenaltyType.SPAM, severity: 0.9, description: "Spam content" },
      ],
    },
  },

  linkedin: {
    id: PlatformId.LINKEDIN,
    name: "LinkedIn",
    specifications: {
      videoSpecs: {
        resolution: [
          { width: 1920, height: 1080, preferred: true },
          { width: 1280, height: 720, preferred: false },
        ],
        aspectRatio: [
          { ratio: "16:9", width: 16, height: 9, preferred: true },
          { ratio: "1:1", width: 1, height: 1, preferred: false },
        ],
        frameRate: [24, 25, 30],
        codec: ["h264"],
        bitrate: { min: 1000000, max: 30000000, recommended: 5000000 },
      },
      audioSpecs: {
        channels: [1, 2],
        sampleRate: [44100, 48000],
        codec: ["aac"],
        bitrate: { min: 96000, max: 192000, recommended: 128000 },
      },
      duration: {
        min: 3,
        max: 600, // 10 minutes
        optimal: { min: 30, max: 120 },
      },
      fileSize: {
        max: 5368709120, // 5 GB
        recommended: 209715200, // 200 MB
      },
      features: {
        captions: true,
        hashtags: true,
        mentions: true,
        thumbnails: true,
        endScreens: false,
        chapters: false,
        polls: true,
        stickers: false,
      },
    },
    bestPractices: {
      engagement: {
        hookDuration: 5,
        ctaPlacement: [{ timing: "end", duration: 5, type: CTAType.FOLLOW }],
        interactionPrompts: ["Follow", "Comment", "Share", "React"],
      },
      content: {
        preferredTypes: [ContentType.TUTORIAL, ContentType.DOCUMENTARY, ContentType.NEWS],
        avoidTypes: [ContentType.MUSIC_VIDEO],
        toneRecommendations: ["Professional", "Educational", "Insightful"],
        visualStyle: ["Professional quality", "Clear audio", "Subtitles"],
      },
      timing: {
        optimalTimes: [
          { dayOfWeek: DayOfWeek.TUESDAY, startHour: 8, endHour: 10, timezone: "EST" },
          { dayOfWeek: DayOfWeek.WEDNESDAY, startHour: 8, endHour: 10, timezone: "EST" },
          { dayOfWeek: DayOfWeek.THURSDAY, startHour: 8, endHour: 10, timezone: "EST" },
        ],
        frequency: { min: 1, max: 5, unit: "week" },
        consistency: "Consistent professional content",
      },
      optimization: {
        seo: {
          titleLength: { min: 10, max: 150, optimal: 70 },
          descriptionLength: { min: 0, max: 3000, optimal: 150 },
          keywordDensity: 0.02,
          hashtagCount: { min: 3, max: 10, optimal: 5 },
        },
        thumbnails: {
          resolution: { width: 1200, height: 627, preferred: true },
          textOverlay: true,
          contrast: 0.6,
          brandingPlacement: "professional",
        },
        accessibility: {
          captions: { required: true, languages: ["en"], accuracy: 0.95 },
          audioDescription: false,
          colorContrast: 4.5,
        },
      },
    },
    algorithms: {
      signals: [
        { type: SignalType.COMMENTS, importance: PlatformImportance.CRITICAL, timeframe: 48 },
        { type: SignalType.SHARES, importance: PlatformImportance.HIGH, timeframe: 48 },
        { type: SignalType.VIEW_DURATION, importance: PlatformImportance.HIGH, timeframe: 72 },
      ],
      weights: [
        { signal: SignalType.COMMENTS, weight: 0.35 },
        { signal: SignalType.SHARES, weight: 0.3 },
        { signal: SignalType.VIEW_DURATION, weight: 0.2 },
        { signal: SignalType.LIKES, weight: 0.15 },
      ],
      penalties: [
        { type: PenaltyType.SPAM, severity: 0.9, description: "Promotional spam" },
        { type: PenaltyType.INAPPROPRIATE, severity: 0.95, description: "Unprofessional content" },
      ],
    },
  },

  vimeo: {
    id: PlatformId.VIMEO,
    name: "Vimeo",
    specifications: {
      videoSpecs: {
        resolution: [
          { width: 7680, height: 4320, preferred: false }, // 8K
          { width: 3840, height: 2160, preferred: true }, // 4K
          { width: 1920, height: 1080, preferred: true },
        ],
        aspectRatio: [
          { ratio: "16:9", width: 16, height: 9, preferred: true },
          { ratio: "21:9", width: 21, height: 9, preferred: false },
          { ratio: "4:3", width: 4, height: 3, preferred: false },
        ],
        frameRate: [23.976, 24, 25, 29.97, 30, 48, 50, 59.94, 60],
        codec: ["h264", "h265", "prores"],
        bitrate: { min: 5000000, max: 500000000, recommended: 50000000 },
      },
      audioSpecs: {
        channels: [1, 2, 5.1],
        sampleRate: [44100, 48000, 96000],
        codec: ["aac", "pcm"],
        bitrate: { min: 128000, max: 768000, recommended: 320000 },
      },
      duration: {
        min: 0,
        max: 7200, // 2 hours for free accounts
        optimal: { min: 180, max: 1200 },
      },
      fileSize: {
        max: 26843545600, // 25 GB for Pro accounts
        recommended: 5368709120, // 5 GB
      },
      features: {
        captions: true,
        hashtags: true,
        mentions: false,
        thumbnails: true,
        endScreens: true,
        chapters: true,
        polls: false,
        stickers: false,
      },
    },
    bestPractices: {
      engagement: {
        hookDuration: 10,
        ctaPlacement: [{ timing: "end", duration: 10, type: CTAType.VISIT }],
        interactionPrompts: ["Like", "Share", "Follow"],
      },
      content: {
        preferredTypes: [ContentType.DOCUMENTARY, ContentType.MUSIC_VIDEO, ContentType.COMMERCIAL],
        avoidTypes: [],
        toneRecommendations: ["Cinematic", "Professional", "Artistic"],
        visualStyle: ["High production value", "Color graded", "Cinematic"],
      },
      timing: {
        optimalTimes: [{ dayOfWeek: DayOfWeek.WEDNESDAY, startHour: 10, endHour: 14, timezone: "EST" }],
        frequency: { min: 1, max: 4, unit: "month" },
        consistency: "Quality over quantity",
      },
      optimization: {
        seo: {
          titleLength: { min: 10, max: 128, optimal: 60 },
          descriptionLength: { min: 0, max: 5000, optimal: 300 },
          keywordDensity: 0.02,
          hashtagCount: { min: 5, max: 20, optimal: 10 },
        },
        thumbnails: {
          resolution: { width: 1920, height: 1080, preferred: true },
          textOverlay: false,
          contrast: 0.6,
          brandingPlacement: "minimal",
        },
        accessibility: {
          captions: { required: false, languages: ["en"], accuracy: 0.95 },
          audioDescription: false,
          colorContrast: 4.5,
        },
      },
    },
    algorithms: {
      signals: [
        { type: SignalType.VIEW_DURATION, importance: PlatformImportance.CRITICAL, timeframe: 168 },
        { type: SignalType.LIKES, importance: PlatformImportance.HIGH, timeframe: 168 },
      ],
      weights: [
        { signal: SignalType.VIEW_DURATION, weight: 0.5 },
        { signal: SignalType.LIKES, weight: 0.3 },
        { signal: SignalType.SHARES, weight: 0.2 },
      ],
      penalties: [],
    },
  },

  twitch: {
    id: PlatformId.TWITCH,
    name: "Twitch",
    specifications: {
      videoSpecs: {
        resolution: [
          { width: 1920, height: 1080, preferred: true },
          { width: 1280, height: 720, preferred: false },
        ],
        aspectRatio: [{ ratio: "16:9", width: 16, height: 9, preferred: true }],
        frameRate: [30, 60],
        codec: ["h264"],
        bitrate: { min: 3000000, max: 6000000, recommended: 4500000 },
      },
      audioSpecs: {
        channels: [2],
        sampleRate: [44100, 48000],
        codec: ["aac"],
        bitrate: { min: 96000, max: 160000, recommended: 128000 },
      },
      duration: {
        min: 60,
        max: 172800, // 48 hours
        optimal: { min: 300, max: 1800 }, // 5-30 minutes for clips
      },
      fileSize: {
        max: 107374182400, // 100 GB
        recommended: 1073741824, // 1 GB for clips
      },
      features: {
        captions: false,
        hashtags: true,
        mentions: true,
        thumbnails: true,
        endScreens: false,
        chapters: false,
        polls: true,
        stickers: true,
      },
    },
    bestPractices: {
      engagement: {
        hookDuration: 15,
        ctaPlacement: [{ timing: "middle", duration: 5, type: CTAType.FOLLOW }],
        interactionPrompts: ["Follow", "Subscribe", "Clip", "Raid"],
      },
      content: {
        preferredTypes: [ContentType.GAMING, ContentType.VLOG, ContentType.TUTORIAL],
        avoidTypes: [ContentType.COMMERCIAL],
        toneRecommendations: ["Interactive", "Entertaining", "Community-focused"],
        visualStyle: ["Facecam", "Overlay graphics", "Alerts"],
      },
      timing: {
        optimalTimes: [
          { dayOfWeek: DayOfWeek.FRIDAY, startHour: 19, endHour: 23, timezone: "EST" },
          { dayOfWeek: DayOfWeek.SATURDAY, startHour: 14, endHour: 23, timezone: "EST" },
          { dayOfWeek: DayOfWeek.SUNDAY, startHour: 14, endHour: 22, timezone: "EST" },
        ],
        frequency: { min: 3, max: 7, unit: "week" },
        consistency: "Regular streaming schedule crucial",
      },
      optimization: {
        seo: {
          titleLength: { min: 10, max: 140, optimal: 60 },
          descriptionLength: { min: 0, max: 0, optimal: 0 },
          keywordDensity: 0,
          hashtagCount: { min: 1, max: 5, optimal: 3 },
        },
        thumbnails: {
          resolution: { width: 1920, height: 1080, preferred: true },
          textOverlay: true,
          contrast: 0.8,
          brandingPlacement: "prominent",
        },
        accessibility: {
          captions: { required: false, languages: [], accuracy: 0 },
          audioDescription: false,
          colorContrast: 4.0,
        },
      },
    },
    algorithms: {
      signals: [
        { type: SignalType.VIEW_DURATION, importance: PlatformImportance.CRITICAL, timeframe: 1 },
        { type: SignalType.FOLLOW_RATE, importance: PlatformImportance.HIGH, timeframe: 1 },
      ],
      weights: [
        { signal: SignalType.VIEW_DURATION, weight: 0.4 },
        { signal: SignalType.FOLLOW_RATE, weight: 0.3 },
        { signal: SignalType.COMMENTS, weight: 0.3 },
      ],
      penalties: [],
    },
  },

  snapchat: {
    id: PlatformId.SNAPCHAT,
    name: "Snapchat",
    specifications: {
      videoSpecs: {
        resolution: [
          { width: 1080, height: 1920, preferred: true },
          { width: 720, height: 1280, preferred: false },
        ],
        aspectRatio: [{ ratio: "9:16", width: 9, height: 16, preferred: true }],
        frameRate: [24, 25, 30, 60],
        codec: ["h264"],
        bitrate: { min: 1000000, max: 20000000, recommended: 5000000 },
      },
      audioSpecs: {
        channels: [1, 2],
        sampleRate: [44100, 48000],
        codec: ["aac"],
        bitrate: { min: 96000, max: 192000, recommended: 128000 },
      },
      duration: {
        min: 3,
        max: 60,
        optimal: { min: 5, max: 10 },
      },
      fileSize: {
        max: 1073741824, // 1 GB
        recommended: 33554432, // 32 MB
      },
      features: {
        captions: true,
        hashtags: false,
        mentions: true,
        thumbnails: false,
        endScreens: false,
        chapters: false,
        polls: false,
        stickers: true,
      },
    },
    bestPractices: {
      engagement: {
        hookDuration: 1,
        ctaPlacement: [{ timing: "middle", duration: 1, type: CTAType.SWIPE_UP }],
        interactionPrompts: ["Swipe up", "Screenshot", "Reply"],
      },
      content: {
        preferredTypes: [ContentType.VLOG, ContentType.COMMERCIAL],
        avoidTypes: [ContentType.DOCUMENTARY, ContentType.TUTORIAL],
        toneRecommendations: ["Quick", "Fun", "Casual", "Authentic"],
        visualStyle: ["Vertical", "AR effects", "Quick cuts"],
      },
      timing: {
        optimalTimes: [
          { dayOfWeek: DayOfWeek.MONDAY, startHour: 22, endHour: 23, timezone: "EST" },
          { dayOfWeek: DayOfWeek.TUESDAY, startHour: 22, endHour: 23, timezone: "EST" },
        ],
        frequency: { min: 1, max: 5, unit: "day" },
        consistency: "Frequent, casual content",
      },
      optimization: {
        seo: {
          titleLength: { min: 0, max: 0, optimal: 0 },
          descriptionLength: { min: 0, max: 0, optimal: 0 },
          keywordDensity: 0,
          hashtagCount: { min: 0, max: 0, optimal: 0 },
        },
        thumbnails: {
          resolution: { width: 1080, height: 1920, preferred: true },
          textOverlay: false,
          contrast: 0.8,
          brandingPlacement: "none",
        },
        accessibility: {
          captions: { required: false, languages: ["en"], accuracy: 0.8 },
          audioDescription: false,
          colorContrast: 4.0,
        },
      },
    },
    algorithms: {
      signals: [
        { type: SignalType.VIEW_DURATION, importance: PlatformImportance.CRITICAL, timeframe: 24 },
        { type: SignalType.REPLAYS, importance: PlatformImportance.HIGH, timeframe: 24 },
      ],
      weights: [
        { signal: SignalType.VIEW_DURATION, weight: 0.4 },
        { signal: SignalType.REPLAYS, weight: 0.3 },
        { signal: SignalType.SHARES, weight: 0.3 },
      ],
      penalties: [],
    },
  },
}

// Вспомогательные функции для работы с конфигурациями

export function getPlatformConfig(platformId: PlatformIdString): Platform {
  const config = PLATFORM_CONFIGS[platformId]
  if (!config) {
    throw new Error(`Platform configuration not found for: ${platformId}`)
  }
  return config
}

export function getSupportedPlatforms(): PlatformIdString[] {
  return Object.keys(PLATFORM_CONFIGS) as PlatformIdString[]
}

export function getPlatformsByFeature(feature: keyof Platform["specifications"]["features"]): PlatformIdString[] {
  return Object.entries(PLATFORM_CONFIGS)
    .filter(([_, config]) => config.specifications.features[feature])
    .map(([id]) => id as PlatformIdString)
}

export function getOptimalResolution(platformId: PlatformIdString): { width: number; height: number } {
  const config = getPlatformConfig(platformId)
  const preferred = config.specifications.videoSpecs.resolution.find((r) => r.preferred)
  return preferred || config.specifications.videoSpecs.resolution[0]
}

export function getOptimalAspectRatio(platformId: PlatformIdString): { ratio: string; width: number; height: number } {
  const config = getPlatformConfig(platformId)
  const preferred = config.specifications.videoSpecs.aspectRatio.find((r) => r.preferred)
  return preferred || config.specifications.videoSpecs.aspectRatio[0]
}
