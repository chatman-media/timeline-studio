import type { MediaTemplate } from "../../lib/templates"

export const portraitTemplates: MediaTemplate[] = [
  // Шаблоны с 2 экранами
  {
    id: "split-vertical-portrait",
    split: "vertical",
    screens: 2,
    resizable: true,
    splitPosition: 50, // Позиция разделения в процентах (50% - посередине)
    render: () => (
      <div className="flex h-full w-full">
        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          1
        </div>
        <div className="h-full w-px bg-gray-400" style={{ opacity: 0.3 }} />
        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          2
        </div>
      </div>
    ),
  },
  {
    id: "split-horizontal-portrait",
    split: "horizontal",
    screens: 2,
    resizable: true,
    splitPosition: 50, // Позиция разделения в процентах (50% - посередине)
    render: () => (
      <div className="flex h-full w-full flex-col">
        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          1
        </div>
        <div className="h-px w-full bg-gray-400" style={{ opacity: 0.3 }} />
        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          2
        </div>
      </div>
    ),
  },
  // Диагональное разделение
  {
    id: "split-diagonal-portrait",
    split: "diagonal",
    screens: 2,
    resizable: true, // Диагональные шаблоны не могут быть resizable
    splitPoints: [
      { x: 0, y: 40 }, // Начальная точка (левый край, 40% от верха)
      { x: 100, y: 60 }, // Конечная точка (правый край, 60% от верха)
    ],
    render: () => (
      <div className="relative h-full w-full">
        {/* Первый экран (верхний) */}
        <div
          className="absolute inset-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            clipPath: "polygon(0 0, 100% 0, 100% 60%, 0 40%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          <div style={{ position: "relative", top: "-25%" }}>1</div>
        </div>

        {/* Линия разделения */}
        <div
          className="absolute inset-0 z-10 bg-gray-400"
          style={{
            clipPath: "polygon(0 39.8%, 0 40.2%, 100% 60.2%, 100% 59.8%)",
            opacity: 0.3,
          }}
        />

        {/* Второй экран (нижний) */}
        <div
          className="absolute inset-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            clipPath: "polygon(0 40%, 100% 60%, 100% 100%, 0 100%)",
            border: "1px solid rgba(156, 163, 175, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ position: "relative", top: "25%" }}>2</div>
        </div>
      </div>
    ),
  },
  // Шаблон с горизонтальным разделением сверху и вертикальным снизу
  {
    id: "split-mixed-1-portrait",
    split: "custom",
    screens: 3,
    resizable: true,
    render: () => (
      <div className="relative h-full w-full">
        {/* Верхняя секция */}
        <div
          className="absolute top-0 right-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            height: "50%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          1
        </div>

        {/* Горизонтальная линия разделения */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "100%",
            height: "1px",
            top: "50%",
            left: "0",
            opacity: 0.3,
          }}
        />

        {/* Нижняя левая секция */}
        <div
          className="absolute bottom-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "50%",
            height: "50%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          2
        </div>

        {/* Вертикальная линия разделения */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "1px",
            height: "50%",
            top: "50%",
            left: "50%",
            opacity: 0.3,
          }}
        />

        {/* Нижняя правая секция */}
        <div
          className="absolute right-0 bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "50%",
            height: "50%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          3
        </div>
      </div>
    ),
  },

  // Шаблон с вертикальным разделением слева и двумя секциями справа
  {
    id: "split-mixed-2-portrait",
    split: "custom",
    screens: 3,
    resizable: true,
    render: () => (
      <div className="relative h-full w-full">
        {/* Левая секция */}
        <div
          className="absolute top-0 bottom-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "50%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          1
        </div>

        {/* Вертикальная линия разделения */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "1px",
            height: "100%",
            top: "0",
            left: "50%",
            opacity: 0.3,
          }}
        />

        {/* Верхняя правая секция */}
        <div
          className="absolute top-0 right-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "50%",
            height: "50%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          2
        </div>

        {/* Горизонтальная линия разделения */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "50%",
            height: "1px",
            top: "50%",
            right: "0",
            opacity: 0.3,
          }}
        />

        {/* Нижняя правая секция */}
        <div
          className="absolute right-0 bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "50%",
            height: "50%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          3
        </div>
      </div>
    ),
  },

  // Шаблоны с 3 экранами
  {
    id: "split-vertical-3-portrait",
    split: "vertical",
    screens: 3,
    resizable: true,
    render: () => (
      <div className="flex h-full w-full">
        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          1
        </div>
        <div className="h-full w-px bg-gray-400" style={{ opacity: 0.3 }} />
        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          2
        </div>
        <div className="h-full w-px bg-gray-400" style={{ opacity: 0.3 }} />
        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          3
        </div>
      </div>
    ),
  },
  {
    id: "split-horizontal-3-portrait",
    split: "horizontal",
    screens: 3,
    resizable: true,
    render: () => (
      <div className="flex h-full w-full flex-col">
        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          1
        </div>
        <div className="h-px w-full bg-gray-400" style={{ opacity: 0.3 }} />
        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          2
        </div>
        <div className="h-px w-full bg-gray-400" style={{ opacity: 0.3 }} />
        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          3
        </div>
      </div>
    ),
  },

  // Шаблоны с 4 экранами
  {
    id: "split-grid-2x2-portrait",
    split: "custom",
    screens: 4,
    resizable: true,
    render: () => (
      <div className="relative h-full w-full">
        {/* Верхний левый экран */}
        <div
          className="absolute top-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "50%",
            height: "50%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          1
        </div>

        {/* Верхний правый экран */}
        <div
          className="absolute top-0 right-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "50%",
            height: "50%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          2
        </div>

        {/* Нижний левый экран */}
        <div
          className="absolute bottom-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "50%",
            height: "50%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          3
        </div>

        {/* Нижний правый экран */}
        <div
          className="absolute right-0 bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "50%",
            height: "50%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          4
        </div>

        {/* Горизонтальная линия разделения */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "100%",
            height: "1px",
            top: "50%",
            left: "0",
            opacity: 0.3,
          }}
        />

        {/* Вертикальная линия разделения */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "1px",
            height: "100%",
            top: "0",
            left: "50%",
            opacity: 0.3,
          }}
        />
      </div>
    ),
  },
  {
    id: "split-horizontal-4-portrait",
    split: "horizontal",
    screens: 4,
    resizable: true,
    render: () => (
      <div className="flex h-full w-full flex-col">
        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            height: "25%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          1
        </div>
        <div className="h-px w-full bg-gray-400" style={{ opacity: 0.3 }} />
        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            height: "25%",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          2
        </div>
        <div className="h-px w-full bg-gray-400" style={{ opacity: 0.3 }} />
        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            height: "25%",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          3
        </div>
        <div className="h-px w-full bg-gray-400" style={{ opacity: 0.3 }} />
        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            height: "25%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          4
        </div>
      </div>
    ),
  },
  // Шаблон с 6 экранами (2x3)
  {
    id: "split-grid-2x3-portrait",
    split: "custom",
    screens: 6,
    resizable: true,
    render: () => (
      <div className="relative h-full w-full">
        {/* Верхний левый экран */}
        <div
          className="absolute top-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "50%",
            height: "33.33%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          1
        </div>

        {/* Верхний правый экран */}
        <div
          className="absolute top-0 right-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "50%",
            height: "33.33%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          2
        </div>

        {/* Средний левый экран */}
        <div
          className="absolute left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "50%",
            height: "33.33%",
            top: "33.33%",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          3
        </div>

        {/* Средний правый экран */}
        <div
          className="absolute right-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "50%",
            height: "33.33%",
            top: "33.33%",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          4
        </div>

        {/* Нижний левый экран */}
        <div
          className="absolute bottom-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "50%",
            height: "33.33%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          5
        </div>

        {/* Нижний правый экран */}
        <div
          className="absolute right-0 bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "50%",
            height: "33.33%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          6
        </div>

        {/* Горизонтальная линия разделения 1 */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "100%",
            height: "1px",
            top: "33.33%",
            left: "0",
            opacity: 0.3,
          }}
        />

        {/* Горизонтальная линия разделения 2 */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "100%",
            height: "1px",
            top: "66.66%",
            left: "0",
            opacity: 0.3,
          }}
        />

        {/* Вертикальная линия разделения */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "1px",
            height: "100%",
            top: "0",
            left: "50%",
            opacity: 0.3,
          }}
        />
      </div>
    ),
  },

  // Шаблоны с 5 экранами - вариант 1 (1 большой сверху, 4 маленьких снизу)
  {
    id: "split-custom-5-1-portrait",
    split: "custom",
    screens: 5,
    resizable: true,
    render: () => (
      <div className="relative h-full w-full">
        {/* Верхняя большая секция */}
        <div
          className="absolute top-0 right-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            height: "50%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          1
        </div>

        {/* Горизонтальная линия разделения */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "100%",
            height: "1px",
            top: "50%",
            left: "0",
            opacity: 0.3,
          }}
        />

        {/* Нижняя левая верхняя секция */}
        <div
          className="absolute left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "50%",
            height: "25%",
            top: "50%",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          2
        </div>

        {/* Нижняя правая верхняя секция */}
        <div
          className="absolute right-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "50%",
            height: "25%",
            top: "50%",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          3
        </div>

        {/* Вертикальная линия разделения в верхней части нижней секции */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "1px",
            height: "25%",
            top: "50%",
            left: "50%",
            opacity: 0.3,
          }}
        />

        {/* Горизонтальная линия разделения в нижней секции */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "100%",
            height: "1px",
            top: "75%",
            left: "0",
            opacity: 0.3,
          }}
        />

        {/* Нижняя левая нижняя секция */}
        <div
          className="absolute bottom-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "50%",
            height: "25%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          4
        </div>

        {/* Нижняя правая нижняя секция */}
        <div
          className="absolute right-0 bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "50%",
            height: "25%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          5
        </div>

        {/* Вертикальная линия разделения в нижней части нижней секции */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "1px",
            height: "25%",
            top: "75%",
            left: "50%",
            opacity: 0.3,
          }}
        />
      </div>
    ),
  },

  // Шаблоны с 5 экранами - вариант 2 (1 большой снизу, 4 маленьких сверху)
  {
    id: "split-custom-5-2-portrait",
    split: "custom",
    screens: 5,
    resizable: true,
    render: () => (
      <div className="relative h-full w-full">
        {/* Нижняя большая секция */}
        <div
          className="absolute right-0 bottom-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            height: "50%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          5
        </div>

        {/* Горизонтальная линия разделения */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "100%",
            height: "1px",
            top: "50%",
            left: "0",
            opacity: 0.3,
          }}
        />

        {/* Верхняя левая верхняя секция */}
        <div
          className="absolute top-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "50%",
            height: "25%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          1
        </div>

        {/* Верхняя правая верхняя секция */}
        <div
          className="absolute top-0 right-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "50%",
            height: "25%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          2
        </div>

        {/* Вертикальная линия разделения в верхней части верхней секции */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "1px",
            height: "25%",
            top: "0",
            left: "50%",
            opacity: 0.3,
          }}
        />

        {/* Горизонтальная линия разделения в верхней секции */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "100%",
            height: "1px",
            top: "25%",
            left: "0",
            opacity: 0.3,
          }}
        />

        {/* Верхняя левая нижняя секция */}
        <div
          className="absolute left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "50%",
            height: "25%",
            top: "25%",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          3
        </div>

        {/* Верхняя правая нижняя секция */}
        <div
          className="absolute right-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "50%",
            height: "25%",
            top: "25%",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          4
        </div>

        {/* Вертикальная линия разделения в нижней части верхней секции */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "1px",
            height: "25%",
            top: "25%",
            left: "50%",
            opacity: 0.3,
          }}
        />
      </div>
    ),
  },

  // Шаблоны с 5 экранами - вариант 3 (средний на всю ширину, верхний и нижний ряды по 2 экрана)
  {
    id: "split-custom-5-3-portrait",
    split: "custom",
    screens: 5,
    resizable: true,
    render: () => (
      <div className="relative h-full w-full">
        {/* Верхний левый экран */}
        <div
          className="absolute top-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "50%",
            height: "33.33%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          1
        </div>

        {/* Верхний правый экран */}
        <div
          className="absolute top-0 right-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "50%",
            height: "33.33%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          2
        </div>

        {/* Средний экран на всю ширину */}
        <div
          className="absolute right-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            height: "33.33%",
            top: "33.33%",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          3
        </div>

        {/* Нижний левый экран */}
        <div
          className="absolute bottom-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "50%",
            height: "33.33%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          4
        </div>

        {/* Нижний правый экран */}
        <div
          className="absolute right-0 bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "50%",
            height: "33.33%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          5
        </div>

        {/* Горизонтальные линии разделения */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "100%",
            height: "1px",
            top: "33.33%",
            left: "0",
            opacity: 0.3,
          }}
        />
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "100%",
            height: "1px",
            top: "66.66%",
            left: "0",
            opacity: 0.3,
          }}
        />

        {/* Вертикальные линии разделения */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "1px",
            height: "33.33%",
            top: "0",
            left: "50%",
            opacity: 0.3,
          }}
        />
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "1px",
            height: "33.33%",
            bottom: "0",
            left: "50%",
            opacity: 0.3,
          }}
        />
      </div>
    ),
  },

  // Шаблон с 6 экранами (3x2) - альтернативный вариант
  {
    id: "split-grid-2x3-alt-portrait",
    split: "custom",
    screens: 6,
    resizable: true,
    render: () => (
      <div className="relative h-full w-full">
        {/* Верхний левый экран */}
        <div
          className="absolute top-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "33.33%",
            height: "50%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          1
        </div>

        {/* Верхний средний экран */}
        <div
          className="absolute top-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "33.33%",
            height: "50%",
            left: "33.33%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          2
        </div>

        {/* Верхний правый экран */}
        <div
          className="absolute top-0 right-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "33.33%",
            height: "50%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          3
        </div>

        {/* Нижний левый экран */}
        <div
          className="absolute bottom-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "33.33%",
            height: "50%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          4
        </div>

        {/* Нижний средний экран */}
        <div
          className="absolute bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "33.33%",
            height: "50%",
            left: "33.33%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          5
        </div>

        {/* Нижний правый экран */}
        <div
          className="absolute right-0 bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "33.33%",
            height: "50%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          6
        </div>

        {/* Горизонтальная линия разделения */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "100%",
            height: "1px",
            top: "50%",
            left: "0",
            opacity: 0.3,
          }}
        />

        {/* Вертикальная линия разделения 1 */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "1px",
            height: "100%",
            top: "0",
            left: "33.33%",
            opacity: 0.3,
          }}
        />

        {/* Вертикальная линия разделения 2 */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "1px",
            height: "100%",
            top: "0",
            left: "66.66%",
            opacity: 0.3,
          }}
        />
      </div>
    ),
  },

  // Шаблон с 10 экранами (2x5) для вертикального формата
  {
    id: "split-grid-2x5-portrait",
    split: "custom",
    screens: 10,
    resizable: true,
    render: () => (
      <div className="relative h-full w-full">
        {/* Левый столбец */}
        {/* Левый первый экран */}
        <div
          className="absolute top-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "50%",
            height: "20%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          1
        </div>

        {/* Левый второй экран */}
        <div
          className="absolute left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "50%",
            height: "20%",
            top: "20%",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          3
        </div>

        {/* Левый третий экран */}
        <div
          className="absolute left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "50%",
            height: "20%",
            top: "40%",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          5
        </div>

        {/* Левый четвертый экран */}
        <div
          className="absolute left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "50%",
            height: "20%",
            top: "60%",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          7
        </div>

        {/* Левый пятый экран */}
        <div
          className="absolute bottom-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "50%",
            height: "20%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          9
        </div>

        {/* Правый столбец */}
        {/* Правый первый экран */}
        <div
          className="absolute top-0 right-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "50%",
            height: "20%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          2
        </div>

        {/* Правый второй экран */}
        <div
          className="absolute right-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "50%",
            height: "20%",
            top: "20%",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          4
        </div>

        {/* Правый третий экран */}
        <div
          className="absolute right-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "50%",
            height: "20%",
            top: "40%",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          6
        </div>

        {/* Правый четвертый экран */}
        <div
          className="absolute right-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "50%",
            height: "20%",
            top: "60%",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          8
        </div>

        {/* Правый пятый экран */}
        <div
          className="absolute right-0 bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "50%",
            height: "20%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          10
        </div>

        {/* Вертикальная линия разделения */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "1px",
            height: "100%",
            top: "0",
            left: "50%",
            opacity: 0.3,
          }}
        />

        {/* Горизонтальные линии разделения */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "100%",
            height: "1px",
            top: "20%",
            left: "0",
            opacity: 0.3,
          }}
        />
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "100%",
            height: "1px",
            top: "40%",
            left: "0",
            opacity: 0.3,
          }}
        />
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "100%",
            height: "1px",
            top: "60%",
            left: "0",
            opacity: 0.3,
          }}
        />
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "100%",
            height: "1px",
            top: "80%",
            left: "0",
            opacity: 0.3,
          }}
        />
      </div>
    ),
  },

  // Шаблон с 12 экранами (3x4) для вертикального формата
  {
    id: "split-grid-3x4-portrait",
    split: "custom",
    screens: 12,
    resizable: true,
    render: () => (
      <div className="relative h-full w-full">
        <div className="grid h-full w-full grid-cols-3 grid-rows-4">
          {Array.from({ length: 12 }).map((_, index) => {
            const row = Math.floor(index / 3)
            const col = index % 3
            const isEven = (row + col) % 2 === 0

            return (
              <div
                key={`grid-cell-${index}`}
                className="flex items-center justify-center text-sm font-normal text-gray-400"
                style={{
                  background: isEven ? "#23262b" : "#2a2e36",
                  borderTop: row === 0 ? "1px solid rgba(156, 163, 175, 0.3)" : "none",
                  borderBottom: row === 3 ? "1px solid rgba(156, 163, 175, 0.3)" : "none",
                  borderLeft: col === 0 ? "1px solid rgba(156, 163, 175, 0.3)" : "none",
                  borderRight: col === 2 ? "1px solid rgba(156, 163, 175, 0.3)" : "none",
                }}
              >
                {index + 1}
              </div>
            )
          })}
        </div>

        {/* Вертикальные линии */}
        {[1, 2].map((i) => (
          <div
            key={`v-line-${i}`}
            className="absolute inset-y-0 z-10 bg-gray-400"
            style={{
              width: "1px",
              left: `${i * 33.33}%`,
              opacity: 0.3,
            }}
          />
        ))}

        {/* Горизонтальные линии */}
        {[1, 2, 3].map((i) => (
          <div
            key={`h-line-${i}`}
            className="absolute inset-x-0 z-10 bg-gray-400"
            style={{
              height: "1px",
              top: `${i * 25}%`,
              opacity: 0.3,
            }}
          />
        ))}
      </div>
    ),
  },

  // Шаблон с 12 экранами (4x3)
  {
    id: "split-grid-4x3-portrait",
    split: "custom",
    screens: 12,
    resizable: true,
    render: () => (
      <div className="relative h-full w-full">
        <div className="grid h-full w-full grid-cols-4 grid-rows-3">
          {Array.from({ length: 12 }).map((_, index) => {
            const row = Math.floor(index / 4)
            const col = index % 4
            const isEven = (row + col) % 2 === 0

            return (
              <div
                key={`grid-cell-${index}`}
                className="flex items-center justify-center text-sm font-normal text-gray-400"
                style={{
                  background: isEven ? "#23262b" : "#2a2e36",
                  borderTop: row === 0 ? "1px solid rgba(156, 163, 175, 0.3)" : "none",
                  borderBottom: row === 2 ? "1px solid rgba(156, 163, 175, 0.3)" : "none",
                  borderLeft: col === 0 ? "1px solid rgba(156, 163, 175, 0.3)" : "none",
                  borderRight: col === 3 ? "1px solid rgba(156, 163, 175, 0.3)" : "none",
                }}
              >
                {index + 1}
              </div>
            )
          })}
        </div>

        {/* Вертикальные линии */}
        {[1, 2, 3].map((i) => (
          <div
            key={`v-line-${i}`}
            className="absolute inset-y-0 z-10 bg-gray-400"
            style={{
              width: "1px",
              left: `${i * 25}%`,
              opacity: 0.3,
            }}
          />
        ))}

        {/* Горизонтальные линии */}
        {[1, 2].map((i) => (
          <div
            key={`h-line-${i}`}
            className="absolute inset-x-0 z-10 bg-gray-400"
            style={{
              height: "1px",
              top: `${i * 33.33}%`,
              opacity: 0.3,
            }}
          />
        ))}
      </div>
    ),
  },

  // Шаблон с 8 экранами (2x4)
  {
    id: "split-grid-2x4-portrait",
    split: "custom",
    screens: 8,
    resizable: true,
    render: () => (
      <div className="relative h-full w-full">
        <div className="grid h-full w-full grid-cols-2 grid-rows-4">
          {Array.from({ length: 8 }).map((_, index) => {
            const row = Math.floor(index / 2)
            const col = index % 2
            const isEven = (row + col) % 2 === 0

            return (
              <div
                key={`grid-cell-${index}`}
                className="flex items-center justify-center text-lg font-normal text-gray-400"
                style={{
                  background: isEven ? "#23262b" : "#2a2e36",
                  borderTop: row === 0 ? "1px solid rgba(156, 163, 175, 0.3)" : "none",
                  borderBottom: row === 3 ? "1px solid rgba(156, 163, 175, 0.3)" : "none",
                  borderLeft: col === 0 ? "1px solid rgba(156, 163, 175, 0.3)" : "none",
                  borderRight: col === 1 ? "1px solid rgba(156, 163, 175, 0.3)" : "none",
                }}
              >
                {index + 1}
              </div>
            )
          })}
        </div>

        {/* Вертикальная линия */}
        <div
          className="absolute inset-y-0 z-10 bg-gray-400"
          style={{
            width: "1px",
            left: "50%",
            opacity: 0.3,
          }}
        />

        {/* Горизонтальные линии */}
        {[1, 2, 3].map((i) => (
          <div
            key={`h-line-${i}`}
            className="absolute inset-x-0 z-10 bg-gray-400"
            style={{
              height: "1px",
              top: `${i * 25}%`,
              opacity: 0.3,
            }}
          />
        ))}
      </div>
    ),
  },
  {
    id: "split-1-3-portrait",
    split: "custom",
    screens: 4,
    resizable: true,
    render: () => (
      <div className="relative h-full w-full">
        {/* Верхняя большая секция */}
        <div
          className="absolute top-0 right-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            height: "50%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          1
        </div>

        {/* Горизонтальная линия разделения */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "100%",
            height: "1px",
            top: "50%",
            left: "0",
            opacity: 0.3,
          }}
        />

        {/* Нижняя левая секция */}
        <div
          className="absolute bottom-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "33.33%",
            height: "50%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          2
        </div>

        {/* Вертикальная линия разделения 1 */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "1px",
            height: "50%",
            top: "50%",
            left: "33.33%",
            opacity: 0.3,
          }}
        />

        {/* Нижняя средняя секция */}
        <div
          className="absolute bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "33.33%",
            height: "50%",
            left: "33.33%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          3
        </div>

        {/* Вертикальная линия разделения 2 */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "1px",
            height: "50%",
            top: "50%",
            left: "66.66%",
            opacity: 0.3,
          }}
        />

        {/* Нижняя правая секция */}
        <div
          className="absolute right-0 bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "33.33%",
            height: "50%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          4
        </div>
      </div>
    ),
  },
  {
    id: "split-3-1-portrait",
    split: "custom",
    screens: 4,
    resizable: true,
    render: () => (
      <div className="relative h-full w-full">
        {/* Левая верхняя секция */}
        <div
          className="absolute top-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "50%",
            height: "33.33%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          1
        </div>

        {/* Горизонтальная линия разделения 1 */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "50%",
            height: "1px",
            top: "33.33%",
            left: "0",
            opacity: 0.3,
          }}
        />

        {/* Левая средняя секция */}
        <div
          className="absolute left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "50%",
            height: "33.33%",
            top: "33.33%",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          2
        </div>

        {/* Горизонтальная линия разделения 2 */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "50%",
            height: "1px",
            top: "66.66%",
            left: "0",
            opacity: 0.3,
          }}
        />

        {/* Левая нижняя секция */}
        <div
          className="absolute bottom-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "50%",
            height: "33.33%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          3
        </div>

        {/* Вертикальная линия разделения */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "1px",
            height: "100%",
            top: "0",
            left: "50%",
            opacity: 0.3,
          }}
        />

        {/* Правая секция */}
        <div
          className="absolute top-0 right-0 bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "50%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          4
        </div>
      </div>
    ),
  },

  // 3 слева + 1 справа
  {
    id: "split-3-1-right-portrait",
    split: "custom",
    screens: 4,
    resizable: true,
    render: () => (
      <div className="relative h-full w-full">
        {/* Левая секция */}
        <div
          className="absolute top-0 bottom-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "50%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          4
        </div>

        {/* Вертикальная линия разделения */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "1px",
            height: "100%",
            top: "0",
            left: "50%",
            opacity: 0.3,
          }}
        />

        {/* Правая верхняя секция */}
        <div
          className="absolute top-0 right-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "50%",
            height: "33.33%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          1
        </div>

        {/* Горизонтальная линия разделения 1 */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "50%",
            height: "1px",
            top: "33.33%",
            right: "0",
            opacity: 0.3,
          }}
        />

        {/* Правая средняя секция */}
        <div
          className="absolute right-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "50%",
            height: "33.33%",
            top: "33.33%",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          2
        </div>

        {/* Горизонтальная линия разделения 2 */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "50%",
            height: "1px",
            top: "66.66%",
            right: "0",
            opacity: 0.3,
          }}
        />

        {/* Правая нижняя секция */}
        <div
          className="absolute right-0 bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "50%",
            height: "33.33%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          3
        </div>
      </div>
    ),
  },
  {
    id: "split-1-3-bottom-portrait",
    split: "custom",
    screens: 4,
    resizable: true,
    render: () => (
      <div className="relative h-full w-full">
        {/* Нижняя большая секция */}
        <div
          className="absolute right-0 bottom-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            height: "50%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          4
        </div>

        {/* Горизонтальная линия разделения */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "100%",
            height: "1px",
            top: "50%",
            left: "0",
            opacity: 0.3,
          }}
        />

        {/* Верхняя левая секция */}
        <div
          className="absolute top-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "33.33%",
            height: "50%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          1
        </div>

        {/* Вертикальная линия разделения 1 */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "1px",
            height: "50%",
            top: "0",
            left: "33.33%",
            opacity: 0.3,
          }}
        />

        {/* Верхняя средняя секция */}
        <div
          className="absolute top-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "33.33%",
            height: "50%",
            left: "33.33%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          2
        </div>

        {/* Вертикальная линия разделения 2 */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "1px",
            height: "50%",
            top: "0",
            left: "66.66%",
            opacity: 0.3,
          }}
        />

        {/* Верхняя правая секция */}
        <div
          className="absolute top-0 right-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "33.33%",
            height: "50%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          3
        </div>
      </div>
    ),
  },
  // Шаблон с 9 экранами (3x3) для вертикального формата
  {
    id: "split-grid-3x3-portrait",
    split: "custom",
    screens: 9,
    resizable: true,
    render: () => (
      <div className="relative h-full w-full">
        <div className="grid h-full w-full grid-cols-3 grid-rows-3">
          {Array.from({ length: 9 }).map((_, index) => {
            const row = Math.floor(index / 3)
            const col = index % 3
            const isEven = (row + col) % 2 === 0

            return (
              <div
                key={`grid-cell-${index}`}
                className="flex items-center justify-center text-lg font-normal text-gray-400"
                style={{
                  background: isEven ? "#23262b" : "#2a2e36",
                  borderTop: row === 0 ? "1px solid rgba(156, 163, 175, 0.3)" : "none",
                  borderBottom: row === 2 ? "1px solid rgba(156, 163, 175, 0.3)" : "none",
                  borderLeft: col === 0 ? "1px solid rgba(156, 163, 175, 0.3)" : "none",
                  borderRight: col === 2 ? "1px solid rgba(156, 163, 175, 0.3)" : "none",
                }}
              >
                {index + 1}
              </div>
            )
          })}
        </div>

        {/* Вертикальные линии */}
        {[1, 2].map((i) => (
          <div
            key={`v-line-${i}`}
            className="absolute inset-y-0 z-10 bg-gray-400"
            style={{
              width: "1px",
              left: `${i * 33.33}%`,
              opacity: 0.3,
            }}
          />
        ))}

        {/* Горизонтальные линии */}
        {[1, 2].map((i) => (
          <div
            key={`h-line-${i}`}
            className="absolute inset-x-0 z-10 bg-gray-400"
            style={{
              height: "1px",
              top: `${i * 33.33}%`,
              opacity: 0.3,
            }}
          />
        ))}
      </div>
    ),
  },

  // Шаблон с 16 экранами (4x4) для вертикального формата
  {
    id: "split-grid-4x4-portrait",
    split: "custom",
    screens: 16,
    resizable: true,
    render: () => (
      <div className="relative h-full w-full">
        <div className="grid h-full w-full grid-cols-4 grid-rows-4">
          {Array.from({ length: 16 }).map((_, index) => {
            const row = Math.floor(index / 4)
            const col = index % 4
            const isEven = (row + col) % 2 === 0

            return (
              <div
                key={`grid-cell-${index}`}
                className="flex items-center justify-center text-sm font-normal text-gray-400"
                style={{
                  background: isEven ? "#23262b" : "#2a2e36",
                  borderTop: row === 0 ? "1px solid rgba(156, 163, 175, 0.3)" : "none",
                  borderBottom: row === 3 ? "1px solid rgba(156, 163, 175, 0.3)" : "none",
                  borderLeft: col === 0 ? "1px solid rgba(156, 163, 175, 0.3)" : "none",
                  borderRight: col === 3 ? "1px solid rgba(156, 163, 175, 0.3)" : "none",
                }}
              >
                {index + 1}
              </div>
            )
          })}
        </div>

        {/* Вертикальные линии */}
        {[1, 2, 3].map((i) => (
          <div
            key={`v-line-${i}`}
            className="absolute inset-y-0 z-10 bg-gray-400"
            style={{
              width: "1px",
              left: `${i * 25}%`,
              opacity: 0.3,
            }}
          />
        ))}

        {/* Горизонтальные линии */}
        {[1, 2, 3].map((i) => (
          <div
            key={`h-line-${i}`}
            className="absolute inset-x-0 z-10 bg-gray-400"
            style={{
              height: "1px",
              top: `${i * 25}%`,
              opacity: 0.3,
            }}
          />
        ))}
      </div>
    ),
  },

  // Шаблон с 25 экранами (5x5) для портретного формата
  {
    id: "split-grid-5x5-portrait",
    split: "custom",
    screens: 25,
    resizable: true,
    render: () => (
      <div className="relative h-full w-full">
        {/* Создаем сетку 5x5 */}
        {Array.from({ length: 5 }).map((_i, rowIndex) => (
          <div key={`row-${rowIndex}`}>
            {Array.from({ length: 5 }).map((_, colIndex) => {
              const cellIndex = rowIndex * 5 + colIndex + 1
              const isEvenCell = (rowIndex + colIndex) % 2 === 0
              return (
                <div
                  key={`cell-${rowIndex}-${colIndex}`}
                  className="absolute flex items-center justify-center text-xs font-normal text-gray-400"
                  style={{
                    background: isEvenCell ? "#23262b" : "#2a2e36",
                    width: "20%",
                    height: "20%",
                    top: `${rowIndex * 20}%`,
                    left: `${colIndex * 20}%`,
                    borderTop: rowIndex === 0 ? "1px solid rgba(156, 163, 175, 0.3)" : "none",
                    borderBottom: rowIndex === 4 ? "1px solid rgba(156, 163, 175, 0.3)" : "none",
                    borderLeft: colIndex === 0 ? "1px solid rgba(156, 163, 175, 0.3)" : "none",
                    borderRight: colIndex === 4 ? "1px solid rgba(156, 163, 175, 0.3)" : "none",
                  }}
                >
                  {cellIndex}
                </div>
              )
            })}
          </div>
        ))}

        {/* Горизонтальные линии разделения */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={`h-line-${i}`}
            className="absolute z-10 bg-gray-400"
            style={{
              width: "100%",
              height: "1px",
              top: `${(i + 1) * 20}%`,
              left: "0",
              opacity: 0.3,
            }}
          />
        ))}

        {/* Вертикальные линии разделения */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={`v-line-${i}`}
            className="absolute z-10 bg-gray-400"
            style={{
              width: "1px",
              height: "100%",
              top: "0",
              left: `${(i + 1) * 20}%`,
              opacity: 0.3,
            }}
          />
        ))}
      </div>
    ),
  },
]
