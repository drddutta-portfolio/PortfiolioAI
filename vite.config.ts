import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

const DEVELOPMENT_BRANCH = "PortfolioAI-Development"
const DEVELOPMENT_SUPABASE_URL = "https://lrgpjimipfkyoqbpsqzz.supabase.co"
const DEVELOPMENT_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_oa_EMVIgMPR1cjVzsGO1uw_6kyuHan6"

export default defineConfig(() => {
  const isDevelopmentBranch =
    process.env.VERCEL_GIT_COMMIT_REF === DEVELOPMENT_BRANCH

  return {
    plugins: [react()],
    define: isDevelopmentBranch
      ? {
          "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
            DEVELOPMENT_SUPABASE_URL,
          ),
          "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
            DEVELOPMENT_SUPABASE_PUBLISHABLE_KEY,
          ),
          "import.meta.env.VITE_MARKET_DATA_ENABLED": JSON.stringify("false"),
        }
      : undefined,
    test: {
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
      // Keep runner-specific tests out of the application Vitest discovery pass.
      // - scripts/*.test.mjs uses Node's built-in node:test runner and is invoked explicitly.
      // - the three local-only Supabase function tests use Deno/jsr imports and must not
      //   be bundled by Vite's Node resolver.
      exclude: [
        "node_modules/**",
        "dist/**",
        "scripts/**/*.test.mjs",
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
  }
})
