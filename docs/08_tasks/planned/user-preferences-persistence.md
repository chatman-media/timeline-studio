# Система сохранения пользовательских настроек

## 📋 Информация
- **ID**: TASK-USER-003
- **Тип**: feature/improvement
- **Приоритет**: высокий
- **Оценка**: 2-3 недели
- **Веха**: v1.0

## 📝 Описание

Создание унифицированной системы для сохранения, синхронизации и управления всеми пользовательскими настройками и предпочтениями в Timeline Studio. Расширение существующей системы настроек для поддержки иерархической структуры, версионирования и облачной синхронизации.

## 🎯 Цели

1. **Единое хранилище** - все настройки в одном месте с четкой структурой
2. **Иерархия настроек** - глобальные → пользовательские → проектные
3. **Версионирование** - история изменений и возможность отката
4. **Синхронизация** - между устройствами через облако (опционально)
5. **Производительность** - быстрый доступ и минимальная задержка

## ✅ Критерии готовности

- [ ] Разработана схема данных для всех типов настроек
- [ ] Реализована система приоритетов настроек
- [ ] Создан unified settings API
- [ ] Реализовано версионирование настроек
- [ ] Добавлен импорт/экспорт настроек
- [ ] Оптимизирована производительность
- [ ] Реализована миграция существующих настроек
- [ ] Тесты написаны и проходят
- [ ] Документация обновлена
- [ ] Code review пройден

## 🔧 Техническая информация

### Иерархия настроек

```typescript
// Уровни настроек (от низшего к высшему приоритету)
enum SettingsLevel {
  DEFAULT = 0,      // Дефолтные настройки приложения
  GLOBAL = 1,       // Глобальные настройки для всех пользователей
  USER = 2,         // Настройки конкретного пользователя
  PROJECT = 3,      // Настройки конкретного проекта
  SESSION = 4       // Временные настройки сессии
}

// Unified Settings Schema
interface UnifiedSettings {
  // Метаданные
  version: string
  userId: string
  lastModified: Date
  syncEnabled: boolean
  
  // Категории настроек
  categories: {
    appearance: AppearanceSettings
    editor: EditorSettings
    export: ExportSettings
    shortcuts: ShortcutSettings
    ai: AISettings
    performance: PerformanceSettings
    privacy: PrivacySettings
    experimental: ExperimentalSettings
  }
  
  // Пользовательские предпочтения (из TASK-USER-PREFERENCES-AI)
  preferences: UserPreferences
  
  // Проектные настройки
  projectDefaults: ProjectDefaultSettings
}

// Детальные настройки по категориям
interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system' | 'custom'
  customTheme?: CustomTheme
  language: LanguageCode
  fontSize: 'small' | 'medium' | 'large'
  compactMode: boolean
  animations: boolean
  colorScheme: ColorScheme
  layout: {
    sidebarPosition: 'left' | 'right'
    sidebarWidth: number
    panelSizes: Record<string, number>
    toolbarPosition: 'top' | 'bottom'
  }
}

interface EditorSettings {
  autoSave: {
    enabled: boolean
    interval: number // секунды
    location: 'local' | 'cloud' | 'both'
  }
  timeline: {
    snapToGrid: boolean
    gridSize: number
    magneticTimeline: boolean
    showWaveforms: boolean
    showThumbnails: boolean
    thumbnailQuality: 'low' | 'medium' | 'high'
    trackHeight: number
  }
  playback: {
    defaultQuality: 'proxy' | 'half' | 'full'
    skipInterval: number // секунды
    loopPlayback: boolean
    audioScrubbing: boolean
  }
  defaultValues: {
    transitionDuration: number
    clipDuration: number
    fadeInDuration: number
    fadeOutDuration: number
  }
}

interface ExportSettings {
  defaultPresets: {
    youtube: ExportPreset
    instagram: ExportPreset
    tiktok: ExportPreset
    custom: ExportPreset[]
  }
  quality: {
    defaultBitrate: number
    defaultCodec: string
    hardwareAcceleration: boolean
    twoPass: boolean
  }
  output: {
    defaultFolder: string
    namingPattern: string
    overwriteExisting: boolean
    openFolderAfterExport: boolean
  }
}
```

