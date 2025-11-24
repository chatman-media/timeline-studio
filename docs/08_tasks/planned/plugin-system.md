# Plugin System - Система плагинов

## 📋 Обзор

Plugin System - это модульная архитектура для Timeline Studio, позволяющая сторонним разработчикам создавать и интегрировать собственные расширения. Система обеспечивает безопасную изоляцию плагинов, стандартизированные API и marketplace для распространения.

## 🎯 Цели и задачи

### Основные цели:
1. **Расширяемость** - возможность добавления новой функциональности
2. **Безопасность** - изоляция и sandboxing плагинов
3. **Производительность** - минимальный оверхед от плагинов
4. **Удобство разработки** - простые API и инструменты

### Ключевые возможности:
- WebAssembly-based плагины для безопасности
- TypeScript/Rust SDK для разработки
- Hot-reload для разработки
- Marketplace интеграция
- Версионирование и автообновления
- Sandboxed execution environment

## 🏗️ Техническая архитектура

### Frontend структура:
```
src/features/plugin-system/
├── components/
│   ├── plugin-manager/        # Менеджер плагинов
│   │   ├── installed-plugins.tsx # Установленные плагины
│   │   ├── marketplace.tsx    # Marketplace
│   │   ├── plugin-details.tsx # Детали плагина
│   │   └── settings-panel.tsx # Настройки
│   ├── developer-tools/       # Инструменты разработчика
│   │   ├── plugin-debugger.tsx # Отладчик
│   │   ├── console.tsx        # Консоль
│   │   └── profiler.tsx       # Профайлер
│   ├── sandbox/              # Песочница
│   │   ├── plugin-runner.tsx  # Выполнение плагинов
│   │   ├── api-proxy.tsx     # Прокси API
│   │   └── security-monitor.tsx # Монитор безопасности
│   └── sdk-tools/            # SDK инструменты
│       ├── template-generator.tsx # Генератор шаблонов
│       └── docs-viewer.tsx   # Просмотр документации
├── hooks/
│   ├── use-plugin-manager.ts # Менеджер плагинов
│   ├── use-plugin-loader.ts  # Загрузчик плагинов
│   ├── use-plugin-api.ts     # API плагинов
│   └── use-marketplace.ts    # Marketplace
├── services/
│   ├── plugin-registry.ts    # Реестр плагинов
│   ├── plugin-loader.ts      # Загрузчик
│   ├── sandbox-manager.ts    # Менеджер песочницы
│   ├── api-bridge.ts        # Мост API
│   ├── security-service.ts   # Сервис безопасности
│   └── marketplace-client.ts # Клиент маркетплейса
├── runtime/
│   ├── wasm-runtime.ts      # WASM среда выполнения
│   ├── js-runtime.ts        # JavaScript среда
│   └── native-bridge.ts     # Мост с нативным кодом
└── types/
    └── plugin-system.ts     # Типы системы плагинов
```

### Backend структура (Rust):
```
src-tauri/src/plugin_system/
├── mod.rs                    # Главный модуль
├── runtime/                  # Среда выполнения
│   ├── wasm_runtime.rs       # WASM Runtime
│   ├── security_manager.rs   # Менеджер безопасности
│   ├── resource_manager.rs   # Менеджер ресурсов
│   └── api_host.rs          # API хост
├── loader/                   # Загрузчик
│   ├── plugin_loader.rs      # Загрузчик плагинов
│   ├── manifest_parser.rs    # Парсер манифестов
│   ├── dependency_resolver.rs # Резолвер зависимостей
│   └── version_manager.rs    # Менеджер версий
├── marketplace/              # Маркетплейс
│   ├── client.rs            # Клиент API
│   ├── downloader.rs        # Загрузчик
│   └── signature_verifier.rs # Проверка подписей
├── api/                      # API для плагинов
│   ├── timeline_api.rs       # Timeline API
│   ├── effects_api.rs        # Effects API
│   ├── file_api.rs          # File API
│   └── ui_api.rs            # UI API
└── commands.rs               # Tauri команды
```

## 📐 Функциональные требования

### 1. Архитектура плагинов

#### Manifest файл:
```json
{
  "name": "my-awesome-plugin",
  "version": "1.0.0",
  "description": "Awesome video effects plugin",
  "author": "John Doe",
  "license": "MIT",
  
  "main": "index.wasm",
  "type": "effect",
  
  "api_version": "1.0",
  "min_timeline_version": "0.9.0",
  
  "permissions": [
    "timeline.read",
    "timeline.write",
    "file.read",
    "ui.create"
  ],
  
  "dependencies": {
    "@timeline-studio/sdk": "^1.0.0"
  },
  
  "resources": {
    "shaders": ["shaders/"],
    "assets": ["assets/"],
    "locales": ["locales/"]
  },
  
  "metadata": {
    "category": "effects",
    "tags": ["video", "color", "grading"],
    "price": 9.99,
    "screenshots": ["screenshot1.png", "screenshot2.png"]
  }
}
```

