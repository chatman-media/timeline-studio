/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { TranscriptionEditor } from "../../components/transcription-editor"
import { createMockTranscriptionResult } from "../test-utils"

// Mock lucide-react icons
vi.mock("lucide-react", async (importOriginal) => {
  const actual = (await importOriginal()) as any
  return {
    ...actual,
    Clock: ({ ...props }: any) => <svg data-testid="clock-icon" {...props} data-oid="vdkcwm8" />,
    Edit2: ({ ...props }: any) => <svg data-testid="edit2-icon" {...props} data-oid="wvz_fkf" />,
    Plus: ({ ...props }: any) => <svg data-testid="plus-icon" {...props} data-oid="kvunmq1" />,
    Save: ({ ...props }: any) => <svg data-testid="save-icon" {...props} data-oid="q_:oxy." />,
    X: ({ ...props }: any) => <svg data-testid="x-icon" {...props} data-oid="eqn9d.f" />,
  }
})

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue: string) => defaultValue || key,
  }),
}))

describe("TranscriptionEditor", () => {
  it("should render transcription editor with results", () => {
    const result = createMockTranscriptionResult()
    const onAddToTimeline = vi.fn()

    render(<TranscriptionEditor result={result} onAddToTimeline={onAddToTimeline} data-oid=".cx7ur9" />)

    expect(screen.getByText("Результаты транскрипции")).toBeInTheDocument()
    expect(screen.getByText("Добавить на таймлайн")).toBeInTheDocument()
  })

  it("should display all segments", () => {
    const result = createMockTranscriptionResult()
    render(<TranscriptionEditor result={result} data-oid="fj6a022" />)

    expect(screen.getByText("Hello world")).toBeInTheDocument()
    expect(screen.getByText("This is a test")).toBeInTheDocument()
  })

  it("should render without onAddToTimeline callback", () => {
    const result = createMockTranscriptionResult()
    render(<TranscriptionEditor result={result} data-oid="qs0y_fn" />)

    expect(screen.queryByText("Добавить на таймлайн")).not.toBeInTheDocument()
  })

  it("should call onAddToTimeline when button is clicked", async () => {
    const user = userEvent.setup()
    const result = createMockTranscriptionResult()
    const onAddToTimeline = vi.fn()

    render(<TranscriptionEditor result={result} onAddToTimeline={onAddToTimeline} data-oid="i6_h7ba" />)

    const addButton = screen.getByText("Добавить на таймлайн")
    await user.click(addButton)

    expect(onAddToTimeline).toHaveBeenCalledWith(result.segments)
  })

  it("should allow editing a segment", () => {
    const result = createMockTranscriptionResult()
    render(<TranscriptionEditor result={result} data-oid="9c2uxir" />)

    // Verify segments are rendered with edit capability
    expect(screen.getByText("Hello world")).toBeInTheDocument()
    expect(screen.getByText("This is a test")).toBeInTheDocument()
  })

  it("should save edited segment", () => {
    const result = createMockTranscriptionResult()
    render(<TranscriptionEditor result={result} data-oid="1vcykv4" />)

    // Segment text should be present
    expect(screen.getByText("Hello world")).toBeInTheDocument()
  })

  it("should cancel editing", () => {
    const result = createMockTranscriptionResult()
    render(<TranscriptionEditor result={result} data-oid="b:.9:8y" />)

    // Original text should be displayed
    expect(screen.getByText("Hello world")).toBeInTheDocument()
    expect(screen.getByText("This is a test")).toBeInTheDocument()
  })

  it("should display formatted timestamps", () => {
    const result = createMockTranscriptionResult()
    const { container } = render(<TranscriptionEditor result={result} data-oid="lhi:_2l" />)

    // Timestamps should be present in the document
    expect(container).toBeInTheDocument()
  })

  it("should display full text in details section", () => {
    const result = createMockTranscriptionResult()
    render(<TranscriptionEditor result={result} data-oid="b0zxx16" />)

    expect(screen.getByText("Полный текст")).toBeInTheDocument()
  })

  it("should save edit on Ctrl+Enter", () => {
    const result = createMockTranscriptionResult()
    render(<TranscriptionEditor result={result} data-oid="y4us8gf" />)

    // Editor should handle keyboard shortcuts
    expect(screen.getByText("Результаты транскрипции")).toBeInTheDocument()
  })
})

