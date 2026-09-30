import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  // Remove vendor informational logging from the release bundle; keep warnings/errors.
  esbuild: { pure: ['console.log'] },
  test: { environment: 'node' },
})
