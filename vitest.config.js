import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: [
      'packages/cli/__tests__/**/*.test.{js,ts}',
      'packages/framely/src/**/__tests__/**/*.test.{js,jsx,ts,tsx}',
      'packages/framely/src/**/*.test.{js,jsx,ts,tsx}',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['packages/cli/utils/**', 'packages/framely/src/**'],
    },
  },
});
