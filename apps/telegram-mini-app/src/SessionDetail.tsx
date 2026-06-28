import { type FormEvent, useEffect, useState } from "react"
import { gateway } from "./gateway"
import type { SessionSummary } from "./SessionRow"
import { getWebApp, haptics, setMainButtonBusy, showMainButton } from "./telegram"

/**
 * Session detail screen (#330): the full review session plus concierge actions
 * (approve / revise / cancel) over the gateway's owner-scoped `edit.*` mutations,
 * with haptic feedback. Actions are offered only while preview-ready.
 */
export function SessionDetail({ session, onChanged }: { session: SessionSummary; onChanged: () => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [instruction, setInstruction] = useState("")

  const canAct = session.status === "preview_ready"
  // In Telegram, "Approve" is the native MainButton; show an in-screen button
  // only as a fallback where MainButton is unavailable (e.g. browser dev).
  const hasMainButton = Boolean(getWebApp()?.MainButton)

  async function run(action: () => Promise<unknown>): Promise<void> {
    setBusy(true)
    setError(null)
    try {
      await action()
      haptics.notify("success")
      onChanged()
    } catch (cause) {
      haptics.notify("error")
      setError(cause instanceof Error ? cause.message : "Action failed")
    } finally {
      setBusy(false)
    }
  }

  // The native MainButton mirrors the primary "Approve" action while preview-ready.
  useEffect(() => {
    if (!canAct) return
    return showMainButton("Approve ✓", () => run(() => gateway.edit.approve.mutate({ id: session.id })))
  }, [canAct, session.id])

  // Reflect in-flight state on the MainButton spinner.
  useEffect(() => {
    setMainButtonBusy(busy)
  }, [busy])

  function onRevise(event: FormEvent): void {
    event.preventDefault()
    const trimmed = instruction.trim()
    if (!trimmed) return
    void run(async () => {
      await gateway.edit.revise.mutate({ id: session.id, instruction: trimmed })
      setInstruction("")
    })
  }

  return (
    <section className="detail">
      <span className={`status status-${session.status}`}>{session.status}</span>
      <h2>{session.goal ?? "Review session"}</h2>

      <dl className="meta">
        <div>
          <dt>Revisions</dt>
          <dd>{session.revisionCount}</dd>
        </div>
        {session.approvedAt && (
          <div>
            <dt>Approved</dt>
            <dd>{new Date(session.approvedAt).toLocaleString()}</dd>
          </div>
        )}
        {session.publishedAt && (
          <div>
            <dt>Published</dt>
            <dd>{new Date(session.publishedAt).toLocaleString()}</dd>
          </div>
        )}
        {session.failure && (
          <div>
            <dt>Failure</dt>
            <dd className="error">{session.failure}</dd>
          </div>
        )}
        <div>
          <dt>Updated</dt>
          <dd>{new Date(session.updatedAt).toLocaleString()}</dd>
        </div>
      </dl>

      {canAct ? (
        <div className="actions">
          {!hasMainButton && (
            <button type="button" disabled={busy} onClick={() => run(() => gateway.edit.approve.mutate({ id: session.id }))}>
              Approve
            </button>
          )}
          <button type="button" disabled={busy} onClick={() => run(() => gateway.edit.cancel.mutate({ id: session.id }))}>
            Cancel
          </button>
          <form className="revise" onSubmit={onRevise}>
            <input
              value={instruction}
              onChange={(event) => setInstruction(event.target.value)}
              placeholder="Revise…"
              disabled={busy}
            />
            <button type="submit" disabled={busy || instruction.trim().length === 0}>
              Revise
            </button>
          </form>
        </div>
      ) : (
        <p className="muted">No actions available in “{session.status}”.</p>
      )}

      {error && <p className="error">{error}</p>}
    </section>
  )
}
