import { useCallback, useEffect, useState } from "react"
import { gateway } from "./gateway"
import { RenderJobs } from "./RenderJobs"
import { type SessionSummary, SessionRow } from "./SessionRow"
import { getInitData } from "./telegram"

interface Me {
  userId: string
  chatId: string | null
  username: string | null
}

/**
 * Home screen (#330): the verified identity and the caller's review sessions,
 * each with concierge actions (approve/revise/cancel) over the gateway.
 */
export function App() {
  const [me, setMe] = useState<Me | null>(null)
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      setSessions(await gateway.session.list.query())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to load sessions")
    }
  }, [])

  useEffect(() => {
    if (!getInitData()) {
      setError("Open this app from Telegram — no initData available.")
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const [identity, list] = await Promise.all([gateway.auth.me.query(), gateway.session.list.query()])
        if (cancelled) return
        setMe(identity)
        setSessions(list)
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Failed to load")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) return <main className="screen">Loading…</main>
  if (error && !me) return <main className="screen error">{error}</main>

  return (
    <main className="screen">
      <header>
        <h1>Reels</h1>
        {me && <p className="muted">@{me.username ?? me.userId}</p>}
      </header>

      <section>
        <h2>Your sessions</h2>
        {error && <p className="error">{error}</p>}
        {sessions.length === 0 ? (
          <p className="muted">No review sessions yet. Send an idea to the bot to start.</p>
        ) : (
          <ul className="sessions">
            {sessions.map((session) => (
              <SessionRow key={session.id} session={session} onChanged={() => void refresh()} />
            ))}
          </ul>
        )}
      </section>

      <RenderJobs />
    </main>
  )
}
