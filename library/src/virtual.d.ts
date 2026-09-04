declare module 'virtual:pubflow-native/router' {
  export function getRouter(history: {
    location: { pathname: string; searchStr?: string; search?: string }
  }): {
    load: () => Promise<void>
  }
  export const INDEX_HTML: string
}

declare module 'virtual:pubflow-native/server' {
  import type { Hono } from 'hono'
  const app: Hono
  export default app
  export const INDEX_HTML: string
}

declare module 'virtual:pubflow-native/client' {}
