# Интеграция с Stock Footage сервисами

## Описание задачи

Интеграция Timeline Studio с популярными платформами стокового контента для прямого поиска, предпросмотра и импорта видео, фото и музыки без покидания редактора.

## Цели

1. **Бесшовная интеграция** - поиск стокового контента прямо в браузере медиа
2. **Широкий выбор** - поддержка 5+ популярных платформ
3. **Лицензирование** - автоматическое управление лицензиями и авторскими правами
4. **Производительность** - быстрый поиск с предпросмотром

## Целевые платформы

### Видео и фото
1. **Shutterstock** - 700+ миллионов ресурсов, API v2
2. **Unsplash** - 4+ миллиона бесплатных фото, отличное API
3. **Pexels** - бесплатные видео и фото, простое API
4. **Pixabay** - большая бесплатная коллекция
5. **Getty Images** - премиум контент (по запросу)

### Музыка и аудио
1. **Epidemic Sound** - популярно у YouTubers
2. **AudioJungle** - разнообразная музыка
3. **Freesound** - звуковые эффекты
4. **YouTube Audio Library** - бесплатная музыка Google
5. **Spotify** интеграция (для фонового прослушивания)

### Иконки и графика
1. **Flaticon** - векторные иконки
2. **Noun Project** - символы и иконки
3. **Figma Community** - UI элементы

## Архитектура системы

### 1. Stock Provider Framework

```typescript
// Базовый интерфейс для всех провайдеров
interface StockProvider {
  id: string
  name: string
  supportedTypes: ('video' | 'photo' | 'audio' | 'vector')[]
  
  // Авторизация
  auth: {
    type: 'oauth' | 'api-key' | 'free'
    scopes?: string[]
    endpoints: AuthEndpoints
  }
  
  // Поиск контента
  search(query: SearchQuery): Promise<SearchResult>
  
  // Получение деталей ресурса
  getAsset(id: string): Promise<StockAsset>
  
  // Скачивание
  download(asset: StockAsset, license: LicenseType): Promise<DownloadResult>
  
  // Управление лицензиями
  licenses: LicenseManager
}

// Поисковый запрос
interface SearchQuery {
  query: string
  type: 'video' | 'photo' | 'audio' | 'vector'
  filters: {
    // Общие фильтры
    category?: string
    orientation?: 'horizontal' | 'vertical' | 'square'
    color?: string
    people?: 'none' | 'one' | 'group'
    
    // Видео специфичные
    duration?: [number, number] // мин-макс секунды
    fps?: number[]
    resolution?: Resolution[]
    
    // Аудио специфичные
    genre?: string
    mood?: string
    tempo?: 'slow' | 'medium' | 'fast'
    duration?: [number, number]
    
    // Фото специфичные
    minResolution?: Resolution
    fileType?: 'jpg' | 'png' | 'vector'
  }
  
  // Пагинация
  page: number
  perPage: number
  
  // Сортировка
  sortBy: 'relevance' | 'popular' | 'newest' | 'download_count'
}

// Результат поиска
interface SearchResult {
  query: string
  total: number
  page: number
  assets: StockAsset[]
  suggestions?: string[] // Предложения для уточнения
  filters?: AvailableFilters // Доступные фильтры для текущего запроса
}

// Стоковый ресурс
interface StockAsset {
  id: string
  provider: string
  type: 'video' | 'photo' | 'audio' | 'vector'
  
  // Метаданные
  title: string
  description?: string
  tags: string[]
  category: string
  
  // Превью
  thumbnails: {
    small: string    // 150x150
    medium: string   // 400x400
    large: string    // 800x800
  }
  preview?: string   // Для видео - превью, для аудио - waveform
  
  // Технические данные
  dimensions?: {
    width: number
    height: number
  }
  duration?: number  // Для видео/аудио в секундах
  fileSize?: number
  format?: string
  
  // Авторские права
  author: {
    name: string
    url?: string
  }
  license: LicenseInfo
  attribution?: string
  
  // Коммерческие данные
  pricing: {
    free: boolean
    credits?: number
    prices?: {
      standard?: number
      extended?: number
      editorial?: number
    }
  }
  
  // Статистика
  stats?: {
    views: number
    downloads: number
    likes: number
  }
}
```

### 2. Провайдеры для каждого сервиса

