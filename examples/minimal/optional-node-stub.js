export default {}

export function createClient() {
  throw new Error('This Node package is not bundled for Cloudflare Workers')
}

export class Redis {
  constructor() {
    throw new Error('ioredis is not bundled for Cloudflare Workers')
  }
}
