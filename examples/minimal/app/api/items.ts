import { Hono } from 'hono'

const ITEMS = [
  { id: '1', name: 'Bolt' },
  { id: '2', name: 'Nut' },
  { id: '3', name: 'Washer' },
]

const items = new Hono()
items.get('/', (c) => c.json(ITEMS))
items.get('/:id', (c) => {
  const item = ITEMS.find((row) => row.id === c.req.param('id'))
  if (!item) return c.json({ error: 'not found' }, 404)
  return c.json(item)
})

export default items
