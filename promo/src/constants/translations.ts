export const translations = {
  en: {
    docs: {
      title: "Documentation",
      subtitle: "Everything you need to know about Timeline Studio",
      description: "Development guides, API reference, and best practices",
      sections: {
        gettingStarted: {
          title: "Getting Started",
          quickStart: "Quick Start Guide",
          installation: "Installation",
          projectStructure: "Project Structure",
        },
        architecture: {
          title: "Architecture",
          overview: "Architecture Overview",
          frontend: "Frontend Architecture",
          backend: "Backend Architecture",
        },
        development: {
          title: "Development",
          guide: "Development Guide",
          commands: "Development Commands",
          plugins: "Plugin Development",
          codingStandards: "Coding Standards",
          performance: "Performance Guide",
          testing: "Testing Guide",
        },
        api: {
          title: "API Reference",
          media: "Media API",
          timeline: "Timeline API",
          recognition: "Recognition API",
          aiChat: "AI Chat API",
          export: "Export API",
          generated: "Generated API Docs",
        },
        integrations: {
          title: "Integrations",
          claude: "Claude API",
          openai: "OpenAI API",
          youtube: "YouTube API",
          telegram: "Telegram API",
        },
        requirements: {
          title: "Requirements",
          functional: "Functional Requirements",
          technical: "Technical Requirements",
          features: "Feature Specification",
        },
        security: {
          title: "Security",
          guidelines: "Security Guidelines",
          architecture: "Security Architecture",
        },
        deployment: {
          title: "Deployment",
          build: "Build Guide",
          windows: "Windows Build",
          macos: "macOS Build",
          linux: "Linux Build",
          oauth: "OAuth Setup",
        },
        cicd: {
          title: "CI/CD",
          setup: "CI/CD Setup",
          codecov: "Code Coverage",
        },
        testing: {
          title: "Testing",
          guide: "Testing Guide",
          backend: "Backend Testing",
          realMedia: "Testing with Real Media",
        },
        quality: {
          title: "Quality Assurance",
          alphaGuide: "Alpha Testing Guide",
        },
        tasks: {
          title: "Development Tasks",
          active: "Active Tasks",
          roadmap: "Project Roadmap",
        },
      },
      contribute: {
        title: "Want to contribute?",
        description: "Help us improve Timeline Studio by contributing to the documentation or codebase.",
        viewGithub: "View on GitHub",
        contributingGuide: "Contributing Guide",
      },
    },
    about: {
      hero: {
        title: "Redefining Video Editing",
        subtitle: "Building the future of creative content with AI-powered tools",
        founded: "Founded 2025",
        remote: "Remote First",
        openSource: "Open Source",
      },
      mission: {
        title: "Our Mission",
        paragraph1:
          "At Timeline Studio, we believe that video editing should be accessible, intuitive, and powerful. Our mission is to democratize professional video creation by combining cutting-edge AI technology with a user-friendly interface that anyone can master.",
        paragraph2:
          "We're building more than just software – we're creating a platform that empowers creators, streamlines workflows, and pushes the boundaries of what's possible in digital storytelling.",
      },
      values: {
        title: "Our Values",
        innovation: {
          title: "Innovation First",
          description:
            "We push the boundaries of what's possible, integrating the latest AI advancements into practical tools.",
        },
        community: {
          title: "Global Community",
          description: "Supporting creators worldwide with multi-language support and platform-agnostic solutions.",
        },
        efficiency: {
          title: "Speed & Efficiency",
          description: "Every feature is designed to save time and enhance creativity, not complicate workflows.",
        },
        privacy: {
          title: "Privacy Focused",
          description: "Your content is yours. We prioritize user privacy and data security in everything we build.",
        },
        userCentric: {
          title: "User Centric",
          description:
            "Every decision starts with our users. We build features that solve real problems for real creators.",
        },
        openInnovation: {
          title: "Open Innovation",
          description: "We believe in the power of open source and community-driven development.",
        },
      },
      team: {
        title: "Built by Creators, for Creators",
        description:
          "Our team combines expertise in AI, video technology, and user experience design to create tools that truly understand creator needs.",
        founder: "Founder & Lead Developer",
      },
      cta: {
        title: "Join Our Journey",
        description:
          "Whether you're a content creator, developer, or just passionate about the future of video, we'd love to have you as part of our community.",
        contributeGithub: "Contribute on GitHub",
        tryStudio: "Try Timeline Studio",
      },
    },
    changelog: {
      title: "Changelog",
      subtitle: "Track all updates and improvements to Timeline Studio",
      latest: "LATEST",
      newFeatures: "New Features",
      bugFixes: "Bug Fixes",
      improvements: "Improvements",
      breakingChanges: "Breaking Changes",
      viewRelease: "View Release",
      viewAllReleases: "View all releases on GitHub",
    },
    pricing: {
      title: "Simple Pricing",
      subtitle: "Local features free. Cloud features paid. Everything transparent.",
      description:
        "AI avatars, video generation, one-click export to TikTok/YouTube\nEverything you need to dominate social media",
      mostPopular: "MOST POPULAR",
      cloudStorage: "Cloud Storage",
      aiTokens: "AI Tokens",
      localStorage: "Local storage",
      localAI: "Local AI runtime",
      perUserMonth: "/user/month",
      contactUs: "Contact us",
      tiers: {
        free: {
          name: "FREE",
          price: "$0",
          period: "forever",
          description: "Everything that runs locally is free",
          buttonText: "Download Free",
        },
        pro: {
          name: "PRO",
          price: "$19",
          period: "/month",
          description: "Cloud features and premium AI",
          buttonText: "Start Free Trial",
        },
        max: {
          name: "MAX",
          price: "$99",
          period: "/month",
          description: "Maximum AI power for professionals",
          buttonText: "Try MAX",
        },
        team: {
          name: "TEAM",
          price: "$39",
          description: "For collaborative work",
          buttonText: "Start with Team",
        },
        enterprise: {
          name: "ENTERPRISE",
          description: "Custom solutions",
          buttonText: "Contact Sales",
        },
      },
      features: {
        everythingInFree: "Everything in FREE +",
        everythingInPro: "Everything in PRO +",
        everythingInProBase: "Everything in PRO",
        realTimeCollaboration: "Real-time collaboration",
        teamResourceLibraries: "Team resource libraries",
        ssoAuthentication: "SSO authentication",
        onPremiseDeployment: "On-premise deployment",
        unlimitedStorageRendering: "Unlimited storage & rendering",
        customAiModels: "Custom AI models",
        apiAccess: "API access",
        dedicatedManagerSla: "Dedicated manager & SLA",
        whiteLabelCustomization: "White-label customization",
      },
      teamsEnterprise: "For Teams & Enterprise",
      faq: {
        title: "Frequently Asked Questions",
        whatAreTokens: {
          question: "What are AI tokens?",
          answer:
            "AI tokens are used for premium AI models (Claude, GPT-4). Local AI through Ollama works free and doesn't require tokens. PRO includes 80K tokens/mo, MAX provides 500K tokens/mo for power users.",
        },
        canUpgradeDowngrade: {
          question: "Can I upgrade or downgrade?",
          answer:
            "Yes! You can change your plan anytime. When upgrading, you'll get instant access to new features. When downgrading, changes take effect at the next billing cycle.",
        },
        whyFreePowerful: {
          question: "Why is the free version so powerful?",
          answer:
            "We believe in transparency. Everything that can run on your computer is free. You only pay for cloud services and third-party APIs that require our infrastructure costs.",
        },
        isThereFreeTrial: {
          question: "Is there a free trial?",
          answer:
            "Yes! PRO, MAX and TEAM plans come with a 14-day free trial. No credit card required. Cancel anytime. Plus, get 3 months free when switching from competitors.",
        },
      },
    },
    footer: {
      product: {
        title: "PRODUCT",
        about: "About",
        pricing: "Pricing",
        changelog: "Changelog",
        downloads: "Downloads",
        contact: "Contact",
      },
      resources: {
        title: "RESOURCES",
        documentation: "Documentation",
        blog: "Blog",
        faqs: "FAQs",
        submitFeedback: "Submit feedback",
      },
      social: {
        title: "Follow Us",
      },
      copyright: "© 2025 Timeline Studio, Inc.",
    },
    hero: {
      title: "AI-Powered Video Creation",
      subtitle: "Watch how Timeline Studio AI helps you create viral content in seconds",
      description: "Type your idea and let AI do the magic",
      downloadFree: "Download Free",
    },
    mainPage: {
      hero: {
        title: "Professional Video Editor",
        subtitle: "with 100+ AI Tools",
        description: {
          local: "Local features",
          free: "free forever",
          localAI: "Local AI processing.",
          cloud: "Cloud features and premium AI models available with PRO subscription.",
        },
        openSource: "Open Source",
        downloadFree: "Download Free",
        viewGithub: "View on GitHub",
      },
      whatYouCanDo: {
        title: "What You Can",
        titleHighlight: "Create",
        subtitle: "Everything you need for professional video production",
        professional: {
          title: "Professional Video Editing",
          description: "Full-featured timeline with all tools you need",
          examples: {
            multitrack: "Multi-track timeline with unlimited layers",
            frameAccurate: "Frame-accurate editing",
            multicam: "Multicam editing with angle switching",
            compound: "Compound clips and nesting",
          },
        },
        aiPowered: {
          title: "AI-Powered Automation",
          description: "100+ AI tools to speed up your workflow",
          examples: {
            sceneDetection: "Auto scene detection and cutting",
            colorGrading: "Smart color grading",
            audioEnhancement: "Audio enhancement and noise removal",
            subtitles: "Automatic subtitle generation",
          },
        },
        effects: {
          title: "Effects & Transitions",
          description: "Professional effects library",
          examples: {
            transitions: "100+ transitions (3D, glitch, cinematic)",
            luts: "Color grading with LUTs",
            chromaKey: "Green screen / chroma key",
            speedRamping: "Speed ramping and time remapping",
          },
        },
        audio: {
          title: "Advanced Audio (Fairlight)",
          description: "Professional audio editing suite",
          examples: {
            mixing: "Multi-track audio mixing",
            surround: "Surround sound support",
            effects: "Audio effects and filters",
            voiceEnhancement: "Voice enhancement and EQ",
          },
        },
        export: {
          title: "Export & Share",
          description: "Export to any format or platform",
          examples: {
            quality: "4K/8K export without watermarks",
            directUpload: "Direct upload to YouTube, TikTok, Vimeo",
            presets: "Custom presets for social media",
            hwAccelerated: "Hardware-accelerated rendering",
          },
        },
        recognition: {
          title: "Recognition & Analysis",
          description: "AI-powered scene understanding",
          examples: {
            faceObject: "Face and object detection (YOLO)",
            emotion: "Emotion recognition",
            sceneClassification: "Scene classification",
            quality: "Quality analysis and scoring",
          },
        },
      },
      videoDemos: {
        title: "See It",
        titleHighlight: "In Action",
        subtitle: "Quick video tutorials showing Timeline Studio's powerful features",
        aiEditing: {
          title: "AI Auto-Editing in Action",
          description: "Watch how AI selects best moments and creates engaging edits automatically",
        },
        multiCamera: {
          title: "Multi-Camera Workflow",
          description: "Edit multi-angle footage with automated switching and sync",
        },
        colorGrading: {
          title: "Color Grading Tutorial",
          description: "Professional color correction and grading workflow",
        },
        comingSoon: "Coming Soon",
        checkGithub: "Want to see more? Check out our",
        githubRepo: "GitHub repository",
        forDocs: "for documentation and examples",
      },
      features: {
        smartAnalysis: {
          title: "Smart Analysis",
          description: "AI analyzes trends and suggests the best content strategy for maximum engagement",
        },
        instantCreation: {
          title: "Instant Creation",
          description: "Generate professional videos with trending effects and transitions in seconds",
        },
        viralOptimization: {
          title: "Viral Optimization",
          description: "Optimize timing, hashtags, and content format for each social platform",
        },
      },
      download: {
        title: "Download for free",
        subtitle: "Available for all major operating systems",
        description: "Choose your platform and start creating amazing videos today",
        latestVersion: "Latest version",
        checkGithub: "Check on GitHub",
        allReleases: "All releases",
        downloadFor: "Download for",
      },
    },
    faq: {
      title: "Frequently Asked Questions",
      questions: {
        whatIs: {
          question: "What is Timeline Studio?",
          answer:
            "Timeline Studio is an AI-powered video editing application that helps you create professional-quality videos faster than ever. With 100+ AI tools, it automates tedious tasks while giving you creative control.",
        },
        isFree: {
          question: "Is Timeline Studio free?",
          answer:
            "Yes! Timeline Studio is completely free and open-source. You can download it for Windows, macOS, and Linux without any cost or subscription fees.",
        },
        formats: {
          question: "What video formats are supported?",
          answer:
            "Timeline Studio supports all major video formats including MP4, MOV, AVI, MKV, WebM, and more. It can also export to various formats optimized for different platforms.",
        },
        commercial: {
          question: "Can I use Timeline Studio for commercial projects?",
          answer:
            "Absolutely! Timeline Studio is released under a permissive license that allows both personal and commercial use without restrictions.",
        },
        requirements: {
          question: "What are the system requirements?",
          answer:
            "Timeline Studio runs on Windows 10+, macOS 10.15+, and most Linux distributions. We recommend at least 8GB RAM and a dedicated graphics card for optimal performance with AI features.",
        },
        aiHow: {
          question: "How does the AI video editing work?",
          answer:
            "Our AI analyzes your footage to identify key moments, suggests cuts, applies effects, and can even generate entire edited sequences based on your preferences. You maintain full control and can override any AI decisions.",
        },
        dataSafe: {
          question: "Is my data safe?",
          answer:
            "Yes! Timeline Studio processes everything locally on your computer. Your videos and projects never leave your device, ensuring complete privacy and security.",
        },
        contribute: {
          question: "Can I contribute to the project?",
          answer:
            "We welcome contributions! Timeline Studio is open-source on GitHub. You can submit bug reports, feature requests, or even contribute code to help improve the software.",
        },
      },
      stillQuestions: {
        title: "Still have questions?",
        description: "Feel free to reach out to our community or check our documentation.",
        joinDiscord: "Join Discord Community",
        openIssue: "Open GitHub Issue",
      },
    },
  },
  ru: {
    docs: {
      title: "Документация",
      subtitle: "Всё, что нужно знать о Timeline Studio",
      description: "Руководства по разработке, справочник API и лучшие практики",
      sections: {
        gettingStarted: {
          title: "Начало работы",
          quickStart: "Руководство по быстрому старту",
          installation: "Установка",
          projectStructure: "Структура проекта",
        },
        architecture: {
          title: "Архитектура",
          overview: "Обзор архитектуры",
          frontend: "Архитектура фронтенда",
          backend: "Архитектура бэкенда",
        },
        development: {
          title: "Разработка",
          guide: "Руководство по разработке",
          commands: "Команды разработки",
          plugins: "Разработка плагинов",
          codingStandards: "Стандарты кодирования",
          performance: "Руководство по производительности",
          testing: "Руководство по тестированию",
        },
        api: {
          title: "Справочник API",
          media: "Media API",
          timeline: "Timeline API",
          recognition: "API распознавания",
          aiChat: "API ИИ-чата",
          export: "API экспорта",
          generated: "Сгенерированная документация API",
        },
        integrations: {
          title: "Интеграции",
          claude: "Claude API",
          openai: "OpenAI API",
          youtube: "YouTube API",
          telegram: "Telegram API",
        },
        requirements: {
          title: "Требования",
          functional: "Функциональные требования",
          technical: "Технические требования",
          features: "Спецификация функций",
        },
        security: {
          title: "Безопасность",
          guidelines: "Руководство по безопасности",
          architecture: "Архитектура безопасности",
        },
        deployment: {
          title: "Развертывание",
          build: "Руководство по сборке",
          windows: "Сборка для Windows",
          macos: "Сборка для macOS",
          linux: "Сборка для Linux",
          oauth: "Настройка OAuth",
        },
        cicd: {
          title: "CI/CD",
          setup: "Настройка CI/CD",
          codecov: "Покрытие кода",
        },
        testing: {
          title: "Тестирование",
          guide: "Руководство по тестированию",
          backend: "Тестирование бэкенда",
          realMedia: "Тестирование с реальными медиа",
        },
        quality: {
          title: "Контроль качества",
          alphaGuide: "Руководство по альфа-тестированию",
        },
        tasks: {
          title: "Задачи разработки",
          active: "Активные задачи",
          roadmap: "Дорожная карта проекта",
        },
      },
      contribute: {
        title: "Хотите внести вклад?",
        description: "Помогите нам улучшить Timeline Studio, внося вклад в документацию или кодовую базу.",
        viewGithub: "Посмотреть на GitHub",
        contributingGuide: "Руководство по внесению вклада",
      },
    },
    about: {
      hero: {
        title: "Переосмысливаем видеомонтаж",
        subtitle: "Создаём будущее креативного контента с помощью инструментов на основе ИИ",
        founded: "Основано в 2025",
        remote: "Удалённая работа",
        openSource: "Открытый код",
      },
      mission: {
        title: "Наша миссия",
        paragraph1:
          "В Timeline Studio мы верим, что видеомонтаж должен быть доступным, интуитивным и мощным. Наша миссия — демократизировать профессиональное создание видео, объединив передовые технологии ИИ с удобным интерфейсом, который может освоить каждый.",
        paragraph2:
          "Мы создаём больше, чем просто программное обеспечение — мы создаём платформу, которая расширяет возможности создателей, оптимизирует рабочие процессы и раздвигает границы возможного в цифровом повествовании.",
      },
      values: {
        title: "Наши ценности",
        innovation: {
          title: "Инновации прежде всего",
          description: "Мы раздвигаем границы возможного, интегрируя последние достижения ИИ в практичные инструменты.",
        },
        community: {
          title: "Глобальное сообщество",
          description:
            "Поддерживаем создателей по всему миру с помощью многоязычной поддержки и кроссплатформенных решений.",
        },
        efficiency: {
          title: "Скорость и эффективность",
          description:
            "Каждая функция разработана для экономии времени и повышения креативности, а не для усложнения рабочих процессов.",
        },
        privacy: {
          title: "Конфиденциальность",
          description:
            "Ваш контент принадлежит вам. Мы ставим конфиденциальность пользователей и безопасность данных во главу угла.",
        },
        userCentric: {
          title: "Ориентация на пользователя",
          description:
            "Каждое решение начинается с наших пользователей. Мы создаём функции, которые решают реальные проблемы реальных создателей.",
        },
        openInnovation: {
          title: "Открытые инновации",
          description: "Мы верим в силу открытого исходного кода и разработки, ориентированной на сообщество.",
        },
      },
      team: {
        title: "Создано творцами для творцов",
        description:
          "Наша команда объединяет опыт в области ИИ, видеотехнологий и дизайна пользовательского опыта для создания инструментов, которые действительно понимают потребности создателей.",
        founder: "Основатель и ведущий разработчик",
      },
      cta: {
        title: "Присоединяйтесь к нашему путешествию",
        description:
          "Независимо от того, являетесь ли вы создателем контента, разработчиком или просто увлечены будущим видео, мы будем рады видеть вас в нашем сообществе.",
        contributeGithub: "Внести вклад на GitHub",
        tryStudio: "Попробовать Timeline Studio",
      },
    },
    changelog: {
      title: "История изменений",
      subtitle: "Отслеживайте все обновления и улучшения Timeline Studio",
      latest: "ПОСЛЕДНЯЯ",
      newFeatures: "Новые функции",
      bugFixes: "Исправления ошибок",
      improvements: "Улучшения",
      breakingChanges: "Критические изменения",
      viewRelease: "Посмотреть релиз",
      viewAllReleases: "Посмотреть все релизы на GitHub",
    },
    pricing: {
      title: "Простые цены",
      subtitle: "Локальные функции бесплатно. Облачные функции платно. Всё прозрачно.",
      description:
        "ИИ-аватары, генерация видео, экспорт в TikTok/YouTube одним кликом\nВсё, что нужно для доминирования в соцсетях",
      mostPopular: "САМЫЙ ПОПУЛЯРНЫЙ",
      cloudStorage: "Облачное хранилище",
      aiTokens: "Токены ИИ",
      localStorage: "Локальное хранилище",
      localAI: "Локальный ИИ runtime",
      perUserMonth: "/пользователь/месяц",
      contactUs: "Связаться с нами",
      tiers: {
        free: {
          name: "БЕСПЛАТНО",
          price: "$0",
          period: "навсегда",
          description: "Всё, что работает локально, бесплатно",
          buttonText: "Скачать бесплатно",
        },
        pro: {
          name: "PRO",
          price: "$19",
          period: "/месяц",
          description: "Облачные функции и премиум ИИ",
          buttonText: "Начать бесплатный триал",
        },
        max: {
          name: "MAX",
          price: "$99",
          period: "/месяц",
          description: "Максимальная мощь ИИ для профессионалов",
          buttonText: "Попробовать MAX",
        },
        team: {
          name: "КОМАНДА",
          price: "$39",
          description: "Для совместной работы",
          buttonText: "Начать с командой",
        },
        enterprise: {
          name: "КОРПОРАТИВ",
          description: "Индивидуальные решения",
          buttonText: "Связаться с отделом продаж",
        },
      },
      features: {
        everythingInFree: "Всё из БЕСПЛАТНОГО +",
        everythingInPro: "Всё из PRO +",
        everythingInProBase: "Всё из PRO",
        realTimeCollaboration: "Совместная работа в реальном времени",
        teamResourceLibraries: "Командные библиотеки ресурсов",
        ssoAuthentication: "SSO аутентификация",
        onPremiseDeployment: "Развертывание на ваших серверах",
        unlimitedStorageRendering: "Неограниченное хранилище и рендеринг",
        customAiModels: "Пользовательские ИИ-модели",
        apiAccess: "API доступ",
        dedicatedManagerSla: "Выделенный менеджер и SLA",
        whiteLabelCustomization: "White-label кастомизация",
      },
      teamsEnterprise: "Для команд и корпораций",
      faq: {
        title: "Часто задаваемые вопросы",
        whatAreTokens: {
          question: "Что такое токены ИИ?",
          answer:
            "Токены ИИ используются для премиум ИИ-моделей (Claude, GPT-4). Локальный ИИ через Ollama работает бесплатно и не требует токенов. PRO включает 80тыс токенов/мес, MAX предоставляет 500тыс токенов/мес для опытных пользователей.",
        },
        canUpgradeDowngrade: {
          question: "Могу ли я изменить тариф?",
          answer:
            "Да! Вы можете изменить свой тариф в любое время. При повышении тарифа вы сразу получите доступ к новым функциям. При понижении тарифа изменения вступят в силу со следующего расчетного периода.",
        },
        whyFreePowerful: {
          question: "Почему бесплатная версия такая мощная?",
          answer:
            "Мы верим в прозрачность. Всё, что может работать на вашем компьютере, бесплатно. Вы платите только за облачные сервисы и сторонние API, которые требуют затрат на нашу инфраструктуру.",
        },
        isThereFreeTrial: {
          question: "Есть ли бесплатный триал?",
          answer:
            "Да! Тарифы PRO, MAX и КОМАНДА включают 14-дневный бесплатный триал. Кредитная карта не требуется. Отмена в любое время. Плюс, получите 3 месяца бесплатно при переходе от конкурентов.",
        },
      },
    },
    footer: {
      product: {
        title: "ПРОДУКТ",
        about: "О нас",
        pricing: "Цены",
        changelog: "История изменений",
        downloads: "Загрузки",
        contact: "Контакты",
      },
      resources: {
        title: "РЕСУРСЫ",
        documentation: "Документация",
        blog: "Блог",
        faqs: "Частые вопросы",
        submitFeedback: "Отправить отзыв",
      },
      social: {
        title: "Подписывайтесь",
      },
      copyright: "© 2025 Timeline Studio, Inc.",
    },
    hero: {
      title: "Создание видео с помощью ИИ",
      subtitle: "Посмотрите, как ИИ Timeline Studio помогает создавать виральный контент за секунды",
      description: "Напишите свою идею и позвольте ИИ сделать волшебство",
      downloadFree: "Скачать бесплатно",
    },
    mainPage: {
      hero: {
        title: "Профессиональный видеоредактор",
        subtitle: "со 100+ ИИ-инструментами",
        description: {
          local: "Локальные функции",
          free: "бесплатно навсегда",
          localAI: "Локальная обработка ИИ.",
          cloud: "Облачные функции и премиум ИИ-модели доступны с подпиской PRO.",
        },
        openSource: "Открытый код",
        downloadFree: "Скачать бесплатно",
        viewGithub: "Посмотреть на GitHub",
      },
      whatYouCanDo: {
        title: "Что можно",
        titleHighlight: "создать",
        subtitle: "Всё необходимое для профессионального производства видео",
        professional: {
          title: "Профессиональный видеомонтаж",
          description: "Полнофункциональный таймлайн со всеми необходимыми инструментами",
          examples: {
            multitrack: "Многодорожечный таймлайн с неограниченным количеством слоёв",
            frameAccurate: "Покадровый монтаж",
            multicam: "Мультикамерный монтаж с переключением углов",
            compound: "Составные клипы и вложенность",
          },
        },
        aiPowered: {
          title: "Автоматизация с помощью ИИ",
          description: "100+ ИИ-инструментов для ускорения рабочего процесса",
          examples: {
            sceneDetection: "Автоопределение сцен и нарезка",
            colorGrading: "Умная цветокоррекция",
            audioEnhancement: "Улучшение звука и удаление шума",
            subtitles: "Автоматическая генерация субтитров",
          },
        },
        effects: {
          title: "Эффекты и переходы",
          description: "Профессиональная библиотека эффектов",
          examples: {
            transitions: "100+ переходов (3D, глитч, кинематограф)",
            luts: "Цветокоррекция с LUT",
            chromaKey: "Хромакей / зелёный экран",
            speedRamping: "Изменение скорости и time remapping",
          },
        },
        audio: {
          title: "Продвинутый звук (Fairlight)",
          description: "Профессиональный аудиомонтаж",
          examples: {
            mixing: "Многодорожечный аудиомикс",
            surround: "Поддержка объёмного звука",
            effects: "Аудиоэффекты и фильтры",
            voiceEnhancement: "Улучшение голоса и EQ",
          },
        },
        export: {
          title: "Экспорт и публикация",
          description: "Экспорт в любой формат или платформу",
          examples: {
            quality: "Экспорт 4K/8K без водяных знаков",
            directUpload: "Прямая загрузка на YouTube, TikTok, Vimeo",
            presets: "Пользовательские пресеты для соцсетей",
            hwAccelerated: "Аппаратно-ускоренный рендеринг",
          },
        },
        recognition: {
          title: "Распознавание и анализ",
          description: "Понимание сцен с помощью ИИ",
          examples: {
            faceObject: "Распознавание лиц и объектов (YOLO)",
            emotion: "Распознавание эмоций",
            sceneClassification: "Классификация сцен",
            quality: "Анализ и оценка качества",
          },
        },
      },
      videoDemos: {
        title: "Посмотрите",
        titleHighlight: "в действии",
        subtitle: "Короткие видеоуроки, демонстрирующие мощные функции Timeline Studio",
        aiEditing: {
          title: "Авто-монтаж с ИИ в действии",
          description: "Смотрите, как ИИ выбирает лучшие моменты и создаёт захватывающий монтаж автоматически",
        },
        multiCamera: {
          title: "Мультикамерный рабочий процесс",
          description: "Монтаж многоугловых кадров с автоматическим переключением и синхронизацией",
        },
        colorGrading: {
          title: "Туториал по цветокоррекции",
          description: "Профессиональный рабочий процесс цветокоррекции и грейдинга",
        },
        comingSoon: "Скоро",
        checkGithub: "Хотите увидеть больше? Посмотрите наш",
        githubRepo: "репозиторий на GitHub",
        forDocs: "с документацией и примерами",
      },
      features: {
        smartAnalysis: {
          title: "Умный анализ",
          description: "ИИ анализирует тренды и предлагает лучшую контент-стратегию для максимального охвата",
        },
        instantCreation: {
          title: "Мгновенное создание",
          description: "Генерируйте профессиональные видео с трендовыми эффектами и переходами за секунды",
        },
        viralOptimization: {
          title: "Вирусная оптимизация",
          description: "Оптимизируйте тайминг, хештеги и формат контента для каждой социальной платформы",
        },
      },
      download: {
        title: "Скачать бесплатно",
        subtitle: "Доступно для всех основных операционных систем",
        description: "Выберите вашу платформу и начните создавать удивительные видео сегодня",
        latestVersion: "Последняя версия",
        checkGithub: "Проверить на GitHub",
        allReleases: "Все релизы",
        downloadFor: "Скачать для",
      },
    },
    faq: {
      title: "Часто задаваемые вопросы",
      questions: {
        whatIs: {
          question: "Что такое Timeline Studio?",
          answer:
            "Timeline Studio — это видеоредактор с поддержкой ИИ, который помогает создавать профессиональные видео быстрее, чем когда-либо. С более чем 150 ИИ-инструментами он автоматизирует рутинные задачи, сохраняя творческий контроль в ваших руках.",
        },
        isFree: {
          question: "Timeline Studio бесплатный?",
          answer:
            "Да! Timeline Studio полностью бесплатный и с открытым исходным кодом. Вы можете скачать его для Windows, macOS и Linux без каких-либо затрат или подписок.",
        },
        formats: {
          question: "Какие форматы видео поддерживаются?",
          answer:
            "Timeline Studio поддерживает все основные форматы видео, включая MP4, MOV, AVI, MKV, WebM и другие. Также можно экспортировать в различные форматы, оптимизированные для разных платформ.",
        },
        commercial: {
          question: "Могу ли я использовать Timeline Studio для коммерческих проектов?",
          answer:
            "Конечно! Timeline Studio выпущен под свободной лицензией, которая позволяет как личное, так и коммерческое использование без ограничений.",
        },
        requirements: {
          question: "Каковы системные требования?",
          answer:
            "Timeline Studio работает на Windows 10+, macOS 10.15+ и большинстве дистрибутивов Linux. Мы рекомендуем минимум 8 ГБ оперативной памяти и выделенную видеокарту для оптимальной работы ИИ-функций.",
        },
        aiHow: {
          question: "Как работает ИИ-монтаж видео?",
          answer:
            "Наш ИИ анализирует ваши кадры для определения ключевых моментов, предлагает нарезки, применяет эффекты и может даже генерировать целые смонтированные последовательности на основе ваших предпочтений. Вы сохраняете полный контроль и можете отменить любые решения ИИ.",
        },
        dataSafe: {
          question: "Мои данные в безопасности?",
          answer:
            "Да! Timeline Studio обрабатывает всё локально на вашем компьютере. Ваши видео и проекты никогда не покидают ваше устройство, обеспечивая полную конфиденциальность и безопасность.",
        },
        contribute: {
          question: "Могу ли я внести вклад в проект?",
          answer:
            "Мы приветствуем вклад! Timeline Studio с открытым исходным кодом на GitHub. Вы можете отправлять отчеты об ошибках, запросы функций или даже вносить код для улучшения программы.",
        },
      },
      stillQuestions: {
        title: "Остались вопросы?",
        description: "Не стесняйтесь обращаться к нашему сообществу или проверить документацию.",
        joinDiscord: "Присоединиться к Discord",
        openIssue: "Открыть issue на GitHub",
      },
    },
  },
  zh: {
    docs: {
      title: "文档",
      subtitle: "关于Timeline Studio的一切",
      description: "开发指南、API参考和最佳实践",
      sections: {
        gettingStarted: {
          title: "入门指南",
          quickStart: "快速开始指南",
          installation: "安装",
          projectStructure: "项目结构",
        },
        architecture: {
          title: "架构",
          overview: "架构概述",
          frontend: "前端架构",
          backend: "后端架构",
        },
        development: {
          title: "开发",
          guide: "开发指南",
          commands: "开发命令",
          plugins: "插件开发",
          codingStandards: "编码标准",
          performance: "性能指南",
          testing: "测试指南",
        },
        api: {
          title: "API参考",
          media: "媒体API",
          timeline: "时间轴API",
          recognition: "识别API",
          aiChat: "AI聊天API",
          export: "导出API",
          generated: "生成的API文档",
        },
        integrations: {
          title: "集成",
          claude: "Claude API",
          openai: "OpenAI API",
          youtube: "YouTube API",
          telegram: "Telegram API",
        },
        requirements: {
          title: "需求",
          functional: "功能需求",
          technical: "技术需求",
          features: "功能规范",
        },
        security: {
          title: "安全",
          guidelines: "安全指南",
          architecture: "安全架构",
        },
        deployment: {
          title: "部署",
          build: "构建指南",
          windows: "Windows构建",
          macos: "macOS构建",
          linux: "Linux构建",
          oauth: "OAuth设置",
        },
        cicd: {
          title: "CI/CD",
          setup: "CI/CD设置",
          codecov: "代码覆盖率",
        },
        testing: {
          title: "测试",
          guide: "测试指南",
          backend: "后端测试",
          realMedia: "真实媒体测试",
        },
        quality: {
          title: "质量保证",
          alphaGuide: "Alpha测试指南",
        },
        tasks: {
          title: "开发任务",
          active: "活跃任务",
          roadmap: "项目路线图",
        },
      },
      contribute: {
        title: "想要贡献？",
        description: "通过为文档或代码库做贡献来帮助我们改进Timeline Studio。",
        viewGithub: "在GitHub上查看",
        contributingGuide: "贡献指南",
      },
    },
    about: {
      hero: {
        title: "重新定义视频编辑",
        subtitle: "用AI驱动的工具构建创意内容的未来",
        founded: "成立于2025年",
        remote: "远程优先",
        openSource: "开源",
      },
      mission: {
        title: "我们的使命",
        paragraph1:
          "在Timeline Studio，我们相信视频编辑应该是易于访问、直观且强大的。我们的使命是通过将尖端AI技术与任何人都能掌握的用户友好界面相结合，来民主化专业视频创作。",
        paragraph2:
          "我们不仅仅是在构建软件——我们正在创建一个平台，赋能创作者、简化工作流程，并推动数字叙事可能性的边界。",
      },
      values: {
        title: "我们的价值观",
        innovation: {
          title: "创新优先",
          description: "我们推动可能性的边界，将最新的AI进展集成到实用工具中。",
        },
        community: {
          title: "全球社区",
          description: "通过多语言支持和平台无关的解决方案支持全球创作者。",
        },
        efficiency: {
          title: "速度与效率",
          description: "每个功能都旨在节省时间和增强创造力，而不是使工作流程复杂化。",
        },
        privacy: {
          title: "注重隐私",
          description: "您的内容属于您。我们在构建的一切中都优先考虑用户隐私和数据安全。",
        },
        userCentric: {
          title: "以用户为中心",
          description: "每个决定都从我们的用户开始。我们构建解决真实创作者真实问题的功能。",
        },
        openInnovation: {
          title: "开放创新",
          description: "我们相信开源和社区驱动开发的力量。",
        },
      },
      team: {
        title: "由创作者为创作者构建",
        description: "我们的团队结合了AI、视频技术和用户体验设计方面的专业知识，创造真正理解创作者需求的工具。",
        founder: "创始人兼首席开发者",
      },
      cta: {
        title: "加入我们的旅程",
        description: "无论您是内容创作者、开发者，还是只是对视频的未来充满热情，我们都希望您成为我们社区的一部分。",
        contributeGithub: "在GitHub上贡献",
        tryStudio: "试用Timeline Studio",
      },
    },
    changelog: {
      title: "更新日志",
      subtitle: "跟踪Timeline Studio的所有更新和改进",
      latest: "最新",
      newFeatures: "新功能",
      bugFixes: "错误修复",
      improvements: "改进",
      breakingChanges: "重大变更",
      viewRelease: "查看发布",
      viewAllReleases: "在GitHub上查看所有发布",
    },
    pricing: {
      title: "简单定价",
      subtitle: "本地功能免费。云功能付费。一切透明。",
      description: "AI头像、视频生成、一键导出到TikTok/YouTube\n您在社交媒体上占主导地位所需的一切",
      mostPopular: "最受欢迎",
      cloudStorage: "云存储",
      aiTokens: "AI令牌",
      localStorage: "本地存储",
      localAI: "本地AI运行时",
      perUserMonth: "/用户/月",
      contactUs: "联系我们",
      tiers: {
        free: {
          name: "免费",
          price: "$0",
          period: "永久",
          description: "本地运行的一切都是免费的",
          buttonText: "免费下载",
        },
        pro: {
          name: "专业版",
          price: "$19",
          period: "/月",
          description: "云功能和高级AI",
          buttonText: "开始免费试用",
        },
        max: {
          name: "最大版",
          price: "$99",
          period: "/月",
          description: "专业人士的最大AI能力",
          buttonText: "试用MAX",
        },
        team: {
          name: "团队版",
          price: "$39",
          description: "用于协作工作",
          buttonText: "开始团队版",
        },
        enterprise: {
          name: "企业版",
          description: "定制解决方案",
          buttonText: "联系销售",
        },
      },
      features: {
        everythingInFree: "免费版的所有功能 +",
        everythingInPro: "专业版的所有功能 +",
        everythingInProBase: "专业版的所有功能",
        realTimeCollaboration: "实时协作",
        teamResourceLibraries: "团队资源库",
        ssoAuthentication: "SSO身份验证",
        onPremiseDeployment: "本地部署",
        unlimitedStorageRendering: "无限存储和渲染",
        customAiModels: "自定义AI模型",
        apiAccess: "API访问",
        dedicatedManagerSla: "专属经理和SLA",
        whiteLabelCustomization: "白标定制",
      },
      teamsEnterprise: "适用于团队和企业",
      faq: {
        title: "常见问题",
        whatAreTokens: {
          question: "什么是AI令牌？",
          answer:
            "AI令牌用于高级AI模型（Claude、GPT-4）。通过Ollama的本地AI免费工作，不需要令牌。专业版包含8万令牌/月，最大版为高级用户提供50万令牌/月。",
        },
        canUpgradeDowngrade: {
          question: "我可以升级或降级吗？",
          answer:
            "可以！您可以随时更改计划。升级时，您将立即获得新功能的访问权限。降级时，更改将在下一个计费周期生效。",
        },
        whyFreePowerful: {
          question: "为什么免费版本如此强大？",
          answer:
            "我们相信透明度。能在您计算机上运行的一切都是免费的。您只需为需要我们基础设施成本的云服务和第三方API付费。",
        },
        isThereFreeTrial: {
          question: "有免费试用吗？",
          answer:
            "有！专业版、最大版和团队版都提供14天免费试用。无需信用卡。随时取消。另外，从竞争对手转换时可获得3个月免费。",
        },
      },
    },
    footer: {
      product: {
        title: "产品",
        about: "关于",
        pricing: "定价",
        changelog: "更新日志",
        downloads: "下载",
        contact: "联系",
      },
      resources: {
        title: "资源",
        documentation: "文档",
        blog: "博客",
        faqs: "常见问题",
        submitFeedback: "提交反馈",
      },
      social: {
        title: "关注我们",
      },
      copyright: "© 2025 Timeline Studio, Inc.",
    },
    hero: {
      title: "AI驱动的视频创作",
      subtitle: "观看Timeline Studio AI如何帮助您在几秒钟内创建病毒式内容",
      description: "输入您的想法，让AI施展魔法",
      downloadFree: "免费下载",
    },
    mainPage: {
      hero: {
        title: "专业视频编辑器",
        subtitle: "拥有100+个AI工具",
        description: {
          local: "本地功能",
          free: "永久免费",
          localAI: "本地AI处理。",
          cloud: "云功能和高级AI模型可通过PRO订阅获得。",
        },
        openSource: "开源",
        downloadFree: "免费下载",
        viewGithub: "在GitHub上查看",
      },
      whatYouCanDo: {
        title: "您可以",
        titleHighlight: "创造什么",
        subtitle: "专业视频制作所需的一切",
        professional: {
          title: "专业视频编辑",
          description: "功能齐全的时间轴，包含您需要的所有工具",
          examples: {
            multitrack: "无限层的多轨时间轴",
            frameAccurate: "帧精确编辑",
            multicam: "带角度切换的多机位编辑",
            compound: "复合剪辑和嵌套",
          },
        },
        aiPowered: {
          title: "AI驱动的自动化",
          description: "100+个AI工具加速您的工作流程",
          examples: {
            sceneDetection: "自动场景检测和剪切",
            colorGrading: "智能调色",
            audioEnhancement: "音频增强和降噪",
            subtitles: "自动生成字幕",
          },
        },
        effects: {
          title: "效果和转场",
          description: "专业效果库",
          examples: {
            transitions: "100+转场（3D、故障、电影）",
            luts: "使用LUT调色",
            chromaKey: "绿幕/色度键",
            speedRamping: "速度渐变和时间重映射",
          },
        },
        audio: {
          title: "高级音频（Fairlight）",
          description: "专业音频编辑套件",
          examples: {
            mixing: "多轨音频混音",
            surround: "环绕声支持",
            effects: "音频效果和滤镜",
            voiceEnhancement: "人声增强和EQ",
          },
        },
        export: {
          title: "导出和分享",
          description: "导出到任何格式或平台",
          examples: {
            quality: "4K/8K导出无水印",
            directUpload: "直接上传到YouTube、TikTok、Vimeo",
            presets: "社交媒体自定义预设",
            hwAccelerated: "硬件加速渲染",
          },
        },
        recognition: {
          title: "识别和分析",
          description: "AI驱动的场景理解",
          examples: {
            faceObject: "人脸和物体检测（YOLO）",
            emotion: "情绪识别",
            sceneClassification: "场景分类",
            quality: "质量分析和评分",
          },
        },
      },
      videoDemos: {
        title: "观看",
        titleHighlight: "实际演示",
        subtitle: "快速视频教程展示Timeline Studio的强大功能",
        aiEditing: {
          title: "AI自动编辑实战",
          description: "观看AI如何选择最佳时刻并自动创建引人入胜的编辑",
        },
        multiCamera: {
          title: "多机位工作流程",
          description: "使用自动切换和同步编辑多角度素材",
        },
        colorGrading: {
          title: "调色教程",
          description: "专业的色彩校正和调色工作流程",
        },
        comingSoon: "即将推出",
        checkGithub: "想看更多？查看我们的",
        githubRepo: "GitHub仓库",
        forDocs: "获取文档和示例",
      },
      features: {
        smartAnalysis: {
          title: "智能分析",
          description: "AI分析趋势并建议最佳内容策略以获得最大参与度",
        },
        instantCreation: {
          title: "即时创作",
          description: "在几秒钟内生成具有趋势效果和转场的专业视频",
        },
        viralOptimization: {
          title: "病毒式优化",
          description: "为每个社交平台优化时机、标签和内容格式",
        },
      },
      download: {
        title: "免费下载",
        subtitle: "适用于所有主要操作系统",
        description: "选择您的平台，今天就开始创建精彩视频",
        latestVersion: "最新版本",
        checkGithub: "在GitHub上查看",
        allReleases: "所有发布",
        downloadFor: "下载适用于",
      },
    },
    faq: {
      title: "常见问题",
      questions: {
        whatIs: {
          question: "什么是Timeline Studio？",
          answer:
            "Timeline Studio是一个AI驱动的视频编辑应用程序，帮助您比以往更快地创建专业质量的视频。拥有超过150个AI工具，它自动化繁琐的任务，同时给您创意控制权。",
        },
        isFree: {
          question: "Timeline Studio免费吗？",
          answer: "是的！Timeline Studio完全免费且开源。您可以为Windows、macOS和Linux下载它，无需任何费用或订阅费。",
        },
        formats: {
          question: "支持哪些视频格式？",
          answer:
            "Timeline Studio支持所有主要视频格式，包括MP4、MOV、AVI、MKV、WebM等。它还可以导出为针对不同平台优化的各种格式。",
        },
        commercial: {
          question: "我可以将Timeline Studio用于商业项目吗？",
          answer: "当然可以！Timeline Studio在自由许可证下发布，允许个人和商业使用，无任何限制。",
        },
        requirements: {
          question: "系统要求是什么？",
          answer:
            "Timeline Studio在Windows 10+、macOS 10.15+和大多数Linux发行版上运行。我们建议至少8GB RAM和专用显卡以获得最佳AI功能性能。",
        },
        aiHow: {
          question: "AI视频编辑是如何工作的？",
          answer:
            "我们的AI分析您的素材以识别关键时刻，建议剪辑，应用效果，甚至可以根据您的偏好生成整个编辑序列。您保持完全控制，可以撤销任何AI决定。",
        },
        dataSafe: {
          question: "我的数据安全吗？",
          answer:
            "是的！Timeline Studio在您的计算机上本地处理一切。您的视频和项目永远不会离开您的设备，确保完全的隐私和安全。",
        },
        contribute: {
          question: "我可以为项目做贡献吗？",
          answer:
            "我们欢迎贡献！Timeline Studio在GitHub上开源。您可以提交错误报告、功能请求，甚至贡献代码来帮助改进软件。",
        },
      },
      stillQuestions: {
        title: "还有问题？",
        description: "随时联系我们的社区或查看我们的文档。",
        joinDiscord: "加入Discord社区",
        openIssue: "在GitHub上开启Issue",
      },
    },
  },
} as const

export type Language = keyof typeof translations
export type TranslationKey = keyof typeof translations.en