#### Plugin Interface:
```typescript
interface TimelinePlugin {
    // Метаданные
    manifest: PluginManifest;
    
    // Lifecycle hooks
    onLoad?(): Promise<void>;
    onUnload?(): Promise<void>;
    onActivate?(): Promise<void>;
    onDeactivate?(): Promise<void>;
    
    // Основная функциональность
    main(api: PluginAPI): Promise<void>;
}

interface PluginAPI {
    // Timeline API
    timeline: TimelineAPI;
    
    // Effects API
    effects: EffectsAPI;
    
    // UI API
    ui: UIAPI;
    
    // File API
    file: FileAPI;
    
    // Storage API
    storage: StorageAPI;
    
    // Events API
    events: EventsAPI;
}
```

### 2. WASM Runtime

#### WASM Plugin Execution:
```rust
use wasmtime::*;

pub struct WasmPluginRuntime {
    engine: Engine,
    instances: HashMap<PluginId, Instance>,
    security_config: SecurityConfig,
}

impl WasmPluginRuntime {
    pub fn load_plugin(&mut self, plugin_data: &[u8]) -> Result<PluginId> {
        // Компиляция WASM модуля
        let module = Module::new(&self.engine, plugin_data)?;
        
        // Создание store с ограничениями
        let mut store = Store::new(&self.engine, PluginState::new());
        store.limiter(|state| &mut state.limiter);
        
        // Настройка API bindings
        let mut linker = Linker::new(&self.engine);
        self.setup_api_bindings(&mut linker)?;
        
        // Создание instance
        let instance = linker.instantiate(&mut store, &module)?;
        
        let plugin_id = self.generate_plugin_id();
        self.instances.insert(plugin_id.clone(), instance);
        
        Ok(plugin_id)
    }
    
    pub fn call_plugin_function(
        &mut self, 
        plugin_id: &PluginId,
        function: &str,
        args: &[wasmtime::Val]
    ) -> Result<Vec<wasmtime::Val>> {
        let instance = self.instances.get(plugin_id)
            .ok_or(Error::PluginNotFound)?;
        
        let func = instance
            .get_typed_func::<(i32, i32), i32>(&mut store, function)?;
        
        // Выполнение с timeout
        let result = tokio::time::timeout(
            Duration::from_secs(30),
            func.call_async(&mut store, (args[0].i32().unwrap(), args[1].i32().unwrap()))
        ).await??;
        
        Ok(vec![wasmtime::Val::I32(result)])
    }
}
```

#### Security Sandbox:
```rust
pub struct SecurityManager {
    allowed_permissions: HashSet<Permission>,
    resource_limits: ResourceLimits,
    file_access_rules: Vec<FileAccessRule>,
}

impl SecurityManager {
    pub fn check_permission(&self, plugin_id: &PluginId, permission: Permission) -> bool {
        // Проверка разрешений из манифеста
        self.allowed_permissions.contains(&permission)
    }
    
    pub fn check_file_access(&self, path: &Path, access_type: AccessType) -> bool {
        for rule in &self.file_access_rules {
            if rule.matches(path) {
                return rule.allows(access_type);
            }
        }
        false
    }
    
    pub fn enforce_resource_limits(&self, usage: &ResourceUsage) -> Result<()> {
        if usage.memory > self.resource_limits.max_memory {
            return Err(Error::MemoryLimitExceeded);
        }
        
        if usage.cpu_time > self.resource_limits.max_cpu_time {
            return Err(Error::CpuLimitExceeded);
        }
        
        Ok(())
    }
}
```

### 3. Plugin SDK

