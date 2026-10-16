import path from 'node:path'
import { defineConfig } from '@playwright/test'

const PORT = 5180

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  use: { baseURL: `http://127.0.0.1:${PORT}`, serviceWorkers: 'block' },
  webServer: {
    command: `node ${path.join('e2e', 'serve.mjs')}`,
    url: `http://127.0.0.1:${PORT}/api/health`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
})
