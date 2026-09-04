import { Hono } from 'hono'

const hello = new Hono()
hello.get('/', (c) => c.json({ hello: 'pubflow-native' }))
export default hello
