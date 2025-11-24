# Система идентификации пользователя

## 📋 Информация
- **ID**: TASK-USER-001
- **Тип**: feature
- **Приоритет**: высокий
- **Оценка**: 3-4 недели
- **Веха**: v1.0

## 📝 Описание

Создание полноценной системы идентификации пользователя для Timeline Studio, включающей концепцию пользователя как центральной сущности приложения, управление профилем, сессиями и правами доступа.

## 🎯 Цели

1. **Создать концепцию пользователя** - центральную сущность для всех функций
2. **Профиль пользователя** - хранение информации, настроек и предпочтений
3. **Система сессий** - управление активными сессиями на разных устройствах
4. **Права и роли** - для будущих коллаборативных функций
5. **Интеграция с существующими системами** - настройки, проекты, аналитика

## ✅ Критерии готовности

- [ ] Создана модель данных пользователя (Frontend + Backend)
- [ ] Реализован UserContext для глобального доступа
- [ ] Интегрирована с существующими настройками
- [ ] Создан UI профиля пользователя
- [ ] Реализовано хранение данных в SQLite
- [ ] Миграция существующих настроек к новой модели
- [ ] Тесты написаны и проходят
- [ ] Документация обновлена
- [ ] Code review пройден

## 🔧 Техническая информация

### Модель данных пользователя

```typescript
interface User {
  // Идентификация
  id: string                    // UUID пользователя
  email?: string               // Email (опционально)
  username?: string            // Имя пользователя
  displayName: string          // Отображаемое имя
  avatar?: string              // URL или base64 аватара
  
  // Метаданные
  createdAt: Date              // Дата создания аккаунта
  lastActiveAt: Date           // Последняя активность
  deviceId: string             // ID устройства (для локальных пользователей)
  
  // Профиль
  profile: {
    bio?: string               // Описание
    location?: string          // Местоположение
    language: LanguageCode     // Предпочитаемый язык
    timezone: string           // Часовой пояс
  }
  
  // Настройки
  settings: {
    theme: 'light' | 'dark' | 'system'
    autoSave: boolean
    notifications: NotificationSettings
    privacy: PrivacySettings
  }
  
  // Статистика
  stats: {
    projectsCount: number      // Количество проектов
    totalExports: number       // Всего экспортов
    storageUsed: number        // Использовано места (MB)
    lastProjectId?: string     // ID последнего проекта
  }
  
  // Связи
  apiKeys: ApiKeyReference[]   // Ссылки на API ключи
  projects: ProjectReference[] // Ссылки на проекты
  preferences: UserPreferences // Ссылка на предпочтения (из другой задачи)
}
```

### Frontend архитектура

```typescript
// User Context Provider
const UserContext = React.createContext<UserContextValue | null>(null)

interface UserContextValue {
  user: User | null
  isLoading: boolean
  error: Error | null
  
  // Методы
  updateProfile: (profile: Partial<User['profile']>) => Promise<void>
  updateSettings: (settings: Partial<User['settings']>) => Promise<void>
  uploadAvatar: (file: File) => Promise<void>
  deleteUser: () => Promise<void>
}

// User State Machine
const userMachine = createMachine({
  id: 'user',
  initial: 'loading',
  
  context: {
    user: null,
    error: null
  },
  
  states: {
    loading: {
      invoke: {
        src: 'loadUser',
        onDone: {
          target: 'authenticated',
          actions: 'setUser'
        },
        onError: {
          target: 'anonymous',
          actions: 'setError'
        }
      }
    },
    
    anonymous: {
      on: {
        CREATE_LOCAL_USER: {
          target: 'creating',
          actions: 'createLocalUser'
        },
        SIGN_IN: 'authenticating'
      }
    },
    
    authenticated: {
      on: {
        UPDATE_PROFILE: {
          actions: 'updateProfile'
        },
        UPDATE_SETTINGS: {
          actions: 'updateSettings'
        },
        SIGN_OUT: 'anonymous'
      }
    },
    
    creating: {
      invoke: {
        src: 'createUser',
        onDone: 'authenticated',
        onError: 'anonymous'
      }
    }
  }
})
```

### Backend архитектура (Rust)

```rust
// src-tauri/src/user/mod.rs
#[derive(Debug, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub email: Option<String>,
    pub username: Option<String>,
    pub display_name: String,
    pub avatar: Option<String>,
    pub created_at: DateTime<Utc>,
    pub last_active_at: DateTime<Utc>,
    pub device_id: String,
    pub profile: UserProfile,
    pub settings: UserSettings,
    pub stats: UserStats,
}

// Команды Tauri
#[tauri::command]
async fn get_current_user(state: State<'_, AppState>) -> Result<User, Error> {
    state.user_service.get_current_user().await
}

#[tauri::command]
async fn update_user_profile(
    state: State<'_, AppState>,
    profile: UserProfile
) -> Result<User, Error> {
    state.user_service.update_profile(profile).await
}

#[tauri::command]
async fn create_local_user(
    state: State<'_, AppState>,
    display_name: String
) -> Result<User, Error> {
    state.user_service.create_local_user(display_name).await
}
```

### Интеграция с существующими системами

