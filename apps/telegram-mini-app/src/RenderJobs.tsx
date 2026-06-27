import { useEffect, useState } from "react"
import { gateway } from "./gateway"

type RenderJob = Awaited<ReturnType<typeof gateway.render.list.query>>[number]

/**
 * The caller's render jobs (#330), streamed live over the gateway's
 * `render.events` SSE subscription — an initial snapshot then a new one whenever
 * a job changes status. Renders nothing until the first event and stays hidden
 * when there are no jobs.
 */
export function RenderJobs() {
  const [jobs, setJobs] = useState<RenderJob[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const subscription = gateway.render.events.subscribe(undefined, {
      onData: (snapshot) => {
        setJobs(snapshot.jobs)
        setError(null)
        setLoaded(true)
      },
      onError: (cause) => {
        setError(cause.message)
        setLoaded(true)
      },
    })
    return () => subscription.unsubscribe()
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
