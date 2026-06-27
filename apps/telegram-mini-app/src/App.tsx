import { useEffect, useState } from "react"
import { gateway } from "./gateway"
import { getInitData } from "./telegram"

interface Me {
  userId: string
  chatId: string | null
  username: string | null
}

type SessionSummary = Awaited<ReturnType<typeof gateway.session.list.query>>[number]

/**
 * Home screen (#330): proves end-to-end auth + data over the gateway — shows the
 * verified identity and the caller's review sessions. Chat/preview screens and
 * the live render view follow.
 */
export function App() {
  const [me, setMe] = useState<Me | null>(null)
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!getInitData()) {
      setError("Open this app from Telegram — no initData available.")
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const [identity, list] = await Promise.all([
          gateway.auth.me.query(),
          gateway.session.list.query(),
        ])
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
  if (error) return <main className="screen error">{error}</main>

  return (
    <main className="screen">
      <header>
        <h1>Reels</h1>
        {me && <p className="muted">@{me.username ?? me.userId}</p>}
      </header>

      <section>
        <h2>Your sessions</h2>
        {sessions.length === 0 ? (
          <p className="muted">No review sessions yet. Send an idea to the bot to start.</p>
        ) : (
          <ul className="sessions">
            {sessions.map((session) => (
              <li key={session.id}>
                <span className={`status status-${session.status}`}>{session.status}</span>
                <span className="goal">{session.goal ?? session.id}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
