import {
  PROGRAM_D_D1_VERSION,
  type ProgramD1LocalState,
} from "./programD1Types"

export interface ProgramD1StateStore {
  load(): ProgramD1LocalState
  save(state: ProgramD1LocalState): void
}

export function emptyProgramD1LocalState(): ProgramD1LocalState {
  return {
    version: PROGRAM_D_D1_VERSION,
    runs: [],
    leases: {},
  }
}

export function createMemoryProgramD1Store(
  initial: ProgramD1LocalState = emptyProgramD1LocalState(),
): ProgramD1StateStore {
  let state = structuredClone(initial)
  return {
    load: () => structuredClone(state),
    save: (next) => { state = structuredClone(next) },
  }
}

export const PROGRAM_D_D1_BROWSER_STORAGE_KEY =
  "portfolioai.program-d.d1.local-orchestration.v2"

export function createBrowserProgramD1Store(
  storage: Storage,
): ProgramD1StateStore {
  return {
    load() {
      const raw = storage.getItem(PROGRAM_D_D1_BROWSER_STORAGE_KEY)
      if (!raw) return emptyProgramD1LocalState()
      try {
        const parsed = JSON.parse(raw) as Partial<ProgramD1LocalState>
        if (
          parsed.version !== PROGRAM_D_D1_VERSION
          || !Array.isArray(parsed.runs)
          || typeof parsed.leases !== "object"
          || parsed.leases === null
        ) {
          return emptyProgramD1LocalState()
        }
        return parsed as ProgramD1LocalState
      } catch {
        return emptyProgramD1LocalState()
      }
    },
    save(state) {
      storage.setItem(PROGRAM_D_D1_BROWSER_STORAGE_KEY, JSON.stringify(state))
    },
  }
}
