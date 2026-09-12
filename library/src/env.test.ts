import { describe, expect, it } from 'bun:test'
import { publicEnv, serverEnv } from './env.ts'

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

describe('serverEnv', () => {
  it('prefers the unprefixed name', () => {
    expect(
      serverEnv('FLOWLESS_URL', {
        FLOWLESS_URL: 'https://bare.example',
        PUBFLOW_PUBLIC_FLOWLESS_URL: 'https://pubflow.example',
        VITE_FLOWLESS_URL: 'https://vite.example',
      }),
    ).toBe('https://bare.example')
  })

  it('uses PUBFLOW_PUBLIC_ when the unprefixed name is missing', () => {
    expect(
      serverEnv('FLOWLESS_URL', {
        PUBFLOW_PUBLIC_FLOWLESS_URL: 'https://pubflow.example',
      }),
    ).toBe('https://pubflow.example')
  })

  it('skips empty unprefixed values', () => {
    expect(
      serverEnv('BRIDGE_SECRET', {
        BRIDGE_SECRET: '  ',
        PUBFLOW_PUBLIC_BRIDGE_SECRET: 'from-public',
      }),
    ).toBe('from-public')
  })

  it('falls back to VITE_', () => {
    expect(serverEnv('BRIDGE_SECRET', { VITE_BRIDGE_SECRET: 's3cret' })).toBe('s3cret')
  })
})
