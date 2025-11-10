# Version Control Module

[English](./README.md) | **Русский**

Модуль Version Control предоставляет функциональность контроля версий для Timeline Studio, позволяя пользователям создавать снимки проекта, управлять ветками, восстанавливать предыдущие версии и отслеживать изменения.

## 📊 Статус модуля

- ✅ **Готовность**: 75% - Основной функционал реализован и интегрирован
- ✅ **Компоненты**: 2 UI компонента для управления версиями
- ✅ **Хуки**: 1 основной хук для работы с версиями
- ✅ **Сервисы**: Интеграция через единый backend-sync сервис
- ✅ **Тесты**: Тесты компонентов и интеграционные тесты
- ✅ **Функции**: Снимки, ветки, автосохранение, история версий
- ✅ **i18n**: Полная поддержка локализации (15 языков)
- ✅ **Интеграция UI**: Доступен в модальном окне настроек пользователя

## 🎯 Статус интеграции

**Расположение в UI**: Настройки пользователя → Вкладка "Контроль версий"

Интерфейс контроля версий доступен из основного приложения через:
1. Открыть модальное окно настроек пользователя (иконка настроек в шапке)
2. Перейти на вкладку "Контроль версий" (5-я вкладка)
3. Доступ ко всем функциям через три подвкладки:
   - **История**: Просмотр и восстановление версий проекта
   - **Ветки**: Создание и переключение между ветками
   - **Настройки**: Конфигурация автосохранения и хранения

## 📁 Архитектура модуля

```
src/features/version-control/
├── components/                        # UI компоненты
│   ├── version-control-manager.tsx    # Основной менеджер версий
│   └── version-history-panel.tsx      # Панель истории версий
├── __tests__/                         # Тесты
│   ├── components/                    # Тесты компонентов
│   │   ├── version-control-manager.test.tsx
│   │   └── version-history-panel.test.tsx
│   └── integration.test.ts            # Интеграционные тесты
├── types.ts                           # TypeScript типы
└── index.ts                           # Экспорт модуля
```

## 🚀 Ключевые возможности

### Управление версиями
- **Создание снимков**: Сохранение текущего состояния проекта с опциональным сообщением
- **Восстановление версий**: Возврат к любой сохраненной версии проекта
- **История версий**: Просмотр всех сохраненных версий с метаданными
- **Сравнение версий**: Анализ различий между версиями

### Управление ветками
- **Создание веток**: Создание новых веток от текущей или указанной версии
- **Переключение веток**: Быстрое переключение между ветками
- **Слияние веток**: Объединение изменений из одной ветки в другую
- **Отслеживание изменений**: Индикация несохраненных изменений

### Автосохранение
- **Автоматические снимки**: Периодическое сохранение состояния проекта
- **Настраиваемый интервал**: Гибкая настройка частоты автосохранения
- **Включение/отключение**: Управление режимом автосохранения

## 🔗 API и хуки

### Tauri команды
Модуль использует единую систему команд через `execute_command`:

| Команда | Тип | Описание |
|---------|-----|----------|
| `execute_command` | Единая команда | Выполнение всех операций контроля версий |
| `get_project_state` | Запрос состояния | Получение текущего состояния проекта |

### Типы команд для execute_command

```typescript
import { createLogger } from '@/lib/tauri-logger'

const logger = createLogger('Example')
type ProjectCommand =
  | { type: "CreateSnapshot", params: { message?: string } }
  | { type: "RestoreVersion", params: { version_id: string } }
  | { type: "GetVersionHistory", params: { limit?: number } }
  | { type: "CompareVersions", params: { version_a: string, version_b: string } }
  | { type: "CreateBranch", params: { branch_name: string, from_version?: string } }
  | { type: "MergeBranch", params: { source_branch: string, target_branch: string } }
  | { type: "SwitchBranch", params: { branch_name: string } }
  | { type: "SetAutoSaveInterval", params: { seconds: number } }
  | { type: "EnableAutoSave", params: { enabled: boolean } }
```

