# Система пользовательских предпочтений и автоматизации

## Обзор
Интеллектуальная система, которая изучает предпочтения пользователя и автоматически создает видео для всех платформ на основе прошлых выборов, без необходимости каждый раз указывать параметры.

## Концепция
"AI запоминает твой стиль и автоматически создает видео так, как ты любишь"

## Как это работает

### 1. Сбор данных о предпочтениях
```typescript
interface UserPreferences {
  // Стилистические предпочтения
  style: {
    colorGrading: ColorProfile[];      // часто используемые LUT/фильтры
    transitions: TransitionType[];     // любимые переходы
    effects: Effect[];                 // предпочитаемые эффекты
    pacing: 'slow' | 'medium' | 'fast'; // темп монтажа
  };
  
  // Музыкальные предпочтения
  music: {
    genres: string[];                  // электроника, рок, классика
    energy: 'calm' | 'medium' | 'high';
    preferredTracks: Track[];          // часто используемые треки
    volumeLevels: AudioLevels;
  };
  
  // Платформо-специфичные настройки
  platforms: {
    youtube: PlatformSettings;
    instagram: PlatformSettings;
    tiktok: PlatformSettings;
    telegram: PlatformSettings;
  };
  
  // Контентные паттерны
  contentPatterns: {
    travel: ContentPattern;
    vlog: ContentPattern;
    event: ContentPattern;
    product: ContentPattern;
  };
}
```

### 2. Машинное обучение на локальных данных

```typescript
class PreferenceLearning {
  // Анализ каждого созданного проекта
  async analyzeProject(project: Project) {
    const features = {
      // Визуальные характеристики
      avgClipDuration: this.calculateAvgClipDuration(project),
      transitionTypes: this.extractTransitions(project),
      effectsUsed: this.extractEffects(project),
      colorProfile: this.analyzeColorGrading(project),
      
      // Аудио характеристики
      musicGenre: await this.detectMusicGenre(project.audio),
      audioLevels: this.measureAudioLevels(project),
      beatSync: this.checkBeatAlignment(project),
      
      // Структурные паттерны
      openingStyle: this.analyzeOpening(project),
      closingStyle: this.analyzeClosing(project),
      narrativeStructure: this.detectStructure(project)
    };
    
    // Обновляем модель предпочтений
    await this.updateUserModel(features);
  }
  
  // Простая модель на основе частотности
  private updateUserModel(features: Features) {
    // Увеличиваем вес для использованных features
    this.model.transitions[features.transitionType].weight += 1;
    this.model.effects[features.effectType].weight += 1;
    
    // Обновляем скользящее среднее для числовых параметров
    this.model.avgClipDuration = 
      (this.model.avgClipDuration * 0.9) + (features.avgClipDuration * 0.1);
  }
}
```

### 3. Автоматическая генерация

```typescript
class AutoVideoGenerator {
  async generateFromMedia(media: MediaFile[], userPrefs: UserPreferences) {
    // 1. Анализируем контент
    const contentType = await this.detectContentType(media);
    
    // 2. Получаем паттерн для этого типа контента
    const pattern = userPrefs.contentPatterns[contentType];
    
    // 3. Генерируем для каждой платформы
    const projects = await Promise.all([
      this.generateForPlatform('youtube', media, pattern),
      this.generateForPlatform('instagram', media, pattern),
      this.generateForPlatform('tiktok', media, pattern),
      this.generateForPlatform('telegram', media, pattern)
    ]);
    
    return projects;
  }
  
  private async generateForPlatform(
    platform: Platform, 
    media: MediaFile[], 
    pattern: ContentPattern
  ) {
    const settings = this.userPrefs.platforms[platform];
    
    return {
      platform,
      project: await this.createProject({
        media,
        duration: settings.preferredDuration,
        aspectRatio: settings.aspectRatio,
        transitions: pattern.transitions,
        effects: pattern.effects,
        music: this.selectMusic(pattern.musicStyle),
        colorGrading: pattern.colorProfile,
        text: this.generateText(platform, pattern)
      })
    };
  }
}
```

## UI/UX для настройки предпочтений