#### TypeScript SDK:
```typescript
// @timeline-studio/sdk
export class TimelineStudioSDK {
    private api: PluginAPI;
    
    constructor(api: PluginAPI) {
        this.api = api;
    }
    
    // Timeline manipulation
    timeline = {
        getCurrentTime: (): Timecode => this.api.timeline.getCurrentTime(),
        
        addClip: (clip: Clip, track: number): Promise<ClipId> => 
            this.api.timeline.addClip(clip, track),
        
        removeClip: (clipId: ClipId): Promise<void> => 
            this.api.timeline.removeClip(clipId),
        
        getSelectedClips: (): Promise<Clip[]> => 
            this.api.timeline.getSelectedClips(),
        
        // Events
        onSelectionChange: (callback: (clips: Clip[]) => void) => 
            this.api.events.on('timeline.selectionChange', callback),
    };
    
    // Effects
    effects = {
        createEffect: (type: string, params: any): Promise<Effect> => 
            this.api.effects.create(type, params),
        
        applyToClip: (effect: Effect, clipId: ClipId): Promise<void> => 
            this.api.effects.applyToClip(effect, clipId),
        
        registerCustomEffect: (definition: EffectDefinition): Promise<void> => 
            this.api.effects.register(definition),
    };
    
    // UI
    ui = {
        createPanel: (config: PanelConfig): Promise<Panel> => 
            this.api.ui.createPanel(config),
        
        showDialog: (dialog: DialogConfig): Promise<DialogResult> => 
            this.api.ui.showDialog(dialog),
        
        addMenuItem: (menu: MenuConfig): Promise<void> => 
            this.api.ui.addMenuItem(menu),
    };
}

// Utility для создания плагинов
export function createPlugin(config: PluginConfig): TimelinePlugin {
    return {
        manifest: config.manifest,
        
        async main(api: PluginAPI) {
            const sdk = new TimelineStudioSDK(api);
            await config.initialize(sdk);
        }
    };
}
```

#### Rust SDK:
```rust
// timeline-studio-sdk crate
use timeline_studio_sdk::prelude::*;

#[plugin_main]
async fn main(api: PluginAPI) -> Result<()> {
    // Регистрация эффекта
    api.effects().register_effect(EffectDefinition {
        name: "Custom Blur".to_string(),
        category: "Filters".to_string(),
        parameters: vec![
            Parameter::Float {
                name: "radius".to_string(),
                default: 5.0,
                range: 0.0..=100.0,
            }
        ],
        processor: Box::new(CustomBlurEffect),
    }).await?;
    
    // Обработка событий
    api.events().on("timeline.clip_selected", |event| {
        println!("Clip selected: {:?}", event);
    }).await?;
    
    Ok(())
}

struct CustomBlurEffect;

impl EffectProcessor for CustomBlurEffect {
    async fn process(&self, input: VideoFrame, params: Parameters) -> Result<VideoFrame> {
        let radius = params.get_float("radius")?;
        
        // Применение blur эффекта
        let output = apply_gaussian_blur(input, radius);
        
        Ok(output)
    }
}
```

### 4. Marketplace

#### Marketplace API:
```typescript
interface MarketplaceAPI {
    // Поиск плагинов
    search(query: SearchQuery): Promise<PluginSearchResult>;
    
    // Детали плагина
    getPluginDetails(pluginId: string): Promise<PluginDetails>;
    
    // Скачивание
    downloadPlugin(pluginId: string): Promise<PluginPackage>;
    
    // Покупка
    purchasePlugin(pluginId: string, paymentMethod: PaymentMethod): Promise<PurchaseResult>;
    
    // Отзывы
    getReviews(pluginId: string): Promise<Review[]>;
    submitReview(pluginId: string, review: Review): Promise<void>;
    
    // Обновления
    checkUpdates(): Promise<UpdateInfo[]>;
    updatePlugin(pluginId: string): Promise<void>;
}

interface PluginSearchResult {
    plugins: PluginListItem[];
    totalCount: number;
    facets: SearchFacets;
}

interface PluginListItem {
    id: string;
    name: string;
    description: string;
    author: string;
    version: string;
    rating: number;
    downloadCount: number;
    price: number;
    thumbnails: string[];
    category: string;
    tags: string[];
}
```

#### Plugin Store UI:
```
┌─────────────────────────────────────────────────┐
│ Plugin Marketplace           [Search: "blur"] │
├─────────────────────────────────────────────────┤
│ Categories     │ Results (24)                   │
│ ▼ Effects      │ ┌────────────────────────────┐ │
│   ├─ Color     │ │ Pro Blur Pack   $12.99    │ │
│   ├─ Filters   │ │ ★★★★☆ (156)   [Buy]       │ │
│   └─ Distort   │ │ Advanced blur effects...   │ │
│ ▼ Tools        │ └────────────────────────────┘ │
│ ▼ Templates    │ ┌────────────────────────────┐ │
│ ▼ Transitions  │ │ Simple Blur     Free      │ │
│                │ │ ★★★☆☆ (89)    [Install]   │ │
│ Sort by:       │ │ Basic blur effect...       │ │
│ [Popular ▼]    │ └────────────────────────────┘ │
│                │ ┌────────────────────────────┐ │
│ Price:         │ │ Motion Blur Pro  $8.99    │ │
│ ○ Free         │ │ ★★★★★ (234)   [Buy]       │ │
│ ○ Paid         │ │ Professional motion...     │ │
│ ● All          │ └────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### 5. Developer Tools

#### Plugin Debugger:
```typescript
interface PluginDebugger {
    // Отладка
    setBreakpoint(file: string, line: number): void;
    removeBreakpoint(file: string, line: number): void;
    