### useVersionControl()
Основной хук для работы с версиями:

```typescript
import { useVersionControl } from '@/features/version-control';

function ProjectHeader() {
  const {
    // Состояние
    currentVersionId,
    branchName,
    hasUncommittedChanges,
    lastSnapshotTime,
    autoSaveEnabled,
    autoSaveIntervalSeconds,
    isLoading,
    error,

    // Действия
    createSnapshot,
    restoreVersion,
    getVersionHistory,
    compareVersions,
    createBranch,
    mergeBranch,
    switchBranch,
    setAutoSaveInterval,
    enableAutoSave
  } = useVersionControl();

  const handleSave = async () => {
    const success = await createSnapshot("Сохранение изменений макета");
    if (success) {
      logger.debugSync("Версия сохранена");
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Badge>{branchName}</Badge>
      {hasUncommittedChanges && (
        <Badge variant="destructive">Есть изменения</Badge>
      )}
      <Button onClick={handleSave} disabled={isLoading}>
        Сохранить версию
      </Button>
    </div>
  );
}
```

## 🧩 Компоненты

### VersionControlManager
Основной компонент для управления версиями:

```typescript
import { VersionControlManager } from '@/features/version-control';

function SettingsPanel() {
  return (
    <VersionControlManager className="w-full" />
  );
}
```

**Возможности**:
- Отображение текущей ветки и версии
- Индикация несохраненных изменений
- Управление автосохранением
- Доступ к истории версий
- Операции с ветками

### VersionHistoryPanel
Панель истории версий:

```typescript
import { VersionHistoryPanel } from '@/features/version-control';

function HistoryView() {
  return (
    <VersionHistoryPanel
      onRestore={(versionId) => logger.debugSync('Восстановление', versionId)}
      onCompare={(v1, v2) => logger.debugSync('Сравнение', v1, v2)}
    />
  );
}
```

**Возможности**:
- Список всех версий с метаданными
- Фильтрация по веткам
- Восстановление версий
- Сравнение версий
- Поиск по сообщениям

## 📦 Типы данных

### VersionInfo
Информация о версии:

```typescript
interface VersionInfo {
  id: string;                    // Уникальный ID версии
  timestamp: string;             // Время создания
  author: string;                // Автор изменений
  message?: string;              // Описание изменений
  branch_name: string;           // Название ветки
}
```

### VersionControlState
Состояние системы контроля версий:

```typescript
interface VersionControlState {
  current_version_id: string;           // ID текущей версии
  branch_name: string;                  // Название текущей ветки
  has_uncommitted_changes: boolean;     // Есть несохраненные изменения
  last_snapshot_time: string;           // Время последнего снимка
  auto_save_enabled: boolean;           // Автосохранение включено
  auto_save_interval_seconds: number;   // Интервал автосохранения
}
```

## 🔄 События системы

Модуль реагирует на следующие события:

### SnapshotCreated
Создан новый снимок:
```typescript
{
  type: "SnapshotCreated",
  payload: {
    version_id: string,
    message?: string
  }
}
```

### VersionRestored
Восстановлена версия:
```typescript
{
  type: "VersionRestored",
  payload: {
    version_id: string,
    from_version_id: string
  }
}
```

### BranchSwitched
Выполнено переключение ветки:
```typescript
{
  type: "BranchSwitched",
  payload: {
    from_branch: string,
    to_branch: string
  }
}
```

### AutoSaveConfigChanged
Изменены настройки автосохранения:
```typescript
{
  type: "AutoSaveConfigChanged",
  payload: {
    enabled: boolean,
    interval_seconds: number
  }
}
```

### AutoSaveTriggered
Выполнено автосохранение:
```typescript
{
  type: "AutoSaveTriggered",
  payload: {
    snapshot_id: string
  }
}
```

## 🧪 Тестирование

### Запуск тестов

