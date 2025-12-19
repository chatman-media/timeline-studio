/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { BaseProviders } from "@/test/test-utils"

import { PersonFormModal } from "../../components/person-form-modal"

// Import lucide-react mocks
import "@/test/mocks/libraries/lucide-react"

// Mock useModals hook
const mockCloseModal = vi.fn()
const mockModalData = vi.fn()
const mockOnSave = vi.fn()

vi.mock("@/domains/system-integration", () => ({
  useModals: () => ({
    activeModal: "person-form",
    isModalOpen: true,
    modalData: mockModalData(),
    openModal: vi.fn(),
    closeModal: mockCloseModal,
    submitModal: vi.fn(),
    openCameraCapture: vi.fn(),
    openVoiceRecording: vi.fn(),
    openExport: vi.fn(),
    openProjectSettings: vi.fn(),
    openUserSettings: vi.fn(),
    openKeyboardShortcuts: vi.fn(),
    openColorGrading: vi.fn(),
    openEffectDetail: vi.fn(),
  }),
}))

// Mock crypto.randomUUID
Object.defineProperty(global, "crypto", {
  value: {
    randomUUID: vi.fn(() => "test-uuid-123"),
  },
  writable: true,
})

describe("PersonFormModal", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockModalData.mockReturnValue({})
  })

  it("should render empty form for new person", () => {
    render(
      <BaseProviders data-oid="hulkn5g">
        <PersonFormModal data-oid="19gn3ir" />
      </BaseProviders>,
    )

    expect(screen.getByLabelText(/Имя \*/)).toHaveValue("")
    expect(screen.getByLabelText(/Заметки/)).toHaveValue("")
    expect(screen.getByPlaceholderText(/Добавить тег/)).toHaveValue("")
    expect(screen.getByText(/Создать/)).toBeInTheDocument()
  })

  it("should render form with person data for editing", () => {
    const mockPerson = {
      id: "person-1",
      name: "John Doe",
      notes: "Test person notes",
      tags: ["actor", "main"],
      thumbnails: [
        {
          id: "thumb-1",
          imageUrl: "/path/to/image.jpg",
          width: 150,
          height: 150,
          sourceClipId: "",
          sourceTimestamp: { seconds: 0 },
          quality: 1,
          isPrimary: true,
          isGenerated: false,
        },
      ],
    }

    mockModalData.mockReturnValue({ person: mockPerson })

    render(
      <BaseProviders data-oid="v1njmph">
        <PersonFormModal data-oid="au71_36" />
      </BaseProviders>,
    )

    expect(screen.getByLabelText(/Имя \*/)).toHaveValue("John Doe")
    expect(screen.getByLabelText(/Заметки/)).toHaveValue("Test person notes")
    expect(screen.getByText("actor")).toBeInTheDocument()
    expect(screen.getByText("main")).toBeInTheDocument()
    expect(screen.getByText(/Сохранить/)).toBeInTheDocument()
  })

  it("should update form fields", () => {
    render(
      <BaseProviders data-oid="1ou:6fc">
        <PersonFormModal data-oid="dm7ir1x" />
      </BaseProviders>,
    )

    const nameInput = screen.getByLabelText(/Имя \*/)
    const notesInput = screen.getByLabelText(/Заметки/)

    fireEvent.change(nameInput, { target: { value: "Jane Smith" } })
    fireEvent.change(notesInput, { target: { value: "New notes" } })

    expect(nameInput).toHaveValue("Jane Smith")
    expect(notesInput).toHaveValue("New notes")
  })

  it("should add and remove tags", () => {
    render(
      <BaseProviders data-oid="ji2hdbf">
        <PersonFormModal data-oid="ilcimaj" />
      </BaseProviders>,
    )

    const tagInput = screen.getByPlaceholderText(/Добавить тег/)
    const addButton = screen.getByRole("button", { name: "Tag" })

    // Add tag
    fireEvent.change(tagInput, { target: { value: "newTag" } })
    fireEvent.click(addButton)

    expect(screen.getByText("newTag")).toBeInTheDocument()
    expect(tagInput).toHaveValue("")

    // Remove tag - find by X icon within the badge
    const badge = screen.getByText("newTag").closest(".inline-flex")
    const removeButton = badge?.querySelector("button")

    if (removeButton) {
      fireEvent.click(removeButton)
    }

    expect(screen.queryByText("newTag")).not.toBeInTheDocument()
  })

  it("should add tag on Enter key", () => {
    render(
      <BaseProviders data-oid="ji7iq1v">
        <PersonFormModal data-oid="9ofd0no" />
      </BaseProviders>,
    )

    const tagInput = screen.getByPlaceholderText(/Добавить тег/)

    fireEvent.change(tagInput, { target: { value: "enterTag" } })
    fireEvent.keyDown(tagInput, { key: "Enter" })

    expect(screen.getByText("enterTag")).toBeInTheDocument()
  })

  it("should not add duplicate tags", () => {
    render(
      <BaseProviders data-oid="smjg0q7">
        <PersonFormModal data-oid="c53vl5:" />
      </BaseProviders>,
    )

    const tagInput = screen.getByPlaceholderText(/Добавить тег/)
    const addButton = screen.getByRole("button", { name: "Tag" })

    // Add tag first time
    fireEvent.change(tagInput, { target: { value: "duplicate" } })
    fireEvent.click(addButton)

    // Try to add same tag again
    fireEvent.change(tagInput, { target: { value: "duplicate" } })
    fireEvent.click(addButton)

    const tags = screen.getAllByText("duplicate")
    expect(tags).toHaveLength(1)
  })

  it("should not add empty tags", () => {
    render(
      <BaseProviders data-oid="o3bgwd:">
        <PersonFormModal data-oid="ke2i7bj" />
      </BaseProviders>,
    )

    const tagInput = screen.getByPlaceholderText(/Добавить тег/)
    const addButton = screen.getByRole("button", { name: "Tag" })

    // Try to add empty tag
    fireEvent.change(tagInput, { target: { value: "   " } })
    fireEvent.click(addButton)

    // Check that no tags are present by looking for badge elements
    const badges = screen.queryAllByText(/^(?!\s*$).+/, { selector: ".gap-1" })
    expect(badges).toHaveLength(0)
  })

  it.todo("should handle file upload", async () => {
    render(
      <BaseProviders data-oid="xr3x8uh">
        <PersonFormModal data-oid="3npcrw7" />
      </BaseProviders>,
    )

    const file = new File(["test"], "test.png", { type: "image/png" })
    const fileInput = document.querySelector('input[type="file"]')!

    // Mock FileReader
    let onloadendCallback: ((event: ProgressEvent) => void) | null = null
    const mockFileReader = {
      readAsDataURL: vi.fn().mockImplementation(() => {
        // Simulate async file reading
        setTimeout(() => {
          if (onloadendCallback) {
            onloadendCallback({} as ProgressEvent)
          }
        }, 0)
      }),
      result: "data:image/png;base64,test",
      set onloadend(handler: ((event: ProgressEvent) => void) | null) {
        onloadendCallback = handler
      },
      get onloadend() {
        return onloadendCallback
      },
    }

    global.FileReader = vi.fn(() => mockFileReader) as any

    fireEvent.change(fileInput, { target: { files: [file] } })

    // Wait for the file to be processed
    await waitFor(() => {
      expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(file)
    })
  })

  it("should save person with valid data", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    mockModalData.mockReturnValue({ onSave })

    render(
      <BaseProviders data-oid="8veity6">
        <PersonFormModal data-oid="e_n8rh." />
      </BaseProviders>,
    )

    const nameInput = screen.getByLabelText(/Имя \*/)
    const notesInput = screen.getByLabelText(/Заметки/)
    const saveButton = screen.getByText(/Создать/)

    fireEvent.change(nameInput, { target: { value: "Test Person" } })
    fireEvent.change(notesInput, { target: { value: "Test notes" } })

    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        id: undefined,
        name: "Test Person",
        notes: "Test notes",
        tags: [],
        thumbnails: undefined,
      })
    })

    expect(mockCloseModal).toHaveBeenCalled()
  })

  it("should not save person without name", async () => {
    const onSave = vi.fn()
    mockModalData.mockReturnValue({ onSave })

    render(
      <BaseProviders data-oid="gkyw59x">
        <PersonFormModal data-oid=".08mobc" />
      </BaseProviders>,
    )

    const saveButton = screen.getByText(/Создать/)

    fireEvent.click(saveButton)

    expect(onSave).not.toHaveBeenCalled()
    expect(mockCloseModal).not.toHaveBeenCalled()
  })

  it("should save edited person", async () => {
    const mockPerson = {
      id: "person-1",
      name: "John Doe",
      notes: "Original notes",
      tags: ["actor"],
    }

    const onSave = vi.fn().mockResolvedValue(undefined)
    mockModalData.mockReturnValue({ person: mockPerson, onSave })

    render(
      <BaseProviders data-oid="ozpd:aq">
        <PersonFormModal data-oid="g2o3gu_" />
      </BaseProviders>,
    )

    const nameInput = screen.getByLabelText(/Имя \*/)
    const saveButton = screen.getByText(/Сохранить/)

    fireEvent.change(nameInput, { target: { value: "John Updated" } })

    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        id: "person-1",
        name: "John Updated",
        notes: "Original notes",
        tags: ["actor"],
        thumbnails: undefined,
      })
    })
  })

  it("should close modal on cancel", () => {
    render(
      <BaseProviders data-oid="fgu83o3">
        <PersonFormModal data-oid="ri4szi7" />
      </BaseProviders>,
    )

    const cancelButton = screen.getByText(/Отмена/)
    fireEvent.click(cancelButton)

    expect(mockCloseModal).toHaveBeenCalled()
  })

  it("should disable buttons when loading", () => {
    mockModalData.mockReturnValue({ isLoading: true })

    render(
      <BaseProviders data-oid="j136pr0">
        <PersonFormModal data-oid="bpl9.tv" />
      </BaseProviders>,
    )

    const cancelButton = screen.getByText(/Отмена/)
    const saveButton = screen.getByText(/Создать/)

    expect(cancelButton).toBeDisabled()
    expect(saveButton).toBeDisabled()
  })

  it.todo("should save with thumbnail", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    mockModalData.mockReturnValue({ onSave })

    const { container } = render(
      <BaseProviders data-oid="l_g7rgf">
        <PersonFormModal data-oid="5b-thr1" />
      </BaseProviders>,
    )

    const nameInput = screen.getByLabelText(/Имя \*/)
    const fileInput = document.querySelector('input[type="file"]')!
    const saveButton = screen.getByText(/Создать/)

    // Set name
    fireEvent.change(nameInput, { target: { value: "Test Person" } })

    // Mock FileReader for thumbnail
    const mockFileReader = {
      readAsDataURL: vi.fn(),
      result: "data:image/png;base64,test",
      onloadend: null as any,
    }

    global.FileReader = vi.fn().mockImplementation(() => {
      return {
        readAsDataURL: vi.fn().mockImplementation(() => {
          // Simulate async file reading
          setTimeout(() => {
            if (mockFileReader.onloadend) {
              mockFileReader.onloadend({} as ProgressEvent)
            }
          }, 0)
        }),
        set onloadend(handler: any) {
          mockFileReader.onloadend = handler
        },
        result: mockFileReader.result,
      }
    }) as any

    const file = new File(["test"], "test.png", { type: "image/png" })
    fireEvent.change(fileInput, { target: { files: [file] } })

    // Wait for the thumbnail to be loaded
    await waitFor(() => {
      const thumbnailImg = container.querySelector('img[alt="Превью"]')
      expect(thumbnailImg).toBeInTheDocument()
      expect(thumbnailImg).toHaveAttribute("src", "data:image/png;base64,test")
    })

    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        id: undefined,
        name: "Test Person",
        notes: "",
        tags: [],
        thumbnails: [
          {
            id: "test-uuid-123",
            imageUrl: "data:image/png;base64,test",
            width: 150,
            height: 150,
            sourceClipId: "",
            sourceTimestamp: { seconds: 0 },
            quality: 1,
            isPrimary: true,
            isGenerated: false,
          },
        ],
      })
    })
  })

  it("should handle upload button click", () => {
    render(
      <BaseProviders data-oid="9ke6dlq">
        <PersonFormModal data-oid="-2n8:ta" />
      </BaseProviders>,
    )

    const uploadButton = screen.getByRole("button", { name: "Upload" })
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

    // Mock click on file input
    const clickSpy = vi.fn()
    fileInput.click = clickSpy

    fireEvent.click(uploadButton)

    expect(clickSpy).toHaveBeenCalled()
  })
})
