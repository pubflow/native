import { Link } from '@tanstack/react-router'

export default function HomePage() {
  return (
    <main className="space-y-3">
      <h1 className="text-2xl font-semibold">Custom Hono server</h1>
      <p className="text-zinc-600">
        <code>app/server.ts</code> owns fetch. Pages still use file routes.
      </p>
      <p>
        Open <Link to="/items" className="underline">/items</Link>,{' '}
        <a href="/rpc/ping" className="underline">
          /rpc/ping
        </a>
        , or{' '}
        <a href="/api/hello" className="underline">
          /api/hello
        </a>
        .
      </p>
    </main>
  )
}