### Settings Storage Manager

```typescript
// Централизованный менеджер настроек
class SettingsManager {
  private cache: Map<string, any> = new Map()
  private subscribers: Map<string, Set<SettingsListener>> = new Map()
  private storage: SettingsStorage
  
  constructor(storage: SettingsStorage) {
    this.storage = storage
    this.loadInitialSettings()
  }
  
  // Получение настройки с учетом иерархии
  async get<T>(
    path: string,
    options?: {
      level?: SettingsLevel
      projectId?: string
      useCache?: boolean
    }
  ): Promise<T> {
    const cacheKey = this.getCacheKey(path, options)
    
    // Проверяем кэш
    if (options?.useCache !== false && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }
    
    // Получаем значение с учетом иерархии
    const value = await this.resolveValue(path, options)
    
    // Кэшируем результат
    this.cache.set(cacheKey, value)
    
    return value
  }
  
  // Установка настройки
  async set<T>(
    path: string,
    value: T,
    options?: {
      level?: SettingsLevel
      projectId?: string
      persist?: boolean
    }
  ): Promise<void> {
    const level = options?.level || SettingsLevel.USER
    
    // Валидация значения
    await this.validateSetting(path, value)
    
    // Сохраняем значение
    await this.storage.set(path, value, level, options?.projectId)
    
    // Обновляем кэш
    const cacheKey = this.getCacheKey(path, options)
    this.cache.set(cacheKey, value)
    
    // Уведомляем подписчиков
    this.notifySubscribers(path, value, level)
    
    // Сохраняем историю
    if (options?.persist !== false) {
      await this.saveToHistory(path, value, level)
    }
  }
  
  // Подписка на изменения
  subscribe(
    path: string,
    listener: SettingsListener
  ): () => void {
    if (!this.subscribers.has(path)) {
      this.subscribers.set(path, new Set())
    }
    
    this.subscribers.get(path)!.add(listener)
    
    // Возвращаем функцию отписки
    return () => {
      this.subscribers.get(path)?.delete(listener)
    }
  }
  
  // Разрешение значения с учетом иерархии
  private async resolveValue(
    path: string,
    options?: {
      level?: SettingsLevel
      projectId?: string
    }
  ): Promise<any> {
    // Пробуем получить значения от высшего к низшему уровню
    const levels = [
      SettingsLevel.SESSION,
      SettingsLevel.PROJECT,
      SettingsLevel.USER,
      SettingsLevel.GLOBAL,
      SettingsLevel.DEFAULT
    ]
    
    for (const level of levels) {
      // Пропускаем уровни выше запрошенного
      if (options?.level && level > options.level) continue
      
      // Для проектного уровня нужен projectId
      if (level === SettingsLevel.PROJECT && !options?.projectId) continue
      
      const value = await this.storage.get(path, level, options?.projectId)
      if (value !== undefined) {
        return value
      }
    }
    
    // Возвращаем дефолтное значение
    return this.getDefaultValue(path)
  }
}
```

### Backend Storage (Rust)

