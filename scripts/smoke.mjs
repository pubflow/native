import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function waitForReady(child, port, timeoutMs = 60000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Vite did not become ready on ${port}\n${out}`)), timeoutMs)
    let out = ''
    const onData = (chunk) => {
      out += chunk.toString()
      if (new RegExp(`Local:\\s+http://(?:localhost|127\\.0\\.0\\.1):${port}`, 'i').test(out)) {
        clearTimeout(timer)
        child.stdout?.off('data', onData)
        child.stderr?.off('data', onData)
        resolve(out)
      }
    }
    child.stdout?.on('data', onData)
    child.stderr?.on('data', onData)
    child.on('exit', (code) => {
      clearTimeout(timer)
      reject(new Error(`Vite exited ${code}\n${out}`))
    })
  })
}

function stop(child) {
  if (!child.pid) return
  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
  } else {
    child.kill('SIGTERM')
  }
}

async function request(url, init) {
  let last
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(url, init)
      const text = await res.text()
      return { status: res.status, text, type: res.headers.get('content-type') || '' }
    } catch (error) {
      last = error
      await new Promise((resolve) => setTimeout(resolve, 400))
    }
  }
  throw last
}

async function smoke({ name, dir, port, checks }) {
  const cwd = path.join(root, dir)
  const child = spawn('bun', ['x', 'vite', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
    cwd,
    shell: process.platform === 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  try {
    await waitForReady(child, port)
    await new Promise((resolve) => setTimeout(resolve, 800))
    for (const check of checks) {
      const result = await request(`http://127.0.0.1:${port}${check.path}`, {
        method: check.method || 'GET',
        headers: check.body ? { 'Content-Type': 'application/json' } : undefined,
        body: check.body,
      })
      if (result.status !== check.status) {
        throw new Error(`${name} ${check.path}: expected ${check.status}, got ${result.status}\n${result.text.slice(0, 500)}`)
      }
      if (check.includes && !result.text.includes(check.includes)) {
        throw new Error(`${name} ${check.path}: missing ${JSON.stringify(check.includes)}\n${result.text.slice(0, 800)}`)
      }
      if (check.notIncludes && result.text.includes(check.notIncludes)) {
        throw new Error(`${name} ${check.path}: contained ${JSON.stringify(check.notIncludes)}`)
      }
    }
    console.log(`ok  ${name}`)
  } finally {
    stop(child)
    await new Promise((resolve) => setTimeout(resolve, 800))
  }
}

await smoke({
  name: 'minimal',
  dir: 'examples/minimal',
  port: 4179,
  checks: [
    { path: '/', status: 200, includes: 'Pubflow Native', notIncludes: 'c is not defined' },
    { path: '/api/hello', status: 200, includes: 'pubflow-native' },
    { path: '/health', status: 200, includes: '"ok":true' },
    {
      path: '/api/actions/ping',
      status: 200,
      method: 'POST',
      body: JSON.stringify({ args: [] }),
      includes: '"ok":true',
    },
  ],
})

await smoke({
  name: 'custom-hono-server',
  dir: 'examples/custom-hono-server',
  port: 4180,
  checks: [
    { path: '/', status: 200, includes: 'Custom Hono server', notIncludes: 'c is not defined' },
    { path: '/api/hello', status: 200, includes: 'from custom server' },
    { path: '/rpc/ping', status: 200, includes: '"pong":true' },
    {
      path: '/api/actions/ping',
      status: 200,
      method: 'POST',
      body: JSON.stringify({ args: [] }),
      includes: 'custom-server',
    },
  ],
})

console.log('smoke passed')

function run(cmd, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd,
      shell: process.platform === 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let out = ''
    child.stdout?.on('data', (chunk) => {
      out += chunk.toString()
    })
    child.stderr?.on('data', (chunk) => {
      out += chunk.toString()
    })
    child.on('exit', (code) => {
      if (code !== 0) reject(new Error(`${cmd} ${args.join(' ')} exited ${code}\n${out}`))
      else resolve(out)
    })
  })
}

async function assertSsrWorkerClean(dir) {
  const cwd = path.join(root, dir)
  await run('bun', ['x', 'vite', 'build'], cwd)
  await run('bun', ['x', 'vite', 'build', '--ssr'], cwd)
  const worker = fs.readFileSync(path.join(cwd, 'dist', 'server', 'worker.js'), 'utf8')
  if (worker.includes('node:fs') || worker.includes('readdirSync')) {
    throw new Error(`${dir} worker.js contains node:fs / readdirSync`)
  }
  if (!fs.existsSync(path.join(cwd, 'dist', 'server', 'bun.js'))) {
    throw new Error(`${dir} missing dist/server/bun.js`)
  }
  console.log(`ok  ${dir} ssr worker`)
}

await assertSsrWorkerClean('examples/minimal')
