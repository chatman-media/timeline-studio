# Установка YOLO моделей для тестов

## Быстрый старт

Для запуска тестов распознавания требуются YOLO модели в формате ONNX.

### Шаг 1: Установите ultralytics

```bash
pip install ultralytics
```

### Шаг 2: Запустите скрипт загрузки

```bash
python3 scripts/download_yolo_models.py
```

Скрипт автоматически:
- Создаст директорию `~/Library/Application Support/timeline-studio/models/`
- Скачает модели YOLO из репозитория Ultralytics
- Экспортирует их в формат ONNX
- Сохранит в нужную директорию

### Шаг 3: Запустите тесты

```bash
bun run test:rust
```

## Ручная установка

Если автоматический скрипт не работает, можно скачать модели вручную:

### Вариант 1: Экспорт через Python

```python
from ultralytics import YOLO

# Для YOLOv11 Detection
model = YOLO('yolo11n.pt')
model.export(format='onnx', simplify=True)

# Для YOLOv8 Detection
model = YOLO('yolov8n.pt')
model.export(format='onnx', simplify=True)
```

Затем скопируйте `.onnx` файлы в:
```
~/Library/Application Support/timeline-studio/models/
```

### Вариант 2: Скачать готовые ONNX модели

1. Посетите [Ultralytics Hub](https://hub.ultralytics.com/)
2. Скачайте ONNX модели:
   - yolo11n.onnx
   - yolov8n.onnx
   - yolo11n-face.onnx (если доступна)
3. Поместите в директорию моделей

## Структура директории моделей

```
~/Library/Application Support/timeline-studio/models/
├── yolo11n.onnx           # YOLOv11 Detection
├── yolo11n-seg.onnx       # YOLOv11 Segmentation
├── yolo11n-face.onnx      # YOLOv11 Face Detection
├── yolov8n.onnx           # YOLOv8 Detection
├── yolov8n-seg.onnx       # YOLOv8 Segmentation
└── yolov8n-face.onnx      # YOLOv8 Face Detection
```

## Размеры моделей

- **yolo11n.onnx**: ~6 MB (основная модель детекции)
- **yolov8n.onnx**: ~6 MB (legacy детекция)
- **yolo11n-seg.onnx**: ~6.5 MB (сегментация)
- **yolo11n-face.onnx**: ~2 MB (детекция лиц, если доступна)

## Проверка установки

Проверьте, что модели установлены:

```bash
ls -lh ~/Library/Application\ Support/timeline-studio/models/
```

Вы должны увидеть файлы .onnx размером 2-7 MB каждый.

## Альтернативные пути (для других платформ)

- **Windows**: `C:\Users\<User>\AppData\Local\timeline-studio\models\`
- **Linux**: `~/.local/share/timeline-studio/models/`

## Устранение проблем

### Ошибка "Model not found"

Убедитесь что:
1. Директория существует: `mkdir -p ~/Library/Application\ Support/timeline-studio/models`
2. Файлы .onnx находятся именно в этой директории
3. Файлы имеют правильные имена (например, `yolo11n.onnx`, а не `yolo11n_opset12.onnx`)

### Ошибка при экспорте

Если ultralytics не может экспортировать модель:
```bash
# Обновите ultralytics
pip install --upgrade ultralytics

# Попробуйте с другими параметрами
python -c "from ultralytics import YOLO; YOLO('yolo11n.pt').export(format='onnx', opset=12)"
```

### Ошибка "ONNX Runtime not available"

Убедитесь что ONNX Runtime установлен:
```bash
brew install onnxruntime
export ORT_DYLIB_PATH=/opt/homebrew/lib/libonnxruntime.dylib
```

Добавьте в ваш shell profile (`~/.zshrc` или `~/.bashrc`):
```bash
export ORT_DYLIB_PATH=/opt/homebrew/lib/libonnxruntime.dylib
```