```rust
// src-tauri/src/settings/storage.rs
use serde::{Serialize, Deserialize};
use sled::{Db, Tree};

pub struct SettingsStorage {
    db: Db,
    trees: HashMap<SettingsLevel, Tree>,
    history: Tree,
}

impl SettingsStorage {
    pub fn new(path: &Path) -> Result<Self> {
        let db = sled::open(path)?;
        
        let mut trees = HashMap::new();
        trees.insert(SettingsLevel::Default, db.open_tree("settings_default")?);
        trees.insert(SettingsLevel::Global, db.open_tree("settings_global")?);
        trees.insert(SettingsLevel::User, db.open_tree("settings_user")?);
        trees.insert(SettingsLevel::Project, db.open_tree("settings_project")?);
        trees.insert(SettingsLevel::Session, db.open_tree("settings_session")?);
        
        let history = db.open_tree("settings_history")?;
        
        Ok(Self { db, trees, history })
    }
    
    pub async fn get(
        &self,
        path: &str,
        level: SettingsLevel,
        context: Option<&str>
    ) -> Result<Option<Value>> {
        let tree = self.trees.get(&level).ok_or(Error::InvalidLevel)?;
        let key = self.build_key(path, context);
        
        match tree.get(&key)? {
            Some(bytes) => {
                let value: Value = bincode::deserialize(&bytes)?;
                Ok(Some(value))
            }
            None => Ok(None)
        }
    }
    
    pub async fn set(
        &self,
        path: &str,
        value: Value,
        level: SettingsLevel,
        context: Option<&str>
    ) -> Result<()> {
        let tree = self.trees.get(&level).ok_or(Error::InvalidLevel)?;
        let key = self.build_key(path, context);
        
        let bytes = bincode::serialize(&value)?;
        tree.insert(&key, bytes)?;
        
        // Добавляем в историю
        self.add_to_history(path, &value, level).await?;
        
        Ok(())
    }
    
    // Версионирование настроек
    async fn add_to_history(
        &self,
        path: &str,
        value: &Value,
        level: SettingsLevel
    ) -> Result<()> {
        let history_entry = HistoryEntry {
            path: path.to_string(),
            value: value.clone(),
            level,
            timestamp: Utc::now(),
            user_id: self.get_current_user_id()?,
        };
        
        let key = format!("{}:{}", path, history_entry.timestamp.timestamp());
        let bytes = bincode::serialize(&history_entry)?;
        
        self.history.insert(key.as_bytes(), bytes)?;
        
        // Очистка старой истории (храним последние 100 изменений)
        self.cleanup_history(path, 100).await?;
        
        Ok(())
    }
}

// Миграция настроек
pub struct SettingsMigration {
    migrations: Vec<Box<dyn Migration>>,
}

impl SettingsMigration {
    pub async fn run(&self, storage: &SettingsStorage) -> Result<()> {
        let current_version = storage.get_version().await?;
        
        for migration in &self.migrations {
            if migration.version() > current_version {
                println!("Running migration: {}", migration.description());
                migration.up(storage).await?;
                storage.set_version(migration.version()).await?;
            }
        }
        
        Ok(())
    }
}
```

### React Hooks для настроек

```typescript
// Хук для работы с настройками
function useSettings<T>(
  path: string,
  options?: UseSettingsOptions
): UseSettingsResult<T> {
  const settingsManager = useSettingsManager()
  const [value, setValue] = useState<T>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  // Загрузка начального значения
  useEffect(() => {
    settingsManager.get<T>(path, options)
      .then(setValue)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [path, options])
  
  // Подписка на изменения
  useEffect(() => {
    const unsubscribe = settingsManager.subscribe(path, (newValue) => {
      setValue(newValue as T)
    })
    
    return unsubscribe
  }, [path])
  
  // Функция обновления
  const updateValue = useCallback(async (newValue: T | ((prev: T) => T)) => {
    try {
      const resolvedValue = typeof newValue === 'function'
        ? newValue(value!)
        : newValue
        
      await settingsManager.set(path, resolvedValue, options)
      setValue(resolvedValue)
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }, [path, value, options])
  
  // Сброс к дефолтному значению
  const reset = useCallback(async () => {
    const defaultValue = await settingsManager.getDefault<T>(path)
    await updateValue(defaultValue)
  }, [path, updateValue])
  
  return {
    value,
    loading,
    error,
    set: updateValue,
    reset
  }
}

// Хук для проектных настроек
function useProjectSettings<T>(
  path: string,
  projectId?: string
): UseSettingsResult<T> {
  const currentProjectId = useCurrentProjectId()
  const effectiveProjectId = projectId || currentProjectId
  
  return useSettings<T>(path, {
    level: SettingsLevel.PROJECT,
    projectId: effectiveProjectId
  })
}

// Хук для массовых настроек
function useSettingsGroup<T extends Record<string, any>>(
  paths: string[]
): UseSettingsGroupResult<T> {
  const settingsManager = useSettingsManager()
  const [values, setValues] = useState<Partial<T>>({})
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    Promise.all(
      paths.map(async (path) => ({
        path,
        value: await settingsManager.get(path)
      }))
    ).then(results => {
      const newValues = results.reduce((acc, { path, value }) => ({
        ...acc,
        [path]: value
      }), {})
      
      setValues(newValues as T)
      setLoading(false)
    })
  }, [paths])
  
  const updateAll = useCallback(async (updates: Partial<T>) => {
    await Promise.all(
      Object.entries(updates).map(([path, value]) =>
        settingsManager.set(path, value)
      )
    )
    
    setValues(prev => ({ ...prev, ...updates }))
  }, [])
  
  return { values, loading, updateAll }
}
```

