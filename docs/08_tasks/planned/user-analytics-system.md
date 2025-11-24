# Система аналитики пользователей

## Описание задачи

Разработка комплексной системы аналитики для Timeline Studio, включающей метрики использования функций, производительности, поведения пользователей и бизнес-аналитику для принятия продуктовых решений.

## Цели

1. **Понимание пользователей** - как используется продукт, какие функции популярны
2. **Оптимизация производительности** - выявление узких мест и проблем
3. **Продуктовые решения** - data-driven разработка новых функций
4. **Бизнес-метрики** - конверсия, retention, монетизация

## Принципы

### Приватность прежде всего
- ✅ **Анонимизация данных** - никаких персональных данных
- ✅ **Opt-in система** - пользователь явно соглашается
- ✅ **Прозрачность** - четкое объяснение что собираем
- ✅ **Контроль** - возможность отключить в любой момент
- ✅ **GDPR compliance** - соответствие европейским требованиям

## Архитектура системы

### 1. Клиентская часть (Frontend)

```typescript
// Центральный сервис аналитики
class AnalyticsService {
  private enabled: boolean = false
  private sessionId: string
  private userId: string // Анонимный ID
  private eventQueue: AnalyticsEvent[] = []
  
  // Инициализация
  async initialize(): Promise<void> {
    this.enabled = await this.getUserConsent()
    this.sessionId = this.generateSessionId()
    this.userId = await this.getOrCreateAnonymousId()
    
    if (this.enabled) {
      this.startSession()
      this.setupPerformanceMonitoring()
      this.setupErrorTracking()
    }
  }
  
  // Трекинг событий
  track(event: AnalyticsEvent): void {
    if (!this.enabled) return
    
    const enrichedEvent = {
      ...event,
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: Date.now(),
      platform: this.getPlatformInfo(),
      appVersion: this.getAppVersion()
    }
    
    this.eventQueue.push(enrichedEvent)
    this.flushIfNeeded()
  }
  
  // Пакетная отправка событий
  private async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return
    
    const events = [...this.eventQueue]
    this.eventQueue = []
    
    try {
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events })
      })
    } catch (error) {
      // Возвращаем события в очередь при ошибке
      this.eventQueue.unshift(...events)
    }
  }
}

// Типы событий
interface AnalyticsEvent {
  type: EventType
  category: EventCategory
  name: string
  properties?: Record<string, any>
  value?: number
  duration?: number
}

type EventType = 
  | 'page_view'
  | 'user_action' 
  | 'feature_usage'
  | 'performance'
  | 'error'
  | 'conversion'

type EventCategory =
  | 'navigation'
  | 'editing'
  | 'export'
  | 'import'
  | 'ai_tools'
  | 'templates'
  | 'effects'
  | 'system'
```

### 2. Автоматический трекинг функций

```typescript
// Декоратор для автоматического трекинга
function trackFeatureUsage(featureName: string, category: EventCategory) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value
    
    descriptor.value = async function (...args: any[]) {
      const startTime = performance.now()
      
      // Трекаем начало использования функции
      analytics.track({
        type: 'feature_usage',
        category: category,
        name: `${featureName}_started`,
        properties: {
          args: args.length,
          feature: featureName
        }
      })
      
      try {
        const result = await method.apply(this, args)
        const duration = performance.now() - startTime
        
        // Трекаем успешное завершение
        analytics.track({
          type: 'feature_usage',
          category: category,
          name: `${featureName}_completed`,
          duration: duration,
          properties: {
            success: true,
            feature: featureName
          }
        })
        
        return result
      } catch (error) {
        const duration = performance.now() - startTime
        
        // Трекаем ошибку
        analytics.track({
          type: 'error',
          category: category,
          name: `${featureName}_failed`,
          duration: duration,
          properties: {
            error: error.message,
            feature: featureName
          }
        })
        
        throw error
      }
    }
  }
}

// Пример использования
class VideoExportService {
  @trackFeatureUsage('video_export', 'export')
  async exportVideo(settings: ExportSettings): Promise<string> {
    // Реализация экспорта
  }
  
  @trackFeatureUsage('ai_upscale', 'ai_tools')
  async upscaleVideo(file: MediaFile): Promise<MediaFile> {
    // AI апскейлинг
  }
}
```

