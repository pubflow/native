import { describe, expect, it } from 'bun:test'
import { bootEnv, injectPublicBootHtml, publicBootPayload, publicEnv, serverEnv } from './env.ts'

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

describe('publicBootPayload', () => {
  it('uses PUBFLOW_PUBLIC_FLOWLESS_URL as the Flowless origin', () => {
    expect(
      publicBootPayload({
        PUBFLOW_PUBLIC_FLOWLESS_URL: 'https://flow.example',
        DATABASE_URL: 'postgres://secret',
      }),
    ).toEqual({ FLOWLESS_URL: 'https://flow.example' })
  })

  it('prefers public over leftover localhost FLOWLESS_URL', () => {
    expect(
      publicBootPayload({
        FLOWLESS_URL: 'http://localhost:8787',
        PUBFLOW_PUBLIC_FLOWLESS_URL: 'https://flow.example',
      }),
    ).toEqual({ FLOWLESS_URL: 'https://flow.example' })
  })
})

describe('injectPublicBootHtml', () => {
  it('injects public Flowless URL into head', () => {
    const html = injectPublicBootHtml('<html><head></head><body></body></html>', {
      PUBFLOW_PUBLIC_FLOWLESS_URL: 'https://flow.example',
    })
    expect(html).toContain('window.__PUBFLOW_PUBLIC__')
    expect(html).toContain('https://flow.example')
    expect(html).not.toContain('DATABASE_URL')
  })

  it('skips when already injected', () => {
    const first = injectPublicBootHtml('<html><head></head><body></body></html>', {
      PUBFLOW_PUBLIC_FLOWLESS_URL: 'https://a.example',
    })
    const second = injectPublicBootHtml(first, { PUBFLOW_PUBLIC_FLOWLESS_URL: 'https://b.example' })
    expect(second).toBe(first)
  })
})

describe('bootEnv', () => {
  it('reads an explicit env map like publicEnv', () => {
    expect(bootEnv('FLOWLESS_URL', { PUBFLOW_PUBLIC_FLOWLESS_URL: 'https://pub.example' })).toBe(
      'https://pub.example',
    )
  })
})
