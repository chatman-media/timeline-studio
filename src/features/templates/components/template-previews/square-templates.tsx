import type { MediaTemplate } from "../../lib/templates"

export const squareTemplates: MediaTemplate[] = [
  // Шаблоны с 2 экранами
  {
    id: "split-vertical-square",
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
    id: "split-horizontal-square",
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
  // Диагональное разделение (горизонтальная ось)
  {
    id: "split-diagonal-square",
    split: "diagonal",
    screens: 2,
    resizable: true,
    splitPoints: [
      { x: 0, y: 35 }, // Начальная точка (левый край, 35% от верха)
      { x: 100, y: 65 }, // Конечная точка (правый край, 65% от верха)
    ],
    render: () => (
      <div className="relative h-full w-full">
        {/* Первый экран (верхний) */}
        <div
          className="absolute inset-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            clipPath: "polygon(0 0, 100% 0, 100% 65%, 0 35%)",
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
            clipPath: "polygon(0 34.8%, 0 35.2%, 100% 65.2%, 100% 64.8%)",
            opacity: 0.3,
          }}
        />

        {/* Второй экран (нижний) */}
        <div
          className="absolute inset-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            clipPath: "polygon(0 35%, 100% 65%, 100% 100%, 0 100%)",
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
  // Диагональное разделение (вертикальная ось)
  {
    id: "split-diagonal-vertical-square",
    split: "diagonal",
    screens: 2,
    resizable: true,
    splitPoints: [
      { x: 65, y: 0 }, // Начальная точка (65% от левого края, верх)
      { x: 35, y: 100 }, // Конечная точка (35% от левого края, низ)
    ],
    render: () => (
      <div className="relative h-full w-full">
        {/* Первый экран (левый) */}
        <div
          className="absolute inset-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            clipPath: "polygon(0 0, 65% 0, 35% 100%, 0 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          <div style={{ position: "relative", left: "-25%" }}>1</div>
        </div>

        {/* Линия разделения */}
        <div
          className="absolute inset-0 z-10 bg-gray-400"
          style={{
            clipPath: "polygon(64.8% 0, 65.2% 0, 35.2% 100%, 34.8% 100%)",
            opacity: 0.3,
          }}
        />

        {/* Второй экран (правый) */}
        <div
          className="absolute inset-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            clipPath: "polygon(65% 0, 100% 0, 100% 100%, 35% 100%)",
            border: "1px solid rgba(156, 163, 175, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ position: "relative", left: "25%" }}>2</div>
        </div>
      </div>
    ),
  },
  // Сетка 2x2
  {
    id: "split-grid-2x2-square",
    split: "grid",
    screens: 4,
    resizable: true,
    splitPoints: [
      { x: 50, y: 0 }, // Верхняя точка
      { x: 50, y: 100 }, // Нижняя точка
      { x: 0, y: 50 }, // Левая точка
      { x: 100, y: 50 }, // Правая точка
    ],
    render: () => (
      <div className="relative h-full w-full">
        {/* Верхний левый экран */}
        <div
          className="absolute inset-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            clipPath: "polygon(0 0, 50% 0, 50% 50%, 0 50%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          <div style={{ position: "relative", left: "-25%", top: "-25%" }}>1</div>
        </div>

        {/* Верхний правый экран */}
        <div
          className="absolute inset-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            clipPath: "polygon(50% 0, 100% 0, 100% 50%, 50% 50%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          <div style={{ position: "relative", left: "25%", top: "-25%" }}>2</div>
        </div>

        {/* Нижний левый экран */}
        <div
          className="absolute inset-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            clipPath: "polygon(0 50%, 50% 50%, 50% 100%, 0 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          <div style={{ position: "relative", left: "-25%", top: "25%" }}>3</div>
        </div>

        {/* Нижний правый экран */}
        <div
          className="absolute inset-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            clipPath: "polygon(50% 50%, 100% 50%, 100% 100%, 50% 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          <div style={{ position: "relative", left: "25%", top: "25%" }}>4</div>
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
  // Шаблон с горизонтальным разделением сверху и вертикальным снизу
  {
    id: "split-mixed-1-square",
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
    id: "split-mixed-2-square",
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
    id: "split-vertical-3-square",
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
    id: "split-horizontal-3-square",
    split: "horizontal",
    screens: 3,
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
    id: "split-vertical-4-square",
    split: "vertical",
    screens: 4,
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
          }}
        >
          3
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
          4
        </div>
      </div>
    ),
  },
  {
    id: "split-horizontal-4-square",
    split: "horizontal",
    screens: 4,
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
  {
    id: "split-1-3-square",
    split: "custom",
    screens: 4,
    resizable: true,
    render: () => (
      <div className="relative h-full w-full">
        {/* Левая большая секция */}
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
            height: "33.33%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          2
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

        {/* Средняя правая секция */}
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
          3
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

        {/* Нижняя правая секция */}
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
          4
        </div>
      </div>
    ),
  },
  {
    id: "split-3-1-square",
    split: "custom",
    screens: 4,
    resizable: true,
    render: () => (
      <div className="relative h-full w-full">
        {/* Верхняя левая секция */}
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
            background: "#2a2e36",
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
            background: "#23262b",
            width: "33.33%",
            height: "50%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          3
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

        {/* Нижняя секция */}
        <div
          className="absolute right-0 bottom-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            height: "50%",
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

  // 3 слева + 1 справа
  {
    id: "split-3-1-right-square",
    split: "custom",
    screens: 4,
    resizable: true,
    render: () => (
      <div className="relative h-full w-full">
        {/* Правая большая секция */}
        <div
          className="absolute top-0 right-0 bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "50%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
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

        {/* Верхняя левая секция */}
        <div
          className="absolute top-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
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

        {/* Средняя левая секция */}
        <div
          className="absolute left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
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

        {/* Нижняя левая секция */}
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
          3
        </div>
      </div>
    ),
  },
  {
    id: "split-1-3-bottom-square",
    split: "custom",
    screens: 4,
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

  // Шаблоны с 7 экранами - вариант 1 (1 большой экран справа внизу, 6 маленьких экранов слева и сверху)
  {
    id: "split-custom-7-1-square",
    split: "custom",
    screens: 7,
    resizable: true,
    render: () => (
      <div className="relative h-full w-full">
        {/* Большой экран (правый нижний) */}
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

        {/* Верхний левый экран */}
        <div
          className="absolute top-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
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
            background: "#23262b",
            width: "50%",
            height: "50%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          2
        </div>

        {/* Нижний левый верхний экран */}
        <div
          className="absolute left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "25%",
            height: "25%",
            top: "50%",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          5
        </div>

        {/* Нижний левый нижний экран */}
        <div
          className="absolute bottom-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "25%",
            height: "25%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          4
        </div>

        {/* Нижний левый средний экран */}
        <div
          className="absolute flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "25%",
            height: "25%",
            top: "50%",
            left: "25%",
          }}
        >
          6
        </div>

        {/* Нижний левый нижний средний экран */}
        <div
          className="absolute flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "25%",
            height: "25%",
            top: "75%",
            left: "25%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          7
        </div>

        {/* Горизонтальные линии разделения */}
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
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "50%",
            height: "1px",
            top: "75%",
            left: "0",
            opacity: 0.3,
          }}
        />

        {/* Вертикальные линии разделения */}
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
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "1px",
            height: "50%",
            top: "50%",
            left: "25%",
            opacity: 0.3,
          }}
        />
      </div>
    ),
  },

  // Шаблоны с 7 экранами - вариант 2 (1 большой экран слева внизу, 6 маленьких экранов справа и сверху)
  {
    id: "split-custom-7-2-square",
    split: "custom",
    screens: 7,
    resizable: true,
    render: () => (
      <div className="relative h-full w-full">
        {/* Большой экран (левый нижний) */}
        <div
          className="absolute bottom-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "50%",
            height: "50%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          3
        </div>

        {/* Верхний левый экран */}
        <div
          className="absolute top-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
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
            background: "#23262b",
            width: "50%",
            height: "50%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          2
        </div>

        {/* Нижний правый верхний экран */}
        <div
          className="absolute right-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "25%",
            height: "25%",
            top: "50%",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          5
        </div>

        {/* Нижний правый нижний экран */}
        <div
          className="absolute right-0 bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "25%",
            height: "25%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          4
        </div>

        {/* Нижний правый средний экран */}
        <div
          className="absolute flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "25%",
            height: "25%",
            top: "50%",
            right: "25%",
          }}
        >
          6
        </div>

        {/* Нижний правый нижний средний экран */}
        <div
          className="absolute flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "25%",
            height: "25%",
            top: "75%",
            right: "25%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          7
        </div>

        {/* Горизонтальные линии разделения */}
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
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "50%",
            height: "1px",
            top: "75%",
            right: "0",
            opacity: 0.3,
          }}
        />

        {/* Вертикальные линии разделения */}
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
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "1px",
            height: "50%",
            top: "50%",
            right: "25%",
            opacity: 0.3,
          }}
        />
      </div>
    ),
  },

  // Шаблоны с 7 экранами - вариант 3 (1 большой экран слева вверху, 6 маленьких экранов справа и снизу)
  {
    id: "split-custom-7-3-square",
    split: "custom",
    screens: 7,
    resizable: true,
    render: () => (
      <div className="relative h-full w-full">
        {/* Большой экран (левый верхний) */}
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
          3
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
          1
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
          2
        </div>

        {/* Верхний правый верхний экран */}
        <div
          className="absolute right-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "25%",
            height: "25%",
            top: "0%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          5
        </div>

        {/* Верхний правый нижний экран */}
        <div
          className="absolute right-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "25%",
            height: "25%",
            top: "25%",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          4
        </div>

        {/* Верхний правый средний экран */}
        <div
          className="absolute flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "25%",
            height: "25%",
            top: "0%",
            right: "25%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          6
        </div>

        {/* Верхний правый нижний средний экран */}
        <div
          className="absolute flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "25%",
            height: "25%",
            top: "25%",
            right: "25%",
          }}
        >
          7
        </div>

        {/* Горизонтальные линии разделения */}
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
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "50%",
            height: "1px",
            top: "25%",
            right: "0",
            opacity: 0.3,
          }}
        />

        {/* Вертикальные линии разделения */}
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
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "1px",
            height: "50%",
            top: "0%",
            right: "25%",
            opacity: 0.3,
          }}
        />
      </div>
    ),
  },

  // Шаблоны с 7 экранами - вариант 4 (1 большой экран справа вверху, 6 маленьких экранов слева и снизу)
  {
    id: "split-custom-7-4-square",
    split: "custom",
    screens: 7,
    resizable: true,
    render: () => (
      <div className="relative h-full w-full">
        {/* Большой экран (правый верхний) */}
        <div
          className="absolute top-0 right-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "50%",
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
            width: "50%",
            height: "50%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          1
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
          2
        </div>

        {/* Верхний левый верхний экран */}
        <div
          className="absolute left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "25%",
            height: "25%",
            top: "0%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          5
        </div>

        {/* Верхний левый нижний экран */}
        <div
          className="absolute left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "25%",
            height: "25%",
            top: "25%",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          4
        </div>

        {/* Верхний левый средний экран */}
        <div
          className="absolute flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "25%",
            height: "25%",
            top: "0%",
            left: "25%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          6
        </div>

        {/* Верхний левый нижний средний экран */}
        <div
          className="absolute flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "25%",
            height: "25%",
            top: "25%",
            left: "25%",
          }}
        >
          7
        </div>

        {/* Горизонтальные линии разделения */}
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
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "50%",
            height: "1px",
            top: "25%",
            left: "0",
            opacity: 0.3,
          }}
        />

        {/* Вертикальные линии разделения */}
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
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "1px",
            height: "50%",
            top: "0%",
            left: "25%",
            opacity: 0.3,
          }}
        />
      </div>
    ),
  },

  // Шаблоны с 5 экранами - вариант 3 (средний на всю ширину, верхний и нижний ряды по 2 экрана)
  {
    id: "split-custom-5-3-square",
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

  // Шаблоны с 5 экранами - вариант 4 (средняя колонка на всю высоту, левая и правая колонки по 2 экрана)
  {
    id: "split-custom-5-4-square",
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
            width: "33.33%",
            height: "50%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          1
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
          2
        </div>

        {/* Средний экран на всю высоту */}
        <div
          className="absolute top-0 bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "33.33%",
            left: "33.33%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          3
        </div>

        {/* Верхний правый экран */}
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
          4
        </div>

        {/* Нижний правый экран */}
        <div
          className="absolute right-0 bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "33.33%",
            height: "50%",
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
            width: "33.33%",
            height: "1px",
            top: "50%",
            left: "0",
            opacity: 0.3,
          }}
        />
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "33.33%",
            height: "1px",
            top: "50%",
            right: "0",
            opacity: 0.3,
          }}
        />

        {/* Вертикальные линии разделения */}
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

  // Шаблон с 6 экранами (3x2) - вариант 1
  {
    id: "split-grid-3x2-square",
    split: "grid",
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

  // Шаблон с 6 экранами (2x3) - вариант 2
  {
    id: "split-grid-2x3-square",
    split: "grid",
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

  // Шаблон с 9 экранами (3x3)
  {
    id: "split-grid-3x3-square",
    split: "grid",
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

  // Шаблон с 10 экранами (5x2)
  {
    id: "split-grid-5x2-square",
    split: "grid",
    screens: 10,
    resizable: true,
    render: () => (
      <div className="relative h-full w-full">
        <div className="grid h-full w-full grid-cols-5 grid-rows-2">
          {Array.from({ length: 10 }).map((_, index) => {
            const row = Math.floor(index / 5)
            const col = index % 5
            const isEven = (row + col) % 2 === 0

            return (
              <div
                key={`grid-cell-${index}`}
                className="flex items-center justify-center text-sm font-normal text-gray-400"
                style={{
                  background: isEven ? "#23262b" : "#2a2e36",
                  borderTop: row === 0 ? "1px solid rgba(156, 163, 175, 0.3)" : "none",
                  borderBottom: row === 1 ? "1px solid rgba(156, 163, 175, 0.3)" : "none",
                  borderLeft: col === 0 ? "1px solid rgba(156, 163, 175, 0.3)" : "none",
                  borderRight: col === 4 ? "1px solid rgba(156, 163, 175, 0.3)" : "none",
                }}
              >
                {index + 1}
              </div>
            )
          })}
        </div>

        {/* Вертикальные линии */}
        {[1, 2, 3, 4].map((i) => (
          <div
            key={`v-line-${i}`}
            className="absolute inset-y-0 z-10 bg-gray-400"
            style={{
              width: "1px",
              left: `${i * 20}%`,
              opacity: 0.3,
            }}
          />
        ))}

        {/* Горизонтальная линия */}
        <div
          className="absolute inset-x-0 z-10 bg-gray-400"
          style={{
            height: "1px",
            top: "50%",
            opacity: 0.3,
          }}
        />
      </div>
    ),
  },

  // Шаблон с 10 экранами (2x5)
  {
    id: "split-grid-2x5-square",
    split: "grid",
    screens: 10,
    resizable: true,
    render: () => (
      <div className="relative h-full w-full">
        <div className="grid h-full w-full grid-cols-2 grid-rows-5">
          {Array.from({ length: 10 }).map((_, index) => {
            const row = Math.floor(index / 2)
            const col = index % 2
            const isEven = (row + col) % 2 === 0

            return (
              <div
                key={`grid-cell-${index}`}
                className="flex items-center justify-center text-sm font-normal text-gray-400"
                style={{
                  background: isEven ? "#23262b" : "#2a2e36",
                  borderTop: row === 0 ? "1px solid rgba(156, 163, 175, 0.3)" : "none",
                  borderBottom: row === 4 ? "1px solid rgba(156, 163, 175, 0.3)" : "none",
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
        {[1, 2, 3, 4].map((i) => (
          <div
            key={`h-line-${i}`}
            className="absolute inset-x-0 z-10 bg-gray-400"
            style={{
              height: "1px",
              top: `${i * 20}%`,
              opacity: 0.3,
            }}
          />
        ))}
      </div>
    ),
  },

  // Шаблон с 12 экранами (4x3)
  {
    id: "split-grid-4x3-square",
    split: "grid",
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

  // Шаблон с 12 экранами (3x4)
  {
    id: "split-grid-3x4-square",
    split: "grid",
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

  // Шаблон с 16 экранами (4x4)
  {
    id: "split-grid-4x4-square",
    split: "grid",
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

  // Шаблон "Сетка 5x5" (25 экранов)
  {
    id: "split-grid-5x5-square",
    split: "grid",
    screens: 25,
    resizable: true,
    render: () => (
      <div className="relative h-full w-full">
        <div className="grid h-full w-full grid-cols-5 grid-rows-5">
          {Array.from({ length: 25 }).map((_, index) => {
            const row = Math.floor(index / 5)
            const col = index % 5
            const isEven = (row + col) % 2 === 0

            return (
              <div
                key={`grid-cell-${index}`}
                className="flex items-center justify-center text-sm font-normal text-gray-400"
                style={{
                  background: isEven ? "#23262b" : "#2a2e36",
                  borderTop: row === 0 ? "1px solid rgba(156, 163, 175, 0.3)" : "none",
                  borderBottom: row === 4 ? "1px solid rgba(156, 163, 175, 0.3)" : "none",
                  borderLeft: col === 0 ? "1px solid rgba(156, 163, 175, 0.3)" : "none",
                  borderRight: col === 4 ? "1px solid rgba(156, 163, 175, 0.3)" : "none",
                }}
              >
                {index + 1}
              </div>
            )
          })}
        </div>

        {/* Вертикальные линии */}
        {[1, 2, 3, 4].map((i) => (
          <div
            key={`v-line-${i}`}
            className="absolute inset-y-0 z-10 bg-gray-400"
            style={{
              width: "1px",
              left: `${i * 20}%`,
              opacity: 0.3,
            }}
          />
        ))}

        {/* Горизонтальные линии */}
        {[1, 2, 3, 4].map((i) => (
          <div
            key={`h-line-${i}`}
            className="absolute inset-x-0 z-10 bg-gray-400"
            style={{
              height: "1px",
              top: `${i * 20}%`,
              opacity: 0.3,
            }}
          />
        ))}
      </div>
    ),
  },
  // Шаблон с 8 экранами (2x4)
  {
    id: "split-grid-2x4-square",
    split: "grid",
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
                className="flex items-center justify-center text-sm font-normal text-gray-400"
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

  // Шаблон с 8 экранами (4x2)
  {
    id: "split-grid-4x2-square",
    split: "grid",
    screens: 8,
    resizable: true,
    render: () => (
      <div className="relative h-full w-full">
        <div className="grid h-full w-full grid-cols-4 grid-rows-2">
          {Array.from({ length: 8 }).map((_, index) => {
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
                  borderBottom: row === 1 ? "1px solid rgba(156, 163, 175, 0.3)" : "none",
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

        {/* Горизонтальная линия */}
        <div
          className="absolute inset-x-0 z-10 bg-gray-400"
          style={{
            height: "1px",
            top: "50%",
            opacity: 0.3,
          }}
        />
      </div>
    ),
  },
]