### 3. Метрики производительности

```typescript
// Мониторинг производительности
class PerformanceTracker {
  private vitals: WebVitals = {}
  
  // Web Vitals мониторинг
  trackWebVitals(): void {
    // Largest Contentful Paint
    this.observeMetric('LCP', (entry) => {
      analytics.track({
        type: 'performance',
        category: 'system',
        name: 'lcp',
        value: entry.startTime,
        properties: {
          element: entry.element?.tagName
        }
      })
    })
    
    // First Input Delay
    this.observeMetric('FID', (entry) => {
      analytics.track({
        type: 'performance',
        category: 'system',
        name: 'fid',
        value: entry.processingStart - entry.startTime
      })
    })
    
    // Cumulative Layout Shift
    this.observeMetric('CLS', (entry) => {
      analytics.track({
        type: 'performance',
        category: 'system',
        name: 'cls',
        value: entry.value
      })
    })
  }
  
  // Кастомные метрики производительности
  trackCustomMetrics(): void {
    // Время загрузки проекта
    this.trackProjectLoadTime()
    
    // Время рендеринга превью
    this.trackPreviewRenderTime()
    
    // Время экспорта видео
    this.trackExportTime()
    
    // Использование памяти
    this.trackMemoryUsage()
    
    // GPU производительность
    this.trackGPUMetrics()
  }
  
  private trackProjectLoadTime(): void {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'project-load') {
          analytics.track({
            type: 'performance',
            category: 'system',
            name: 'project_load_time',
            value: entry.duration,
            properties: {
              projectSize: this.getProjectSize(),
              mediaCount: this.getMediaCount()
            }
          })
        }
      }
    })
    
    observer.observe({ entryTypes: ['measure'] })
  }
  
  private trackMemoryUsage(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory
        analytics.track({
          type: 'performance',
          category: 'system',
          name: 'memory_usage',
          properties: {
            used: memory.usedJSHeapSize,
            total: memory.totalJSHeapSize,
            limit: memory.jsHeapSizeLimit
          }
        })
      }, 30000) // Каждые 30 секунд
    }
  }
}
```

### 4. Трекинг пользовательского поведения

```typescript
// Анализ пользовательских сессий
class UserBehaviorTracker {
  private currentPage: string = ''
  private sessionStartTime: number = Date.now()
  private pageStartTime: number = Date.now()
  
  // Навигация между страницами
  trackPageView(pageName: string): void {
    // Завершаем предыдущую страницу
    if (this.currentPage) {
      const timeOnPage = Date.now() - this.pageStartTime
      analytics.track({
        type: 'page_view',
        category: 'navigation',
        name: 'page_exit',
        duration: timeOnPage,
        properties: {
          page: this.currentPage,
          nextPage: pageName
        }
      })
    }
    
    // Начинаем новую страницу
    this.currentPage = pageName
    this.pageStartTime = Date.now()
    
    analytics.track({
      type: 'page_view',
      category: 'navigation',
      name: 'page_enter',
      properties: {
        page: pageName,
        sessionDuration: Date.now() - this.sessionStartTime
      }
    })
  }
  
  // Funnel анализ (воронка конверсии)
  trackFunnelStep(funnelName: string, step: string, stepIndex: number): void {
    analytics.track({
      type: 'conversion',
      category: 'funnel',
      name: `${funnelName}_step_${stepIndex}`,
      properties: {
        funnel: funnelName,
        step: step,
        stepIndex: stepIndex
      }
    })
  }
  
  // A/B тестирование
  trackExperiment(experimentName: string, variant: string): void {
    analytics.track({
      type: 'user_action',
      category: 'experiment',
      name: 'experiment_exposure',
      properties: {
        experiment: experimentName,
        variant: variant
      }
    })
  }
  
  // Heatmap данные (клики, скроллы)
  trackInteraction(element: HTMLElement, interactionType: 'click' | 'hover' | 'scroll'): void {
    const rect = element.getBoundingClientRect()
    
    analytics.track({
      type: 'user_action',
      category: 'interaction',
      name: interactionType,
      properties: {
        elementType: element.tagName,
        elementId: element.id,
        elementClass: element.className,
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
        page: this.currentPage
      }
    })
  }
}
```

