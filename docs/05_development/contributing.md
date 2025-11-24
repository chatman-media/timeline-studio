# Руководство для контрибьюторов

[← Назад к руководству разработчика](README.md)

## 📋 Содержание

- [Начало работы](#начало-работы)
- [Процесс разработки](#процесс-разработки)
- [Создание Pull Request](#создание-pull-request)
- [Стиль кода](#стиль-кода)
- [Написание тестов](#написание-тестов)
- [Документирование](#документирование)
- [Сообщество](#сообщество)
- [Лицензия](#лицензия)

## 🚀 Начало работы

### 1. Форк репозитория

1. Перейдите на [GitHub страницу Timeline Studio](https://github.com/chatman-media/timeline-studio)
2. Нажмите кнопку "Fork" в правом верхнем углу
3. Клонируйте ваш форк:

```bash
git clone https://github.com/YOUR_USERNAME/timeline-studio.git
cd timeline-studio
git remote add upstream https://github.com/chatman-media/timeline-studio.git
```

### 2. Настройка окружения

Следуйте [руководству по настройке](setup.md) для установки всех зависимостей.

### 3. Создание ветки

```bash
# Обновляем main ветку
git checkout main
git pull upstream main

# Создаем новую ветку для вашей работы
git checkout -b feature/your-feature-name
# или
git checkout -b fix/your-bug-fix
```

## 🔄 Процесс разработки

### 1. Выбор задачи

#### Для новых контрибьюторов

Ищите issues с метками:
- `good first issue` - простые задачи для начала
- `help wanted` - задачи, где нужна помощь
- `documentation` - улучшение документации

#### Создание нового issue

Перед началом работы над новой функцией:
1. Проверьте существующие issues
2. Создайте новый issue с описанием
3. Дождитесь обсуждения и одобрения

### 2. Разработка

#### Структура коммитов

Следуем [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Формат
<type>(<scope>): <subject>

# Примеры
feat(timeline): add multi-track selection
fix(export): resolve memory leak in video encoding
docs(api): update Timeline API documentation
test(effects): add tests for blur effect
```

#### Типы коммитов

- `feat` - новая функциональность
- `fix` - исправление ошибок
- `docs` - изменения документации
- `style` - форматирование, отсутствующие точки с запятой и т.д.
- `refactor` - рефакторинг кода
- `test` - добавление тестов
- `chore` - обновление задач сборки, менеджера пакетов и т.д.

#### Частые коммиты

```bash
# Делайте коммиты часто и с понятными сообщениями
git add src/features/timeline/components/timeline-ruler.tsx
git commit -m "feat(timeline): add time markers to ruler"

git add src/features/timeline/__tests__/components/timeline-ruler.test.tsx
git commit -m "test(timeline): add tests for timeline ruler markers"
```

### 3. Тестирование

#### Запуск тестов

```bash
# Frontend тесты
bun run test

# Backend тесты
bun run test:rust

# E2E тесты
bun run test:e2e

# Все тесты
bun run test:all
```

#### Написание тестов

Для новой функциональности обязательно:
1. Добавьте unit тесты
2. Обновите интеграционные тесты если нужно
3. Добавьте E2E тест для критичных сценариев

Пример структуры тестов:
```
src/features/your-feature/
├── __tests__/
│   ├── components/
│   │   └── your-component.test.tsx
│   ├── hooks/
│   │   └── use-your-hook.test.ts
│   └── services/
│       └── your-service.test.ts
└── __mocks__/
    └── your-mock.ts
```

### 4. Документирование

#### Обязательная документация

1. **JSDoc для публичных API**:
   ```typescript
   /**
    * Процессирует видеофайл с заданными параметрами
    * @param file - Файл для обработки
    * @param options - Параметры обработки
    * @returns Обработанное видео
    * @throws {ProcessingError} Если обработка не удалась
    */
   export async function processVideo(
     file: File,
     options: ProcessOptions
   ): Promise<ProcessedVideo> {
     // ...
   }
   ```

2. **README для новых модулей**:
   ```markdown
   # Feature Name

   Описание функциональности...

   ## Использование

   \```typescript
   import { useFeature } from '@/features/feature-name'
   \```

   ## API

   ### useFeature()
   ...
   ```

3. **Обновление существующей документации**:
   - API референс если добавили новые публичные методы
   - Руководства пользователя для новых функций
   - Примеры использования

### 5. Проверка кода

Перед созданием PR убедитесь:

```bash
# Линтинг
bun run lint
bun run lint:fix  # Автоисправление

# Форматирование
bun run format

# Проверка типов
bun run type-check

# Все проверки
bun run check:all
```

## 📝 Создание Pull Request

### 1. Подготовка

```bash
# Обновляем ветку относительно main
git fetch upstream
git rebase upstream/main

# Проверяем, что все тесты проходят
bun run test:all

# Проверяем линтинг
bun run check:all
```

### 2. Создание PR

1. Запушьте вашу ветку:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Откройте [GitHub](https://github.com/chatman-media/timeline-studio) и создайте Pull Request

3. Заполните шаблон PR:

```markdown
## Описание

Краткое описание изменений и их цели.

## Тип изменений

- [ ] Исправление бага (non-breaking change)
- [ ] Новая функция (non-breaking change)
- [ ] Breaking change
- [ ] Требует обновления документации

## Как протестировано?

Опишите тесты, которые вы провели.

## Чеклист

- [ ] Мой код следует стилю проекта
- [ ] Я провел самостоятельный ревью кода
- [ ] Я добавил комментарии в сложных местах
- [ ] Я обновил документацию
- [ ] Мои изменения не создают новых предупреждений
- [ ] Я добавил тесты для своих изменений
- [ ] Все тесты проходят локально
```

### 3. Code Review

#### Что мы проверяем

- **Функциональность**: Код работает как ожидается
- **Тесты**: Достаточное покрытие тестами
- **Производительность**: Нет очевидных проблем
- **Безопасность**: Нет уязвимостей
- **Стиль**: Соответствие стандартам проекта
- **Документация**: Актуальная и понятная

#### Как отвечать на комментарии

1. Будьте вежливы и конструктивны
2. Если не согласны - аргументируйте
3. Исправляйте замечания отдельными коммитами
4. Отмечайте resolved когда исправлено

### 4. После одобрения

Мейнтейнеры проекта:
1. Сделают финальную проверку
2. Могут попросить сделать squash коммитов
3. Смержат PR в основную ветку

## 🎨 Стиль кода

### TypeScript/JavaScript

```typescript
// ✅ Хорошо
export const processVideo = async (
  file: File,
  options: ProcessOptions
): Promise<ProcessedVideo> => {
  if (!file || file.size === 0) {
    throw new Error('Invalid file provided')
  }

  try {
    const metadata = await extractMetadata(file)
    const processed = await encode(file, options)
    
    return {
      ...processed,
      metadata
    }
  } catch (error) {
    logger.error('Video processing failed', { error, file: file.name })
    throw new ProcessingError('Failed to process video', { cause: error })
  }
}

// ❌ Плохо
export const processVideo = async (f, opts) => {
  const result = await doStuff(f, opts)
  return result
}
```

### React компоненты

```typescript
// ✅ Хорошо - четкая структура
interface VideoPlayerProps {
  file: MediaFile
  autoPlay?: boolean
  onTimeUpdate?: (time: number) => void
}

export const VideoPlayer: FC<VideoPlayerProps> = ({
  file,
  autoPlay = false,
  onTimeUpdate
}) => {
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  
  const handlePlayPause = useCallback(() => {
    setIsPlaying(prev => !prev)
  }, [])
  
  useEffect(() => {
    // Логика воспроизведения
  }, [isPlaying, file])
  
  return (
    <div className="video-player">
      {/* UI компоненты */}
    </div>
  )
}
```

Полное руководство по стилю кода: [coding-standards.md](coding-standards.md)

## 🧪 Написание тестов

### Unit тесты

```typescript
describe('VideoProcessor', () => {
  it('should process video with default options', async () => {
    // Arrange
    const file = new File([''], 'test.mp4', { type: 'video/mp4' })
    const processor = new VideoProcessor()
    
    // Act
    const result = await processor.process(file)
    
    // Assert
    expect(result).toMatchObject({
      format: 'mp4',
      quality: 'high',
      duration: expect.any(Number)
    })
  })
  
  it('should handle processing errors gracefully', async () => {
    // Arrange
    const corruptFile = new File(['corrupt'], 'bad.mp4')
    const processor = new VideoProcessor()
    
    // Act & Assert
    await expect(processor.process(corruptFile))
      .rejects.toThrow('Invalid video format')
  })
})
```

### E2E тесты

```typescript
test('user can import and edit video', async ({ page }) => {
  // Навигация
  await page.goto('/')
  
  // Импорт видео
  await page.getByRole('button', { name: 'Import Media' }).click()
  await page.setInputFiles('input[type="file"]', 'e2e/fixtures/sample.mp4')
  
  // Ожидание обработки
  await expect(page.getByText('Processing...')).toBeVisible()
  await expect(page.getByText('Processing...')).toBeHidden({ timeout: 30000 })
  
  // Проверка результата
  const videoClip = page.getByRole('button', { name: 'sample.mp4' })
  await expect(videoClip).toBeVisible()
})
```

Полное руководство по тестам: [testing.md](testing.md)

## 💬 Сообщество

### Где получить помощь

1. **GitHub Discussions** - для вопросов и обсуждений
2. **Discord** - для быстрой помощи и общения
3. **Issue Tracker** - для багов и предложений

### Кодекс поведения

Мы следуем [Contributor Covenant](https://www.contributor-covenant.org/). 

Ключевые принципы:
- Уважительное общение
- Конструктивная критика
- Помощь новичкам
- Открытость к разным мнениям

### Признание вклада

Все контрибьюторы автоматически добавляются в:
- [Contributors list](https://github.com/chatman-media/timeline-studio/graphs/contributors)
- README.md файл проекта
- Релизные заметки

## 📜 Лицензия

Внося вклад в Timeline Studio, вы соглашаетесь, что ваш вклад будет лицензирован под той же лицензией, что и проект.

## 🎯 Приоритетные области

### Высокий приоритет

1. **Оптимизация производительности**
   - Рендеринг больших проектов
   - Работа с 4K/8K видео
   - Уменьшение потребления памяти

2. **Новые эффекты и переходы**
   - Современные визуальные эффекты
   - GPU-ускоренные фильтры
   - Кастомные шейдеры

3. **Улучшение UX**
   - Горячие клавиши
   - Drag & Drop
   - Контекстные меню

### Средний приоритет

1. **Интеграции**
   - Новые социальные сети
   - Облачные хранилища
   - Стоковые библиотеки

2. **AI функции**
   - Умная обрезка
   - Автоматические субтитры
   - Распознавание сцен

3. **Документация**
   - Видео туториалы
   - Примеры проектов
   - API гайды

## 📚 Полезные ресурсы

### Для изучения кодовой базы

1. [Архитектура приложения](../03_architecture/README.md)
2. [API Reference](../04_api_reference/README.md)
3. [Примеры кода](../09_examples/README.md)

### Внешние ресурсы

- [Tauri Documentation](https://tauri.app/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Rust Book](https://doc.rust-lang.org/book/)

## ✅ Финальный чеклист

Перед отправкой PR убедитесь:

- [ ] Код компилируется без ошибок
- [ ] Все тесты проходят
- [ ] Линтеры не показывают ошибок
- [ ] Документация обновлена
- [ ] Коммиты следуют conventional commits
- [ ] PR имеет понятное описание
- [ ] Связанные issues указаны

---

Спасибо за ваш вклад в Timeline Studio! 🎉

[← Назад к руководству разработчика](README.md)