# План оптимизации промо-сайта Timeline Studio

## Текущее состояние
- ❌ **SSR отсутствует** - обычная SPA на Vite + React
- ✅ Lazy loading роутов (кроме главной)
- ✅ HashRouter для статического хостинга
- ✅ Базовый preconnect и dns-prefetch
- ✅ Critical CSS inline
- ⚠️ Service Worker объявлен, но файл отсутствует
- ⚠️ Three.js загружается везде (тяжелая библиотека)
- ⚠️ Нет pre-rendering (все рендерится в браузере)

## 🚀 Рекомендуемые оптимизации

### Приоритет 1: Критичные (максимальный эффект)

#### 1. Pre-rendering / Static Site Generation
**Эффект:** ⬇️ 70-80% времени до First Contentful Paint

Использовать `vite-plugin-ssr` или `vite-plugin-ssg` для генерации статического HTML:
```bash
npm install -D vite-plugin-ssg
```

Это сгенерирует готовый HTML для каждого роута → мгновенная загрузка контента.

#### 2. Отложенная загрузка Three.js
**Эффект:** ⬇️ 500KB+ от основного bundle

Three.js используется только на `/logo3d`, но загружается везде:
```typescript
// Вместо:
import { Canvas } from '@react-three/fiber'

// Использовать dynamic import:
const ThreeCanvas = lazy(() => import('./components/ThreeCanvas'))
```

#### 3. Создать настоящий Service Worker
**Эффект:** ⬇️ Повторные визиты в 10 раз быстрее

Файл `public/sw.js` отсутствует! Нужно создать для офлайн-кэширования.

### Приоритет 2: Важные (средний эффект)

#### 4. Image Optimization
**Эффект:** ⬇️ 60-70% размера изображений

```bash
npm install -D vite-plugin-imagemin
```

- Конвертация в WebP/AVIF
- Автоматическое сжатие
- Lazy loading изображений

#### 5. Preload критичных ресурсов
**Эффект:** ⬇️ 20-30% времени загрузки

```html
<link rel="preload" href="/assets/main.css" as="style">
<link rel="preload" href="/assets/logo.svg" as="image">
```

#### 6. Bundle Analyzer
**Эффект:** Понимание что занимает место

```bash
npm install -D rollup-plugin-visualizer
```

### Приоритет 3: Полезные (малый эффект)

#### 7. Font Loading Strategy
Уже есть `font-display: swap`, но можно улучшить:
- Использовать `@font-face` с локальными fallback шрифтами
- Preload только критичные шрифты

#### 8. Compression
Настроить в vite.config.js:
```javascript
import compression from 'vite-plugin-compression'

plugins: [
  compression({ algorithm: 'brotli' }),
  compression({ algorithm: 'gzip' })
]
```

#### 9. Code Splitting by Route
Уже используется, но можно улучшить:
- Разделить vendor chunks по важности
- Выделить framer-motion в отдельный chunk
- Prefetch следующих вероятных роутов

## 📊 Ожидаемые результаты

### До оптимизации (примерно):
- First Contentful Paint: ~2.5s
- Time to Interactive: ~4.5s
- Bundle size: ~800KB (gzipped)
- Lighthouse Score: ~75

### После оптимизации:
- First Contentful Paint: ~0.8s (-68%) ⚡
- Time to Interactive: ~1.5s (-67%) ⚡
- Bundle size: ~350KB (gzipped) (-56%) 📦
- Lighthouse Score: ~95+ 🎯

## 🛠️ Быстрый старт (5 минут)

Самые простые и эффективные оптимизации:

1. **Service Worker** (2 мин)
2. **Отложенная загрузка Three.js** (2 мин)
3. **Pre-rendering** (1 мин)

Эти 3 действия дадут 80% эффекта!

## 🔧 Альтернатива SSR

Если хотите **настоящий SSR**, нужно мигрировать на:
- **Vite SSR** (сложнее, нужен Node.js сервер)
- **Astro** (рекомендуется для промо-сайтов)
- **Next.js** (полный фреймворк)

Но для промо-сайта **pre-rendering лучше чем SSR**:
- ✅ Работает на GitHub Pages / Cloudflare Pages
- ✅ Нет серверных затрат
- ✅ Мгновенная загрузка
- ✅ SEO работает отлично

## Рекомендация

Для вашего случая лучше всего:
1. Добавить **pre-rendering** (vite-plugin-ssg)
2. Создать **Service Worker**
3. Отложить **Three.js**

Это даст максимум скорости при минимуме изменений.
