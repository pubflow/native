import { defineConfig, type NativeConfig } from '@pubflow/native/config'

export default defineConfig({
  auth: { provider: 'flowless' },
  runtime: 'bun',
} satisfies NativeConfig)
