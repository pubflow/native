import { describe, expect, it } from 'bun:test'
import { publicEnv } from './env.ts'

describe('publicEnv', () => {
  it('prefers PUBFLOW_PUBLIC_ over VITE_', () => {
    expect(
      publicEnv('FLOWLESS_URL', {
        PUBFLOW_PUBLIC_FLOWLESS_URL: 'https://pubflow.example',
        VITE_FLOWLESS_URL: 'https://vite.example',
      }),
    ).toBe('https://pubflow.example')
  })

  it('falls back to VITE_', () => {
    expect(publicEnv('BRIDGE_SECRET', { VITE_BRIDGE_SECRET: 's3cret' })).toBe('s3cret')
  })

  it('returns undefined when neither prefix is set', () => {
    expect(publicEnv('APP_NAME', {})).toBeUndefined()
  })
})