```bash
# Все тесты модуля
bun run test src/features/version-control/__tests__/

# Интеграционные тесты
bun run test src/features/version-control/__tests__/integration.test.ts

# Тесты компонентов
bun run test src/features/version-control/__tests__/components/version-control-manager.test.tsx
bun run test src/features/version-control/__tests__/components/version-history-panel.test.tsx
```

### Покрытие тестами

#### Компоненты (44 теста)

**VersionControlManager** (7 тестов):
- Отображение текущего состояния версий
- Индикация несохраненных изменений
- Управление автосохранением
- Переключение между вкладками
- Обработка состояния загрузки
- Применение пользовательских классов

**BranchManager** (5 тестов):
- Отображение текущей ветки
- Создание новой ветки
- Очистка поля ввода после создания
- Валидация пустого имени ветки
- Отображение заглушки для слияния веток

**VersionControlSettings** (8 тестов):
- Отображение настроек автосохранения
- Переключение автосохранения
- Изменение интервала автосохранения
- Скрытие интервалов при отключенном автосохранении
- Выделение текущего интервала
- Отображение информации о хранении версий
- Отображение отключенных кнопок экспорта/импорта
- Отключение элементов управления при загрузке

**VersionHistoryPanel** (24 теста):
- Создание снимков с сообщениями и без
- Отображение истории версий
- Форматирование времени
- Управление автосохранением (включение/выключение, изменение интервала)
- Восстановление версий с подтверждением
- Выделение текущей версии
- Обработка состояний загрузки, ошибок и пустого списка
- Обновление истории после операций
- Отключение элементов при загрузке

#### Интеграционные тесты
- **Интеграция с backend**: Проверка взаимодействия с Rust backend
- **Управление состоянием**: Синхронизация состояния между frontend и backend
- **Обработка событий**: Реакция на события системы
- **Обработка ошибок**: Корректная обработка ошибок и отображение пользователю

## 💡 Примеры использования

### Базовое сохранение версии

```typescript
function SaveButton() {
  const { createSnapshot, isLoading } = useVersionControl();

  const handleSave = async () => {
    const message = prompt("Описание изменений:");
    if (message !== null) {
      const success = await createSnapshot(message);
      if (success) {
        toast.success("Версия сохранена");
      }
    }
  };

  return (
    <Button onClick={handleSave} disabled={isLoading}>
      <GitCommit className="w-4 h-4 mr-2" />
      Сохранить версию
    </Button>
  );
}
```

### Переключение веток