### 5. Серверная часть (Analytics API)

```typescript
// Express.js сервер для аналитики
class AnalyticsAPI {
  private clickhouse: ClickHouseClient
  private redis: RedisClient
  
  // Прием событий от клиентов
  async receiveEvents(req: Request, res: Response): Promise<void> {
    const { events } = req.body
    
    // Валидация данных
    const validEvents = this.validateEvents(events)
    
    // Анонимизация (удаление потенциально личных данных)
    const anonymizedEvents = this.anonymizeEvents(validEvents)
    
    // Enrichment (добавление геолокации по IP, device info)
    const enrichedEvents = await this.enrichEvents(anonymizedEvents, req)
    
    // Сохранение в ClickHouse
    await this.clickhouse.insert('events', enrichedEvents)
    
    // Кеширование агрегатов в Redis
    await this.updateRealtimeMetrics(enrichedEvents)
    
    res.status(200).json({ success: true })
  }
  
  // Обработка и агрегация данных
  private async enrichEvents(events: AnalyticsEvent[], req: Request): Promise<EnrichedEvent[]> {
    const ip = req.ip
    const userAgent = req.get('User-Agent')
    
    // Геолокация (без точного адреса, только страна/город)
    const geo = await this.getGeoFromIP(ip)
    
    // Парсинг User-Agent
    const device = this.parseUserAgent(userAgent)
    
    return events.map(event => ({
      ...event,
      geo: {
        country: geo.country,
        city: geo.city,
        timezone: geo.timezone
      },
      device: {
        os: device.os,
        browser: device.browser,
        deviceType: device.deviceType
      },
      network: {
        connection: req.get('connection-type') || 'unknown'
      }
    }))
  }
}
```

### 6. Дашборды и отчеты

```typescript
// React компоненты для аналитических дашбордов
const AnalyticsDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState('7d')
  const [metrics, setMetrics] = useState<DashboardMetrics>()
  
  return (
    <div className="analytics-dashboard">
      {/* Основные метрики */}
      <MetricsOverview metrics={metrics} />
      
      {/* Графики */}
      <div className="charts-grid">
        <ActiveUsersChart timeRange={timeRange} />
        <FeatureUsageChart timeRange={timeRange} />
        <PerformanceChart timeRange={timeRange} />
        <ErrorRateChart timeRange={timeRange} />
      </div>
      
      {/* Детальные таблицы */}
      <div className="tables-section">
        <PopularFeaturesTable />
        <UserSegmentsTable />
        <ConversionFunnelTable />
      </div>
    </div>
  )
}

// Компонент графика активных пользователей
const ActiveUsersChart: React.FC<{ timeRange: string }> = ({ timeRange }) => {
  const { data, loading } = useSWR(
    `/api/analytics/active-users?range=${timeRange}`,
    fetcher
  )
  
  if (loading) return <ChartSkeleton />
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Активные пользователи</CardTitle>
      </CardHeader>
      <CardContent>
        <LineChart
          data={data}
          xAxis="date"
          yAxis="users"
          height={300}
        />
      </CardContent>
    </Card>
  )
}
```

## Ключевые метрики для отслеживания

### 1. Продуктовые метрики

```typescript
interface ProductMetrics {
  // Активность пользователей
  dau: number              // Daily Active Users
  wau: number              // Weekly Active Users
  mau: number              // Monthly Active Users
  retention: {
    day1: number           // Retention на 1 день
    day7: number           // Retention на 7 дней
    day30: number          // Retention на 30 дней
  }
  
  // Использование функций
  featureAdoption: {
    [featureName: string]: {
      users: number         // Количество пользователей
      usage: number         // Количество использований
      adoptionRate: number  // % от всех пользователей
    }
  }
  
  // Производительность
  performance: {
    avgLoadTime: number     // Среднее время загрузки
    avgExportTime: number   // Среднее время экспорта
    errorRate: number       // Процент ошибок
    crashRate: number       // Процент крашей
  }
  
  // Контент
  projects: {
    created: number         // Созданных проектов
    completed: number       // Завершенных проектов
    avgDuration: number     // Средняя длительность
    avgClips: number        // Среднее количество клипов
  }
}
```

