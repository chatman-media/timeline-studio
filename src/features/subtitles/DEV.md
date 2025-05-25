# Subtitles - Техническая документация

## 📁 Структура файлов

### ✅ Реализованная структура

```
src/features/subtitles/
├── subtitles-list.tsx ✅
├── subtitles-preview.tsx ✅
├── subtitles.ts ✅
└── index.ts ✅
```

### 🧪 Тестовое покрытие

```
├── subtitles-list.test.tsx ✅
├── subtitles-preview.test.tsx ✅
├── subtitles.test.ts ✅
```

## 🏗️ Архитектура компонентов

### SubtitlesList

**Файл**: `subtitles-list.tsx`
**Статус**: ✅ Полностью реализован

### SubtitlesPreview

**Файл**: `subtitles-preview.tsx`
**Статус**: ✅ Полностью реализован

## 📦 Типы данных

### Subtitle

```typescript
interface Subtitle {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  style?: SubtitleStyle;
}
```