```typescript
// Shutterstock провайдер
class ShutterstockProvider implements StockProvider {
  private apiKey: string
  private baseUrl = 'https://api.shutterstock.com/v2'
  
  async search(query: SearchQuery): Promise<SearchResult> {
    const params = this.buildSearchParams(query)
    const response = await fetch(`${this.baseUrl}/images/search?${params}`)
    return this.transformResponse(await response.json())
  }
  
  async download(asset: StockAsset, license: LicenseType): Promise<DownloadResult> {
    // Лицензирование и скачивание
    const licenseResponse = await this.licenseAsset(asset.id, license)
    const downloadUrl = await this.getDownloadUrl(licenseResponse.license_id)
    return { url: downloadUrl, license: licenseResponse }
  }
  
  private buildSearchParams(query: SearchQuery): URLSearchParams {
    const params = new URLSearchParams()
    params.set('query', query.query)
    params.set('page', query.page.toString())
    
    // Shutterstock специфичные параметры
    if (query.filters.orientation) {
      params.set('orientation', query.filters.orientation)
    }
    if (query.filters.category) {
      params.set('category', query.filters.category)
    }
    
    return params
  }
}

// Unsplash провайдер (бесплатный)
class UnsplashProvider implements StockProvider {
  private accessKey: string
  private baseUrl = 'https://api.unsplash.com'
  
  async search(query: SearchQuery): Promise<SearchResult> {
    const response = await fetch(
      `${this.baseUrl}/search/photos?query=${query.query}&page=${query.page}&per_page=${query.perPage}`,
      {
        headers: {
          'Authorization': `Client-ID ${this.accessKey}`
        }
      }
    )
    
    const data = await response.json()
    return {
      query: query.query,
      total: data.total,
      page: query.page,
      assets: data.results.map(this.transformUnsplashAsset)
    }
  }
  
  async download(asset: StockAsset): Promise<DownloadResult> {
    // Для Unsplash нужно отправить download tracking
    await fetch(`${this.baseUrl}/photos/${asset.id}/download`, {
      headers: { 'Authorization': `Client-ID ${this.accessKey}` }
    })
    
    return {
      url: asset.originalUrl,
      license: 'unsplash' // Unsplash License
    }
  }
}

// Epidemic Sound провайдер
class EpidemicSoundProvider implements StockProvider {
  async search(query: SearchQuery): Promise<SearchResult> {
    // Поиск музыки по жанру, настроению, темпу
    const params = {
      q: query.query,
      genres: query.filters.genre,
      moods: query.filters.mood,
      tempo: query.filters.tempo,
      duration_from: query.filters.duration?.[0],
      duration_to: query.filters.duration?.[1]
    }
    
    // Реализация поиска...
  }
}
```

### 3. UI компоненты

```typescript
// Интегрированный браузер стокового контента
interface StockBrowser {
  // Поиск и фильтры
  searchBar: {
    query: string
    suggestions: string[]
    recentSearches: string[]
    savedSearches: SavedSearch[]
  }
  
  // Панель фильтров
  filters: {
    providers: StockProvider[]
    type: MediaType
    category: string
    advanced: AdvancedFilters
  }
  
  // Результаты поиска
  results: {
    layout: 'grid' | 'list' | 'masonry'
    assets: StockAsset[]
    loading: boolean
    hasMore: boolean
  }
  
  // Превью ресурса
  preview: {
    asset: StockAsset | null
    playing: boolean // для видео/аудио
    volume: number
    fullscreen: boolean
  }
  
  // Корзина и лицензии
  cart: {
    items: StockAsset[]
    totalCost: number
    licenses: LicenseType[]
  }
}

// Компонент карточки ресурса
const StockAssetCard: React.FC<{
  asset: StockAsset
  onPreview: () => void
  onDownload: () => void
  onAddToCart: () => void
}> = ({ asset, onPreview, onDownload, onAddToCart }) => {
  return (
    <div className="stock-asset-card">
      {/* Превью изображение/видео */}
      <div className="preview-container">
        <img src={asset.thumbnails.medium} alt={asset.title} />
        
        {/* Оверлеи для видео/аудио */}
        {asset.type === 'video' && (
          <div className="video-overlay">
            <PlayIcon />
            <span className="duration">{formatDuration(asset.duration)}</span>
          </div>
        )}
        
        {/* Кнопки действий */}
        <div className="actions-overlay">
          <button onClick={onPreview}>
            <EyeIcon />
          </button>
          <button onClick={onAddToCart}>
            <PlusIcon />
          </button>
        </div>
      </div>
      
      {/* Информация */}
      <div className="asset-info">
        <h3 className="title">{asset.title}</h3>
        <p className="author">by {asset.author.name}</p>
        
        {/* Лицензия и цена */}
        <div className="license-info">
          {asset.pricing.free ? (
            <span className="free-badge">Free</span>
          ) : (
            <span className="price">${asset.pricing.prices?.standard}</span>
          )}
        </div>
        
        {/* Теги */}
        <div className="tags">
          {asset.tags.slice(0, 3).map(tag => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
```

