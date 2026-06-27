import { useEffect, useState } from "react"
import { gateway } from "./gateway"

type RenderJob = Awaited<ReturnType<typeof gateway.render.list.query>>[number]

const POLL_MS = 4000

/**
 * The caller's render jobs (#330), polled for near-live status. A lightweight
 * stand-in for the `render.events` SSE stream — polling avoids the EventSource
 * auth nuance and is enough to show progress; the SSE view can replace it later.
 * Renders nothing until the first load and stays hidden when there are no jobs.
 */
export function RenderJobs() {
  const [jobs, setJobs] = useState<RenderJob[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let active = true
    let timer: ReturnType<typeof setTimeout> | undefined

    const poll = async () => {
      try {
        const list = await gateway.render.list.query()
        if (!active) return
        setJobs(list)
        setError(null)
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Failed to load renders")
      } finally {
        if (active) {
          setLoaded(true)
          timer = setTimeout(() => void poll(), POLL_MS)
        }
      }
    }

    void poll()
    return () => {
      active = false
      if (timer) clearTimeout(timer)
    }
  }, [])

  if (!loaded || (jobs.length === 0 && !error)) return null

  return (
    <section>
      <h2>Renders</h2>
      {error && <p className="error">{error}</p>}
      <ul className="sessions">
        {jobs.map((job) => {
          const state = job.renderStatus ?? job.status
          return (
            <li key={job.id}>
              <div className="row">
                <span className={`status status-${state}`}>{state}</span>
                <span className="goal">{job.hasArtifact ? "ready to deliver" : job.id}</span>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
