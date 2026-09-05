import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

type Item = { id: string; name: string }

export default function ItemPage({ id }: { id: string }) {
  const [item, setItem] = useState<Item | null>(null)

  useEffect(() => {
    fetch(`/api/items/${id}`)
      .then((res) => res.json())
      .then(setItem)
  }, [id])

  return (
    <main className="space-y-3">
      <p className="text-sm text-zinc-500">
        <Link to="/items" className="underline">
          Back to items
        </Link>
      </p>
      <h1 className="text-2xl font-semibold">{item?.name || `Item ${id}`}</h1>
      <pre className="rounded bg-zinc-100 p-3 text-sm">{JSON.stringify(item, null, 2)}</pre>
    </main>
  )
}
