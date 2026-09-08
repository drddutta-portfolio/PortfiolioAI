import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    // Fork fan-out exhausts this project's desktop execution environment before
    // workers can initialize. Serial threads preserve isolation and test coverage.
    fileParallelism: false,
    pool: "threads",
    maxWorkers: 1,
  },
})
