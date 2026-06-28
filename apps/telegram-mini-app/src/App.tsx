import { useCallback, useEffect, useState } from "react"
import { gateway } from "./gateway"
import { RenderJobs } from "./RenderJobs"
import { SessionDetail } from "./SessionDetail"
import { type SessionSummary, SessionRow } from "./SessionRow"
import { getInitData, showBackButton } from "./telegram"

interface Me {
  userId: string
  chatId: string | null
  username: string | null
}

/**
 * Mini App root (#330): home lists the caller's review sessions; tapping one
 * opens a detail screen with concierge actions, navigable via the Telegram
 * BackButton. A live Renders section streams render status over SSE.
 */
export function App() {
  const [me, setMe] = useState<Me | null>(null)
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
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

  // Telegram BackButton returns from the detail screen to the list.
  useEffect(() => {
    if (!selectedId) return
    return showBackButton(() => setSelectedId(null))
  }, [selectedId])

  if (loading) return <main className="screen">Loading…</main>
  if (error && !me) return <main className="screen error">{error}</main>

  const selected = selectedId ? sessions.find((s) => s.id === selectedId) : undefined

  if (selected) {
    return (
      <main className="screen">
        <SessionDetail
          session={selected}
          onChanged={() => {
            void refresh()
            setSelectedId(null)
          }}
        />
      </main>
    )
  }

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
              <SessionRow key={session.id} session={session} onOpen={setSelectedId} />
            ))}
          </ul>
        )}
      </section>

      <RenderJobs />
    </main>
  )
}
