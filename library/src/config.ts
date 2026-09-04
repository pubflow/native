export type NativeRuntime = 'bun' | 'node' | 'cloudflare' | 'deno'

export type NativeAuthConfig = {
  provider?: 'flowless' | 'none'
}

export type NativeConfig = {
  auth?: NativeAuthConfig
  runtime?: NativeRuntime
  /** Remote Flowfull base URL when pages are a BFF in front of another backend. */
  flowfullApiUrl?: string
}

export const defaultNativeConfig: Required<Pick<NativeConfig, 'runtime'>> & {
  auth: NativeAuthConfig
} = {
  auth: { provider: 'flowless' },
  runtime: 'bun',
}

export function defineConfig(config: NativeConfig): NativeConfig {
  return config
}
