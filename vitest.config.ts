import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    exclude: ['**/.context'],
    globalSetup: ['./setup-tests.ts']
  }
})