### 2. Бизнес-метрики

```typescript
interface BusinessMetrics {
  // Конверсия
  conversion: {
    trialToSub: number      // Trial → Подписка
    freeToTrial: number     // Free → Trial
    tierUpgrade: number     // Апгрейд тарифа
  }
  
  // Доходы
  revenue: {
    mrr: number             // Monthly Recurring Revenue
    arpu: number            // Average Revenue Per User
    ltv: number             // Life Time Value
    churn: number           // Процент оттока
  }
  
  // Поддержка
  support: {
    tickets: number         // Количество тикетов
    satisfaction: number    // Удовлетворенность (1-5)
    resolutionTime: number  // Время решения (часы)
  }
}
```

### 3. Технические метрики

```typescript
interface TechnicalMetrics {
  // Производительность приложения
  performance: {
    lcp: number            // Largest Contentful Paint
    fid: number            // First Input Delay
    cls: number            // Cumulative Layout Shift
    ttfb: number           // Time to First Byte
  }
  
  // Использование ресурсов
  resources: {
    cpuUsage: number       // Использование CPU (%)
    memoryUsage: number    // Использование памяти (MB)
    diskUsage: number      // Использование диска (MB)
    networkUsage: number   // Сетевой трафик (MB)
  }
  
  // Ошибки и стабильность
  errors: {
    jsErrors: number       // JavaScript ошибки
    networkErrors: number  // Сетевые ошибки
    renderErrors: number   // Ошибки рендеринга
    crashRate: number      // Процент крашей
  }
}
```

## Специфические метрики для Timeline Studio

### 1. Метрики видеоредактора

```typescript
// Трекинг использования функций редактора
const trackEditingMetrics = {
  // Временная шкала
  timeline: {
    tracksUsed: number,           // Количество используемых треков
    clipsAdded: number,           // Добавленных клипов  
    transitionsApplied: number,   // Примененных переходов
    effectsApplied: number,       // Примененных эффектов
    timelineLength: number        // Длительность проекта
  },
  
  // AI инструменты
  aiTools: {
    smartMontage: number,         // Использование умного монтажа
    sceneDetection: number,       // Определение сцен
    voiceEnhancement: number,     // Улучшение голоса
    backgroundRemoval: number,    // Удаление фона
    colorGrading: number          // Цветокоррекция
  },
  
  // Экспорт
  export: {
    format: string,               // Формат экспорта
    resolution: string,           // Разрешение
    duration: number,             // Время экспорта
    fileSize: number,             // Размер файла
    success: boolean              // Успешность экспорта
  }
}
```

### 2. Workflow аналитика

```typescript
// Анализ рабочих процессов пользователей
interface WorkflowAnalytics {
  // Типичные паттерны использования
  commonWorkflows: {
    name: string,                 // "Quick Edit", "Advanced Project"
    steps: string[],              // Последовательность действий
    frequency: number,            // Частота использования
    avgDuration: number           // Среднее время выполнения
  }[],
  
  // Точки отвала (где пользователи бросают)
  dropOffPoints: {
    step: string,                 // Название шага
    dropOffRate: number,          // Процент отвала
    avgTimeBeforeDrop: number     // Время до отвала
  }[],
  
  // Эффективность функций
  featureEffectiveness: {
    [featureName: string]: {
      completionRate: number,     // Процент завершения
      timeToComplete: number,     // Время до завершения  
      errorRate: number,          // Процент ошибок
      satisfactionScore: number   // Оценка пользователей
    }
  }
}
```

## План реализации

### Фаза 1: Базовая инфраструктура (3-4 недели)

