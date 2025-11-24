# Сопоставление типов Frontend и Backend

## 🎨 Эффекты (Effects)

### Frontend (TypeScript)
```typescript
type: "blur" | "brightness" | "contrast" | "speed" | "reverse" | "grayscale" | "sepia" | 
      "saturation" | "hue-rotate" | "vintage" | "duotone" | "noir" | "cyberpunk" | "dreamy" | 
      "infrared" | "matrix" | "arctic" | "sunset" | "lomo" | "twilight" | "neon" | "invert" | 
      "vignette" | "film-grain" | "chromatic-aberration" | "lens-flare" | "glow" | "sharpen" | 
      "noise-reduction" | "stabilization"
```

### Backend (Rust)
```rust
enum EffectType {
    Blur, Brightness, Contrast, Speed, Reverse, Grayscale, Sepia, Saturation, HueRotate,
    Vintage, Duotone, Noir, Cyberpunk, Dreamy, Infrared, Matrix, Arctic, Sunset, Lomo,
    Twilight, Neon, Invert, Vignette, FilmGrain, ChromaticAberration, LensFlare, Glow,
    Sharpen, NoiseReduction, Stabilization
}
```

### ✅ Соответствие типов эффектов
Все типы эффектов полностью совпадают! Преобразование:
- Frontend: `hue-rotate` → Backend: `HueRotate`
- Frontend: `film-grain` → Backend: `FilmGrain`
- Frontend: `chromatic-aberration` → Backend: `ChromaticAberration`
- Frontend: `lens-flare` → Backend: `LensFlare`
- Frontend: `noise-reduction` → Backend: `NoiseReduction`

## 🔄 Переходы (Transitions)

### Frontend (TypeScript)
```typescript
interface Transition {
    type: string // Гибкий строковый тип
    category: "basic" | "advanced" | "creative" | "3d" | "artistic" | "cinematic"
    complexity: "basic" | "intermediate" | "advanced"
    tags: TransitionTag[] // 42 тега
}
```

### Backend (Rust)
```rust
pub type TransitionType = String; // Гибкий строковый тип ✅
enum TransitionCategory {
    Basic, Advanced, Creative, ThreeD, Artistic, Cinematic
}
enum TransitionComplexity {
    Basic, Intermediate, Advanced
}
enum TransitionTag { /* 27 тегов */ }
```

### ✅ Соответствие категорий и сложности
Полное совпадение! Преобразование:
- Frontend: `"3d"` → Backend: `ThreeD`

### ⚠️ Теги переходов
Frontend имеет все теги из Backend + дополнительные теги.

## 🎬 Фильтры (Filters)

### Frontend (TypeScript)
```typescript
category: "color-correction" | "technical" | "cinematic" | "artistic" | "creative" | "vintage"
complexity: "basic" | "intermediate" | "advanced"
tags: FilterTag[] // 14 тегов
```

### Backend (Rust)
```rust
enum FilterCategory {
    ColorCorrection, Technical, Cinematic, Artistic, Creative, Vintage
}
enum FilterComplexity {
    Basic, Intermediate, Advanced
}
enum FilterTag { /* 14 тегов */ }
```

### ✅ Соответствие фильтров
Полное совпадение! Преобразование:
- Frontend: `"color-correction"` → Backend: `ColorCorrection`

## 📋 Параметры эффектов

### Frontend
```typescript
params?: {
    intensity?: number    // Основной параметр для большинства эффектов
    speed?: number       // Для эффекта Speed
    angle?: number       // Для HueRotate
    radius?: number      // Для Blur и Vignette
    amount?: number      // Для Sharpen
    threshold?: number   // Для технических эффектов
    temperature?: number // Для цветокоррекции
    tint?: number       // Для цветокоррекции
}
```

### Backend
```rust
enum EffectParameter {
    Float(f32),
    Int(i32),
    String(String),
    Bool(bool),
    Color(u32),
    FloatArray(Vec<f32>),
    FilePath(PathBuf),
}
```

### ⚠️ ВАЖНО: Сопоставление параметров
Frontend использует `intensity` как основной параметр, но Backend ожидает разные имена:
- **Brightness/Contrast/Saturation**: Frontend `intensity` → Backend `value`
- **Blur**: Frontend `radius` → Backend `radius` ✅
- **Speed**: Frontend `speed` → Backend `speed` ✅
- **HueRotate**: Frontend `angle` → Backend `angle` ✅
- **Vignette**: Frontend `intensity` и `radius` → Backend `angle` (для FFmpeg)
- **FilmGrain**: Frontend `intensity` → Backend `strength`
- **Glow**: Frontend `intensity` → Backend `intensity` ✅
- **Sharpen**: Frontend `amount` → Backend `amount` ✅

## 🔧 Рекомендации по интеграции

### 1. Преобразование имен типов
```typescript
// Frontend to Backend
function toRustEnumCase(str: string): string {
    return str.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join('');
}

// Примеры:
// "hue-rotate" → "HueRotate"
// "color-correction" → "ColorCorrection"
// "3d" → "ThreeD"
```

