import {
  PROGRAM_D_R12_LOCAL_IMPLEMENTATION_VERSION,
  PROGRAM_D_R12_PROMPT_VERSION,
  type ProgramDR12Result,
} from "./programD3R12Contract"

export interface ProgramDR12Cache {
  get(key: string): ProgramDR12Result | null
  set(key: string, value: ProgramDR12Result): void
  clear(): void
}

export function createMemoryProgramDR12Cache(): ProgramDR12Cache {
  const values = new Map<string, ProgramDR12Result>()
  return {
    get: (key) => values.get(key) ?? null,
    set: (key, value) => { values.set(key, structuredClone(value)) },
    clear: () => values.clear(),
  }
}

export const PROGRAM_D_R12_BROWSER_CACHE_KEY =
  "portfolioai.program-d.r12.local-cache.v1"

function isProgramDR12Result(value: unknown): value is ProgramDR12Result {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false
  const row = value as Record<string, unknown>
  return row.version === PROGRAM_D_R12_LOCAL_IMPLEMENTATION_VERSION
    && typeof row.narrativeId === "string"
    && typeof row.inputPacketHash === "string"
    && row.promptVersion === PROGRAM_D_R12_PROMPT_VERSION
    && row.provider === "LOCAL_MOCK"
    && row.model === "PROGRAM_D_R12_LOCAL_MOCK_V1"
    && typeof row.generatedAt === "string"
    && typeof row.narrative === "object"
    && row.narrative !== null
    && typeof row.validationStatus === "string"
    && typeof row.usage === "object"
    && row.usage !== null
    && typeof row.cached === "boolean"
}

function parseProgramDR12Cache(raw: string): Record<string, ProgramDR12Result> {
  const parsed: unknown = JSON.parse(raw)
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {}

  const safe: Record<string, ProgramDR12Result> = {}
  for (const [key, value] of Object.entries(parsed)) {
    if (isProgramDR12Result(value)) safe[key] = value
  }
  return safe
}

export function createBrowserProgramDR12Cache(storage: Storage): ProgramDR12Cache {
  const load = (): Record<string, ProgramDR12Result> => {
    const raw = storage.getItem(PROGRAM_D_R12_BROWSER_CACHE_KEY)
    if (!raw) return {}
    try {
      return parseProgramDR12Cache(raw)
    } catch {
      return {}
    }
  }
  const save = (values: Record<string, ProgramDR12Result>) => {
    storage.setItem(PROGRAM_D_R12_BROWSER_CACHE_KEY, JSON.stringify(values))
  }
  return {
    get(key) {
      return load()[key] ?? null
    },
    set(key, value) {
      save({ ...load(), [key]: value })
    },
    clear() {
      storage.removeItem(PROGRAM_D_R12_BROWSER_CACHE_KEY)
    },
  }
}
