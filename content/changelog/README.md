# Changelog System Documentation

## Обзор

Промо-сайт Timeline Studio отображает историю версий проекта на странице `/changelog`. Система работает следующим образом:

## Структура файлов

```
promo/
├── content/
│   └── changelog/
│       ├── latest.md     # Актуальный CHANGELOG из корня проекта
│       └── 0.36.0.md     # Архивная версия (не используется)
├── public/
│   └── content/
│       └── changelog/
│           └── latest.md # Копия для статического доступа
└── src/
    ├── pages/
    │   └── Changelog.tsx # Компонент страницы changelog
    └── utils/
        └── parseChangelog.ts # Парсер markdown changelog
```

## Как это работает

1. **Автоматическая синхронизация**: GitHub Action `sync-changelog.yml` автоматически копирует `CHANGELOG.md` из корня проекта в промо-папку при каждом изменении.

2. **Динамическая загрузка**: Компонент `Changelog.tsx` загружает `latest.md` через fetch и парсит его с помощью `parseChangelog.ts`.

3. **Fallback**: Если загрузка не удалась, используются захардкоженные версии из компонента.

4. **Парсинг**: Утилита `parseChangelog.ts` извлекает:
   - Номер версии
   - Дату релиза
   - Features (новые функции)
   - Bug Fixes (исправления)
   - Improvements (улучшения)
   - Breaking Changes (критические изменения)

## Обновление changelog

### Автоматически
При каждом релизе semantic-release обновляет `CHANGELOG.md`, и GitHub Action синхронизирует его с промо-сайтом.

### Вручную
```bash
# Скопировать CHANGELOG.md в промо-папку
cp CHANGELOG.md promo/content/changelog/latest.md
cp CHANGELOG.md promo/public/content/changelog/latest.md
```

## Формат CHANGELOG.md

Файл должен следовать формату [Conventional Changelog](https://www.conventionalcommits.org/):

```markdown
# [0.51.0](https://github.com/chatman-media/timeline-studio/compare/v0.50.0...v0.51.0) (2025-01-30)

### Features
* **module:** описание новой функции ([hash](link))

### Bug Fixes  
* **module:** описание исправления ([hash](link))
```

## Отладка

Если версии не отображаются:

1. Проверьте консоль браузера на ошибки загрузки
2. Убедитесь, что файл `latest.md` существует в `public/content/changelog/`
3. Проверьте формат markdown файла
4. Проверьте работу парсера в `parseChangelog.ts`