1. **Клиентский SDK**
   - [ ] AnalyticsService с очередью событий
   - [ ] Система согласий (GDPR compliant)
   - [ ] Автоматический трекинг основных действий
   - [ ] Декораторы для функций

2. **Серверная часть**
   - [ ] API для приема событий
   - [ ] ClickHouse для хранения данных
   - [ ] Redis для real-time метрик
   - [ ] Базовые агрегации

### Фаза 2: Метрики и дашборды (4-5 недель)

3. **Основные метрики**
   - [ ] DAU/WAU/MAU расчеты
   - [ ] Retention cohorts
   - [ ] Feature adoption rates
   - [ ] Performance metrics

4. **Дашборды**
   - [ ] Админ-панель с основными метриками
   - [ ] Графики и визуализации
   - [ ] Настраиваемые отчеты
   - [ ] Алерты и уведомления

### Фаза 3: Продвинутая аналитика (3-4 недели)

5. **Behavioral analytics**
   - [ ] User journey mapping
   - [ ] Funnel analysis
   - [ ] Cohort analysis
   - [ ] Segmentation

6. **Продуктовая аналитика**
   - [ ] Feature usage patterns
   - [ ] Workflow optimization
   - [ ] A/B testing framework
   - [ ] Churn prediction

### Фаза 4: AI и автоматизация (2-3 недели)

7. **Умные инсайты**
   - [ ] Автоматическое выявление трендов
   - [ ] Аномалии в поведении
   - [ ] Персонализированные рекомендации
   - [ ] Предиктивная аналитика

## Соответствие приватности

### GDPR Compliance

```typescript
// Система управления согласиями
class ConsentManager {
  // Получение согласия пользователя
  async requestConsent(): Promise<boolean> {
    const modal = new ConsentModal({
      title: 'Помочь улучшить Timeline Studio?',
      description: `
        Мы собираем анонимные данные использования для улучшения продукта:
        • Какие функции используются чаще всего
        • Производительность приложения
        • Ошибки и проблемы
        
        Мы НЕ собираем:
        • Личную информацию
        • Содержимое ваших проектов
        • Файлы или медиа
      `,
      options: {
        analytics: true,
        performance: true,
        errors: true
      }
    })
    
    return await modal.show()
  }
  
  // Отзыв согласия
  async revokeConsent(): Promise<void> {
    await this.clearStoredData()
    await this.notifyServer('consent_revoked')
    analytics.disable()
  }
  
  // Экспорт данных пользователя
  async exportUserData(userId: string): Promise<UserData> {
    return await fetch(`/api/analytics/export/${userId}`)
  }
  
  // Удаление всех данных пользователя
  async deleteUserData(userId: string): Promise<void> {
    await fetch(`/api/analytics/delete/${userId}`, { method: 'DELETE' })
  }
}
```

## Монетизация данных

### Продуктовые инсайты для развития
```typescript
// Использование аналитики для принятия решений
const productInsights = {
  // Какие функции разрабатывать дальше
  featurePriority: () => {
    // Топ неиспользуемых функций = кандидаты на улучшение UX
    // Топ используемых = развивать дальше
    // Корреляция использования с retention
  },
  
  // Где пользователи застревают
  uxOptimization: () => {
    // Высокий bounce rate на определенных экранах
    // Долгое время выполнения задач
    // Высокий error rate в функциях
  },
  
  // Персонализация
  userSegmentation: () => {
    // Новички vs Профи
    // Casual vs Power users  
    // По типу контента (подкасты, YouTube, фильмы)
  }
}
```

## Метрики успеха

1. **Внедрение**
   - 70%+ пользователей дают согласие на аналитику
   - < 1% impact на производительность
   - 99.9% uptime аналитических сервисов

2. **Качество данных**
   - < 5% потерянных событий
   - < 10 секунд задержка до дашборда
   - 100% покрытие критических user flows

3. **Бизнес-value**
   - 20%+ improvement в retention через оптимизации
   - 3+ data-driven продуктовых решения в месяц
   - 15%+ увеличение feature adoption

## Приоритет

Высокий - критически важно для понимания продукта и принятия решений о развитии.