```typescript
// Обновление user-settings-machine.ts
const userSettingsMachine = createMachine({
  context: {
    user: null, // Добавляем пользователя
    settings: {
      // существующие настройки
    }
  },
  
  states: {
    loading: {
      invoke: {
        src: async (context) => {
          // Загружаем пользователя и его настройки
          const user = await loadUser()
          const settings = await loadUserSettings(user.id)
          return { user, settings }
        }
      }
    }
  }
})

// Обновление project-machine.ts
const projectMachine = createMachine({
  context: {
    project: null,
    userId: null, // Добавляем связь с пользователем
  },
  
  guards: {
    canEditProject: (context) => {
      // Проверяем права пользователя на проект
      return context.project.userId === context.userId
    }
  }
})
```

### UI компоненты

```tsx
// UserProfileModal
const UserProfileModal: React.FC = () => {
  const { user, updateProfile, uploadAvatar } = useUser()
  
  return (
    <Modal>
      <div className="user-profile">
        <AvatarUploader
          avatar={user.avatar}
          onUpload={uploadAvatar}
        />
        
        <Form onSubmit={updateProfile}>
          <Input
            label="Отображаемое имя"
            value={user.displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          
          <Textarea
            label="О себе"
            value={user.profile.bio}
            onChange={(e) => setBio(e.target.value)}
          />
          
          <Select
            label="Язык"
            value={user.profile.language}
            options={SUPPORTED_LANGUAGES}
          />
        </Form>
        
        <UserStats stats={user.stats} />
      </div>
    </Modal>
  )
}

// UserAvatar компонент для header
const UserAvatar: React.FC = () => {
  const { user } = useUser()
  const [showMenu, setShowMenu] = useState(false)
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Avatar
          src={user?.avatar}
          fallback={user?.displayName[0]}
        />
      </DropdownMenuTrigger>
      
      <DropdownMenuContent>
        <DropdownMenuItem onClick={openProfile}>
          <User className="mr-2" />
          Профиль
        </DropdownMenuItem>
        <DropdownMenuItem onClick={openSettings}>
          <Settings className="mr-2" />
          Настройки
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut}>
          <LogOut className="mr-2" />
          Выйти
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

### Миграция данных

```typescript
// Скрипт миграции существующих настроек
async function migrateToUserSystem() {
  // 1. Создаем локального пользователя
  const deviceId = await getDeviceId()
  const existingSettings = await loadLegacySettings()
  
  const user = await createLocalUser({
    displayName: existingSettings.username || 'Пользователь',
    deviceId,
    settings: {
      theme: existingSettings.theme,
      language: existingSettings.language,
      // ... остальные настройки
    }
  })
  
  // 2. Мигрируем проекты
  const projects = await loadAllProjects()
  for (const project of projects) {
    await assignProjectToUser(project.id, user.id)
  }
  
  // 3. Мигрируем API ключи
  const apiKeys = await loadApiKeys()
  await assignApiKeysToUser(apiKeys, user.id)
  
  // 4. Удаляем старые данные
  await cleanupLegacyData()
}
```

### Затрагиваемые модули
- `src/features/user-settings/` - расширение существующей системы
- `src/features/app-settings/` - интеграция с глобальными настройками
- `src/features/project-settings/` - добавление связи с пользователем
- `src-tauri/src/user/` - новый модуль для работы с пользователями
- `src-tauri/src/db/` - схема базы данных для пользователей

### Зависимости
- SQLite для локального хранения данных
- UUID для генерации ID пользователей
- Интеграция с существующей системой настроек
- Будущая интеграция с системой аутентификации (TASK-USER-002)

## 🧪 Тестирование

### Тест-кейсы
1. **Создание локального пользователя**:
   - Шаги: Первый запуск приложения
   - Ожидаемый результат: Автоматически создается локальный пользователь

2. **Обновление профиля**:
   - Шаги: Открыть профиль, изменить данные, сохранить
   - Ожидаемый результат: Данные сохраняются и отображаются корректно

3. **Загрузка аватара**:
   - Шаги: Загрузить изображение в качестве аватара
   - Ожидаемый результат: Аватар сохраняется и отображается во всех местах

4. **Миграция данных**:
   - Шаги: Обновить приложение со старой версии
   - Ожидаемый результат: Все данные мигрируют к новой системе

### Регрессионное тестирование
- Проверить, что существующие настройки продолжают работать
- Убедиться, что проекты корректно открываются после миграции
- Проверить совместимость с системой API ключей

## 📊 Прогресс

- [x] Анализ требований
- [x] Дизайн решения
- [ ] Реализация модели данных
- [ ] Backend сервисы
- [ ] Frontend компоненты
- [ ] Интеграция с существующими системами
- [ ] Миграция данных
- [ ] Тестирование
- [ ] Документация
- [ ] Review
- [ ] Merge

## 💬 Обсуждение

Эта задача создает фундамент для будущих функций:
- Облачная синхронизация
- Коллаборация между пользователями
- Персонализация интерфейса
- Система подписок и лицензирования

## 🔗 Ссылки

- [User Preferences AI Automation](user-preferences-ai-automation.md) - связанная задача
- [User Analytics System](user-analytics-system.md) - интеграция с аналитикой
- [API Keys Management](../completed/api-keys-management.md) - существующая система