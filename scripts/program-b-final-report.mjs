import { createServer } from "vite"

const server = await createServer({
  appType: "custom",
  server: { middlewareMode: true },
  logLevel: "error",
})

try {
  const module = await server.ssrLoadModule(
    "/src/features/research/programBFinalClosure.ts",
  )
  const audit = module.buildProgramBFinalAudit()
  process.stdout.write(JSON.stringify(audit, null, 2) + "\n")
} finally {
  await server.close()
}
