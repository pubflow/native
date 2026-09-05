import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { RouterProvider, createMemoryHistory } from '@tanstack/react-router'
import type { Context } from 'hono'

type HistoryLike = {
  location: { pathname: string; searchStr?: string; search?: string }
}

export type RouterFactory = (history: HistoryLike) => {
  load: () => Promise<void>
}

type ViteDev = {
  transformIndexHtml: (url: string, html: string) => Promise<string>
  config: { root: string }
}

function injectAppHtml(template: string, appHtml: string): string {
  if (template.includes('<!--ssr-outlet-->')) {
    return template.replace('<!--ssr-outlet-->', appHtml)
  }
  if (/<div id="root"[^>]*>[\s\S]*?<\/div>/.test(template)) {
    return template.replace(/<div id="root"[^>]*>[\s\S]*?<\/div>/, `<div id="root">${appHtml}</div>`)
  }
  return template.replace('</body>', `<div id="root">${appHtml}</div></body>`)
}

async function loadTemplate(c: Context, indexHtml: string): Promise<string> {
  if (indexHtml) return indexHtml
  const vite = (c.env as { vite?: ViteDev } | undefined)?.vite
  const root = vite?.config.root || process.cwd()
  let html = `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/></head><body><div id="root"></div></body></html>`
  try {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const file = path.join(root, 'index.html')
    if (fs.existsSync(file)) html = fs.readFileSync(file, 'utf8')
  } catch {
    // Workers without fs: caller should pass the built index HTML.
  }
  if (vite?.transformIndexHtml) {
    const url = new URL(c.req.url)
    html = await vite.transformIndexHtml(url.pathname + url.search, html)
  }
  return html
}

async function renderAppHtml(c: Context, getRouter: RouterFactory): Promise<string> {
  const url = new URL(c.req.url)
  const history = createMemoryHistory({ initialEntries: [url.pathname + url.search] })
  const router = getRouter(history)
  await router.load()
  const app = createElement(RouterProvider, { router: router as never })
  return renderToString(app)
}

export async function renderPage(c: Context, getRouter: RouterFactory, indexHtml = '') {
  const appHtml = await renderAppHtml(c, getRouter)
  const template = await loadTemplate(c, indexHtml)
  return c.html(injectAppHtml(template, appHtml))
}
