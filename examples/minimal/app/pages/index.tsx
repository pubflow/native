import { Link } from '@tanstack/react-router'

export default function HomePage() {
  return (
    <main className="space-y-3">
      <h1 className="text-2xl font-semibold">Pubflow Native</h1>
      <p className="text-zinc-600">Minimal app: pages, a Hono API, and file routes.</p>
      <p>
        Open <Link to="/items" className="underline">/items</Link> or{' '}
        <a href="/api/hello" className="underline">
          /api/hello
        </a>
        .
      </p>
    </main>
  )
}
