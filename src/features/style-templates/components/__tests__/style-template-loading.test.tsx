import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import {
  StyleTemplateListSkeleton,
  StyleTemplateLoading,
  StyleTemplatePreviewSkeleton,
} from "../style-template-loading"

describe("StyleTemplateLoading", () => {
  it("should render with default props", () => {
    render(<StyleTemplateLoading />)

    expect(screen.getByText("Загрузка шаблонов...")).toBeInTheDocument()

    const loader = screen.getByText("Загрузка шаблонов...").previousElementSibling
    expect(loader).toHaveClass("h-8 w-8 animate-spin")
  })

  it("should render with custom message", () => {
    render(<StyleTemplateLoading message="Пожалуйста, подождите" />)

    expect(screen.getByText("Пожалуйста, подождите")).toBeInTheDocument()
  })

  it("should render with small size", () => {
    render(<StyleTemplateLoading size="sm" />)

    const container = screen.getByText("Загрузка шаблонов...").parentElement
    expect(container).toHaveClass("p-4")

    const loader = screen.getByText("Загрузка шаблонов...").previousElementSibling
    expect(loader).toHaveClass("h-4 w-4")
  })

  it("should render with medium size", () => {
    render(<StyleTemplateLoading size="md" />)

    const container = screen.getByText("Загрузка шаблонов...").parentElement
    expect(container).toHaveClass("p-8")

    const loader = screen.getByText("Загрузка шаблонов...").previousElementSibling
    expect(loader).toHaveClass("h-8 w-8")
  })

  it("should render with large size", () => {
    render(<StyleTemplateLoading size="lg" />)

    const container = screen.getByText("Загрузка шаблонов...").parentElement
    expect(container).toHaveClass("p-12")

    const loader = screen.getByText("Загрузка шаблонов...").previousElementSibling
    expect(loader).toHaveClass("h-12 w-12")
  })

  it("should have proper styling", () => {
    render(<StyleTemplateLoading />)

    const container = screen.getByText("Загрузка шаблонов...").parentElement
    expect(container).toHaveClass("flex flex-col items-center justify-center")

    const message = screen.getByText("Загрузка шаблонов...")
    expect(message).toHaveClass("mt-2 text-sm text-gray-600 dark:text-gray-400")

    const loader = message.previousElementSibling
    expect(loader).toHaveClass("animate-spin text-blue-500")
  })
})

describe("StyleTemplatePreviewSkeleton", () => {
  it("should render with correct dimensions", () => {
    const { container } = render(<StyleTemplatePreviewSkeleton size={200} />)

    const skeleton = container.querySelector(".animate-pulse")
    expect(skeleton).toHaveStyle({ width: "200px", height: "230px" }) // 200 * 0.75 + 80
  })

  it("should have preview area", () => {
    const { container } = render(<StyleTemplatePreviewSkeleton size={200} />)

    const previewArea = container.querySelector(".bg-gray-700")
    expect(previewArea).toHaveStyle({ width: "200px", height: "150px" }) // 200 * 0.75
  })

  it("should have info area with placeholder elements", () => {
    const { container } = render(<StyleTemplatePreviewSkeleton size={200} />)

    const skeleton = container.querySelector(".animate-pulse")
    const infoArea = skeleton?.querySelector(".p-3")
    expect(infoArea).toBeInTheDocument()

    // Title placeholder
    const titlePlaceholder = infoArea?.querySelector(".mb-2.h-4.w-3\\/4")
    expect(titlePlaceholder).toBeInTheDocument()

    // Info placeholders
    const infoPlaceholders = infoArea?.querySelectorAll(".h-3")
    expect(infoPlaceholders).toHaveLength(2)
    expect(infoPlaceholders?.[0]).toHaveClass("w-1/3")
    expect(infoPlaceholders?.[1]).toHaveClass("w-1/4")
  })

  it("should have proper animation class", () => {
    const { container } = render(<StyleTemplatePreviewSkeleton size={200} />)

    const skeleton = container.querySelector(".animate-pulse")
    expect(skeleton).toHaveClass("animate-pulse overflow-hidden rounded-lg")
  })

  it("should calculate height based on aspect ratio", () => {
    const { container } = render(<StyleTemplatePreviewSkeleton size={300} />)

    const skeleton = container.querySelector(".animate-pulse")
    expect(skeleton).toHaveStyle({ width: "300px", height: "305px" }) // 300 * 0.75 + 80
  })
})

describe("StyleTemplateListSkeleton", () => {
  it("should render default number of skeletons", () => {
    render(<StyleTemplateListSkeleton />)

    const skeletons = screen.getAllByRole("generic").filter((el) => el.classList.contains("animate-pulse"))
    expect(skeletons).toHaveLength(6)
  })

  it("should render custom number of skeletons", () => {
    render(<StyleTemplateListSkeleton count={10} />)

    const skeletons = screen.getAllByRole("generic").filter((el) => el.classList.contains("animate-pulse"))
    expect(skeletons).toHaveLength(10)
  })

  it("should render with custom size", () => {
    const { container } = render(<StyleTemplateListSkeleton size={150} />)

    const firstSkeleton = container.querySelector(".animate-pulse")
    expect(firstSkeleton).toHaveStyle({ width: "150px" })
  })

  it("should have responsive grid layout", () => {
    const { container } = render(<StyleTemplateListSkeleton />)

    const grid = container.querySelector(".grid")
    expect(grid).toHaveClass(
      "grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
    )
  })

  it("should render no skeletons when count is 0", () => {
    render(<StyleTemplateListSkeleton count={0} />)

    const skeletons = screen.getAllByRole("generic").filter((el) => el.classList.contains("animate-pulse"))
    expect(skeletons).toHaveLength(0)
  })

  it("should pass size to individual skeletons", () => {
    render(<StyleTemplateListSkeleton count={3} size={250} />)

    const skeletons = screen.getAllByRole("generic").filter((el) => el.classList.contains("animate-pulse"))

    skeletons.forEach((skeleton) => {
      expect(skeleton).toHaveStyle({ width: "250px" })
    })
  })
})
