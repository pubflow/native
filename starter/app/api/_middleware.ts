import type { MiddlewareHandler } from 'hono'
import { rateLimit, rateLimitPresets } from '@pubflow/native/rate-limit'

const limit = rateLimit({ ...rateLimitPresets.api, prefix: 'api' })

const middleware: MiddlewareHandler = async (c, next) => {
  c.header('X-Pubflow-Native', '1')
  return limit(c, next)
}

export default middleware