### Визуальный конструктор стиля
```
┌─────────────────────────────────────┐
│     Мои стили монтажа               │
├─────────────────────────────────────┤
│                                     │
│ [📱 Для соцсетей]                   │
│ ├─ Переходы: Быстрые                │
│ ├─ Музыка: Трендовая                │
│ └─ Длительность: 15-30 сек          │
│                                     │
│ [🎬 Влоги]                          │
│ ├─ Переходы: Плавные                │
│ ├─ Музыка: Фоновая                  │
│ └─ Длительность: 3-10 мин           │
│                                     │
│ [🏝️ Путешествия]                    │
│ ├─ Переходы: Кинематографичные      │
│ ├─ Музыка: Эпичная                  │
│ └─ Эффекты: Цветокоррекция          │
│                                     │
│ [+ Создать новый стиль]             │
└─────────────────────────────────────┘
```

### Обучение через примеры
```tsx
const StyleLearning = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Покажи свой стиль</CardTitle>
        <CardDescription>
          Загрузи 3-5 видео, которые тебе нравятся, 
          и AI научится делать похожие
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DropZone 
          accept="video/*"
          onDrop={analyzeReferenceVideos}
          text="Перетащи примеры видео сюда"
        />
        
        {analyzedFeatures && (
          <div className="mt-4">
            <h4>AI обнаружил:</h4>
            <ul>
              <li>Быстрые переходы каждые 2-3 сек</li>
              <li>Яркая цветокоррекция</li>
              <li>Синхронизация с битом</li>
              <li>Текст в начале и конце</li>
            </ul>
            <Button onClick={saveAsStyle}>
              Сохранить как мой стиль
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
```

## Автоматизация процесса

### 1. Quick Create - одна кнопка
```tsx
const QuickCreate = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleQuickCreate = async (files: File[]) => {
    setIsProcessing(true);
    
    // AI делает всё автоматически
    const results = await autoGenerator.generateAll(files);
    
    // Показываем результаты
    showResults(results);
  };
  
  return (
    <div className="quick-create-zone">
      <DropZone
        onDrop={handleQuickCreate}
        className="large-drop-zone"
      >
        <Upload size={48} />
        <h2>Брось видео сюда</h2>
        <p>AI создаст версии для всех платформ автоматически</p>
      </DropZone>
      
      {isProcessing && <ProcessingAnimation />}
    </div>
  );
};
```

### 2. Фоновая обработка
```typescript
class BackgroundProcessor {
  async processInBackground(media: MediaFile[]) {
    // Создаем задачу
    const taskId = await this.createTask({
      type: 'auto-generate',
      media: media,
      status: 'pending'
    });
    
    // Уведомляем пользователя
    await this.notify({
      title: 'Начал создавать видео',
      body: `Обрабатываю ${media.length} файлов...`,
      taskId
    });
    
    // Обработка в фоне
    const worker = new Worker('auto-generate.worker.js');
    worker.postMessage({ taskId, media });
    
    worker.onmessage = async (e) => {
      if (e.data.status === 'complete') {
        await this.notify({
          title: 'Видео готовы! 🎉',
          body: 'Создал 4 версии для разных платформ',
          action: 'Открыть',
          taskId
        });
      }
    };
  }
}
```

## Хранение данных

