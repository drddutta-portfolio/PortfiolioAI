import type {
  ProgramCR9ComparisonResult,
  ProgramCR9MeaningfulChangeEvent,
  ProgramCR9TransitionState,
} from "./r9MeaningfulChangeContract"

export type ProgramCR9PresentationTone =
  | "positive"
  | "warning"
  | "negative"
  | "neutral"

export interface ProgramCR9Presentation {
  readonly transitionState: ProgramCR9TransitionState
  readonly label: string
  readonly tone: ProgramCR9PresentationTone
  readonly baselineLabel: string
  readonly meaningfulChangeCount: number
  readonly rawChangeCount: number
  readonly eventId: string | null
  readonly changeLabels: readonly string[]
}

function pretty(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function tone(result: ProgramCR9ComparisonResult): ProgramCR9PresentationTone {
  if (result.transitionState === "MEANINGFUL_CHANGE") {
    const codes = result.meaningfulChanges.map((change) => change.code)
    if (
      codes.includes("EXIT_INTELLIGENCE_CHANGED")
      || codes.includes("PORTFOLIO_RISK_CHANGED")
      || codes.includes("R8_BLOCKER_SET_CHANGED")
      || codes.includes("EVIDENCE_STATE_CHANGED")
    ) return "warning"
    return "neutral"
  }
  if (
    result.transitionState === "INCOMPARABLE"
    || result.transitionState === "OUT_OF_ORDER"
  ) return "warning"
  return "neutral"
}

function eventLabels(event: ProgramCR9MeaningfulChangeEvent | null) {
  if (!event) return []
  return event.meaningfulChanges.map((change) => (
    `${pretty(change.code)}: ${change.previousValue ?? "None"} → ${change.currentValue ?? "None"}`
  ))
}

export function projectProgramCR9Comparison(
  result: ProgramCR9ComparisonResult,
): ProgramCR9Presentation {
  return {
    transitionState: result.transitionState,
    label: pretty(result.transitionState),
    tone: tone(result),
    baselineLabel: pretty(result.baselineState),
    meaningfulChangeCount: result.meaningfulChanges.length,
    rawChangeCount: result.rawChanges.length,
    eventId: result.event?.eventId ?? null,
    changeLabels: eventLabels(result.event),
  }
}
