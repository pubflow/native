import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-8 font-sans text-zinc-900">
      <nav className="mb-8 flex gap-4 text-sm">
        <Link to="/" className="underline">
          Home
        </Link>
        <Link to="/items" className="underline">
          Items
        </Link>
        <Link to="/about" className="underline">
          About
        </Link>
      </nav>
      {children}
    </div>
  )
}
