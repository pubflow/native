import { Hono } from 'hono'

const hello = new Hono()
hello.get('/', (c) => c.json({ hello: 'from custom server' }))
export default hello
