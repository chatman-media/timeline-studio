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
      <div className="flex h-full w-full" data-oid="6gwf.2-">
        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="vf6rka4"
        >
          1
        </div>
        <div className="h-full w-px bg-gray-400" style={{ opacity: 0.3 }} data-oid="t2drhri" />
        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="jb8_55x"
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
      <div className="flex h-full w-full flex-col" data-oid="rwdduz2">
        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="furb3qf"
        >
          1
        </div>
        <div className="h-px w-full bg-gray-400" style={{ opacity: 0.3 }} data-oid="y-_9n.p" />
        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="uka6grs"
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
      <div className="relative h-full w-full" data-oid="coxdyd8">
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
          data-oid="txnl:fo"
        >
          <div style={{ position: "relative", top: "-25%" }} data-oid="o7vswwl">
            1
          </div>
        </div>

        {/* Линия разделения */}
        <div
          className="absolute inset-0 z-10 bg-gray-400"
          style={{
            clipPath: "polygon(0 39.8%, 0 40.2%, 100% 60.2%, 100% 59.8%)",
            opacity: 0.3,
          }}
          data-oid="e1vpix."
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
          data-oid="9u5rzrj"
        >
          <div style={{ position: "relative", top: "25%" }} data-oid="tefbhfl">
            2
          </div>
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
      <div className="relative h-full w-full" data-oid="ix8ap0h">
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
          data-oid="lg6v4oh"
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
          data-oid="it-pr:j"
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
          data-oid="kgtp:nc"
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
          data-oid="addxguo"
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
          data-oid="n57hc58"
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
      <div className="relative h-full w-full" data-oid="yn4nu.u">
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
          data-oid="-2ysqd5"
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
          data-oid="w3jg9i_"
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
          data-oid="gkguvyv"
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
          data-oid="qa88rzv"
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
          data-oid="muwn4-8"
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
      <div className="flex h-full w-full" data-oid="vhirj5.">
        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="qdi7qnn"
        >
          1
        </div>
        <div className="h-full w-px bg-gray-400" style={{ opacity: 0.3 }} data-oid="1pk5v_y" />
        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="6q8s_lj"
        >
          2
        </div>
        <div className="h-full w-px bg-gray-400" style={{ opacity: 0.3 }} data-oid="4tw0_95" />
        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="n4d9a.5"
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
      <div className="flex h-full w-full flex-col" data-oid="73t1_fi">
        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="eic9uf9"
        >
          1
        </div>
        <div className="h-px w-full bg-gray-400" style={{ opacity: 0.3 }} data-oid="65p88fx" />
        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="-.ujhwc"
        >
          2
        </div>
        <div className="h-px w-full bg-gray-400" style={{ opacity: 0.3 }} data-oid="1.-85o-" />
        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="x8r88kt"
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
      <div className="relative h-full w-full" data-oid="80dzbza">
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
          data-oid="ds2f4:_"
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
          data-oid="f5sok36"
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
          data-oid="id.np_."
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
          data-oid="3ac_mhy"
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
          data-oid="9zjy_44"
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
          data-oid="r4dxsfa"
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
      <div className="flex h-full w-full flex-col" data-oid="3oxonwr">
        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            height: "25%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid=":claakk"
        >
          1
        </div>
        <div className="h-px w-full bg-gray-400" style={{ opacity: 0.3 }} data-oid="m5hy16-" />
        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            height: "25%",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="u_rzbj7"
        >
          2
        </div>
        <div className="h-px w-full bg-gray-400" style={{ opacity: 0.3 }} data-oid="o49a:bx" />
        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            height: "25%",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="cb5quna"
        >
          3
        </div>
        <div className="h-px w-full bg-gray-400" style={{ opacity: 0.3 }} data-oid=".vbmn_s" />
        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            height: "25%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="uy7escz"
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
      <div className="relative h-full w-full" data-oid="utu24kn">
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
          data-oid="j6zqi5."
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
          data-oid="_zqvgr-"
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
          data-oid="_0tg5u3"
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
          data-oid="tlzhcyr"
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
          data-oid="kqrecn:"
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
          data-oid="b:ev9go"
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
          data-oid="4of2rsc"
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
          data-oid="h2w9lp_"
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
          data-oid="m1s335l"
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
      <div className="relative h-full w-full" data-oid="2ydg4zd">
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
          data-oid="n245dum"
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
          data-oid="7adbdgv"
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
          data-oid="xp.ya8r"
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
          data-oid="r_-3r0x"
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
          data-oid="30u4mj3"
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
          data-oid="-pa55w6"
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
          data-oid="oz-8fpp"
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
          data-oid="cu0ysy."
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
          data-oid="bc-9qe7"
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
      <div className="relative h-full w-full" data-oid=":mb:g8-">
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
          data-oid="fxbtcgc"
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
          data-oid="csar14o"
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
          data-oid="vct.ynb"
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
          data-oid="i2.j:h3"
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
          data-oid="p_yuhbi"
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
          data-oid="a7q2-8:"
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
          data-oid="-d.w:5."
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
          data-oid="ildhr62"
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
          data-oid="51dpln:"
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
      <div className="relative h-full w-full" data-oid=".km0o_v">
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
          data-oid="cwbwx::"
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
          data-oid="nuz1vjz"
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
          data-oid="g:2hydo"
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
          data-oid="v.9y06_"
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
          data-oid="rvbc-_7"
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
          data-oid="mzb.k6h"
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
          data-oid="yu-rkg2"
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
          data-oid="o.2fdki"
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
          data-oid="_ce976q"
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
      <div className="relative h-full w-full" data-oid="g7vk6cw">
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
          data-oid="89r4.80"
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
          data-oid="no3m0bu"
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
          data-oid="u6ghgot"
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
          data-oid="j4axhxj"
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
          data-oid="-7latdk"
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
          data-oid="jml.j7x"
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
          data-oid="ch125ng"
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
          data-oid="w_ip-cq"
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
          data-oid="i_5wu27"
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
      <div className="relative h-full w-full" data-oid="4-jeml-">
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
          data-oid="j8hebqa"
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
          data-oid="k:x2pmp"
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
          data-oid="ox4dlbc"
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
          data-oid="c7jq-99"
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
          data-oid="dljf5dy"
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
          data-oid="no:_rcc"
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
          data-oid="7jes3e0"
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
          data-oid="7lvp.9s"
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
          data-oid="agy2u5."
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
          data-oid="7luqcwu"
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
          data-oid="hm36kl7"
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
          data-oid=":c92eci"
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
          data-oid="dh03s5o"
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
          data-oid="98som.p"
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
          data-oid="qxzstz6"
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
      <div className="relative h-full w-full" data-oid="e-j5wwb">
        <div className="grid h-full w-full grid-cols-3 grid-rows-4" data-oid="gk-ealn">
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
                data-oid="9t98ov9"
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
            data-oid="8l.jbic"
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
            data-oid="2v:ow53"
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
      <div className="relative h-full w-full" data-oid="8asilfp">
        <div className="grid h-full w-full grid-cols-4 grid-rows-3" data-oid="lnykw6.">
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
                data-oid="ythlk7r"
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
            data-oid="rv5dkjz"
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
            data-oid="nzeej-b"
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
      <div className="relative h-full w-full" data-oid="9i3-i:u">
        <div className="grid h-full w-full grid-cols-2 grid-rows-4" data-oid="55uy0zw">
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
                data-oid="23o_mhw"
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
          data-oid="mqhyjgv"
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
            data-oid="juq43t0"
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
      <div className="relative h-full w-full" data-oid="h8_fbg4">
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
          data-oid="8w3q9cq"
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
          data-oid="8awtng3"
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
          data-oid="iwq.og6"
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
          data-oid="7gvs:sw"
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
          data-oid="ikws6nj"
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
          data-oid="2mn2nma"
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
          data-oid=".rdrjnd"
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
      <div className="relative h-full w-full" data-oid="-wze2.6">
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
          data-oid="eb0rf-k"
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
          data-oid="9v_8stf"
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
          data-oid="96m4oa8"
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
          data-oid="r_l.ebh"
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
          data-oid="jbz7rk2"
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
          data-oid="61lgd9y"
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
          data-oid="zb73q09"
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
      <div className="relative h-full w-full" data-oid=":xwx4w1">
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
          data-oid="f631vsx"
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
          data-oid="_-5tlv4"
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
          data-oid="arbwozg"
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
          data-oid="_hxpg2y"
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
          data-oid="h629iou"
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
          data-oid="gsgqv3t"
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
          data-oid="b8mbi97"
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
      <div className="relative h-full w-full" data-oid="rk74uh.">
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
          data-oid="crtzlg:"
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
          data-oid=":0dg70c"
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
          data-oid="x5dq41a"
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
          data-oid="yr9xbk2"
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
          data-oid="-1sei_c"
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
          data-oid="de7spbq"
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
          data-oid="qf6fupe"
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
      <div className="relative h-full w-full" data-oid="z304yaa">
        <div className="grid h-full w-full grid-cols-3 grid-rows-3" data-oid="jfutxa.">
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
                data-oid="qkl_dq8"
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
            data-oid="equxwkh"
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
            data-oid="w7rkm2d"
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
      <div className="relative h-full w-full" data-oid="l7w:qxo">
        <div className="grid h-full w-full grid-cols-4 grid-rows-4" data-oid="n4v3fds">
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
                data-oid="q6_yty6"
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
            data-oid="j:ulv-h"
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
            data-oid="cj_4xlr"
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
      <div className="relative h-full w-full" data-oid="lv_oief">
        {/* Создаем сетку 5x5 */}
        {Array.from({ length: 5 }).map((_i, rowIndex) => (
          <div key={`row-${rowIndex}`} data-oid="rfvyxo6">
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
                  data-oid="f39zec3"
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
            data-oid="hakqtzq"
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
            data-oid="4qejpmm"
          />
        ))}
      </div>
    ),
  },
]
