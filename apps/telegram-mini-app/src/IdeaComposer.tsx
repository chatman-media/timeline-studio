import { type FormEvent, useState } from "react"
import { gateway } from "./gateway"
import { haptics } from "./telegram"

/**
 * Idea composer (#330): submit a fresh idea to start a review session. Drives
 * the gateway's `idea.submit`, which enqueues the bot's first-cut workflow; the
 * new session surfaces in the list once it reaches preview-ready. Disabled
 * server-side without a script generator → we surface that as a hint.
 */
export function IdeaComposer({ onSubmitted }: { onSubmitted: () => void }) {
  const [text, setText] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [queued, setQueued] = useState(false)

  async function onSubmit(event: FormEvent): Promise<void> {
    event.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || busy) return
    setBusy(true)
    setError(null)
    setQueued(false)
    try {
      await gateway.idea.submit.mutate({ text: trimmed })
      haptics.notify("success")
      setText("")
      setQueued(true)
      onSubmitted()
    } catch (cause) {
      haptics.notify("error")
      setError(cause instanceof Error ? cause.message : "Could not submit idea")
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="idea" onSubmit={onSubmit}>
      <textarea
        value={text}
        onChange={(event) => {
          setText(event.target.value)
          setQueued(false)
        }}
        placeholder="Describe your reel idea…"
        rows={3}
        disabled={busy}
      />
      <button type="submit" disabled={busy || text.trim().length === 0}>
        {busy ? "Sending…" : "Send idea"}
      </button>
      {queued && <p className="muted">Idea queued — your first cut is being prepared.</p>}
      {error && <p className="error">{error}</p>}
    </form>
  )
}