### UI для управления настройками

```tsx
// Улучшенный Settings Modal
const EnhancedSettingsModal: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [changedSettings, setChangedSettings] = useState<Set<string>>(new Set())
  const [showOnlyChanged, setShowOnlyChanged] = useState(false)
  
  return (
    <Modal size="xl">
      <div className="settings-modal">
        {/* Поиск и фильтры */}
        <div className="settings-header">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Поиск настроек..."
          />
          
          <div className="settings-filters">
            <Toggle
              checked={showOnlyChanged}
              onChange={setShowOnlyChanged}
              label="Только измененные"
            />
            
            <Button
              variant="ghost"
              onClick={resetAllChanges}
              disabled={changedSettings.size === 0}
            >
              Сбросить изменения ({changedSettings.size})
            </Button>
          </div>
        </div>
        
        {/* Категории настроек */}
        <Tabs defaultValue="appearance">
          <TabsList>
            <TabsTrigger value="appearance">
              <Palette className="mr-2" />
              Внешний вид
            </TabsTrigger>
            <TabsTrigger value="editor">
              <Edit className="mr-2" />
              Редактор
            </TabsTrigger>
            <TabsTrigger value="export">
              <Download className="mr-2" />
              Экспорт
            </TabsTrigger>
            <TabsTrigger value="shortcuts">
              <Keyboard className="mr-2" />
              Горячие клавиши
            </TabsTrigger>
            <TabsTrigger value="advanced">
              <Settings2 className="mr-2" />
              Продвинутые
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="appearance">
            <AppearanceSettings
              searchQuery={searchQuery}
              onSettingChange={handleSettingChange}
            />
          </TabsContent>
          
          <TabsContent value="editor">
            <EditorSettings
              searchQuery={searchQuery}
              onSettingChange={handleSettingChange}
            />
          </TabsContent>
          
          {/* ... другие вкладки */}
        </Tabs>
        
        {/* Действия */}
        <div className="settings-footer">
          <div className="settings-actions-left">
            <Button variant="ghost" onClick={exportSettings}>
              <Upload className="mr-2" />
              Экспортировать
            </Button>
            
            <Button variant="ghost" onClick={importSettings}>
              <Download className="mr-2" />
              Импортировать
            </Button>
          </div>
          
          <div className="settings-actions-right">
            <Button variant="ghost" onClick={close}>
              Отмена
            </Button>
            
            <Button onClick={saveSettings}>
              Сохранить изменения
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

// Компонент для отдельной настройки
const SettingItem: React.FC<{
  path: string
  label: string
  description?: string
  type: 'toggle' | 'select' | 'input' | 'slider' | 'color'
  options?: any
  onChange: (value: any) => void
}> = ({ path, label, description, type, options, onChange }) => {
  const { value, loading, set } = useSettings(path)
  const [localValue, setLocalValue] = useState(value)
  const isChanged = localValue !== value
  
  const handleChange = (newValue: any) => {
    setLocalValue(newValue)
    onChange(newValue)
  }
  
  return (
    <div className={cn("setting-item", { "setting-changed": isChanged })}>
      <div className="setting-info">
        <label>{label}</label>
        {description && <p className="setting-description">{description}</p>}
      </div>
      
      <div className="setting-control">
        {type === 'toggle' && (
          <Switch
            checked={localValue}
            onCheckedChange={handleChange}
            disabled={loading}
          />
        )}
        
        {type === 'select' && (
          <Select value={localValue} onValueChange={handleChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((option: any) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        
        {/* ... другие типы контролов */}
      </div>
      
      {isChanged && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleChange(value)}
          className="setting-reset"
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}
```

