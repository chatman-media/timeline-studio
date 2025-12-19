import type { MediaTemplate } from "../../lib/templates"

export const landscapeTemplates: MediaTemplate[] = [
  // Шаблоны с 2 экранами (с возможностью изменения размеров)
  {
    id: "split-vertical-landscape",
    split: "vertical",
    resizable: true,
    screens: 2,
    splitPosition: 50, // Позиция разделения в процентах (50% - посередине),
    render: () => (
      <div className="flex h-full w-full" data-oid="988x1y4">
        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="_h947:e"
        >
          1
        </div>
        <div className="h-full w-px bg-gray-600" data-oid="yfyggbo" />
        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="ucpyob4"
        >
          2
        </div>
      </div>
    ),
  },
  {
    id: "split-horizontal-landscape",
    split: "horizontal",
    resizable: true,
    screens: 2,
    splitPosition: 50, // Позиция разделения в процентах (50% - посередине)
    render: () => (
      <div className="flex h-full w-full flex-col" data-oid="ycdw57d">
        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            height: "50%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="cwwax49"
        >
          1
        </div>
        <div className="h-px w-full bg-gray-600" data-oid="tpk0exi" />
        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            height: "50%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="h6gukx:"
        >
          2
        </div>
      </div>
    ),
  },
  // Диагональное разделение
  {
    id: "split-diagonal-landscape",
    split: "diagonal",
    resizable: true,
    screens: 2,
    splitPoints: [
      { x: 66.67, y: 0 }, // Начальная точка (2/3 от левого края, верх)
      { x: 33.33, y: 100 }, // Конечная точка (1/3 от левого края, низ)
    ],
    render: () => (
      <div className="relative h-full w-full" data-oid="lvn:i7n">
        {/* Первый экран (левый) */}
        <div
          className="absolute inset-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            clipPath: "polygon(0 0, 66.67% 0, 33.33% 100%, 0 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="mrqmxhd"
        >
          <div style={{ position: "relative", left: "-15%" }} data-oid="p0h61vn">
            1
          </div>
        </div>

        {/* Линия разделения */}
        <div
          className="absolute inset-0 z-10 bg-gray-400"
          style={{
            clipPath: "polygon(66.47% 0, 66.87% 0, 33.53% 100%, 33.13% 100%)",
            opacity: 0.8,
          }}
          data-oid="u6hp2:j"
        />

        {/* Второй экран (правый) */}
        <div
          className="absolute inset-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            clipPath: "polygon(66.67% 0, 100% 0, 100% 100%, 33.33% 100%)",
            border: "1px solid rgba(156, 163, 175, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          data-oid="q5y700h"
        >
          <div style={{ position: "relative", left: "30%" }} data-oid="5v5nd1b">
            2
          </div>
        </div>
      </div>
    ),
  },
  // Шаблон с горизонтальным разделением сверху и вертикальным снизу
  {
    id: "split-mixed-1-landscape",
    split: "custom",
    resizable: true,
    screens: 3,
    render: () => (
      <div className="relative h-full w-full" data-oid="wee4rcd">
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
          data-oid="j_nltwd"
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
          data-oid="7nayilj"
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
          data-oid="yuu7am7"
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
          data-oid="wgr:vcz"
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
          data-oid="1ra0vf_"
        >
          3
        </div>
      </div>
    ),
  },

  // Шаблон с вертикальным разделением слева и двумя секциями справа
  {
    id: "split-mixed-2-landscape",
    split: "custom",
    resizable: true,
    screens: 3,
    render: () => (
      <div className="relative h-full w-full" data-oid="3avau50">
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
          data-oid="x8x890v"
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
          data-oid="xqwsarj"
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
          data-oid="39ukqpf"
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
          data-oid="w8c-x.f"
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
          data-oid="d8p2npf"
        >
          3
        </div>
      </div>
    ),
  },

  // Шаблоны с 3 экранами
  {
    id: "split-vertical-3-landscape",
    split: "vertical",
    resizable: true,
    screens: 3,
    render: () => (
      <div className="flex h-full w-full" data-oid="8:0_z.m">
        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="kx79eeu"
        >
          1
        </div>
        <div className="h-full w-px bg-gray-400" style={{ opacity: 0.3 }} data-oid="2-d-7qu" />

        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="pnxe5gi"
        >
          2
        </div>
        <div className="h-full w-px bg-gray-400" style={{ opacity: 0.3 }} data-oid="u0a2zz3" />

        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="hysx_v4"
        >
          3
        </div>
      </div>
    ),
  },
  {
    id: "split-horizontal-3-landscape",
    split: "horizontal",
    resizable: true,
    screens: 3,
    render: () => (
      <div className="flex h-full w-full flex-col" data-oid="0fj_my5">
        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            width: "100%",
            height: "33.33%",
            background: "#23262b",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="d-npwgb"
        >
          1
        </div>
        <div className="h-px w-full bg-gray-400" style={{ opacity: 0.3 }} data-oid="sf2p9rw" />

        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            height: "33.33%",
            background: "#2a2e36",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="-712qo2"
        >
          2
        </div>
        <div className="h-px w-full bg-gray-400" style={{ opacity: 0.3 }} data-oid="y9j-sj6" />

        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            height: "33.33%",
            background: "#23262b",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="-ka.ck-"
        >
          3
        </div>
      </div>
    ),
  },

  // Шаблоны с 4 экранами
  {
    id: "split-grid-2x2-landscape",
    split: "grid",
    resizable: true,
    screens: 4,
    render: () => (
      <div className="relative h-full w-full" data-oid="hr1d:g.">
        <div className="grid h-full w-full grid-cols-2 grid-rows-2" data-oid="pj_hk7e">
          {Array.from({ length: 4 }).map((_, index) => {
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
                  borderBottom: row === 1 ? "1px solid rgba(156, 163, 175, 0.3)" : "none",
                  borderLeft: col === 0 ? "1px solid rgba(156, 163, 175, 0.3)" : "none",
                  borderRight: col === 1 ? "1px solid rgba(156, 163, 175, 0.3)" : "none",
                }}
                data-oid="okw_dkb"
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
          data-oid="vzbave-"
        />

        {/* Горизонтальная линия */}
        <div
          className="absolute inset-x-0 z-10 bg-gray-400"
          style={{
            height: "1px",
            top: "50%",
            opacity: 0.3,
          }}
          data-oid=":4irrf9"
        />
      </div>
    ),
  },
  {
    id: "split-vertical-4-landscape",
    split: "vertical",
    resizable: true,
    screens: 4,
    render: () => (
      <div className="flex h-full w-full" data-oid="_5glo_b">
        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="crkm-a1"
        >
          1
        </div>
        <div className="h-full w-px bg-gray-400" style={{ opacity: 0.3 }} data-oid="7kodkvv" />

        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid=".mcsya3"
        >
          2
        </div>
        <div className="h-full w-px bg-gray-400" style={{ opacity: 0.3 }} data-oid="lwglkp-" />

        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="2zd0_-o"
        >
          3
        </div>
        <div className="h-full w-px bg-gray-400" style={{ opacity: 0.3 }} data-oid="faw0kfj" />

        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid=".yposp4"
        >
          4
        </div>
      </div>
    ),
  },

  // Шаблоны с 5 экранами - вариант 1 (1 большой слева, 4 маленьких справа)
  {
    id: "split-custom-5-1-landscape",
    split: "custom",
    resizable: true,
    screens: 5,
    render: () => (
      <div className="relative h-full w-full" data-oid="exdt1w8">
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
          data-oid="qj.jat2"
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
          data-oid="f98o0xc"
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
          data-oid="5b.nu36"
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
          data-oid="nd-k56l"
        />

        {/* Нижняя правая секция - верхняя левая */}
        <div
          className="absolute flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "25%",
            height: "25%",
            top: "50%",
            left: "50%",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="9gz_waj"
        >
          3
        </div>

        {/* Нижняя правая секция - верхняя правая */}
        <div
          className="absolute flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "25%",
            height: "25%",
            top: "50%",
            left: "75%",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="kfxlcy2"
        >
          4
        </div>

        {/* Вертикальная линия разделения в нижней правой секции */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "1px",
            height: "25%",
            top: "50%",
            left: "75%",
            opacity: 0.3,
          }}
          data-oid="fww9r9u"
        />

        {/* Горизонтальная линия разделения в нижней правой секции */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "50%",
            height: "1px",
            top: "75%",
            right: "0",
            opacity: 0.3,
          }}
          data-oid="9m1m8l3"
        />

        {/* Нижняя правая секция - нижняя */}
        <div
          className="absolute right-0 bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "50%",
            height: "25%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="_h1bt.8"
        >
          5
        </div>
      </div>
    ),
  },

  // Шаблоны с 5 экранами - вариант 2 (4 маленьких слева, 1 большой справа)
  {
    id: "split-custom-5-2-landscape",
    split: "custom",
    resizable: true,
    screens: 5,
    render: () => (
      <div className="relative h-full w-full" data-oid="qjc9njh">
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
          data-oid="pfpykph"
        >
          5
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
          data-oid="3haw2ca"
        />

        {/* Верхняя левая секция */}
        <div
          className="absolute top-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "50%",
            height: "50%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="7flvr2r"
        >
          1
        </div>

        {/* Горизонтальная линия разделения */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "50%",
            height: "1px",
            top: "50%",
            left: "0",
            opacity: 0.3,
          }}
          data-oid="ygs9_-v"
        />

        {/* Нижняя левая секция - верхняя левая */}
        <div
          className="absolute flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "25%",
            height: "25%",
            top: "50%",
            left: "0",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="g3zvzwo"
        >
          2
        </div>

        {/* Нижняя левая секция - верхняя правая */}
        <div
          className="absolute flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "25%",
            height: "25%",
            top: "50%",
            left: "25%",
          }}
          data-oid="31ula2d"
        >
          3
        </div>

        {/* Вертикальная линия разделения в нижней левой секции */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "1px",
            height: "25%",
            top: "50%",
            left: "25%",
            opacity: 0.3,
          }}
          data-oid="oohil_5"
        />

        {/* Горизонтальная линия разделения в нижней левой секции */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "50%",
            height: "1px",
            top: "75%",
            left: "0",
            opacity: 0.3,
          }}
          data-oid="oijtt93"
        />

        {/* Нижняя левая секция - нижняя */}
        <div
          className="absolute bottom-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "50%",
            height: "25%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="28pyodk"
        >
          4
        </div>
      </div>
    ),
  },

  // Шаблоны с 5 экранами - вариант 3 (средний на всю ширину, верхний и нижний ряды по 2 экрана)
  {
    id: "split-custom-5-3-landscape",
    split: "custom",
    resizable: true,
    screens: 5,
    render: () => (
      <div className="relative h-full w-full" data-oid=":inpb1i">
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
          data-oid="m3bh.0r"
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
          data-oid="av_-dnv"
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
          data-oid="8osqk9e"
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
          data-oid="v:4b-gj"
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
          data-oid="3umld6j"
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
          data-oid="wl9vf0s"
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
          data-oid="nom8x4z"
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
          data-oid="p3bwgrw"
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
          data-oid="k9xveii"
        />
      </div>
    ),
  },
  {
    id: "split-1-3-landscape",
    split: "custom",
    resizable: true,
    screens: 4,
    render: () => (
      <div className="relative h-full w-full" data-oid="ato21rs">
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
          data-oid="nudi-p6"
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
          data-oid="h1lvl89"
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
          data-oid="-2ox1zr"
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
          data-oid="5zc_7q-"
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
          data-oid="7q07b9-"
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
          data-oid="sl.vuds"
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
          data-oid="37zon.x"
        >
          4
        </div>
      </div>
    ),
  },
  // 3 слева + 1 справа
  {
    id: "split-3-1-right-landscape",
    split: "custom",
    resizable: true,
    screens: 4,
    render: () => (
      <div className="relative h-full w-full" data-oid="pbq80c4">
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
          data-oid="rsmbu1k"
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
          data-oid="hrda.na"
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
          data-oid="-7oe6u."
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
          data-oid=".8kkggs"
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
          data-oid="zpw2h.s"
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
          data-oid="48snvs3"
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
          data-oid="ehwily6"
        >
          3
        </div>
      </div>
    ),
  },
  {
    id: "split-1-3-bottom-landscape",
    split: "custom",
    resizable: true,
    screens: 4,
    render: () => (
      <div className="relative h-full w-full" data-oid="l75ttj6">
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
          data-oid="nlezpd-"
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
          data-oid="x_7w7vh"
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
          data-oid="a0e72di"
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
          data-oid="y0020zs"
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
          data-oid="2:limzp"
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
          data-oid="pdv8hd_"
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
          data-oid="uz31cz_"
        >
          4
        </div>
      </div>
    ),
  },

  {
    id: "split-3-1-landscape",
    split: "custom",
    resizable: true,
    screens: 4,
    render: () => (
      <div className="relative h-full w-full" data-oid="h06uvqj">
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
          data-oid="zv67-lv"
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
          data-oid="ez39ip8"
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
          data-oid="5wtf5bc"
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
          data-oid="c3kyod:"
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
          data-oid=":9ohc6d"
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
          data-oid="7v1lrt1"
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
          data-oid="t9s6rmx"
        >
          4
        </div>
      </div>
    ),
  },

  // Шаблон с 6 экранами (3x2)
  {
    id: "split-grid-3x2-landscape",
    split: "grid",
    resizable: true,
    screens: 6,
    render: () => (
      <div className="relative h-full w-full" data-oid="62r0r53">
        <div className="grid h-full w-full grid-cols-3 grid-rows-2" data-oid=".2q8dh.">
          {Array.from({ length: 6 }).map((_, index) => {
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
                  borderBottom: row === 1 ? "1px solid rgba(156, 163, 175, 0.3)" : "none",
                  borderLeft: col === 0 ? "1px solid rgba(156, 163, 175, 0.3)" : "none",
                  borderRight: col === 2 ? "1px solid rgba(156, 163, 175, 0.3)" : "none",
                }}
                data-oid="qbs83pv"
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
            data-oid="td-f1d9"
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
          data-oid="d8dvxij"
        />
      </div>
    ),
  },

  // Шаблон с 9 экранами (3x3)
  {
    id: "split-grid-3x3-landscape",
    split: "grid",
    resizable: true,
    screens: 9,
    render: () => (
      <div className="relative h-full w-full" data-oid="2huc1j-">
        <div className="grid h-full w-full grid-cols-3 grid-rows-3" data-oid="tw8mlmd">
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
                data-oid="ywa_iqp"
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
            data-oid="h5ysa9n"
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
            data-oid="ruqfk:l"
          />
        ))}
      </div>
    ),
  },

  // Шаблон с 10 экранами (5x2) для широкоэкранного формата
  {
    id: "split-grid-5x2-landscape",
    split: "grid",
    resizable: true,
    screens: 10,
    render: () => (
      <div className="relative h-full w-full" data-oid=":nv-0tr">
        {/* Верхний ряд */}
        {/* Верхний первый экран */}
        <div
          className="absolute top-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "20%",
            height: "50%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="_ywvwgc"
        >
          1
        </div>

        {/* Верхний второй экран */}
        <div
          className="absolute top-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "20%",
            height: "50%",
            left: "20%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="7chm62l"
        >
          2
        </div>

        {/* Верхний третий экран */}
        <div
          className="absolute top-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "20%",
            height: "50%",
            left: "40%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="-.2o_mj"
        >
          3
        </div>

        {/* Верхний четвертый экран */}
        <div
          className="absolute top-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "20%",
            height: "50%",
            left: "60%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="zh222nu"
        >
          4
        </div>

        {/* Верхний пятый экран */}
        <div
          className="absolute top-0 right-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "20%",
            height: "50%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="62oyqag"
        >
          5
        </div>

        {/* Нижний ряд */}
        {/* Нижний первый экран */}
        <div
          className="absolute bottom-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "20%",
            height: "50%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="_j_u7dk"
        >
          6
        </div>

        {/* Нижний второй экран */}
        <div
          className="absolute bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "20%",
            height: "50%",
            left: "20%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="8cpbj1o"
        >
          7
        </div>

        {/* Нижний третий экран */}
        <div
          className="absolute bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "20%",
            height: "50%",
            left: "40%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="ehh_8oa"
        >
          8
        </div>

        {/* Нижний четвертый экран */}
        <div
          className="absolute bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "20%",
            height: "50%",
            left: "60%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="o_qc2qr"
        >
          9
        </div>

        {/* Нижний пятый экран */}
        <div
          className="absolute right-0 bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "20%",
            height: "50%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="qovh87c"
        >
          10
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
          data-oid="ifop9a9"
        />

        {/* Вертикальные линии разделения */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "1px",
            height: "100%",
            top: "0",
            left: "20%",
            opacity: 0.3,
          }}
          data-oid="-.t3qyw"
        />

        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "1px",
            height: "100%",
            top: "0",
            left: "40%",
            opacity: 0.3,
          }}
          data-oid="ypszqc-"
        />

        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "1px",
            height: "100%",
            top: "0",
            left: "60%",
            opacity: 0.3,
          }}
          data-oid="781kmtm"
        />

        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "1px",
            height: "100%",
            top: "0",
            left: "80%",
            opacity: 0.3,
          }}
          data-oid="qtq6qv1"
        />
      </div>
    ),
  },

  // Шаблон с 12 экранами (4x3) для широкоэкранного формата
  {
    id: "split-grid-4x3-landscape",
    split: "grid",
    resizable: true,
    screens: 12,
    render: () => (
      <div className="relative h-full w-full" data-oid=":f-2dsx">
        <div className="grid h-full w-full grid-cols-4 grid-rows-3" data-oid="x8zl-rv">
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
                data-oid="97damhy"
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
            data-oid="r6y7rf_"
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
            data-oid="kdfm2ll"
          />
        ))}
      </div>
    ),
  },

  // Шаблон с 12 экранами (3x4) для широкоэкранного формата
  {
    id: "split-grid-3x4-landscape",
    split: "grid",
    resizable: true,
    screens: 12,
    render: () => (
      <div className="relative h-full w-full" data-oid="h.pt0n8">
        <div className="grid h-full w-full grid-cols-3 grid-rows-4" data-oid="_q-fxuq">
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
                data-oid="jsh33wd"
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
            data-oid="9eojk7x"
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
            data-oid="c_g.lno"
          />
        ))}
      </div>
    ),
  },

  // Шаблон с 25 экранами (5x5) для широкоэкранного формата
  {
    id: "split-grid-5x5-landscape",
    split: "grid",
    resizable: true,
    screens: 25,
    render: () => (
      <div className="relative h-full w-full" data-oid="0orf9rz">
        {/* Создаем сетку 5x5 */}
        {Array.from({ length: 25 }).map((_, index) => {
          const rowIndex = Math.floor(index / 5)
          const colIndex = index % 5
          const cellIndex = index + 1
          const isEvenCell = (rowIndex + colIndex) % 2 === 0
          return (
            <div
              key={`cell-${rowIndex}-${colIndex}`}
              className="absolute flex items-center justify-center text-sm font-normal text-gray-400"
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
              data-oid="gex37i7"
            >
              {cellIndex}
            </div>
          )
        })}

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
            data-oid="mob_y19"
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
            data-oid="bdwg9-8"
          />
        ))}
      </div>
    ),
  },

  // Шаблон с 16 экранами (4x4) для широкоэкранного формата
  {
    id: "split-grid-4x4-landscape",
    split: "grid",
    resizable: true,
    screens: 16,
    render: () => (
      <div className="relative h-full w-full" data-oid="54gju70">
        <div className="grid h-full w-full grid-cols-4 grid-rows-4" data-oid="sr7nil5">
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
                data-oid="ibrl35d"
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
            data-oid="cqhvggu"
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
            data-oid="jnq8hxz"
          />
        ))}
      </div>
    ),
  },

  // Шаблон с 8 экранами (4x2)
  {
    id: "split-grid-4x2-landscape",
    split: "custom",
    resizable: true,
    screens: 8,
    render: () => (
      <div className="relative h-full w-full" data-oid="ynmsc:y">
        {/* Верхний ряд */}
        {/* Верхний первый экран */}
        <div
          className="absolute top-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "25%",
            height: "50%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid=".iawcg8"
        >
          1
        </div>

        {/* Верхний второй экран */}
        <div
          className="absolute top-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "25%",
            height: "50%",
            left: "25%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="4qs55xr"
        >
          2
        </div>

        {/* Верхний третий экран */}
        <div
          className="absolute top-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "25%",
            height: "50%",
            left: "50%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="0o:1tgd"
        >
          3
        </div>

        {/* Верхний четвертый экран */}
        <div
          className="absolute top-0 right-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "25%",
            height: "50%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="ovn.y:n"
        >
          4
        </div>

        {/* Нижний ряд */}
        {/* Нижний первый экран */}
        <div
          className="absolute bottom-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "25%",
            height: "50%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="avuy-41"
        >
          5
        </div>

        {/* Нижний второй экран */}
        <div
          className="absolute bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "25%",
            height: "50%",
            left: "25%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="papgp0p"
        >
          6
        </div>

        {/* Нижний третий экран */}
        <div
          className="absolute bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "25%",
            height: "50%",
            left: "50%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="l3hla45"
        >
          7
        </div>

        {/* Нижний четвертый экран */}
        <div
          className="absolute right-0 bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "25%",
            height: "50%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="ss4qv_k"
        >
          8
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
          data-oid="ps8zeig"
        />

        {/* Вертикальная линия разделения 1 */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "1px",
            height: "100%",
            top: "0",
            left: "25%",
            opacity: 0.3,
          }}
          data-oid="ovm4948"
        />

        {/* Вертикальная линия разделения 2 */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "1px",
            height: "100%",
            top: "0",
            left: "50%",
            opacity: 0.3,
          }}
          data-oid=".rlnezl"
        />

        {/* Вертикальная линия разделения 3 */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "1px",
            height: "100%",
            top: "0",
            left: "75%",
            opacity: 0.3,
          }}
          data-oid="yinzgub"
        />
      </div>
    ),
  },
]
