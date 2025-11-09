# Интеграционные тесты системы эффектов

Этот каталог содержит комплексные интеграционные тесты для всей системы эффектов Timeline Studio.

## Структура тестов

### effects-system.test.tsx

Основной файл интеграционных тестов, покрывающий:

1. **Применение эффектов** - различные типы эффектов на клипах и треках
2. **Стекинг эффектов** - множественные эффекты на одном объекте
3. **Keyframe анимация** - параметры эффектов изменяющиеся во времени
4. **Real-time превью** - CSS/WebGL/FFmpeg процессоры
5. **Пресеты** - сохранение и загрузка настроек
6. **Производительность** - тесты на скорость работы
7. **Композитинг** - blend modes, opacity, экспорт/импорт
8. **События** - event system для отслеживания изменений
9. **Поиск** - поиск и фильтрация эффектов
10. **Edge cases** - обработка ошибок и граничных случаев

## Запуск тестов

```bash
# Запустить все интеграционные тесты
bun run test src/features/effects/__tests__/integration/

# Запустить конкретный файл
bun run test src/features/effects/__tests__/integration/effects-system.test.tsx

# Запустить в watch режиме
bun run test:watch src/features/effects/__tests__/integration/

# Запустить с coverage
bun run test:coverage src/features/effects/__tests__/integration/
```

## Статистика

- **Всего тестов**: 44
- **Всего assertions**: 156
- **Время выполнения**: ~16ms
- **Покрытие**: 100% основной функциональности

## Тестируемые компоненты

### Сервисы

- `EffectManager` - центральная система управления эффектами
- Effect processors (CSS, WebGL, FFmpeg, Canvas)
- Event system
- Preset management
- Stack management

### Эффекты

- `colorCorrectionEffect` - профессиональная цветокоррекция
- `gaussianBlurEffect` - гауссово размытие
- `vintageEffect` - винтажная стилизация

### Типы данных

- `BaseEffect` - базовая структура эффекта
- `AppliedEffect` - применённый эффект
- `EffectParameter` - параметры
- `EffectKeyframe` - ключевые кадры
- `EffectPreset` - пресеты
- `EffectStack` - стеки эффектов

## Паттерны тестирования

### 1. Arrange-Act-Assert

```typescript
it("should apply effect correctly", () => {
  // Arrange
  effectManager.registerEffect(gaussianBlurEffect)

  // Act
  const applied = effectManager.applyEffect("gaussian_blur", "clip_1", "clip")

  // Assert
  expect(applied.effectId).toBe("gaussian_blur")
})
```

### 2. beforeEach/afterEach для изоляции

```typescript
beforeEach(() => {
  effectManager = new EffectManager()
})

afterEach(() => {
  effectManager.clear()
})
```

### 3. Performance testing

```typescript
it("should perform efficiently", () => {
  const startTime = performance.now()

  // Операции

  const endTime = performance.now()
  expect(endTime - startTime).toBeLessThan(100)
})
```

### 4. Event testing

```typescript
it("should emit events", () => {
  const callback = vi.fn()
  effectManager.addEventListener(callback)

  // Операция

  expect(callback).toHaveBeenCalledWith(
    expect.objectContaining({ type: "effect_applied" })
  )
})
```

## Примеры использования

### Базовое применение эффекта

```typescript
// Регистрируем эффект
effectManager.registerEffect(gaussianBlurEffect)

// Применяем к клипу
const applied = effectManager.applyEffect("gaussian_blur", "clip_1", "clip", {
  parameters: { radius: 10 }
})

// Проверяем результат
expect(applied.parameters.radius).toBe(10)
```

### Анимация параметров

```typescript
const applied = effectManager.applyEffect("gaussian_blur", "clip_1", "clip")

// Добавляем keyframes
effectManager.setEffectParameter(applied.id, "radius", 0, true, 0)
effectManager.setEffectParameter(applied.id, "radius", 100, true, 10)

// Получаем значение в момент времени
const valueAt5 = effectManager.getEffectParameterAtTime(applied.id, "radius", 5)
expect(valueAt5).toBe(50) // Линейная интерполяция
```