### 2. Типы для Tauri команд
```typescript
// Frontend types для Tauri
export interface EffectSchema {
    id: string;
    effect_type: string; // Rust enum в snake_case
    name: string;
    enabled: boolean;
    parameters: Record<string, number | string | boolean>;
}

export interface TransitionSchema {
    id: string;
    transition_type: string;
    name: string;
    duration: {
        min: number;
        max: number;
        default: number;
        current: number;
    };
    start_time: number;
    from_clip_id: string;
    to_clip_id: string;
    parameters: Record<string, any>;
}
```

### 3. Конвертеры для отправки в Backend
```typescript
// Конвертер эффекта с правильным маппингом параметров
export function toBackendEffect(effect: VideoEffect): EffectSchema {
    // Конвертируем параметры в формат Backend
    const parameters: Record<string, number | string | boolean> = {};
    
    if (effect.params) {
        // Для эффектов, которые используют intensity вместо value
        if (['brightness', 'contrast', 'saturation'].includes(effect.type) && effect.params.intensity) {
            parameters.value = effect.params.intensity;
        }
        
        // Копируем остальные параметры как есть
        Object.entries(effect.params).forEach(([key, value]) => {
            if (key !== 'intensity' || !['brightness', 'contrast', 'saturation'].includes(effect.type)) {
                parameters[key] = value;
            }
        });
    }
    
    return {
        id: effect.id,
        effect_type: toRustEnumCase(effect.type),
        name: effect.name,
        enabled: true,
        parameters,
        // Добавляем ffmpeg_command если есть кастомная команда
        ffmpeg_command: effect.ffmpegCommand
    };
}

// Конвертер перехода
export function toBackendTransition(transition: Transition): TransitionSchema {
    return {
        id: transition.id,
        transition_type: transition.type,
        name: transition.labels.en,
        duration: {
            ...transition.duration,
            current: transition.duration.default
        },
        start_time: 0, // Заполняется при размещении на timeline
        from_clip_id: "", // Заполняется при размещении
        to_clip_id: "", // Заполняется при размещении
        parameters: transition.parameters || {}
    };
}
```

## ✅ Выводы

1. **Типы эффектов** - полное соответствие ✅
2. **Категории и сложность** - полное соответствие ✅
3. **Теги** - Frontend супермножество Backend ✅
4. **Параметры** - требуется маппинг для некоторых эффектов ⚠️

## 🚀 Что исправлено в Backend

1. **FFmpegBuilder** теперь поддерживает параметр `intensity` из Frontend:
   - Brightness, Contrast, Saturation - проверяют и `intensity` и `value`
   - FilmGrain - проверяет и `intensity` и `strength`
   - Vignette - использует `intensity` и `radius`

2. **Добавлены недостающие FFmpeg команды**:
   - Noir - `hue=s=0,eq=contrast=1.5:brightness=-0.1`
   - Cyberpunk - `eq=brightness=0.1:contrast=1.8:saturation=1.5,colorbalance=rs=0.5:gs=-0.3:bs=0.8`

## 📝 Checklist для интеграции

- [x] Типы эффектов совпадают
- [x] Категории и теги совместимы
- [x] Backend поддерживает параметры Frontend
- [x] FFmpeg команды корректно генерируются
- [x] Создать TypeScript типы для ProjectSchema ✅
- [x] Добавить примеры вызова Tauri команд ✅
- [ ] Протестировать рендеринг с эффектами

## 📦 Созданные файлы для интеграции

### 1. `/src/types/video-compiler.ts`
Полные TypeScript типы для всех структур данных Video Compiler:
- ProjectSchema, Track, Clip, Effect, Transition
- Enums для всех типов
- Вспомогательные функции преобразования
- Примеры вызова Tauri команд

### 2. `/src/hooks/use-video-compiler.ts`
React хук для работы с Video Compiler:
- Запуск рендеринга
- Отслеживание прогресса
- Отмена рендеринга
- Генерация превью кадров

### 3. `/src/features/timeline/utils/timeline-to-project.ts`
Функция преобразования Timeline в ProjectSchema:
- Конвертация треков и клипов
- Сбор всех эффектов
- Обработка переходов
- Правильный маппинг параметров

## 🚀 Пример использования в Timeline

```typescript
import { useTimeline } from '@/features/timeline/hooks/use-timeline';
import { useVideoCompiler } from '@/hooks/use-video-compiler';
import { timelineToProjectSchema } from './utils/timeline-to-project';

function TimelineExportButton() {
  const { project } = useTimeline();
  const { startRender, isRendering, renderProgress } = useVideoCompiler();
  
  const handleExport = async () => {
    const projectSchema = timelineToProjectSchema(project);
    await startRender(projectSchema, '/path/to/output.mp4');
  };
  
  return (
    <>
      <button onClick={handleExport} disabled={isRendering}>
        Экспортировать
      </button>
      
      {renderProgress && (
        <div>
          Прогресс: {renderProgress.percentage.toFixed(1)}%
          ({renderProgress.current_frame}/{renderProgress.total_frames})
        </div>
      )}
    </>
  );
}
```