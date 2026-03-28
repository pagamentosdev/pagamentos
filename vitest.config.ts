import tsconfigPaths from 'vite-tsconfig-paths'
import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    exclude: [...configDefaults.exclude, '**/.context/**'],
    globalSetup: ['./setup-tests.ts'],
    coverage: {
      include: [
        'src/provider/abacatepay/v2/effect/abacatepay.ts',
        'src/provider/abacatepay/v2/effect/webhooks.ts'
      ],
      thresholds: {
        lines: 100,
        branches: 100,
        functions: 100,
        statements: 100
      }
    }
  }
})
