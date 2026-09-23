import { readFile } from "node:fs/promises"
import { createServer } from "vite"

const snapshotPath = process.argv[2]
if (!snapshotPath) throw new Error("A cache snapshot JSON path is required.")

const server = await createServer({ appType: "custom", server: { middlewareMode: true }, logLevel: "error" })
try {
  const module = await server.ssrLoadModule("/src/features/research/programAA1CacheMaterializer.ts")
  const snapshot = JSON.parse(await readFile(snapshotPath, "utf8"))
  const result = module.materializeProgramAA1CacheBaseline(snapshot)
  process.stdout.write(`${JSON.stringify(result.baseline, null, 2)}\n\n${module.renderProgramAA1BaselineReport(result.baseline)}\n`)
} finally {
  await server.close()
}
