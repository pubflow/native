import { spawn } from 'node:child_process'
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

async function get(url) {
  let last
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(url)
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
      const result = await get(`http://127.0.0.1:${port}${check.path}`)
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
  ],
})

console.log('smoke passed')
