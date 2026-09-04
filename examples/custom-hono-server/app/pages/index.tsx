export default function HomePage() {
  return (
    <main>
      <h1>Custom Hono server</h1>
      <p>
        <code>app/server.ts</code> owns fetch. Try <a href="/rpc/ping">/rpc/ping</a> and{' '}
        <a href="/api/hello">/api/hello</a>.
      </p>
    </main>
  )
}
