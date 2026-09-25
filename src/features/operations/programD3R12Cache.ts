import type { ProgramDR12Result } from "./programD3R12Contract"

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

export function createBrowserProgramDR12Cache(storage: Storage): ProgramDR12Cache {
  const load = (): Record<string, ProgramDR12Result> => {
    const raw = storage.getItem(PROGRAM_D_R12_BROWSER_CACHE_KEY)
    if (!raw) return {}
    try {
      const parsed = JSON.parse(raw)
      return parsed && typeof parsed === "object" ? parsed as Record<string, ProgramDR12Result> : {}
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
