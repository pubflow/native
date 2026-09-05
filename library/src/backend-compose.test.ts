import { describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { Hono } from 'hono'
import { createApiApp } from './api.ts'
import { scanApi } from './scan.ts'

function tmpBackend() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pubflow-native-backend-'))
  fs.mkdirSync(path.join(root, 'app', 'lib', 'products'), { recursive: true })
  fs.mkdirSync(path.join(root, 'app', 'api', 'v1'), { recursive: true })
  fs.mkdirSync(path.join(root, 'app', 'api', 'v2'), { recursive: true })
  fs.writeFileSync(
    path.join(root, 'app', 'lib', 'products', 'service.ts'),
    `export function listProducts() {
  return [{ id: '1', name: 'Bolt' }]
}
export function getProduct(id: string) {
  return listProducts().find((item) => item.id === id) ?? null
}
`,
  )
  fs.writeFileSync(path.join(root, 'app', 'api', 'v1', 'products.ts'), 'export default {}')
  fs.writeFileSync(path.join(root, 'app', 'api', 'v2', 'products.ts'), 'export default {}')
  fs.writeFileSync(path.join(root, 'app', 'api', 'v1', '_hidden.ts'), 'export default {}')
  return root
}

async function productsFromLib(root: string) {
  const service = (await import(
    pathToFileURL(path.join(root, 'app', 'lib', 'products', 'service.ts')).href
  )) as {
    listProducts: () => Array<{ id: string; name: string }>
    getProduct: (id: string) => { id: string; name: string } | null
  }
  const products = new Hono()
  products.get('/', (c) => c.json(service.listProducts()))
  products.get('/:id', (c) => {
    const item = service.getProduct(c.req.param('id'))
    if (!item) return c.json({ error: 'not found' }, 404)
    return c.json(item)
  })
  return products
}

describe('backend composition', () => {
  it('serves v1/v2 from app/lib and does not mount underscore or lib files', async () => {
    const root = tmpBackend()
    const products = await productsFromLib(root)
    const hidden = new Hono()
    hidden.get('/', (c) => c.json({ hidden: true }))

    const app = createApiApp({
      '/app/api/v1/products.ts': { default: products },
      '/app/api/v2/products.ts': { default: products },
      '/app/api/v1/_hidden.ts': { default: hidden },
    })

    expect(await (await app.request('/v1/products')).json()).toEqual([{ id: '1', name: 'Bolt' }])
    expect(await (await app.request('/v1/products/1')).json()).toEqual({ id: '1', name: 'Bolt' })
    expect((await app.request('/v1/products/missing')).status).toBe(404)
    expect(await (await app.request('/v2/products')).json()).toEqual([{ id: '1', name: 'Bolt' }])
    expect((await app.request('/v1/_hidden')).status).toBe(404)

    const mounts = scanApi(root)
    expect(mounts.find((file) => file.rel === 'v1/products.ts')?.mount).toBe('/v1/products')
    expect(mounts.find((file) => file.rel === 'v2/products.ts')?.mount).toBe('/v2/products')
    expect(mounts.find((file) => file.rel.includes('_hidden'))).toBeUndefined()
    expect(mounts.every((file) => !file.rel.includes('lib/'))).toBe(true)

    fs.rmSync(root, { recursive: true, force: true })
  })
})