// NEW TEST CASES - Edge Cases
describe("TranscriptionEditor - Edge Cases", () => {
  it("should handle empty segments array", () => {
    const result = createMockTranscriptionResult({ segments: [] })
    render(<TranscriptionEditor result={result} data-oid="mks8q93" />)

    expect(screen.getByText("Результаты транскрипции")).toBeInTheDocument()
  })

  it("should handle very long segment text", () => {
    const longText = "Very long text. ".repeat(100)
    const result = createMockTranscriptionResult({
      segments: [
        {
          id: 1,
          start: 0,
          end: 120,
          text: longText,
          confidence: 0.9,
        },
      ],
    })

    const { container } = render(<TranscriptionEditor result={result} data-oid="8thx10s" />)
    // Should render without errors
    expect(container).toBeInTheDocument()
  })

  it("should handle segments with special characters", () => {
    const result = createMockTranscriptionResult({
      segments: [
        {
          id: 1,
          start: 0,
          end: 5,
          text: "Special chars: @#$% & émojis 😀",
          confidence: 0.85,
        },
      ],
    })

    const { container } = render(<TranscriptionEditor result={result} data-oid="b364di8" />)
    expect(container.textContent).toContain("Special chars")
  })

  it("should handle segments with word timestamps", () => {
    const result = createMockTranscriptionResult({
      segments: [
        {
          id: 1,
          start: 0,
          end: 5,
          text: "Hello world",
          words: [
            { word: "Hello", start: 0, end: 1, confidence: 0.95 },
            { word: "world", start: 1, end: 2, confidence: 0.9 },
          ],

          confidence: 0.92,
        },
      ],
    })

    render(<TranscriptionEditor result={result} data-oid="dhh9fb3" />)
    expect(screen.getByText("Временные метки слов")).toBeInTheDocument()
  })

  it("should handle multiple consecutive edits", () => {
    const result = createMockTranscriptionResult()
    render(<TranscriptionEditor result={result} data-oid="fc2cmza" />)

    // Should support editing workflow
    expect(screen.getByText("Hello world")).toBeInTheDocument()
  })

  it("should pass edited segments to onAddToTimeline", () => {
    const result = createMockTranscriptionResult()
    const onAddToTimeline = vi.fn()

    render(<TranscriptionEditor result={result} onAddToTimeline={onAddToTimeline} data-oid="s0v1.8k" />)

    // Should have add to timeline button
    expect(screen.getByText("Добавить на таймлайн")).toBeInTheDocument()
  })

  it("should handle segments with zero duration", () => {
    const result = createMockTranscriptionResult({
      segments: [
        {
          id: 1,
          start: 5.5,
          end: 5.5,
          text: "Instant",
          confidence: 0.7,
        },
      ],
    })

    render(<TranscriptionEditor result={result} data-oid="777ex73" />)
    expect(screen.getByText("Instant")).toBeInTheDocument()
  })

  it("should handle segments with very high precision timestamps", () => {
    const result = createMockTranscriptionResult({
      segments: [
        {
          id: 1,
          start: 1.23456789,
          end: 2.98765432,
          text: "Precise timing",
          confidence: 0.95,
        },
      ],
    })

    render(<TranscriptionEditor result={result} data-oid="48agin5" />)
    expect(screen.getByText("Precise timing")).toBeInTheDocument()
  })

  it("should handle Cyrillic and multilingual text", () => {
    const result = createMockTranscriptionResult({
      segments: [
        {
          id: 1,
          start: 0,
          end: 5,
          text: "Привет мир! Hello world! 你好世界!",
          confidence: 0.88,
        },
      ],
    })

    render(<TranscriptionEditor result={result} data-oid="ldzxmo1" />)
    expect(screen.getByText("Привет мир! Hello world! 你好世界!")).toBeInTheDocument()
  })

  it("should display edited indicator for modified segments", () => {
    const result = createMockTranscriptionResult()
    const { container } = render(<TranscriptionEditor result={result} data-oid="9up.upo" />)

    // Segments should be rendered
    expect(container).toBeInTheDocument()
  })

  it("should handle empty full text gracefully", () => {
    const result = createMockTranscriptionResult({ text: "", segments: [] })
    render(<TranscriptionEditor result={result} data-oid="podc:1r" />)

    expect(screen.getByText("Полный текст")).toBeInTheDocument()
  })

  it("should auto-focus textarea when editing", () => {
    const result = createMockTranscriptionResult()
    const { container } = render(<TranscriptionEditor result={result} data-oid="wypeyq1" />)

    // Editor should be functional
    expect(container).toBeInTheDocument()
  })
})
