import { createServer } from "vite"

const server = await createServer({
  appType: "custom",
  server: { middlewareMode: true, hmr: false, ws: false },
  logLevel: "error",
})

try {
  const module = await server.ssrLoadModule(
    "/src/features/decision/r8C2Validation.ts",
  )
  const audit = module.buildProgramCR8C2Validation()
  process.stdout.write(JSON.stringify(audit, null, 2) + "\n")
  if (!audit.overallPass) process.exitCode = 1
} finally {
  await server.close()
}
