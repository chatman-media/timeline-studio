"use client"

/**
 * Global error boundary for the application
 * This component is specifically designed to avoid React Context usage
 * to prevent "Cannot read properties of null (reading 'useContext')" errors
 * during Next.js static export pre-rendering
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en" data-oid="2w:0iht">
      <body data-oid="mbi77oj">
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#000",
            color: "#fff",
            padding: "1rem",
          }}
          data-oid="psvgb5_"
        >
          <div style={{ textAlign: "center", maxWidth: "600px" }} data-oid="q0hzssp">
            <h1 style={{ fontSize: "3rem", marginBottom: "1rem" }} data-oid="asu6r63">
              Application Error
            </h1>
            <p
              style={{
                fontSize: "1.25rem",
                marginBottom: "2rem",
                opacity: 0.8,
              }}
              data-oid="b02oofo"
            >
              An unexpected error occurred. Please try refreshing the page.
            </p>
            {error.digest && (
              <p
                style={{
                  fontSize: "0.875rem",
                  opacity: 0.6,
                  marginBottom: "2rem",
                }}
                data-oid="_nk24v0"
              >
                Error ID: {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              style={{
                backgroundColor: "#fff",
                color: "#000",
                padding: "0.75rem 2rem",
                borderRadius: "0.5rem",
                border: "none",
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: "600",
              }}
              data-oid="2.t4kec"
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
