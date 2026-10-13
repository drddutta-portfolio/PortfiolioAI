import {defineConfig} from "vitest/config"

// Edge contract tests are pure Node-compatible modules. Keeping them out of the
// application jsdom/setup path avoids initializing a browser environment that
// they neither use nor need.
export default defineConfig({
  resolve:{alias:{"https://esm.sh/decimal.js@10.6.0":"decimal.js"}},
  test:{
    environment:"node",
    include:["supabase/functions/_shared/**/*.test.ts"],
    setupFiles:[],
    fileParallelism:false,
    pool:"threads",
    maxWorkers:1,
  },
})
