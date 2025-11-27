# Скрипт статистики проекта

## Использование

Скрипт `count-features-stats.ts` автоматически подсчитывает статистику всех фич проекта Timeline Studio.

### Запуск

```bash
bun run scripts/count-features-stats.ts
```

### Что подсчитывается

Для каждой фичи в `/src/features/`:

1. **Компоненты** - `.tsx` файлы в `components/`
2. **Хуки** - `use-*.ts` файлы в `hooks/`
3. **Сервисы** - файлы с суффиксом `-service.ts`, `-client.ts`, `-api.ts` в `services/`
4. **State машины** - файлы с суффиксом `-machine.ts` в `services/`
5. **Типы** - все `.ts`/`.tsx` файлы в `types/`
6. **Тесты** - `.test.ts`/`.test.tsx` файлы в `__tests__/`
7. **Готовность** - из README.md фичи (паттерны: "Готовность: XX%", "Readiness: XX%")

### Исключенные фичи

По умолчанию исключаются:
- `camera-capture` (временно отключено)
- `voice-recording` (временно отключено)

Список можно изменить в константе `EXCLUDED_FEATURES` в скрипте.

### Формат вывода

Скрипт выводит:

1. **Детальную статистику по фичам** - файлы, тесты, готовность
2. **Общую статистику** - итоги по всем фичам
3. **Распределение по готовности** - группировка фич
4. **JSON данные** - для автоматической обработки

### Обновление документации

После запуска скрипта обновите:

1. `/docs/00_project_manifest/project_stats.md` - подробная статистика
2. `/docs/00_project_manifest/README.md` - манифест проекта
3. `/docs/00_project_manifest/metrics.json` - JSON данные
4. `/docs/00_project_manifest/metrics_summary.txt` - визуальная сводка

### Автоматизация

Для автоматического обновления всей документации:

```bash
bun run scripts/count-features-stats.ts > /tmp/stats.json
# Затем обновите документацию на основе данных в /tmp/stats.json
```

### Пример добавления готовности в README фичи

В `/src/features/[feature-name]/README.md`:

```markdown
## Статус

**Готовность**: 85%
```

или

```markdown
## Status

**Readiness**: 85%
```

Скрипт автоматически найдет и учтет этот процент.

### Важные заметки

- Скрипт учитывает только директории в `/src/features/`
- Фичи без README.md попадут в категорию "Без данных о готовности"
- Для точного подсчета компонентов нужна структура `components/` внутри фичи
- Хуки должны начинаться с `use-` и находиться в `hooks/`
- State машины должны заканчиваться на `-machine.ts` и находиться в `services/`

### Расширение функциональности

Чтобы добавить новый тип файлов для подсчета:

1. Откройте `scripts/count-features-stats.ts`
2. Добавьте новое поле в интерфейс `FeatureStats.files`
3. Добавьте подсчет в функцию `analyzeFeature()`
4. Обновите вывод статистики

Пример:

```typescript
// Добавить utils
const utilsDir = join(featurePath, 'utils');
if (existsSync(utilsDir)) {
  stats.files.utils = countFiles(utilsDir, /\.tsx?$/);
}
```
