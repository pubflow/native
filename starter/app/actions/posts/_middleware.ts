import type { MiddlewareHandler } from 'hono'

const middleware: MiddlewareHandler = async (c, next) => {
  c.header('X-Pubflow-Action', 'posts')
  await next()
}

export default middleware
