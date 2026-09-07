import type { MiddlewareHandler } from 'hono'

const middleware: MiddlewareHandler = async (c, next) => {
  c.header('X-Pubflow-Native', '1')
  await next()
}

export default middleware