### 4. Система лицензирования

```typescript
// Менеджер лицензий
class LicenseManager {
  // Типы лицензий
  licenses = {
    free: {
      name: 'Free',
      attribution: 'required',
      commercial: true,
      modifications: true,
      resale: false
    },
    standard: {
      name: 'Standard',
      attribution: 'optional',
      commercial: true,
      modifications: true,
      resale: false
    },
    extended: {
      name: 'Extended',
      attribution: 'optional',
      commercial: true,
      modifications: true,
      resale: true,
      prints: 'unlimited'
    }
  }
  
  // Проверка лицензии
  async verifyLicense(assetId: string, usage: UsageType): Promise<boolean> {
    const asset = await this.getAsset(assetId)
    const license = asset.license
    
    // Проверяем разрешения
    if (usage.commercial && !license.commercial) return false
    if (usage.resale && !license.resale) return false
    
    return true
  }
  
  // Автоматическое добавление атрибуции
  generateAttribution(asset: StockAsset): string {
    if (asset.license.attribution === 'required') {
      return `${asset.title} by ${asset.author.name} (${asset.provider})`
    }
    return ''
  }
  
  // Трекинг использования лицензий
  async trackUsage(assetId: string, projectId: string, usage: UsageType): Promise<void> {
    await this.db.licenses.add({
      assetId,
      projectId,
      usage,
      downloadedAt: new Date(),
      attribution: this.generateAttribution(asset)
    })
  }
}
```

## Интеграция с Timeline Studio

### 1. Браузер медиа расширение

```typescript
// Новая вкладка в браузере медиа
const mediaBrowserTabs = [
  { id: 'local', name: 'Локальные файлы' },
  { id: 'templates', name: 'Шаблоны' },
  { id: 'style-templates', name: 'Стили' },
  { id: 'stock', name: 'Стоковый контент' }, // НОВАЯ ВКЛАДКА
  { id: 'ai-tools', name: 'AI Инструменты' }
]

// Компонент стоковой вкладки
const StockMediaTab: React.FC = () => {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<StockFilters>({})
  const [results, setResults] = useState<StockAsset[]>([])
  
  return (
    <div className="stock-media-tab">
      {/* Поисковая панель */}
      <StockSearchBar
        query={query}
        onSearch={setQuery}
        filters={filters}
        onFiltersChange={setFilters}
      />
      
      {/* Результаты */}
      <StockResultsGrid
        assets={results}
        onAssetSelect={handleAssetImport}
        onPreview={handlePreview}
      />
      
      {/* Корзина для платного контента */}
      <StockCart />
    </div>
  )
}
```

### 2. Импорт в проект

```typescript
// Сервис импорта стокового контента
class StockImportService {
  // Импорт ресурса в проект
  async importAsset(
    asset: StockAsset,
    license: LicenseType,
    projectId: string
  ): Promise<MediaFile> {
    // 1. Лицензирование и скачивание
    const downloadResult = await this.stockService.download(asset, license)
    
    // 2. Сохранение в локальное хранилище
    const localPath = await this.saveToLocal(downloadResult.url, asset)
    
    // 3. Создание MediaFile
    const mediaFile: MediaFile = {
      id: generateId(),
      name: asset.title,
      path: localPath,
      type: asset.type,
      size: asset.fileSize || 0,
      duration: asset.duration,
      metadata: {
        width: asset.dimensions?.width,
        height: asset.dimensions?.height,
        // Добавляем метаданные стока
        stock: {
          provider: asset.provider,
          assetId: asset.id,
          license: license,
          attribution: downloadResult.license.attribution,
          author: asset.author.name,
          tags: asset.tags
        }
      }
    }
    
    // 4. Трекинг лицензии
    await this.licenseManager.trackUsage(asset.id, projectId, {
      type: 'import',
      commercial: true
    })
    
    // 5. Добавление в проект
    await this.projectService.addMediaFile(projectId, mediaFile)
    
    return mediaFile
  }
  
  // Автоматическое добавление атрибуции в титры
  async addAttributionToProject(projectId: string): Promise<void> {
    const usedAssets = await this.licenseManager.getProjectAssets(projectId)
    const attributions = usedAssets
      .filter(asset => asset.license.attribution === 'required')
      .map(asset => asset.attribution)
    
    if (attributions.length > 0) {
      await this.projectService.addCreditsSection(projectId, {
        title: 'Stock Content Credits',
        credits: attributions
      })
    }
  }
}
```

### 3. Smart Search функции