    // Выполнение
    continue(): void;
    stepOver(): void;
    stepInto(): void;
    stepOut(): void;
    
    // Инспекция
    inspectVariable(name: string): Promise<VariableValue>;
    evaluateExpression(expression: string): Promise<any>;
    
    // Stack trace
    getStackTrace(): Promise<StackFrame[]>;
    
    // Console
    getConsoleOutput(): Promise<ConsoleMessage[]>;
    clearConsole(): void;
}
```

#### Hot Reload:
```rust
pub struct HotReloadManager {
    watchers: HashMap<PluginId, FileWatcher>,
    reload_queue: VecDeque<PluginId>,
}

impl HotReloadManager {
    pub fn watch_plugin(&mut self, plugin_id: PluginId, path: PathBuf) -> Result<()> {
        let (tx, rx) = mpsc::channel();
        
        let watcher = RecommendedWatcher::new(tx, Config::default())?;
        watcher.watch(&path, RecursiveMode::Recursive)?;
        
        // Обработка изменений файлов
        tokio::spawn(async move {
            while let Ok(event) = rx.recv() {
                match event {
                    Ok(Event { kind: EventKind::Modify(_), .. }) => {
                        self.reload_queue.push_back(plugin_id.clone());
                    }
                    _ => {}
                }
            }
        });
        
        self.watchers.insert(plugin_id, watcher);
        
        Ok(())
    }
    
    pub async fn process_reload_queue(&mut self) -> Result<()> {
        while let Some(plugin_id) = self.reload_queue.pop_front() {
            self.reload_plugin(&plugin_id).await?;
        }
        
        Ok(())
    }
}
```

### 6. Plugin Lifecycle

#### Состояния плагина:
```typescript
enum PluginState {
    NotInstalled = 'not_installed',
    Downloaded = 'downloaded',
    Installing = 'installing',
    Installed = 'installed',
    Loading = 'loading',
    Loaded = 'loaded',
    Active = 'active',
    Error = 'error',
    Updating = 'updating'
}

interface PluginLifecycle {
    // Установка
    install(packagePath: string): Promise<void>;
    uninstall(pluginId: string): Promise<void>;
    
    // Загрузка
    load(pluginId: string): Promise<void>;
    unload(pluginId: string): Promise<void>;
    
    // Активация
    activate(pluginId: string): Promise<void>;
    deactivate(pluginId: string): Promise<void>;
    
    // Обновление
    update(pluginId: string): Promise<void>;
    
    // Состояние
    getState(pluginId: string): PluginState;
    
    // События
    onStateChange(callback: (pluginId: string, state: PluginState) => void): void;
}
```

### 7. Версионирование

#### Semantic Versioning:
```rust
use semver::{Version, VersionReq};

pub struct DependencyResolver {
    installed_plugins: HashMap<String, Version>,
    registry: PluginRegistry,
}

impl DependencyResolver {
    pub fn resolve_dependencies(&self, manifest: &PluginManifest) -> Result<DependencyGraph> {
        let mut graph = DependencyGraph::new();
        let mut to_resolve = VecDeque::new();
        
        // Добавляем зависимости плагина
        for (name, version_req) in &manifest.dependencies {
            to_resolve.push_back((name.clone(), version_req.clone()));
        }
        
        // Резолвим зависимости
        while let Some((name, version_req)) = to_resolve.pop_front() {
            let version = self.find_compatible_version(&name, &version_req)?;
            
            if !graph.contains(&name) {
                graph.add_dependency(name.clone(), version.clone());
                
                // Получаем манифест зависимости
                let dep_manifest = self.registry.get_manifest(&name, &version)?;
                
                // Добавляем транзитивные зависимости
                for (dep_name, dep_version_req) in &dep_manifest.dependencies {
                    to_resolve.push_back((dep_name.clone(), dep_version_req.clone()));
                }
            }
        }
        
        // Проверяем на конфликты
        self.check_version_conflicts(&graph)?;
        
        Ok(graph)
    }
}
```

### 8. Performance Monitoring

#### Plugin Profiler:
```typescript
interface PluginProfiler {
    // Мониторинг производительности
    startProfiling(pluginId: string): void;
    stopProfiling(pluginId: string): ProfilingResult;
    
