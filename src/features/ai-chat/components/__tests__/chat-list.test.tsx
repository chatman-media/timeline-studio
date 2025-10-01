import { fireEvent } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { render } from "@/test/test-utils"
import { ChatListItem } from "../../services"
import { ChatList } from "../chat-list"

const mockSessions: ChatListItem[] = [
  {
    id: "session-1",
    title: "First chat session",
    messageCount: 5,
    lastMessage: "This is the last message",
    createdAt: new Date("2024-01-01"),
    agent: "gpt-5",
  },
  {
    id: "session-2",
    title: "Second chat session",
    messageCount: 3,
    lastMessage: "Another message",
    createdAt: new Date("2024-01-02"),
    agent: "gpt-5",
  },
  {
    id: "session-3",
    title: "Third chat session",
    messageCount: 10,
    lastMessage: "Latest message",
    createdAt: new Date("2024-01-03"),
    agent: "gpt-5",
  },
  {
    id: "session-4",
    title: "Fourth chat session",
    messageCount: 2,
    lastMessage: "Hidden session",
    createdAt: new Date("2024-01-04"),
    agent: "gpt-5",
  },
]

describe("ChatList", () => {
  const defaultProps = {
    sessions: mockSessions,
    currentSessionId: "session-1",
    isCreatingNew: false,
    onSelectSession: vi.fn(),
    onDeleteSession: vi.fn(),
    onCopySession: vi.fn(),
  }

  it("should render chat list with sessions", () => {
    const { getByText } = render(<ChatList {...defaultProps} />)

    expect(getByText("Previous Threads")).toBeInTheDocument()
    expect(getByText("First chat session")).toBeInTheDocument()
    expect(getByText("Second chat session")).toBeInTheDocument()
    expect(getByText("Third chat session")).toBeInTheDocument()
  })

  it("should show only first 3 sessions by default", () => {
    const { queryByText, getByText } = render(<ChatList {...defaultProps} />)

    // First 3 should be visible
    expect(getByText("First chat session")).toBeInTheDocument()
    expect(getByText("Second chat session")).toBeInTheDocument()
    expect(getByText("Third chat session")).toBeInTheDocument()

    // Fourth should be hidden
    expect(queryByText("Fourth chat session")).not.toBeInTheDocument()

    // Should show "Show more" button
    expect(getByText(/Show 1 more/)).toBeInTheDocument()
  })

  it("should expand to show all sessions when Show more is clicked", () => {
    const { getByText } = render(<ChatList {...defaultProps} />)

    const showMoreButton = getByText(/Show 1 more/)
    fireEvent.click(showMoreButton)

    // Now all sessions should be visible
    expect(getByText("Fourth chat session")).toBeInTheDocument()

    // Button should change to "Show less"
    expect(getByText("Show less")).toBeInTheDocument()
  })

  it("should highlight current session", () => {
    const { getByText } = render(<ChatList {...defaultProps} />)

    const currentSession = getByText("First chat session").closest("button")
    expect(currentSession).toHaveClass("bg-muted")
  })

  it("should call onSelectSession when session is clicked", () => {
    const { getByText } = render(<ChatList {...defaultProps} />)

    const secondSession = getByText("Second chat session").closest("button")!
    fireEvent.click(secondSession)

    expect(defaultProps.onSelectSession).toHaveBeenCalledWith("session-2")
  })

  it("should show delete button on hover", async () => {
    const { getByText, getByLabelText } = render(<ChatList {...defaultProps} />)

    const sessionButton = getByText("Second chat session").closest("button")!

    // Hover over session
    fireEvent.mouseEnter(sessionButton)

    // Delete button should appear
    const deleteButton = getByLabelText("Delete session")
    expect(deleteButton).toBeInTheDocument()

    // Click delete
    fireEvent.click(deleteButton)
    expect(defaultProps.onDeleteSession).toHaveBeenCalledWith("session-2")
  })

  it("should show copy button on hover", async () => {
    const { getByText, getByLabelText } = render(<ChatList {...defaultProps} />)

    const sessionButton = getByText("Second chat session").closest("button")!

    // Hover over session
    fireEvent.mouseEnter(sessionButton)

    // Copy button should appear
    const copyButton = getByLabelText("Copy session")
    expect(copyButton).toBeInTheDocument()

    // Click copy
    fireEvent.click(copyButton)
    expect(defaultProps.onCopySession).toHaveBeenCalledWith("session-2")
  })

  it("should show loading state when creating new chat", () => {
    const { getByText } = render(<ChatList {...defaultProps} isCreatingNew={true} />)

    expect(getByText("составь план рефакторинга")).toBeInTheDocument()
  })

  it("should show message count for each session", () => {
    const { getByText } = render(<ChatList {...defaultProps} />)

    expect(getByText("5")).toBeInTheDocument() // First session message count
    expect(getByText("3")).toBeInTheDocument() // Second session message count
    expect(getByText("10")).toBeInTheDocument() // Third session message count
  })

  it("should truncate long session titles", () => {
    const longTitleSessions: ChatListItem[] = [
      {
        id: "long-session",
        title:
          "This is a very long session title that should be truncated to fit in the UI properly without breaking the layout",
        messageCount: 1,
        lastMessage: "Message",
        createdAt: new Date(),
        agent: "gpt-5",
      },
    ]

    const { container } = render(<ChatList {...defaultProps} sessions={longTitleSessions} />)

    const titleElement = container.querySelector(".truncate")
    expect(titleElement).toHaveClass("truncate")
  })

  it("should handle empty sessions list", () => {
    const { getByText, queryByText } = render(<ChatList {...defaultProps} sessions={[]} />)

    expect(getByText("Previous Threads")).toBeInTheDocument()
    expect(queryByText(/Show \d+ more/)).not.toBeInTheDocument()
  })
})
