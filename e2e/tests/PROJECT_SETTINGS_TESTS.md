# Project Settings E2E Tests

## Запуск тестов

### Вариант 1: Автоматический запуск dev сервера (рекомендуется)

```bash
# Из корневой директории проекта
rm -f dist/dev/lock  # Удаляем lock файл если есть
bun run test:e2e e2e/tests/project-settings.spec.ts
```

Playwright автоматически запустит dev сервер, выполнит тесты и остановит сервер.

### Вариант 2: Использование уже запущенного сервера

Если у вас уже запущен dev сервер:

```bash
# В одном терминале - запустите dev сервер
bun run dev

# В другом терминале - запустите тесты с ручной конфигурацией
# (требуется создать временный конфиг без webServer)
```

## Покрытые сценарии

1. ✅ Открытие модального окна Project Settings
2. ✅ Изменение aspect ratio (16:9, 9:16, 1:1, etc.)
3. ✅ Изменение resolution (1080p, 720p, 4K, etc.)
4. ✅ Редактирование custom width/height
5. ✅ Блокировка/разблокировка aspect ratio
6. ✅ Изменение frame rate (24, 30, 60 fps)
7. ✅ Изменение color space (SDR, HDR)
8. ✅ Сохранение настроек
9. ✅ Отмена изменений
10. ✅ Сохранение значений при вводе digit-by-digit
11. ✅ Пропорциональное изменение при locked aspect ratio

## Частые проблемы

### ERR_CONNECTION_REFUSED

**Проблема:** `net::ERR_CONNECTION_REFUSED at http://localhost:3001/`

**Решение:**
- Убедитесь что dev сервер не запущен вручную
- Удалите lock файл: `rm -f dist/dev/lock`
- Запустите тесты снова

### Unable to acquire lock

**Проблема:** `Unable to acquire lock at dist/dev/lock`

**Решение:**
```bash
rm -f dist/dev/lock
bun run test:e2e e2e/tests/project-settings.spec.ts
```

### Тесты падают из-за таймаутов

**Решение:** Увеличьте таймауты в `playwright.config.ts`:
```typescript
timeout: 120000,  // 2 минуты вместо 60 секунд
```

## Отладка тестов

### С UI (headed mode)
```bash
npx playwright test e2e/tests/project-settings.spec.ts --headed
```

### С пошаговой отладкой
```bash
npx playwright test e2e/tests/project-settings.spec.ts --debug
```

### Просмотр отчёта
```bash
npx playwright show-report
```

### Просмотр trace для конкретного теста
```bash
npx playwright show-trace test-results/[test-name]/trace.zip
```
