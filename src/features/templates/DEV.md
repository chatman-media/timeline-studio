# Templates - Техническая документация

## 📁 Структура файлов

### ✅ Полная структура реализована

```
src/features/templates/
├── components/
│   ├── template-list.tsx ✅
│   ├── template-preview.tsx ✅
│   ├── template-list-toolbar.tsx ✅
│   ├── resizable-template.tsx ✅
│   ├── video-panel-component.tsx ✅
│   ├── template-previews/ ✅
│   ├── templates/ ✅
│   └── index.ts ✅
├── lib/
│   ├── template-labels.ts ✅
│   ├── templates.tsx ✅
│   └── index.ts ✅
├── services/
│   ├── template-list-machine.ts ✅
│   ├── template-list-provider.tsx ✅
│   ├── template-service.ts ✅
│   └── index.ts ✅
└── index.ts ✅
```

### 🧪 Тестовое покрытие

```
├── components/
│   ├── template-list-toolbar.test.tsx ✅
│   └── template-preview.test.tsx ✅
└── services/
    ├── template-list-machine.test.ts ✅
    └── template-list-provider.test.tsx ✅
```

## 🏗️ Архитектура компонентов

### TemplateList

**Файл**: `components/template-list.tsx`
**Статус**: ✅ Полностью реализован

### TemplateListMachine

**Файл**: `services/template-list-machine.ts`
**Статус**: ✅ Полностью реализован

## 📦 Типы данных

### Template

```typescript
interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  preview?: string;
  config: TemplateConfig;
}
```
