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
      <div className="flex h-full w-full" data-oid="7kcjqhr">
        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="-rnpbki"
        >
          1
        </div>
        <div className="h-full w-px bg-gray-400" style={{ opacity: 0.3 }} data-oid="4657my_" />
        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="8z7as7v"
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
      <div className="flex h-full w-full flex-col" data-oid="6hv3h6e">
        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="-2mryvy"
        >
          1
        </div>
        <div className="h-px w-full bg-gray-400" style={{ opacity: 0.3 }} data-oid="y0769fk" />
        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid=":_:pg7b"
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
      <div className="relative h-full w-full" data-oid="h8vxwoc">
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
          data-oid="q4-jadm"
        >
          <div style={{ position: "relative", top: "-25%" }} data-oid="g9lpx8t">
            1
          </div>
        </div>

        {/* Линия разделения */}
        <div
          className="absolute inset-0 z-10 bg-gray-400"
          style={{
            clipPath: "polygon(0 34.8%, 0 35.2%, 100% 65.2%, 100% 64.8%)",
            opacity: 0.3,
          }}
          data-oid="f9uhm46"
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
          data-oid="tdph2ge"
        >
          <div style={{ position: "relative", top: "25%" }} data-oid="h6dl3v2">
            2
          </div>
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
      <div className="relative h-full w-full" data-oid="dkxnr0l">
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
          data-oid="azb5j-i"
        >
          <div style={{ position: "relative", left: "-25%" }} data-oid="59qlsuk">
            1
          </div>
        </div>

        {/* Линия разделения */}
        <div
          className="absolute inset-0 z-10 bg-gray-400"
          style={{
            clipPath: "polygon(64.8% 0, 65.2% 0, 35.2% 100%, 34.8% 100%)",
            opacity: 0.3,
          }}
          data-oid="iqw7nyc"
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
          data-oid="49puczp"
        >
          <div style={{ position: "relative", left: "25%" }} data-oid="b7w.hyg">
            2
          </div>
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
      <div className="relative h-full w-full" data-oid="v93hcgi">
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
          data-oid="o7f36do"
        >
          <div style={{ position: "relative", left: "-25%", top: "-25%" }} data-oid="7w07ssx">
            1
          </div>
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
          data-oid="ng-20ub"
        >
          <div style={{ position: "relative", left: "25%", top: "-25%" }} data-oid="3hw51i5">
            2
          </div>
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
          data-oid="75x-a-g"
        >
          <div style={{ position: "relative", left: "-25%", top: "25%" }} data-oid="zhcq_r2">
            3
          </div>
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
          data-oid="k89v83i"
        >
          <div style={{ position: "relative", left: "25%", top: "25%" }} data-oid="tug3073">
            4
          </div>
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
          data-oid="s2sm8d2"
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
          data-oid="5e9tsde"
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
      <div className="relative h-full w-full" data-oid="ac8xzjr">
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
          data-oid="nxu3xee"
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
          data-oid="5cs6_vj"
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
          data-oid="0:drubk"
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
          data-oid="-z:szxt"
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
          data-oid="fiy1fd9"
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
      <div className="relative h-full w-full" data-oid="apdjlpf">
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
          data-oid=".a35-79"
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
          data-oid=".3m1kp4"
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
          data-oid="m.75zap"
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
          data-oid="w78t40w"
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
          data-oid="03bz40h"
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
      <div className="flex h-full w-full" data-oid="cbivxma">
        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="nubelvh"
        >
          1
        </div>
        <div className="h-full w-px bg-gray-400" style={{ opacity: 0.3 }} data-oid="6a.jyp-" />
        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="nq5j2o4"
        >
          2
        </div>
        <div className="h-full w-px bg-gray-400" style={{ opacity: 0.3 }} data-oid="qzbm95c" />
        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid=".gdkugm"
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
      <div className="flex h-full w-full flex-col" data-oid="hiy45bc">
        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="pw5981:"
        >
          1
        </div>
        <div className="h-px w-full bg-gray-400" style={{ opacity: 0.3 }} data-oid="pkxvc31" />
        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="kjq3ixo"
        >
          2
        </div>
        <div className="h-px w-full bg-gray-400" style={{ opacity: 0.3 }} data-oid="4n_:4w0" />
        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="ve69i9v"
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
      <div className="flex h-full w-full" data-oid="a136:l2">
        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="rmcmwe-"
        >
          1
        </div>
        <div className="h-full w-px bg-gray-400" style={{ opacity: 0.3 }} data-oid="vi2qy-b" />
        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="fyli62z"
        >
          2
        </div>
        <div className="h-full w-px bg-gray-400" style={{ opacity: 0.3 }} data-oid="ssj8eym" />
        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="6.0oyj1"
        >
          3
        </div>
        <div className="h-full w-px bg-gray-400" style={{ opacity: 0.3 }} data-oid="uh8zwab" />
        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid=":2e2_x_"
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
      <div className="flex h-full w-full flex-col" data-oid="246kftl">
        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            height: "25%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="lm:da9c"
        >
          1
        </div>
        <div className="h-px w-full bg-gray-400" style={{ opacity: 0.3 }} data-oid="4hc_ry1" />
        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            height: "25%",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="l.m.in1"
        >
          2
        </div>
        <div className="h-px w-full bg-gray-400" style={{ opacity: 0.3 }} data-oid="em2tkgp" />
        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            height: "25%",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="4ba.xs2"
        >
          3
        </div>
        <div className="h-px w-full bg-gray-400" style={{ opacity: 0.3 }} data-oid="x8bemr2" />
        <div
          className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            height: "25%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
          data-oid="u7.-12t"
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
      <div className="relative h-full w-full" data-oid="p_pey2k">
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
          data-oid="efc2hw."
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
          data-oid=":yka7-n"
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
          data-oid="a6:vag1"
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
          data-oid="ng.ujiz"
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
          data-oid="p1lpfwr"
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
          data-oid="zoja-.d"
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
          data-oid="ak0l:7l"
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
      <div className="relative h-full w-full" data-oid=".f1xe4c">
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
          data-oid="gzhtmiu"
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
          data-oid="v1tbi3u"
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
          data-oid="jxqeq:n"
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
          data-oid="tb3.mww"
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
          data-oid="5-9c3c-"
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
          data-oid="0w2cu8l"
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
          data-oid="ugj4f62"
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
      <div className="relative h-full w-full" data-oid="fcuisin">
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
          data-oid="4qcwwc5"
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
          data-oid="imr_55e"
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
          data-oid="wym1pj-"
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
          data-oid="7s_120b"
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
          data-oid="jcbw56g"
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
          data-oid="z-mhw4p"
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
          data-oid="j9i5bxb"
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
      <div className="relative h-full w-full" data-oid="tt:s7c8">
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
          data-oid="jx52_t9"
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
          data-oid="a.lk1yh"
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
          data-oid="zdgh627"
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
          data-oid="v86ewk1"
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
          data-oid="pw:46ix"
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
          data-oid="3g99hn3"
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
          data-oid="ov4igu2"
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
      <div className="relative h-full w-full" data-oid="9u5duz_">
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
          data-oid="_p9macc"
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
          data-oid="4xdjzca"
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
          data-oid="_2di3bc"
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
          data-oid="_.qy_ti"
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
          data-oid="iykb_10"
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
          data-oid="a3xwt.y"
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
          data-oid="4j0q_i1"
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
          data-oid="m:.ur56"
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
          data-oid="mw534-d"
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
          data-oid="hic7z__"
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
          data-oid="s4rkmhr"
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
      <div className="relative h-full w-full" data-oid="iu0uz.6">
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
          data-oid="cxzmfbv"
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
          data-oid="teuo2l0"
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
          data-oid="v3szqw:"
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
          data-oid="kdfevj_"
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
          data-oid="ggrb36f"
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
          data-oid="hhw6f58"
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
          data-oid="hp.s1cf"
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
          data-oid="0im.uxt"
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
          data-oid="iskl-sb"
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
          data-oid="fxd6nnk"
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
          data-oid="a-corgv"
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
      <div className="relative h-full w-full" data-oid="c_e-5e6">
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
          data-oid="e654fu7"
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
          data-oid="8lc71.5"
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
          data-oid="6h.36nm"
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
          data-oid="w1fw_ln"
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
          data-oid="xg820pb"
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
          data-oid="8c2jf2a"
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
          data-oid="57ll3fx"
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
          data-oid="_19zoos"
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
          data-oid="327r24j"
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
          data-oid="_9wbqrk"
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
          data-oid="xr-zhwa"
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
      <div className="relative h-full w-full" data-oid="kuc-1wn">
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
          data-oid="njv-:vr"
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
          data-oid="h.tgvc9"
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
          data-oid="w2a4fbh"
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
          data-oid="j5n:ibr"
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
          data-oid="hgsj6g4"
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
          data-oid="32zpj87"
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
          data-oid="jyg6exc"
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
          data-oid="_eavvqx"
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
          data-oid=":s:9o8c"
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
          data-oid="mqtduq2"
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
          data-oid=":rgo9:p"
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
      <div className="relative h-full w-full" data-oid="4-dcx0t">
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
          data-oid="d9ouxu2"
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
          data-oid="m86ovge"
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
          data-oid="nbf7bc_"
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
          data-oid="i2ddf7v"
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
          data-oid="4as5g.."
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
          data-oid=".xlm-3o"
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
          data-oid="p-:au8z"
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
          data-oid="h5c5bpc"
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
          data-oid="g8zwi3x"
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
      <div className="relative h-full w-full" data-oid="u4mxg8y">
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
          data-oid="vnenoi-"
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
          data-oid="rj8t4t1"
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
          data-oid="f1qdr2c"
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
          data-oid="c0wykwc"
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
          data-oid="4igscev"
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
          data-oid="fc4.h-q"
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
          data-oid="rbzfn.c"
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
          data-oid="lyj0m7u"
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
          data-oid="p2-efgf"
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
      <div className="relative h-full w-full" data-oid="ti3w.h3">
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
          data-oid="74zoj.9"
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
          data-oid="p:a66rs"
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
          data-oid="pi8eefi"
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
          data-oid="b9zfaex"
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
          data-oid="zaxqqvc"
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
          data-oid="ky7zmji"
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
          data-oid="oskljpd"
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
          data-oid=".498w9u"
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
          data-oid="smyu:_7"
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
      <div className="relative h-full w-full" data-oid="yajw2h_">
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
          data-oid="n77f.1w"
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
          data-oid="_jdtpbs"
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
          data-oid="mz8j816"
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
          data-oid="y6d2nt1"
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
          data-oid="ey3b:.6"
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
          data-oid="qvhu.ew"
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
          data-oid="79-2bw."
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
          data-oid="4ygl2u0"
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
          data-oid="pjeoa0p"
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
      <div className="relative h-full w-full" data-oid="y7-ciyv">
        <div className="grid h-full w-full grid-cols-3 grid-rows-3" data-oid="woxuuje">
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
                data-oid=".2ba03v"
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
            data-oid="lwyoumg"
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
            data-oid="xywxiu2"
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
      <div className="relative h-full w-full" data-oid=".:5htvf">
        <div className="grid h-full w-full grid-cols-5 grid-rows-2" data-oid="w-.g:2l">
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
                data-oid="spwtfa0"
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
            data-oid="6pnyw0x"
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
          data-oid="vtywo9s"
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
      <div className="relative h-full w-full" data-oid="6f:nnle">
        <div className="grid h-full w-full grid-cols-2 grid-rows-5" data-oid="r3ged.6">
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
                data-oid="bgf.x8a"
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
          data-oid="4xk_o7a"
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
            data-oid="6:ci0m3"
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
      <div className="relative h-full w-full" data-oid=".3rexds">
        <div className="grid h-full w-full grid-cols-4 grid-rows-3" data-oid="gaos-93">
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
                data-oid="_i_y:w:"
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
            data-oid="4w508rd"
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
            data-oid="w5zst8:"
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
      <div className="relative h-full w-full" data-oid="rplyqbn">
        <div className="grid h-full w-full grid-cols-3 grid-rows-4" data-oid="ltadp9k">
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
                data-oid="lw-_jj-"
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
            data-oid="2rwrct-"
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
            data-oid=".o7ggj-"
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
      <div className="relative h-full w-full" data-oid="sj1h4e9">
        <div className="grid h-full w-full grid-cols-4 grid-rows-4" data-oid="6iyhwpi">
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
                data-oid="9w_hpv."
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
            data-oid="6hni7m2"
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
            data-oid="a_380z7"
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
      <div className="relative h-full w-full" data-oid="mup-pvi">
        <div className="grid h-full w-full grid-cols-5 grid-rows-5" data-oid="lxhmk6w">
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
                data-oid="p_72ubj"
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
            data-oid="2o7dl71"
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
            data-oid="w6ui78c"
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
      <div className="relative h-full w-full" data-oid="gv4wiey">
        <div className="grid h-full w-full grid-cols-2 grid-rows-4" data-oid="j9elv-q">
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
                data-oid="727h7.n"
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
          data-oid="a0levwk"
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
            data-oid="o6-jpdm"
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
      <div className="relative h-full w-full" data-oid=".2nv0l-">
        <div className="grid h-full w-full grid-cols-4 grid-rows-2" data-oid="w3v2f0t">
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
                data-oid="yrt:rqj"
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
            data-oid="d8fkhtm"
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
          data-oid="moymc09"
        />
      </div>
    ),
  },
]
