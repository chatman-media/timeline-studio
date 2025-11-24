# Easy Mode - Редактор через AI чат

## Обзор
Упрощенный режим Timeline Studio, где пользователь создает видео через общение с AI ассистентом, без необходимости работать с timeline и сложными инструментами.

## Концепция
"Расскажи, что хочешь создать - AI сделает остальное"

## Интерфейс

### Минималистичный дизайн
```
┌─────────────────────────────────────┐
│        Timeline Studio Easy         │
├─────────────────────────────────────┤
│                                     │
│         [Видео превью]              │
│                                     │
├─────────────────────────────────────┤
│  Выбранные медиа: 5 файлов         │
│  [📹][📹][📹][📹][📹] [+Добавить]    │
├─────────────────────────────────────┤
│ 💬 Чат с AI                         │
│ ┌─────────────────────────────────┐ │
│ │ AI: Привет! Что будем создавать?│ │
│ │                                  │ │
│ │ User: Хочу динамичное видео     │ │
│ │ из отпуска с музыкой            │ │
│ │                                  │ │
│ │ AI: Отлично! Я вижу у вас       │ │
│ │ 5 видео. Давайте создадим       │ │
│ │ энергичный монтаж. Какой стиль  │ │
│ │ предпочитаете?                   │ │
│ │                                  │ │
│ │ [Быстрые действия:]              │ │
│ │ [🎬 Travel] [🎉 Party] [🌅 Chill]│ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Введите сообщение...]        [➤]  │
└─────────────────────────────────────┘
```

## Функциональность

### 1. Простой выбор медиа
```typescript
interface EasyModeMedia {
  // Drag & drop или выбор файлов
  files: MediaFile[];
  
  // Автоматический анализ
  analysis: {
    scenes: Scene[];
    quality: QualityMetrics;
    content: ContentType; // путешествие, событие, влог и т.д.
  };
}
```

### 2. AI диалог
```typescript
interface AIConversation {
  // Понимание намерений
  intents: {
    style: VideoStyle;        // динамичный, спокойный, эпичный
    mood: Mood;              // веселый, драматичный, романтичный
    duration: Duration;      // короткий (< 1 мин), средний, длинный
    platform: Platform;      // YouTube, Instagram, TikTok
  };
  
  // Генерация предложений
  suggestions: {
    templates: Template[];
    effects: Effect[];
    music: Track[];
    transitions: Transition[];
  };
}
```

### 3. Примеры диалогов

#### Пример 1: Путешествие
```
User: У меня видео из поездки в Италию, хочу красивое видео для инстаграма

AI: Понял! Для Instagram сделаю вертикальное видео 60 секунд. 
Предлагаю несколько вариантов:

[🏛️ Классика] - плавные переходы, итальянская музыка
[🎬 Кинематограф] - цветокоррекция как в кино, эпичная музыка  
[📱 Trendy] - быстрые переходы, популярная музыка

Что выбираем?

User: Кинематограф

AI: Отлично! Применяю:
- Цветокоррекцию "Cinematic Warm" 
- Плавные переходы с размытием
- Эпичную оркестровую музыку
- Замедление красивых моментов

Начинаю создавать... Готово через 30 секунд!
[▓▓▓▓▓░░░░░] 50%
```

#### Пример 2: День рождения
```
User: Видео с дня рождения дочки, нужно веселое с музыкой

AI: Создам праздничное видео! У меня есть несколько идей:

🎂 С днем рождения! - классический монтаж с титрами
🎉 Party Mix - динамичный клип под веселую музыку
🎈 Story Time - хронологическая история праздника

Могу добавить:
- Анимированные стикеры и конфетти
- Поздравительные надписи
- Веселые sound effects

Что добавляем?
```

### 4. Автоматические действия AI

```typescript
class EasyModeAI {
  async processRequest(message: string, media: MediaFile[]) {
    // 1. Анализ медиа
    const analysis = await this.analyzeMedia(media);
    
    // 2. Понимание запроса
    const intent = await this.understandIntent(message);
    
    // 3. Генерация плана монтажа
    const plan = await this.generateMontagePlan({
      media: analysis,
      intent: intent,
      duration: this.calculateOptimalDuration(media)
    });
    
    // 4. Создание проекта
    const project = await this.createProject(plan);
    
    // 5. Применение эффектов
    await this.applyEffects(project, intent.style);
    
    // 6. Добавление музыки
    await this.addMusic(project, intent.mood);
    
    return project;
  }
}
```

## Интеграция с основным редактором

### Переключение режимов
```typescript
interface ModeSwitch {
  // Из Easy в Pro
  convertToProProject: () => TimelineProject;
  
  // Сохранение истории чата
  preserveConversation: boolean;
  
  // Передача всех настроек
  transferSettings: ProjectSettings;
}
```

### UI компонент переключения
```tsx
const ModeSwitcher = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="ghost">
          Easy Mode ✨
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={switchToProMode}>
          <Layers className="mr-2" />
          Pro Mode (Timeline)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={switchToEasyMode}>
          <MessageCircle className="mr-2" />
          Easy Mode (AI Chat)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
```

## Быстрые шаблоны

