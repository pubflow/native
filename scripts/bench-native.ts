import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { assertWorkerBudget, parseTotalUploadKib } from './cf-size.ts'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const APPS = [
  { id: 'starter' as const, dir: 'starter', label: 'Default (`starter/`)' },
  { id: 'minimal' as const, dir: 'examples/minimal', label: 'Minimal' },
  { id: 'custom-hono-server' as const, dir: 'examples/custom-hono-server', label: 'Custom Hono' },
]

function cpuMs(usage: NodeJS.CpuUsage): number {
  return (usage.user + usage.system) / 1000
}

function sampleCpu(fn: () => void, iterations: number): { cpuMs: number; wallMs: number } {
  fn()
  const wall0 = performance.now()
  const cpu0 = process.cpuUsage()
  for (let i = 0; i < iterations; i++) fn()
  const cpu = process.cpuUsage(cpu0)
  return { cpuMs: cpuMs(cpu) / iterations, wallMs: (performance.now() - wall0) / iterations }
}

function localCpuBench() {
  const items = Array.from({ length: 24 }, (_, i) => `Item ${i + 1}`)
  const page = createElement(
    'main',
    { className: 'p-8' },
    createElement('h1', null, 'Home'),
    createElement('p', null, 'Representative SSR chrome for a Native page.'),
    createElement(
      'ul',
      null,
      ...items.map((name) => createElement('li', { key: name }, name)),
    ),
  )
  const payload = {
    items: items.map((name, id) => ({ id, name })),
  }
  const ssr = sampleCpu(() => {
    renderToString(page)
  }, 200)
  const json = sampleCpu(() => {
    JSON.stringify(payload)
  }, 2000)
  return { ssr, json }
}

function run(cmd: string, args: string[], cwd: string): Promise<{ code: number; out: string }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd,
      shell: process.platform === 'win32',
      env: { ...process.env, NO_COLOR: '1' },
    })
    let out = ''
    child.stdout?.on('data', (chunk) => {
      out += chunk.toString()
    })
    child.stderr?.on('data', (chunk) => {
      out += chunk.toString()
    })
    child.on('close', (code) => resolve({ code: code ?? 1, out }))
  })
}

async function dryRunSizes(checkBudget: boolean, appFilter = '') {
  const selected = appFilter ? APPS.filter((app) => app.id === appFilter) : APPS
  if (appFilter && selected.length === 0) {
    throw new Error(`Unknown --app ${appFilter}`)
  }
  for (const app of selected) {
    const cwd = path.join(repoRoot, app.dir)
    if (!fs.existsSync(path.join(cwd, 'dist', 'server', 'worker.js'))) {
      throw new Error(`Build ${app.dir} first (missing dist/server/worker.js)`)
    }
    const result = await run('bun', ['x', 'wrangler', 'deploy', '--dry-run'], cwd)
    const parsed = parseTotalUploadKib(result.out)
    if (!parsed) {
      throw new Error(`Could not parse Total Upload for ${app.dir}:\n${result.out.slice(-1500)}`)
    }
    if (checkBudget) assertWorkerBudget(app.id, parsed.uncompressed)
    console.log(
      `${app.label}: ${(parsed.uncompressed / 1024).toFixed(2)} MiB uncompressed / ${parsed.gzip.toFixed(0)} KiB gzip`,
    )
  }
}

const args = process.argv.slice(2)
const wantCpu = args.includes('--cpu') || args.length === 0
const wantSizes = args.includes('--sizes')
const checkBudget = args.includes('--check-budget')
const appFilter = args.includes('--app') ? args[args.indexOf('--app') + 1] : ''

if (wantCpu) {
  const { ssr, json } = localCpuBench()
  console.log('Local CPU (not Cloudflare). process.cpuUsage() / renderToString vs JSON.stringify.')
  console.log(`  SSR page:  ${ssr.cpuMs.toFixed(3)} ms CPU  (${ssr.wallMs.toFixed(3)} ms wall) per render`)
  console.log(`  JSON /api: ${json.cpuMs.toFixed(3)} ms CPU  (${json.wallMs.toFixed(3)} ms wall) per serialize`)
  console.log('On a Worker, read cpuTime from `wrangler tail` after bun run deploy:cf.')
}

if (wantSizes || checkBudget) {
  await dryRunSizes(checkBudget, appFilter)
}
