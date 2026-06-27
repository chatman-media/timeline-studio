import { type FormEvent, useState } from "react"
import { gateway } from "./gateway"

export type SessionSummary = Awaited<ReturnType<typeof gateway.session.list.query>>[number]

/**
 * One review session with concierge actions (#330). Approve / Cancel / Revise
 * are only offered while the session is preview-ready and call the gateway's
 * owner-scoped `edit.*` mutations; the parent refreshes the list afterwards.
 */
export function SessionRow({ session, onChanged }: { session: SessionSummary; onChanged: () => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [instruction, setInstruction] = useState("")

  const canAct = session.status === "preview_ready"

  async function run(action: () => Promise<unknown>): Promise<void> {
    setBusy(true)
    setError(null)
    try {
      await action()
      onChanged()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Action failed")
    } finally {
      setBusy(false)
    }
  }

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
    <li>
      <div className="row">
        <span className={`status status-${session.status}`}>{session.status}</span>
        <span className="goal">{session.goal ?? session.id}</span>
      </div>

      {canAct && (
        <div className="actions">
          <button type="button" disabled={busy} onClick={() => run(() => gateway.edit.approve.mutate({ id: session.id }))}>
            Approve
          </button>
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
      )}

      {error && <p className="error">{error}</p>}
    </li>
  )
}
