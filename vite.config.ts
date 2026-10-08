import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

export default defineConfig({
    plugins: [react()],
    test: {
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
      env: {
        VITE_SUPABASE_URL: "https://lrgpjimipfkyoqbpsqzz.supabase.co",
        VITE_SUPABASE_PUBLISHABLE_KEY: "test-only-non-secret-publishable-key",
      },
      // Keep runner-specific tests out of the application Vitest discovery pass.
      // - scripts/*.test.mjs uses Node's built-in node:test runner and is invoked explicitly.
      // - the three local-only Supabase function tests use Deno/jsr imports and must not
      //   be bundled by Vite's Node resolver.
      exclude: [
        "node_modules/**",
        "dist/**",
        "scripts/**/*.test.mjs",
        "supabase/functions/**/*.deno.test.ts",
        "supabase/functions/g10-2-local-global-generics-evidence/index.test.ts",
        "supabase/functions/g10-2-local-trendlyne-gap-fill/index.test.ts",
        "supabase/functions/refresh-pharma-benchmark/index.test.ts",
      ],
      // Fork fan-out exhausts this project's desktop execution environment before
      // workers can initialize. Serial threads preserve isolation and test coverage.
      fileParallelism: false,
      pool: "threads",
      maxWorkers: 1,
    },
})