### Категории
```typescript
const quickTemplates = {
  social: {
    instagram: {
      reels: "Вертикальное видео 15-30 сек с трендовой музыкой",
      stories: "15 сек видео с стикерами и текстом",
      post: "Квадратное видео до 60 сек"
    },
    tiktok: {
      viral: "Быстрые переходы, популярная музыка",
      educational: "Текст поверх видео, спокойный темп"
    },
    youtube: {
      shorts: "Вертикальное видео до 60 сек",
      vlog: "Горизонтальное видео с титрами"
    }
  },
  
  events: {
    birthday: "Веселый монтаж с поздравлениями",
    wedding: "Романтичное видео с красивой музыкой",
    travel: "Динамичный клип из путешествия",
    corporate: "Профессиональное видео с логотипом"
  },
  
  styles: {
    cinematic: "Кинематографичная цветокоррекция и музыка",
    retro: "Винтажные фильтры и старая музыка",
    modern: "Современные эффекты и переходы",
    minimal: "Простые переходы, без лишних эффектов"
  }
};
```

## Умные подсказки

### Контекстные предложения
```typescript
class SmartSuggestions {
  suggest(context: Context): Suggestion[] {
    // На основе анализа медиа
    if (context.media.type === 'travel') {
      return [
        "Добавить карту с маршрутом?",
        "Использовать переходы через черное?",
        "Добавить названия мест?"
      ];
    }
    
    // На основе платформы
    if (context.platform === 'tiktok') {
      return [
        "Добавить популярный звук?",
        "Сделать зацикленное видео?",
        "Добавить текст для SEO?"
      ];
    }
  }
}
```

## Обучение пользователя

### Первый запуск
```
AI: Привет! Я помогу создать крутое видео 🎬

Просто расскажите, что хотите:
- "Сделай динамичное видео из отпуска"
- "Нужен ролик для Instagram из этих фото"
- "Создай презентацию продукта"

Или выберите готовый стиль:
[🎬 Примеры стилей]
```

### Подсказки во время работы
```
AI: Совет: Могу сделать видео еще лучше!
- Добавить музыку? 🎵
- Применить цветокоррекцию? 🎨
- Вставить текст или титры? 📝
```

## Техническая реализация

### State Machine для Easy Mode
```typescript
const easyModeMachine = createMachine({
  initial: 'idle',
  states: {
    idle: {
      on: {
        SELECT_MEDIA: 'mediaSelected',
        START_CHAT: 'chatting'
      }
    },
    
    mediaSelected: {
      entry: 'analyzeMedia',
      on: {
        ANALYSIS_COMPLETE: 'ready',
        ADD_MORE: 'idle'
      }
    },
    
    chatting: {
      on: {
        SEND_MESSAGE: {
          target: 'processing',
          actions: 'processUserIntent'
        },
        SELECT_TEMPLATE: 'applyingTemplate'
      }
    },
    
    processing: {
      invoke: {
        src: 'generateVideo',
        onDone: 'preview',
        onError: 'error'
      }
    },
    
    preview: {
      on: {
        APPROVE: 'exporting',
        MODIFY: 'chatting',
        SWITCH_TO_PRO: 'convertingToTimeline'
      }
    }
  }
});
```

### Интеграция с существующими сервисами
```typescript
class EasyModeService {
  constructor(
    private timelineService: TimelineService,
    private aiService: AIService,
    private effectsService: EffectsService
  ) {}
  
  async createFromChat(request: ChatRequest): Promise<Project> {
    // Используем существующие сервисы
    const timeline = this.timelineService.createEmpty();
    
    // AI генерирует структуру
    const structure = await this.aiService.generateStructure(request);
    
    // Применяем через существующие API
    for (const clip of structure.clips) {
      await this.timelineService.addClip(timeline, clip);
    }
    
    // Эффекты через существующий сервис
    await this.effectsService.applyBatch(timeline, structure.effects);
    
    return timeline.project;
  }
}
```

## План внедрения

### Этап 1: MVP (2 недели)
- [ ] Базовый UI с чатом
- [ ] Интеграция с Claude/GPT
- [ ] Простые шаблоны монтажа
- [ ] Переключение режимов

### Этап 2: Умные функции (2 недели)
- [ ] Анализ контента медиа
- [ ] Контекстные подсказки
- [ ] Автоматический подбор музыки
- [ ] Быстрые стили

### Этап 3: Полировка (1 неделя)
- [ ] Анимации переходов
- [ ] Сохранение истории чата
- [ ] Обучающие подсказки
- [ ] A/B тестирование

## Метрики успеха

- **Конверсия новичков**: 80% успешно создают первое видео
- **Время до результата**: < 3 минут от старта до готового видео  
- **Переход в Pro Mode**: 30% пробуют расширенный режим
- **Удовлетворенность**: 90% довольны результатом с первой попытки

## Потенциальные расширения

1. **Голосовой ввод**: "Окей, сделай это видео более динамичным"
2. **Обучение на примерах**: "Сделай как в этом видео [ссылка]"
3. **Коллаборация**: Несколько человек дают указания AI
4. **Авто-публикация**: Сразу в соцсети после создания