### 1. Локальная база предпочтений
```typescript
// SQLite через Tauri
const preferencesSchema = `
  CREATE TABLE user_preferences (
    id INTEGER PRIMARY KEY,
    user_id TEXT,
    preference_type TEXT,
    preference_data JSON,
    usage_count INTEGER DEFAULT 1,
    last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE style_patterns (
    id INTEGER PRIMARY KEY,
    pattern_name TEXT,
    content_type TEXT,
    pattern_data JSON,
    success_rate REAL,
    usage_count INTEGER DEFAULT 0
  );
  
  CREATE INDEX idx_usage ON user_preferences(usage_count DESC);
  CREATE INDEX idx_last_used ON user_preferences(last_used DESC);
`;
```

### 2. Синхронизация через облако (опционально)
```typescript
interface CloudSync {
  // Зашифрованное хранение предпочтений
  async syncPreferences(userId: string) {
    const localPrefs = await this.getLocalPreferences();
    const encrypted = await this.encrypt(localPrefs, userId);
    
    await api.post('/user/preferences', {
      userId,
      data: encrypted,
      version: PREFERENCE_VERSION
    });
  }
  
  // Получение с других устройств
  async fetchPreferences(userId: string) {
    const response = await api.get(`/user/preferences/${userId}`);
    const decrypted = await this.decrypt(response.data, userId);
    
    await this.mergeWithLocal(decrypted);
  }
}
```

## Примеры автоматизации

### 1. Утренняя рутина влогера
```typescript
// Пользователь каждое утро загружает видео с телефона
const morningRoutine = {
  trigger: 'folder-watch', // или 'schedule'
  folder: '/Users/vlogger/Morning Videos/',
  
  actions: [
    {
      type: 'auto-generate',
      platforms: ['youtube', 'instagram'],
      style: 'morning-vlog',
      music: 'calm-morning-playlist'
    },
    {
      type: 'add-intro',
      template: 'good-morning-subscribers'
    },
    {
      type: 'export',
      quality: '1080p',
      location: 'ready-to-upload/'
    }
  ]
};
```

### 2. Автоматическая нарезка для соцсетей
```typescript
// Из одного длинного видео - много коротких
const socialMediaCuts = {
  input: 'long-video.mp4',
  
  outputs: [
    {
      platform: 'tiktok',
      duration: 60,
      highlights: 'auto-detect', // AI находит лучшие моменты
      style: 'viral-tiktok'
    },
    {
      platform: 'instagram-reels',
      duration: 30,
      aspectRatio: '9:16',
      style: 'trendy-reels'
    },
    {
      platform: 'youtube-shorts',
      duration: 60,
      addCaptions: true,
      style: 'youtube-shorts-style'
    }
  ]
};
```

## Настройки конфиденциальности

```typescript
interface PrivacySettings {
  // Что сохранять
  savePreferences: {
    styles: boolean;        // стили монтажа
    music: boolean;         // музыкальные предпочтения
    platforms: boolean;     // настройки платформ
    content: boolean;       // анализ контента
  };
  
  // Где хранить
  storage: {
    local: boolean;         // на устройстве
    cloud: boolean;         // в облаке
    encrypted: boolean;     // шифровать данные
  };
  
  // Автоматизация
  automation: {
    enabled: boolean;
    requireConfirmation: boolean;
    allowBackgroundProcessing: boolean;
  };
}
```

## План реализации

### Фаза 1: Базовое сохранение (1 неделя)
- [ ] SQLite схема для предпочтений
- [ ] Сохранение выборов пользователя
- [ ] Простые шаблоны стилей

### Фаза 2: Обучение (2 недели)
- [ ] Анализ созданных проектов
- [ ] Выявление паттернов
- [ ] UI для управления стилями

### Фаза 3: Автоматизация (1 неделя)
- [ ] Quick Create функционал
- [ ] Фоновая обработка
- [ ] Множественный экспорт

### Фаза 4: Продвинутые функции (1 неделя)
- [ ] Обучение на примерах
- [ ] Расписание и триггеры
- [ ] Облачная синхронизация

## Технические детали реализации

### State Machine для автоматизации
```typescript
const automationMachine = createMachine({
  initial: 'idle',
  states: {
    idle: {
      on: {
        MEDIA_ADDED: 'analyzing',
        SCHEDULE_TRIGGERED: 'fetching'
      }
    },
    
    analyzing: {
      invoke: {
        src: 'analyzeContent',
        onDone: {
          target: 'generating',
          actions: 'saveContentAnalysis'
        }
      }
    },
    
    generating: {
      invoke: {
        src: 'generateAllVersions',
        onDone: 'reviewing',
        onError: 'error'
      }
    },
    
    reviewing: {
      on: {
        APPROVE_ALL: 'exporting',
        MODIFY: 'editing',
        REJECT: 'idle'
      }
    },
    
    exporting: {
      invoke: {
        src: 'exportAllPlatforms',
        onDone: 'complete'
      }
    }
  }
});
```

## Метрики успеха

- **Точность предсказаний**: 85% пользователей довольны автоматическим результатом
- **Экономия времени**: 90% сокращение времени на создание видео
- **Использование автоматизации**: 60% пользователей используют Quick Create
- **Повторное использование стилей**: Каждый стиль используется 10+ раз