import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: [
        'src/lib/money.ts',
        'src/lib/receipt.ts',
        'src/lib/cart.ts',
        'src/lib/wallet.ts',
        'src/lib/price-step.ts',
        'src/lib/catalog-search.ts',
        'src/lib/auth.ts',
        'src/lib/auth-search.ts',
        'src/lib/storage.ts',
        'src/lib/owner.ts',
        'src/lib/api/errors.ts',
        'src/lib/api/client.ts',
        'src/contracts/**/*.ts',
        'src/realtime/apply-events.ts',
        'src/realtime/dedupe.ts',
        'src/mocks/pricing.ts',
      ],
      exclude: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
      thresholds: {
        statements: 85,
        branches: 75,
        functions: 85,
        lines: 85,
      },
    },
  },
})
