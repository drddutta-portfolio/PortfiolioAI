import { readdir, readFile, stat } from "node:fs/promises"
import { extname, join, relative, sep } from "node:path"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("..", import.meta.url))
const presentationRoots = [join(root, "src", "pages"), join(root, "src", "components")]
const extensions = new Set([".ts", ".tsx", ".js", ".jsx"])

const forbidden = [
  {
    name: "direct Supabase client import",
    pattern: /(?:from\s+["'][^"']*\/lib\/supabase["']|import\s+["'][^"']*\/lib\/supabase["'])/u,
  },
  {
    name: "direct Supabase data operation",
    pattern: /\bsupabase\s*\.(?:from|rpc|functions)\s*\(/u,
  },
  {
    name: "direct canonical classification storage reference",
    pattern: /\bcurrent_security_enrichment_v1\b/u,
  },
  {
    name: "direct canonical score storage reference",
    pattern: /\bstock_score_runs\b/u,
  },
  {
    name: "direct canonical recommendation storage reference",
    pattern: /\bstock_recommendation_runs\b/u,
  },
  {
    name: "direct canonical sizing storage reference",
    pattern: /\bposition_sizing_assessments\b/u,
  },
]

async function filesUnder(directory) {
  const result = []
  for (const entry of await readdir(directory)) {
    const path = join(directory, entry)
    const info = await stat(path)
    if (info.isDirectory()) result.push(...await filesUnder(path))
    else if (extensions.has(extname(path))) result.push(path)
  }
  return result
}

const violations = []
for (const directory of presentationRoots) {
  for (const path of await filesUnder(directory)) {
    const source = await readFile(path, "utf8")
    for (const rule of forbidden) {
      if (rule.pattern.test(source)) {
        violations.push(`${relative(root, path).split(sep).join("/")}: ${rule.name}`)
      }
    }
  }
}

if (violations.length) {
  console.error("PortfolioAI single-source architecture violation(s):")
  for (const violation of violations) console.error(`- ${violation}`)
  console.error("Presentation code must consume shared repositories/hooks/view models rather than canonical storage directly.")
  process.exit(1)
}

console.log("PortfolioAI data-boundary guard passed: presentation code contains no direct canonical storage access.")