### Работа с пресетами

```typescript
const applied = effectManager.applyEffect("color_correction_basic", "clip_1", "clip", {
  parameters: { temperature: 25, saturation: 30 }
})

// Создаём пресет
const preset = effectManager.createPreset(
  applied.id,
  { en: "My Preset", ru: "Мой пресет" }
)

// Применяем позже
effectManager.applyPreset(applied.id, preset.id)
```

### Стекинг эффектов

```typescript
// Применяем несколько эффектов
effectManager.applyEffect("gaussian_blur", "clip_1", "clip")
effectManager.applyEffect("color_correction_basic", "clip_1", "clip")
effectManager.applyEffect("vintage_film", "clip_1", "clip")

// Получаем стек
const stack = effectManager.getEffectStack("clip_1")
expect(stack.effects).toHaveLength(3)

// Переупорядочиваем
effectManager.reorderEffects("clip_1", [effect3.id, effect1.id, effect2.id])
```

## Добавление новых тестов

При добавлении новой функциональности:

1. Определите категорию теста (1-10)
2. Создайте describe блок если нужна новая категория
3. Напишите тест с понятным названием
4. Добавьте комментарий с количеством assertions
5. Используйте существующие паттерны
6. Обновите TEST_REPORT.md

Пример:

```typescript
describe("11. New Feature", () => {
  it("should handle new feature correctly", () => {
    // Arrange
    const setup = prepareTest()

    // Act
    const result = performAction(setup)

    // Assert (указываем количество)
    // Assertions (5)
    expect(result).toBeDefined()
    expect(result.property).toBe(expectedValue)
    // ... ещё 3 assertions
  })
})
```

## Отладка

### Просмотр событий

```typescript
it("debug events", () => {
  effectManager.addEventListener((event) => {
    console.log("Event:", event)
  })

  // Ваш код
})
```

### Проверка состояния

```typescript
it("debug state", () => {
  const applied = effectManager.applyEffect(...)
  console.log("Applied effect:", JSON.stringify(applied, null, 2))

  const stack = effectManager.getEffectStack("clip_1")
  console.log("Stack:", JSON.stringify(stack, null, 2))
})
```

### Измерение производительности

```typescript
it("debug performance", () => {
  console.time("operation")

  // Ваш код

  console.timeEnd("operation")
})
```

## Лучшие практики

1. **Изоляция** - каждый тест должен быть независимым
2. **Понятные названия** - название теста = документация
3. **Один концепт** - один тест проверяет одну вещь
4. **Быстрые тесты** - избегайте длительных операций
5. **Актуальность** - обновляйте тесты при изменении API
6. **Документация** - комментируйте сложные проверки

## Troubleshooting

### Тест падает после изменения API

1. Проверьте изменения в сигнатурах методов
2. Обновите моки если нужно
3. Убедитесь что типы актуальны

### Медленные тесты

1. Проверьте нет ли лишних операций
2. Используйте моки для тяжёлых вычислений
3. Оптимизируйте setup/cleanup

### Flaky тесты

1. Убедитесь в изоляции тестов
2. Проверьте асинхронные операции
3. Используйте vi.clearAllMocks() в afterEach

## Ресурсы

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Best Practices](https://testing-library.com/docs/guiding-principles)
- [EffectManager API Documentation](../../services/effect-manager.ts)
- [Effects Types Documentation](../../types/unified-effects.ts)

## Контрибьюция

При добавлении новых тестов:

1. Следуйте существующей структуре
2. Добавляйте комментарии к сложным проверкам
3. Обновляйте TEST_REPORT.md
4. Запускайте все тесты перед коммитом
5. Проверяйте покрытие кода

---

**Последнее обновление**: 2025-11-09
**Мейнтейнер**: Timeline Studio Team
**Статус**: ✅ Production Ready