```typescript
function BranchSelector() {
  const { branchName, switchBranch } = useVersionControl();
  const [branches, setBranches] = useState<string[]>(['main', 'develop']);

  const handleBranchChange = async (newBranch: string) => {
    if (newBranch !== branchName) {
      const success = await switchBranch(newBranch);
      if (success) {
        toast.success(`Переключено на ветку ${newBranch}`);
      }
    }
  };

  return (
    <Select value={branchName} onValueChange={handleBranchChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {branches.map(branch => (
          <SelectItem key={branch} value={branch}>
            <GitBranch className="w-4 h-4 mr-2" />
            {branch}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

### Автосохранение

```typescript
function AutoSaveSettings() {
  const {
    autoSaveEnabled,
    autoSaveIntervalSeconds,
    enableAutoSave,
    setAutoSaveInterval
  } = useVersionControl();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Автосохранение</Label>
        <Switch
          checked={autoSaveEnabled}
          onCheckedChange={enableAutoSave}
        />
      </div>

      {autoSaveEnabled && (
        <div className="flex items-center gap-2">
          <Label>Интервал (сек):</Label>
          <Input
            type="number"
            value={autoSaveIntervalSeconds}
            onChange={(e) => setAutoSaveInterval(Number(e.target.value))}
            min={10}
            max={300}
            className="w-20"
          />
        </div>
      )}
    </div>
  );
}
```

### История версий с восстановлением

```typescript
function VersionHistory() {
  const { getVersionHistory, restoreVersion } = useVersionControl();
  const [versions, setVersions] = useState<VersionInfo[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const history = await getVersionHistory(50);
    if (history) {
      setVersions(history);
    }
  };

  const handleRestore = async (versionId: string) => {
    const confirm = window.confirm("Восстановить эту версию?");
    if (confirm) {
      const success = await restoreVersion(versionId);
      if (success) {
        toast.success("Версия восстановлена");
      }
    }
  };

  return (
    <div className="space-y-2">
      {versions.map(version => (
        <Card key={version.id} className="p-3">
          <div className="flex justify-between items-start">
            <div>
              <div className="font-medium">{version.message || "Без описания"}</div>
              <div className="text-sm text-muted-foreground">
                {new Date(version.timestamp).toLocaleString()}
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleRestore(version.id)}
            >
              Восстановить
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
```

## 🔧 Рекомендации по использованию

### Оптимальные настройки автосохранения

```typescript
// Для активной работы
const ACTIVE_EDITING = {
  enabled: true,
  interval: 30  // Каждые 30 секунд
};

// Для длительных сессий
const LONG_SESSION = {
  enabled: true,
  interval: 120  // Каждые 2 минуты
};

// Для финальной обработки
const FINAL_TOUCHES = {
  enabled: false,  // Только ручное сохранение
  interval: 0
};
```

### Стратегии работы с ветками

1. **Main Branch**: Основная ветка для стабильных версий
2. **Develop Branch**: Ветка для активной разработки
3. **Feature Branches**: Отдельные ветки для экспериментов
4. **Backup Branches**: Резервные ветки перед крупными изменениями

### Лучшие практики

1. **Частые снимки**: Сохраняйте версии после каждого значимого изменения
2. **Описательные сообщения**: Используйте понятные описания изменений
3. **Регулярные ветки**: Создавайте ветки для экспериментов
4. **Проверка перед слиянием**: Всегда проверяйте изменения перед слиянием веток

## ⚠️ Известные ограничения

Следующие функции в настоящее время **не реализованы** и запланированы для будущей разработки:

1. **Слияние веток**: Объединение изменений из одной ветки в другую пока недоступно
   - В UI отображается сообщение-заглушка: "Функция слияния веток пока не реализована"
   - Запланировано для реализации на Фазе 2

2. **Экспорт/Импорт**: Функциональность экспорта и импорта истории версий отключена
   - Кнопки отключены во вкладке Настройки
   - Требуется реализация в бэкенде для сериализации/десериализации
   - Запланировано для реализации на Фазе 2

3. **Интеграционные тесты**: Полный набор интеграционных тестов ожидается
   - Тесты компонентов завершены и проходят успешно
   - Необходимы сквозные интеграционные тесты с бэкендом

См. [ROADMAP.md](./ROADMAP.md) для подробных планов разработки и сроков.

## 🚨 Устранение неполадок

### Ошибка сохранения версии

**Симптомы**: Не удается создать снимок проекта

**Решения**:
1. Проверьте свободное место на диске
2. Убедитесь, что проект не заблокирован другим процессом
3. Проверьте права доступа к директории проекта

### Ошибка восстановления версии

**Симптомы**: Не удается восстановить предыдущую версию

**Решения**:
1. Убедитесь, что версия существует в истории
2. Проверьте целостность файлов версии
3. Попробуйте восстановить более раннюю версию

### Проблемы с автосохранением

**Симптомы**: Автосохранение не работает

**Решения**:
1. Проверьте, включено ли автосохранение
2. Убедитесь, что интервал больше 10 секунд
3. Проверьте логи на наличие ошибок

## 🎯 Заключение

Модуль Version Control предоставляет надежную систему управления версиями для Timeline Studio, позволяя пользователям безопасно экспериментировать, отслеживать изменения и восстанавливать предыдущие состояния проекта. Интеграция с Rust backend обеспечивает высокую производительность и надежность операций.

**Версия:** 0.68.1
**Последнее обновление:** 7 августа 2025
**Разработано с ❤️ командой Timeline Studio**