    // Метрики
    getMetrics(pluginId: string): PluginMetrics;
    
    // Лимиты ресурсов
    setResourceLimits(pluginId: string, limits: ResourceLimits): void;
    
    // Предупреждения
    onResourceWarning(callback: (pluginId: string, warning: ResourceWarning) => void): void;
}

interface PluginMetrics {
    cpuUsage: number;          // %
    memoryUsage: number;       // MB
    executionTime: number;     // ms
    apiCalls: number;          // count
    errors: number;            // count
    
    // Timeline specific
    frameProcessingTime: number; // ms per frame
    effectApplicationTime: number; // ms
}
```

## 🎨 UI/UX дизайн

### Plugin Manager:
```
┌─────────────────────────────────────────────────┐
│ Plugin Manager                [Marketplace] [+] │
├─────────────────────────────────────────────────┤
│ Installed (12)          │ Details               │
│ ┌─────────────────────┐ │ Pro Color Grader      │
│ │ ● Pro Color Grader  │ │ Version: 2.1.0        │
│ │   v2.1.0  [Update] │ │ Author: ColorCorp     │
│ └─────────────────────┘ │ Status: ✅ Active     │
│ ┌─────────────────────┐ │                       │
│ │ ○ Motion Graphics   │ │ Performance:          │
│ │   v1.5.2           │ │ CPU: 5.2%             │
│ └─────────────────────┘ │ Memory: 45MB          │
│ ┌─────────────────────┐ │                       │
│ │ ● Simple Blur       │ │ Permissions:          │
│ │   v1.0.0   [Error] │ │ ✅ Timeline read/write │
│ └─────────────────────┘ │ ✅ Effects creation   │
│                         │ ❌ File system access │
│ [Enable All] [Settings] │ [Disable] [Settings]  │
└─────────────────────────────────────────────────┘
```

## 📊 План реализации

### Фаза 1: Базовая система (4 недели)
- [ ] WASM runtime
- [ ] Security sandbox
- [ ] Plugin manifest system
- [ ] Basic TypeScript SDK

### Фаза 2: Marketplace (3 недели)
- [ ] Marketplace API
- [ ] Plugin browser UI
- [ ] Download/install system
- [ ] Signature verification

### Фаза 3: Developer tools (3 недели)
- [ ] Hot reload
- [ ] Debugger
- [ ] Profiler
- [ ] Documentation tools

### Фаза 4: Advanced features (2 недели)
- [ ] Dependency resolution
- [ ] Auto-updates
- [ ] Plugin templates
- [ ] Native bridge

## 🎯 Метрики успеха

### Функциональность:
- 100+ плагинов в marketplace в первый год
- 95%+ uptime для plugin runtime
- <100ms overhead для plugin calls

### Безопасность:
- Zero security incidents
- 100% sandbox containment
- Proper permission enforcement

### Developer Experience:
- <5 минут setup нового плагина
- Comprehensive documentation
- Active community support

## 🔗 Интеграция

### С другими модулями:
- **Effects** - плагины эффектов
- **Timeline** - timeline плагины
- **Export** - export плагины
- **UI** - UI расширения

### API Reference:
```typescript
interface PluginSystemAPI {
    // Lifecycle
    installPlugin(packageUrl: string): Promise<InstallResult>;
    enablePlugin(pluginId: string): Promise<void>;
    disablePlugin(pluginId: string): Promise<void>;
    
    // Registry
    getInstalledPlugins(): Plugin[];
    getPluginInfo(pluginId: string): PluginInfo;
    
    // Marketplace
    searchMarketplace(query: string): Promise<MarketplaceResult>;
    downloadPlugin(pluginId: string): Promise<void>;
    
    // Development
    loadDevelopmentPlugin(path: string): Promise<void>;
    reloadPlugin(pluginId: string): Promise<void>;
    
    // Events
    onPluginStateChange(callback: PluginStateChangeCallback): void;
}
```

## 📚 Справочные материалы

- [WebAssembly Specification](https://webassembly.org/specs/)
- [Wasmtime Documentation](https://docs.wasmtime.dev/)
- [VSCode Extension API](https://code.visualstudio.com/api)
- [Figma Plugin API](https://www.figma.com/plugin-docs/)

---

*Документ будет обновляться по мере разработки модуля*