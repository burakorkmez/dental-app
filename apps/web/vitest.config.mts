import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['src/**/*.test.ts'] },
  // Mirrors the `@/*` path in tsconfig.json. Needed once a test loads a route
  // handler, since those import by alias rather than by relative path.
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
});
