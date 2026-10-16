// Builds the frontend, serves it the way production does (through the backend),
// and starts the API on a throwaway database. Playwright waits for the health
// check, then runs the tests against it.
import { execSync, spawn } from 'node:child_process'
import { cpSync, mkdirSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const here = path.dirname(fileURLToPath(import.meta.url))
const frontend = path.resolve(here, '..')
const repo = path.resolve(frontend, '..')
const backend = path.join(repo, 'Backend')
const wwwroot = path.join(backend, 'wwwroot')
const dataDir = path.join(frontend, '.e2e-data')

rmSync(dataDir, { recursive: true, force: true })
mkdirSync(dataDir, { recursive: true })

execSync('pnpm build', { cwd: frontend, stdio: 'inherit' })

rmSync(wwwroot, { recursive: true, force: true })
cpSync(path.join(frontend, 'dist'), wwwroot, { recursive: true })

const server = spawn('dotnet', ['run', '--no-build', '--urls', 'http://127.0.0.1:5180'], {
  cwd: backend,
  stdio: 'inherit',
  env: { ...process.env, DB_PATH: path.join(dataDir, 'fittrack.db') },
})

const cleanup = () => {
  server.kill()
  rmSync(wwwroot, { recursive: true, force: true })
  rmSync(dataDir, { recursive: true, force: true })
}
process.on('SIGINT', cleanup)
process.on('SIGTERM', cleanup)
server.on('exit', (code) => process.exit(code ?? 0))
