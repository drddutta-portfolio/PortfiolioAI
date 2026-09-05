interface PageLoaderProps {
  readonly label: string
}

export function PageLoader({ label }: PageLoaderProps) {
  return (
    <main className="centered-page" aria-busy="true" aria-live="polite">
      <div className="loader" aria-hidden="true" />
      <p className="muted">{label}…</p>
    </main>
  )
}
