import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

type Item = { id: string; name: string }

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([])

  useEffect(() => {
    fetch('/api/items')
      .then((res) => res.json())
      .then(setItems)
  }, [])

  return (
    <main className="space-y-3">
      <h1 className="text-2xl font-semibold">Items</h1>
      <ul className="list-disc space-y-1 pl-5">
        {items.map((item) => (
          <li key={item.id}>
            <Link to="/items/$id" params={{ id: item.id }} className="underline">
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
