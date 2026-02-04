import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: [
      'cli/__tests__/**/*.test.{js,ts}',
      'frontend/src/**/__tests__/**/*.test.{js,jsx,ts,tsx}',
      'frontend/src/**/*.test.{js,jsx,ts,tsx}',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['cli/utils/**', 'frontend/src/lib/**'],
    },
  },
});