### Синхронизация настроек

```typescript
// Сервис синхронизации с облаком
class SettingsSyncService {
  private syncQueue: SyncOperation[] = []
  private syncing = false
  
  async enableSync(userId: string, token: string) {
    // Инициализация синхронизации
    await this.storage.set('sync.enabled', true)
    await this.storage.set('sync.userId', userId)
    await this.storage.set('sync.token', token)
    
    // Первичная синхронизация
    await this.performInitialSync()
    
    // Запуск периодической синхронизации
    this.startPeriodicSync()
  }
  
  private async performSync() {
    if (this.syncing) return
    
    this.syncing = true
    
    try {
      // Получаем локальные изменения
      const localChanges = await this.getLocalChanges()
      
      // Получаем удаленные изменения
      const remoteChanges = await this.fetchRemoteChanges()
      
      // Разрешаем конфликты
      const resolved = await this.resolveConflicts(localChanges, remoteChanges)
      
      // Применяем изменения
      await this.applyChanges(resolved)
      
      // Обновляем метки времени
      await this.updateSyncTimestamps()
      
    } finally {
      this.syncing = false
    }
  }
  
  private async resolveConflicts(
    local: SettingsChange[],
    remote: SettingsChange[]
  ): Promise<SettingsChange[]> {
    const conflicts = this.findConflicts(local, remote)
    
    if (conflicts.length === 0) {
      return [...local, ...remote]
    }
    
    // Стратегия разрешения конфликтов
    return conflicts.map(conflict => {
      // По умолчанию: последнее изменение побеждает
      if (conflict.local.timestamp > conflict.remote.timestamp) {
        return conflict.local
      } else {
        return conflict.remote
      }
    })
  }
}
```

### Затрагиваемые модули
- `src/features/user-settings/` - основная реализация
- `src/features/app-settings/` - интеграция с глобальными настройками
- `src/features/project-settings/` - проектные настройки
- `src-tauri/src/settings/` - backend хранилище
- Все feature модули для миграции к новой системе

### Зависимости
- [TASK-USER-001](user-identity-system.md) - интеграция с системой пользователей
- [User Preferences AI Automation](user-preferences-ai-automation.md) - хранение AI предпочтений
- sled или SQLite для эффективного key-value хранилища
- Опциональная облачная синхронизация

## 🧪 Тестирование

### Тест-кейсы
1. **Иерархия настроек**:
   - Шаги: Установить настройку на разных уровнях
   - Ожидаемый результат: Правильный приоритет (проект > пользователь > глобальный)

2. **Производительность**:
   - Шаги: Загрузить 1000+ настроек
   - Ожидаемый результат: < 50ms время доступа

3. **Синхронизация**:
   - Шаги: Изменить настройку на одном устройстве
   - Ожидаемый результат: Изменение появляется на другом устройстве

4. **Миграция**:
   - Шаги: Обновить приложение со старой версии
   - Ожидаемый результат: Все настройки сохранены и доступны

### Регрессионное тестирование
- Проверить работу всех существующих настроек
- Убедиться в обратной совместимости
- Проверить производительность при большом количестве настроек

## 📊 Прогресс

- [x] Анализ требований
- [x] Дизайн решения
- [ ] Схема данных
- [ ] Backend хранилище
- [ ] Settings Manager
- [ ] React hooks
- [ ] UI компоненты
- [ ] Миграция существующих настроек
- [ ] Синхронизация (опционально)
- [ ] Тестирование
- [ ] Документация
- [ ] Review
- [ ] Merge

## 💬 Обсуждение

Ключевые решения:
- Использование sled для быстрого key-value хранилища
- Кэширование часто используемых настроек
- Ленивая загрузка для редко используемых настроек
- Версионирование для возможности отката

## 🔗 Ссылки

- [Settings Best Practices](https://www.electronjs.org/docs/api/storage)
- [sled - Embedded Database](https://github.com/spacejam/sled)
- [React Context Best Practices](https://kentcdodds.com/blog/how-to-use-react-context-effectively)