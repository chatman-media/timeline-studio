# Semantic Release Configuration

Timeline Studio использует [semantic-release](https://semantic-release.gitbook.io/) для автоматического версионирования и создания релизов.

## Как это работает

1. **Автоматический анализ коммитов** - semantic-release анализирует коммиты и определяет тип релиза
2. **Генерация версии** - На основе типов коммитов генерируется новая версия (major/minor/patch)
3. **Обновление CHANGELOG** - Автоматически обновляется CHANGELOG.md
4. **Синхронизация с промо-сайтом** - CHANGELOG копируется в промо-сайт
5. **Создание GitHub Release** - Создается релиз на GitHub с тегом

## Форматы коммитов

Используйте [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - новая функциональность (увеличивает minor версию)
- `fix:` - исправление багов (увеличивает patch версию)
- `docs:` - изменения документации
- `style:` - форматирование кода
- `refactor:` - рефакторинг кода
- `perf:` - улучшения производительности
- `test:` - добавление тестов
- `chore:` - обновление зависимостей, конфигурации

### Breaking Changes

Для мажорных изменений добавьте `BREAKING CHANGE:` в тело коммита или `!` после типа:

```
feat!: новый API

BREAKING CHANGE: старый API больше не поддерживается
```

## Локальное тестирование

```bash
# Проверка без реального релиза
npm run semantic-release:dry

# Синхронизация changelog вручную
npm run sync-changelog
```

## GitHub Actions

Релизы создаются автоматически при пуше в main ветку через GitHub Actions.

## Конфигурация

Настройки находятся в `.releaserc.json`:
- Анализ коммитов
- Генерация changelog
- Синхронизация с промо-сайтом
- Коммит изменений
- Создание GitHub release