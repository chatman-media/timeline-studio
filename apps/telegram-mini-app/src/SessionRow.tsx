import { gateway } from "./gateway"
import { haptics } from "./telegram"

export type SessionSummary = Awaited<ReturnType<typeof gateway.session.list.query>>[number]

/**
 * A tappable session summary row (#330) — status + goal. Tapping opens the
 * detail screen where the concierge actions live.
 */
export function SessionRow({ session, onOpen }: { session: SessionSummary; onOpen: (id: string) => void }) {
  return (
    <li>
      <button
        type="button"
        className="row session-open"
        onClick={() => {
          haptics.impact("light")
          onOpen(session.id)
        }}
      >
        <span className={`status status-${session.status}`}>{session.status}</span>
        <span className="goal">{session.goal ?? session.id}</span>
        <span className="chevron" aria-hidden="true">
          ›
        </span>
      </button>
    </li>
  )
}