```typescript
// AI-powered поиск стокового контента
class SmartStockSearch {
  // Поиск по описанию сцены
  async searchByDescription(description: string): Promise<StockAsset[]> {
    // "A person working on laptop in a coffee shop"
    const tags = await this.extractTags(description)
    // ['person', 'laptop', 'coffee shop', 'working']
    
    const results = await Promise.all([
      this.searchShutterstock(tags),
      this.searchUnsplash(tags),
      this.searchPexels(tags)
    ])
    
    return this.mergeAndRankResults(results.flat())
  }
  
  // Поиск подходящей музыки по видео контенту
  async suggestMusicForVideo(videoFile: MediaFile): Promise<StockAsset[]> {
    const analysis = await this.analyzeVideoMood(videoFile)
    // { mood: 'energetic', tempo: 'fast', genre: 'electronic' }
    
    return await this.searchEpidemicSound({
      mood: analysis.mood,
      tempo: analysis.tempo,
      genre: analysis.genre,
      duration: [videoFile.duration * 0.8, videoFile.duration * 1.2]
    })
  }
  
  // Поиск по цветовой палитре
  async searchByColors(colors: string[]): Promise<StockAsset[]> {
    const colorQueries = colors.map(color => this.colorToQuery(color))
    // ['blue sky', 'sunset orange', 'forest green']
    
    return await this.searchMultipleProviders(colorQueries)
  }
}
```

## Монетизация и подписки

### Модель freemium
```typescript
interface StockSubscription {
  plan: 'free' | 'pro' | 'team' | 'enterprise'
  
  limits: {
    downloadsPerMonth: number
    providers: string[]
    maxResolution: Resolution
    commercialUse: boolean
  }
  
  features: {
    advancedSearch: boolean
    bulkDownload: boolean
    licenseManagement: boolean
    teamSharing: boolean
  }
}

const subscriptionPlans = {
  free: {
    downloadsPerMonth: 5,
    providers: ['unsplash', 'pexels', 'pixabay'], // Только бесплатные
    maxResolution: '1080p',
    commercialUse: false
  },
  pro: {
    downloadsPerMonth: 100,
    providers: ['all'],
    maxResolution: '4K',
    commercialUse: true,
    // Включает кредиты для Shutterstock
    credits: 50
  }
}
```

## План реализации

### Фаза 1: MVP (4-5 недель)
1. **Базовая архитектура**
   - [ ] StockProvider фреймворк
   - [ ] Unsplash провайдер (бесплатный)
   - [ ] Pexels провайдер (бесплатный)
   - [ ] Базовый UI для поиска

2. **Интеграция в браузер**
   - [ ] Новая вкладка "Стоковый контент"
   - [ ] Поиск и фильтрация
   - [ ] Превью ресурсов
   - [ ] Импорт в проект

### Фаза 2: Платные провайдеры (3-4 недели)
3. **Shutterstock интеграция**
   - [ ] OAuth авторизация
   - [ ] Платное лицензирование
   - [ ] Система кредитов
   - [ ] Управление подпиской

4. **Музыкальные сервисы**
   - [ ] Epidemic Sound API
   - [ ] AudioJungle интеграция
   - [ ] Freesound для SFX
   - [ ] Smart music suggestions

### Фаза 3: Smart функции (3-4 недели)
5. **AI-powered поиск**
   - [ ] Поиск по описанию
   - [ ] Цветовой поиск
   - [ ] Подбор музыки по настроению
   - [ ] Автоматические теги

6. **Продвинутые функции**
   - [ ] Bulk download
   - [ ] Коллекции и избранное
   - [ ] Автоматическая атрибуция
   - [ ] Лицензионный аудит

### Фаза 4: Расширение (2-3 недели)
7. **Дополнительные провайдеры**
   - [ ] Getty Images (премиум)
   - [ ] Flaticon (иконки)
   - [ ] Figma Community
   - [ ] Adobe Stock (по запросу)

## Метрики успеха

1. **Использование**
   - 60%+ пользователей используют стоковый контент
   - 10+ поисков в день на активного пользователя
   - 5+ импортов в неделю

2. **Конверсия**
   - 20% freemium → pro конверсия
   - $15 средний чек на платного пользователя
   - 70%+ retention rate

3. **Качество**
   - < 2 секунды время поиска
   - 95%+ успешность импорта
   - 4.5+ рейтинг функции

## Риски и митигация

1. **API лимиты провайдеров**
   - Риск: Высокие затраты на API
   - Митигация: Кеширование, rate limiting

2. **Лицензионные споры**
   - Риск: Неправильное использование лицензий
   - Митигация: Четкий трекинг, уведомления

3. **Конкуренция**
   - Риск: Adobe Stock доминирует
   - Митигация: Фокус на AI и интеграцию